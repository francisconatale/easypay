"use server"

import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { randomBytes } from "crypto"

export async function getMercadoPagoAuthUrl() {
    const supabase = await createServerClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Usuario no autenticado")
    }

    const state = randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    const { error } = await supabase.from("oauth_states").insert({
        state,
        user_id: user.id,
        expires_at: expiresAt,
    })

    if (error) {
        console.error("Error saving OAuth state:", error)
        throw new Error("Error al iniciar la conexión con Mercado Pago")
    }

    const params = new URLSearchParams({
        client_id: process.env.MP_CLIENT_ID!,
        response_type: "code",
        platform_id: "mp",
        redirect_uri: process.env.MP_REDIRECT_URI!,
        state: state,
    })

    const authUrl = `https://auth.mercadopago.com.ar/authorization?${params.toString()}`
    console.log("Generated MP Auth URL:", authUrl)
    console.log("Using Redirect URI:", process.env.MP_REDIRECT_URI)

    return authUrl
}
