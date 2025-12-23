import { createServerClient } from "@/lib/supabase/server"

interface MPOAuthResponse {
    access_token: string
    token_type: string
    expires_in: number
    scope: string
    user_id: number
    refresh_token: string
    public_key: string
    live_mode: boolean
}

export async function exchangeMPOAuthToken(code: string): Promise<MPOAuthResponse> {
    const params = {
        client_id: process.env.MP_CLIENT_ID!,
        client_secret: process.env.MP_CLIENT_SECRET!,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: process.env.MP_REDIRECT_URI!,
    }

    const response = await fetch("https://api.mercadopago.com/oauth/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Error al obtener el token de Mercado Pago")
    }

    return response.json()
}

export async function refreshMPOAuthToken(refreshToken: string): Promise<MPOAuthResponse> {
    const params = {
        client_id: process.env.MP_CLIENT_ID!,
        client_secret: process.env.MP_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
    }

    const response = await fetch("https://api.mercadopago.com/oauth/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Error al refrescar el token de Mercado Pago")
    }

    return response.json()
}
