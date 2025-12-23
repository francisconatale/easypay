"use server"

import { createServerClient } from "@/lib/supabase/server"

// --- Helper para obtener credenciales ---
async function getMPCredentials() {
    const supabase = await createServerClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: credentials } = await supabase
        .from("mp_credentials")
        .select("access_token, mp_user_id")
        .eq("user_id", user.id)
        .single()

    return credentials
}

// --- Helpers para IDs Externos ---
function getStoreExternalId(userId: number | string): string {
    const cleanUserId = userId.toString().replace(/[^a-zA-Z0-9]/g, "")
    // Estructura estricta v2
    return `easypayStore${cleanUserId}v2`
}

function getPosExternalId(userId: number | string, suffix: string = ""): string {
    const cleanUserId = userId.toString().replace(/[^a-zA-Z0-9]/g, "")
    // Si no hay sufijo, es el POS principal v2
    if (!suffix) {
        return `easypayPOS${cleanUserId}v2`
    }
    // Si hay sufijo, es un POS adicional. Usamos 'ADD' como separador alfanumérico.
    return `easypayPOS${cleanUserId}ADD${suffix}`
}

export async function createPaymentPreference(formData: FormData) {
    const title = formData.get("title") as string
    const price = Number(formData.get("price"))

    if (!title || !price) {
        return { error: "Por favor completa todos los campos" }
    }

    const credentials = await getMPCredentials()
    if (!credentials?.access_token) {
        return { error: "No tienes vinculada tu cuenta de Mercado Pago" }
    }

    try {
        const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${credentials.access_token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                items: [
                    {
                        title: title,
                        quantity: 1,
                        unit_price: price,
                        currency_id: "ARS",
                    },
                ],
                back_urls: {
                    success: "https://easypay.com/cobros",
                    failure: "https://easypay.com/cobros",
                    pending: "https://easypay.com/cobros",
                },
                auto_return: "approved",
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            console.error("MP Error:", data)
            return { error: "Error al crear la preferencia en Mercado Pago" }
        }

        return {
            success: true,
            init_point: data.init_point,
            sandbox_init_point: data.sandbox_init_point,
        }
    } catch (error) {
        console.error("Server Action Error:", error)
        return { error: "Error interno del servidor" }
    }
}

export async function getTerminalData() {
    const credentials = await getMPCredentials()
    if (!credentials?.access_token || !credentials?.mp_user_id) {
        return { error: "No tienes vinculada tu cuenta de Mercado Pago" }
    }

    const accessToken = credentials.access_token
    const userId = credentials.mp_user_id

    const storeExternalId = getStoreExternalId(userId)
    const posExternalId = getPosExternalId(userId)

    try {
        // 1. Buscar Sucursal (Store)
        let storeId = null
        const storesRes = await fetch(
            `https://api.mercadopago.com/users/${userId}/stores/search?external_id=${storeExternalId}`,
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        )
        const storesData = await storesRes.json()

        if (storesData.results && storesData.results.length > 0) {
            storeId = storesData.results[0].id
        } else {
            return { needs_setup: true }
        }

        // 2. Buscar Caja (POS)
        let posData = null
        const posRes = await fetch(
            `https://api.mercadopago.com/pos?external_id=${posExternalId}`,
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        )
        const posResult = await posRes.json()

        if (posResult.results && posResult.results.length > 0) {
            posData = posResult.results[0]
        } else {
            // Crear POS si no existe
            const createPosRes = await fetch("https://api.mercadopago.com/pos", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: "Caja Principal",
                    store_id: storeId,
                    external_id: posExternalId,
                    fixed_amount: true,
                }),
            })
            posData = await createPosRes.json()
            if (!createPosRes.ok) {
                console.error("Error creating POS:", posData)
                return { error: "Error al crear caja en Mercado Pago" }
            }
        }

        return {
            success: true,
            qr_image: posData.qr?.image,
            external_pos_id: posData.external_id,
        }
    } catch (error) {
        console.error("Get Terminal Data Error:", error)
        return { error: "Error al obtener datos de la terminal" }
    }
}

export async function createStoreAndPos(formData: FormData) {
    const name = formData.get("name") as string
    const streetName = formData.get("street_name") as string
    const streetNumber = formData.get("street_number") as string
    const cityName = formData.get("city_name") as string
    const stateName = formData.get("state_name") as string

    if (!name || !streetName || !streetNumber || !cityName || !stateName) {
        return { error: "Por favor completa todos los campos" }
    }

    const credentials = await getMPCredentials()
    if (!credentials?.access_token || !credentials?.mp_user_id) {
        return { error: "Error de autenticación" }
    }

    const accessToken = credentials.access_token
    const userId = credentials.mp_user_id

    const storeExternalId = getStoreExternalId(userId)
    const posExternalId = getPosExternalId(userId)

    try {
        const createStoreRes = await fetch(
            `https://api.mercadopago.com/users/${userId}/stores`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: name,
                    external_id: storeExternalId,
                    location: {
                        street_number: streetNumber,
                        street_name: streetName,
                        city_name: cityName,
                        state_name: stateName,
                        latitude: -34.603722,
                        longitude: -58.381592,
                        reference: "Easypay Store",
                    },
                }),
            }
        )
        const newStore = await createStoreRes.json()

        if (!createStoreRes.ok) {
            console.error("Error creating store:", newStore)
            return { error: newStore.message || "Error al crear la sucursal. Verifica la dirección." }
        }

        const createPosRes = await fetch("https://api.mercadopago.com/pos", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: "Caja Principal",
                store_id: newStore.id,
                external_id: posExternalId,
                fixed_amount: true,
            }),
        })

        const posData = await createPosRes.json()
        if (!createPosRes.ok) {
            console.error("Error creating POS:", posData)
            return { error: "Sucursal creada, pero error al crear la caja." }
        }

        return { success: true }

    } catch (error) {
        console.error("Create Store Error:", error)
        return { error: "Error interno al crear la sucursal" }
    }
}

