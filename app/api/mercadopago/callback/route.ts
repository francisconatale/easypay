import { createServerClient } from "@/lib/supabase/server"
import { exchangeMPOAuthToken } from "@/lib/mercadopago"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get("code")
    const state = requestUrl.searchParams.get("state")
    const error = requestUrl.searchParams.get("error")

    if (error) {
        return NextResponse.redirect(`${requestUrl.origin}/dashboard?error=${error}`)
    }

    if (!code || !state) {
        return NextResponse.redirect(`${requestUrl.origin}/dashboard?error=missing_params`)
    }

    try {
        const supabase = await createServerClient()

        // Verificar state y obtener usuario
        const { data: stateData, error: stateError } = await supabase
            .from("oauth_states")
            .select("user_id")
            .eq("state", state)
            .gt("expires_at", new Date().toISOString())
            .single()

        if (stateError || !stateData) {
            console.error("Invalid or expired state:", stateError)
            return NextResponse.redirect(`${requestUrl.origin}/dashboard?error=invalid_state`)
        }

        const userId = stateData.user_id

        // Intercambiar código por tokens
        const tokenData = await exchangeMPOAuthToken(code)

        // Calcular fecha de expiración
        const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

        // Guardar en base de datos
        const { error: dbError } = await supabase.from("mp_credentials").upsert({
            user_id: userId,
            mp_user_id: tokenData.user_id,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            public_key: tokenData.public_key,
            expires_at: expiresAt,
            updated_at: new Date().toISOString(),
        })

        if (dbError) {
            console.error("Error saving credentials:", dbError)
            return NextResponse.redirect(`${requestUrl.origin}/dashboard?error=db_error`)
        }

        // Eliminar el state usado
        await supabase.from("oauth_states").delete().eq("state", state)

        return NextResponse.redirect(`${requestUrl.origin}/dashboard?success=mp_connected`)
    } catch (error) {
        console.error("Error in MP callback:", error)
        return NextResponse.redirect(`${requestUrl.origin}/dashboard?error=exchange_failed`)
    }
}
