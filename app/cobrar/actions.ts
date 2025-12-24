"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

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

function getStoreExternalId(userId: number | string): string {
    const cleanUserId = userId.toString().replace(/[^a-zA-Z0-9]/g, "")
    return `easypayStore${cleanUserId}v2`
}

function getPosExternalId(userId: number | string, suffix: string = ""): string {
    const cleanUserId = userId.toString().replace(/[^a-zA-Z0-9]/g, "")
    if (!suffix) {
        return `easypayPOS${cleanUserId}v2`
    }
    return `easypayPOS${cleanUserId}ADD${suffix}`
}
async function createStoreInternal(userId: number | string, accessToken: string, data: {
    name: string,
    streetName: string,
    streetNumber: string,
    cityName: string,
    stateName: string
}) {
    const storeExternalId = getStoreExternalId(userId)

    const createStoreRes = await fetch(
        `https://api.mercadopago.com/users/${userId}/stores`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: data.name,
                external_id: storeExternalId,
                location: {
                    street_number: data.streetNumber,
                    street_name: data.streetName,
                    city_name: data.cityName,
                    state_name: data.stateName,
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
        throw new Error(newStore.message || "Error al crear la sucursal.")
    }

    return newStore
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
        let storeName = null
        let storeLocation = null
        const storesRes = await fetch(
            `https://api.mercadopago.com/users/${userId}/stores/search?external_id=${storeExternalId}`,
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        )
        const storesData = await storesRes.json()

        if (!storesRes.ok) {
            // 404 is expected if the user has no stores yet
            if (storesRes.status === 404) {
                return { needs_setup: true }
            }

            if (storesRes.status === 403 || storesRes.status === 401) {
                return { error: "Tu sesión de Mercado Pago expiró. Por favor, vuelve a vincular tu cuenta.", needs_reauth: true }
            }

            console.error("Error searching stores:", storesData)
            return { error: "Error al verificar sucursal en Mercado Pago" }
        }

        if (storesData.results && storesData.results.length > 0) {
            storeId = storesData.results[0].id
            storeName = storesData.results[0].name
            storeLocation = storesData.results[0].location
        }


        let posData = null
        const posRes = await fetch(
            `https://api.mercadopago.com/pos?external_id=${posExternalId}`,
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        )
        const posResult = await posRes.json()

        if (!posRes.ok) {
            if (posRes.status === 403 || posRes.status === 401) {
                return { error: "Tu sesión de Mercado Pago expiró. Por favor, vuelve a vincular tu cuenta.", needs_reauth: true }
            }
            return { error: "Error al verificar caja en Mercado Pago" }
        }

        if (posResult.results && posResult.results.length > 0) {
            posData = posResult.results[0]
        } else {
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
            qr_code: posData.qr?.qr_code || posData.qr_code,
            external_pos_id: posData.external_id,
            external_store_id: storeExternalId,
            store_name: storeName,
            store_location: storeLocation,
            store_id: storeId,
        }
    } catch (error) {
        console.error("Get Terminal Data Error:", error)
        return { error: "Error al obtener datos de la terminal" }
    }
}

export async function deleteStore(storeId: string) {
    const credentials = await getMPCredentials()
    if (!credentials?.access_token || !credentials?.mp_user_id) {
        return { error: "No autenticado" }
    }

    try {
        const response = await fetch(
            `https://api.mercadopago.com/users/${credentials.mp_user_id}/stores/${storeId}`,
            {
                method: "DELETE",
                headers: { Authorization: `Bearer ${credentials.access_token}` },
            }
        )

        if (!response.ok) {
            const errData = await response.json()
            console.error("Error deleting store:", errData)
            return { error: "Error al eliminar la sucursal" }
        }

        return { success: true }
    } catch (error) {
        console.error("Delete Store Error:", error)
        return { error: "Error interno al eliminar la sucursal" }
    }
}



export async function disconnectMercadoPago(_formData?: FormData) {
    const supabase = await createServerClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error("No autenticado")

    const { error } = await supabase
        .from("mp_credentials")
        .delete()
        .eq("user_id", user.id)

    if (error) {
        console.error("Error disconnecting MP:", error)
        throw new Error("Error al desconectar Mercado Pago")
    }

    // Limpiar también estados pendientes
    await supabase.from("oauth_states").delete().eq("user_id", user.id)

    redirect("/dashboard?success=mp_disconnected")
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
        throw new Error("Error de autenticación")
    }

    const accessToken = credentials.access_token
    const userId = credentials.mp_user_id
    const posExternalId = getPosExternalId(userId)

    try {
        const newStore = await createStoreInternal(userId, accessToken, {
            name,
            streetName,
            streetNumber,
            cityName,
            stateName
        })

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
            // Si ya existe (409), intentamos actualizarla para vincularla al nuevo store
            if (createPosRes.status === 409) {
                console.log("POS already exists, updating store link...")

                // 1. Buscar la caja existente para obtener su ID numérico
                const searchPosRes = await fetch(
                    `https://api.mercadopago.com/pos?external_id=${posExternalId}`,
                    {
                        headers: { Authorization: `Bearer ${accessToken}` },
                    }
                )
                const searchPosData = await searchPosRes.json()

                if (searchPosData.results && searchPosData.results.length > 0) {
                    const existingPosId = searchPosData.results[0].id

                    const updatePosRes = await fetch(
                        `https://api.mercadopago.com/pos/${existingPosId}`,
                        {
                            method: "PUT",
                            headers: {
                                Authorization: `Bearer ${accessToken}`,
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                name: "Caja Principal",
                                store_id: newStore.id,
                                fixed_amount: true,
                            }),
                        }
                    )

                    if (!updatePosRes.ok) {
                        const updateErr = await updatePosRes.json()
                        console.error("Error updating existing POS:", updateErr)
                        return { error: "La caja ya existía y no se pudo vincular a la nueva sucursal." }
                    }

                    return { success: true }
                } else {
                    return { error: "Error de conflicto (409) pero no se encontró la caja." }
                }
            }

            console.error("Error creating POS:", posData)
            return { error: "Sucursal creada, pero error al crear la caja." }
        }

        return { success: true }

    } catch (error: any) {
        console.error("Create Store Error:", error)
        return { error: error.message || "Error interno al crear la sucursal" }
    }
}