export async function createInstoreOrder(formData: FormData) {
    const amount = Number(formData.get("amount"))
    const description = formData.get("description") as string
    const externalPosId = formData.get("external_pos_id") as string

    if (!amount || !externalPosId) {
        return { error: "Faltan datos para crear la orden" }
    }

    const credentials = await getMPCredentials()
    if (!credentials?.access_token || !credentials?.mp_user_id) {
        return { error: "Error de autenticación" }
    }

    try {
        const url = `https://api.mercadopago.com/instore/orders/qr/seller/collectors/${credentials.mp_user_id}/pos/${externalPosId}/qrs`

        const payload = {
            external_reference: `order_${Date.now()}`,
            title: description || "Cobro Easypay",
            description: description || "Cobro desde Easypay",
            total_amount: amount,
            items: [
                {
                    external_code: "ITEM",
                    category: "marketplace",
                    title: description || "Item",
                    description: description || "Item description",
                    unit_price: amount,
                    quantity: 1,
                    unit_measure: "unit",
                    total_amount: amount,
                    currency_id: "ARS",
                },
            ],
        }


        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${credentials.access_token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        })

        if (!response.ok) {
            const errData = await response.json()
            console.error("Error creating order:", JSON.stringify(errData, null, 2))
            return { error: `Error MP: ${errData.message} (${errData.status}) - ${JSON.stringify(errData.causes || [])}` }
        }

        return { success: true }
    } catch (error) {
        console.error("Create Order Error:", error)
        return { error: "Error interno al crear la orden" }
    }
}

export async function deleteInstoreOrder(externalPosId: string) {
    const credentials = await getMPCredentials()
    if (!credentials?.access_token || !credentials?.mp_user_id) {
        return { error: "Error de autenticación" }
    }

    try {
        const url = `https://api.mercadopago.com/instore/orders/qr/seller/collectors/${credentials.mp_user_id}/pos/${externalPosId}/qrs`

        const response = await fetch(url, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${credentials.access_token}`,
            },
        })

        if (!response.ok && response.status !== 404 && response.status !== 400) {
            const errData = await response.json()
            console.error("Error deleting order:", errData)
            return { error: "Error al borrar la orden anterior" }
        }

        return { success: true }
    } catch (error) {
        console.error("Delete Order Error:", error)
        return { error: "Error interno al borrar la orden" }
    }
}

export async function getPosDetails(externalPosId: string) {
    const credentials = await getMPCredentials()
    if (!credentials?.access_token) {
        return { error: "No autenticado" }
    }

    try {
        const response = await fetch(
            `https://api.mercadopago.com/pos?external_id=${externalPosId}`,
            {
                headers: { Authorization: `Bearer ${credentials.access_token}` },
            }
        )
        const data = await response.json()
        return { success: true, data }
    } catch (error) {
        return { error: "Error al obtener detalles del POS" }
    }
}

export async function listStores() {
    const credentials = await getMPCredentials()
    if (!credentials?.access_token || !credentials?.mp_user_id) {
        return { error: "No autenticado" }
    }

    try {
        const response = await fetch(
            `https://api.mercadopago.com/users/${credentials.mp_user_id}/stores/search`,
            {
                headers: { Authorization: `Bearer ${credentials.access_token}` },
            }
        )
        const data = await response.json()
        return { success: true, results: data.results }
    } catch (error) {
        return { error: "Error al listar sucursales" }
    }
}

export async function listPos() {
    const credentials = await getMPCredentials()
    if (!credentials?.access_token || !credentials?.mp_user_id) {
        return { error: "No autenticado" }
    }

    try {
        const response = await fetch(
            `https://api.mercadopago.com/pos?limit=100`,
            {
                headers: { Authorization: `Bearer ${credentials.access_token}` },
            }
        )
        const data = await response.json()
        return { success: true, results: data.results }
    } catch (error) {
        return { error: "Error al listar cajas" }
    }
}

export async function createAdditionalPos(name: string) {
    const credentials = await getMPCredentials()
    if (!credentials?.access_token || !credentials?.mp_user_id) {
        return { error: "No autenticado" }
    }

    const userId = credentials.mp_user_id
    const storeExternalId = getStoreExternalId(userId)

    try {
        // 1. Buscar el Store ID (SOLO v2)
        let storeId = null

        const storesResV2 = await fetch(
            `https://api.mercadopago.com/users/${userId}/stores/search?external_id=${storeExternalId}`,
            { headers: { Authorization: `Bearer ${credentials.access_token}` } }
        )
        const storesDataV2 = await storesResV2.json()

        if (storesDataV2.results && storesDataV2.results.length > 0) {
            storeId = storesDataV2.results[0].id
        }

        if (!storeId) {
            return { error: "No se encontró la sucursal principal. Por favor configura tu sucursal primero." }
        }

        const uniqueSuffix = Date.now().toString().slice(-6)
        const newPosExternalId = getPosExternalId(userId, uniqueSuffix)

        const createPosRes = await fetch("https://api.mercadopago.com/pos", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${credentials.access_token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: name,
                store_id: storeId,
                external_id: newPosExternalId,
                fixed_amount: true,
            }),
        })

        const posData = await createPosRes.json()

        if (!createPosRes.ok) {
            console.error("Error creating additional POS:", posData)
            return { error: "Error al crear la nueva caja" }
        }

        return { success: true, pos: posData }

    } catch (error) {
        console.error("Create Additional POS Error:", error)
        return { error: "Error interno al crear caja" }
    }
}
