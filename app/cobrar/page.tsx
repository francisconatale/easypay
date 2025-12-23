"use client"

import { useState, useEffect, useRef } from "react"
import { createInstoreOrder } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, QrCode, Check, ArrowLeft, Settings } from "lucide-react"
import Link from "next/link"
import QRCode from "qrcode"

// Componente para renderizar el QR
function PaymentQR({ qrData }: { qrData: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        if (canvasRef.current && qrData) {
            QRCode.toCanvas(canvasRef.current, qrData, {
                width: 256,
                margin: 2,
            }, (error) => {
                if (error) console.error("Error generating QR:", error)
            })
        }
    }, [qrData])

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow-sm border">
            <canvas ref={canvasRef} className="max-w-full h-auto" />
            <p className="mt-2 text-xs text-slate-500 font-mono break-all max-w-[250px] text-center">
                Escanear con Mercado Pago, Modo o BNA+
            </p>
        </div>
    )
}

export default function CobrarPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [qrData, setQrData] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [needsSetup, setNeedsSetup] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        setError(null)
        setQrData(null)
        setNeedsSetup(false)

        const res = await createInstoreOrder(formData)

        if (res.needsSetup) {
            setNeedsSetup(true)
        } else if (res.error) {
            setError(res.error)
        } else if (res.qrData) {
            console.log("Setting QR Data:", res.qrData)
            setQrData(res.qrData)
        }

        setIsLoading(false)
    }

    const handleReset = () => {
        setQrData(null)
        setError(null)
        setNeedsSetup(false)
    }

    if (needsSetup) {
        return (
            <div className="container mx-auto px-6 py-8">
                <div className="max-w-md mx-auto space-y-8">
                    <Card className="border-yellow-200 bg-yellow-50">
                        <CardHeader>
                            <CardTitle className="text-yellow-800">Configuración Requerida</CardTitle>
                            <CardDescription className="text-yellow-700">
                                Antes de cobrar, necesitas configurar tu sucursal y caja.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href="/negocios">
                                <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Ir a Configuración
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-6 py-8">
            <div className="max-w-md mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Cobrar con QR</h1>
                    <p className="text-slate-600 mt-1">Genera un QR interoperable para cada venta</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Nueva Venta</CardTitle>
                        <CardDescription>Ingresa el monto y genera el código QR</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!qrData ? (
                            <form action={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="description">Concepto</Label>
                                    <Input id="description" name="description" placeholder="Ej: Venta Mostrador" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Monto ($)</Label>
                                    <Input id="amount" name="amount" type="number" min="1" step="0.01" placeholder="0.00" required />
                                </div>

                                {error && <p className="text-sm text-red-600 font-medium text-center">{error}</p>}

                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Generando...
                                        </>
                                    ) : (
                                        <>
                                            <QrCode className="mr-2 h-5 w-5" />
                                            Generar QR
                                        </>
                                    )}
                                </Button>
                            </form>
                        ) : (
                            <div className="flex flex-col items-center space-y-6 animate-in fade-in zoom-in duration-300">
                                <div className="text-center space-y-1">
                                    <div className="flex items-center justify-center gap-2 text-green-600 font-bold text-lg">
                                        <Check className="h-6 w-6" />
                                        ¡Listo para cobrar!
                                    </div>
                                    <p className="text-slate-500 text-sm">Escanea el código con tu billetera virtual</p>
                                </div>

                                <PaymentQR qrData={qrData} />

                                <div className="w-full pt-4 border-t">
                                    <Button variant="outline" className="w-full" onClick={handleReset}>
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Nueva Venta
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