export async function getStoresWithPos() {
    const credentials = await getMPCredentials()
    if (!credentials?.access_token || !credentials?.mp_user_id) {
        return { error: "No autenticado" }
    }

    try {
        // 1. Obtener todas las stores
        const storesRes = await fetch(
            `https://api.mercadopago.com/users/${credentials.mp_user_id}/stores/search`,
            {
                headers: { Authorization: `Bearer ${credentials.access_token}` },
                cache: 'no-store'
            }
        )
        const storesData = await storesRes.json()

        if (!storesRes.ok) {
            if (storesRes.status === 403 || storesRes.status === 401) {
                return { error: "Tu sesión de Mercado Pago expiró.", needs_reauth: true }
            }
            console.error("Error fetching stores:", storesData)
            return { error: "Error al obtener sucursales" }
        }

        const stores = storesData.results || []

        // 2. Obtener todos los POS
        const posRes = await fetch(
            `https://api.mercadopago.com/pos?limit=100`,
            {
                headers: { Authorization: `Bearer ${credentials.access_token}` },
                cache: 'no-store'
            }
        )
        const posData = await posRes.json()
        const allPos = posData.results || []

        // 3. Mapear POS a sus respectivas Stores
        const storesWithPos = stores.map((store: any) => {
            return {
                ...store,
                terminals: allPos.filter((pos: any) => String(pos.store_id) === String(store.id))
            }
        })

        return { success: true, stores: storesWithPos }
    } catch (error) {
        console.error("Error fetching stores with POS:", error)
        return { error: "Error al obtener sucursales y cajas" }
    }
}

export async function createInstoreOrder(formData: FormData) {
    const amount = Number(formData.get("amount"))
    const description = formData.get("description") as string

    if (!amount) {
        return { error: "Monto inválido" }
    }

    const credentials = await getMPCredentials()
    if (!credentials?.access_token || !credentials?.mp_user_id) {
        throw new Error("Error de autenticación")
    }

    let externalPosId = formData.get("external_pos_id") as string
    let externalStoreId = formData.get("external_store_id") as string
    let qrData = null

    if (!externalPosId || !externalStoreId) {
        const terminalData = await getTerminalData()

        if (terminalData.error || !terminalData.external_pos_id || !terminalData.external_store_id) {
            return { error: "No se pudo obtener la información de la caja (POS). Configura tu sucursal primero." }
        }
        externalPosId = terminalData.external_pos_id
        externalStoreId = terminalData.external_store_id
        qrData = terminalData.qr_code || terminalData.qr_image
    }

    const userId = credentials.mp_user_id
    const externalReference = `order_${Date.now()}`

    const payload = {
        external_reference: externalReference,
        title: description || "Cobro con QR",
        description: description || `Cobro en caja ${externalPosId}`,
        notification_url: "https://tu-backend.com/ipn", // TODO: Configurar URL real
        total_amount: amount,
        items: [
            {
                sku_number: "A123",
                category: "marketplace",
                title: description || "Item",
                description: description || "Item de venta",
                unit_price: amount,
                quantity: 1,
                unit_measure: "unit",
                total_amount: amount
            }
        ]
    }

    try {
        const url = `https://api.mercadopago.com/instore/qr/seller/collectors/${userId}/stores/${externalStoreId}/pos/${externalPosId}/orders`

        const response = await fetch(url, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${credentials.access_token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        })

        if (response.status === 204) {
            console.log("Instore Order Created Successfully (204 No Content)")
            return {
                success: true,
                qrData: qrData,
                orderId: externalReference,
                externalReference
            }
        }

        if (!response.ok) {
            const errData = await response.json()
            console.error("Error creating Instore Order:", JSON.stringify(errData, null, 2))
            return { error: "Error al crear la orden presencial. Verifica que la caja exista." }
        }

        // Fallback for unexpected success status
        const data = await response.json()
        console.log("Instore Order Created (Unexpected Content):", data)
        return {
            success: true,
            qrData: qrData,
            orderId: externalReference,
            externalReference
        }

    } catch (error) {
        console.error("Create Instore Order Error:", error)
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
