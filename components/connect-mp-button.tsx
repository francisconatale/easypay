"use client"

import { Button } from "@/components/ui/button"
import { getMercadoPagoAuthUrl } from "@/app/actions/mercadopago"
import { useState } from "react"
import { Loader2 } from "lucide-react"

export function ConnectMPButton() {
    const [loading, setLoading] = useState(false)

    const handleConnect = async () => {
        try {
            setLoading(true)
            const url = await getMercadoPagoAuthUrl()
            window.location.href = url
        } catch (error) {
            console.error("Error connecting to Mercado Pago:", error)
            alert("Error al conectar con Mercado Pago")
            setLoading(false)
        }
    }

    return (
        <Button
            onClick={handleConnect}
            disabled={loading}
            className="bg-[#009EE3] hover:bg-[#0081B9] text-white"
        >
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Conectando...
                </>
            ) : (
                "Conectar Mercado Pago"
            )}
        </Button>
    )
}
