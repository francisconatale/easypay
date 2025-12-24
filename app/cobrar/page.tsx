"use client"

import { useState, useEffect, useRef } from "react"
import { createInstoreOrder, getStoresWithPos } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, QrCode, Check, ArrowLeft, Settings, Store } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

    // State for stores and selection
    const [stores, setStores] = useState<any[]>([])
    const [selectedStoreId, setSelectedStoreId] = useState<string>("")
    const [selectedPosId, setSelectedPosId] = useState<string>("")
    const [loadingStores, setLoadingStores] = useState(true)

    useEffect(() => {
        async function loadStores() {
            setLoadingStores(true)
            const res = await getStoresWithPos() as any
            if (res.success && res.stores) {
                setStores(res.stores)
                // Auto-select first store if available
                if (res.stores.length > 0) {
                    const firstStore = res.stores[0]
                    setSelectedStoreId(firstStore.external_id)
                    if (firstStore.terminals && firstStore.terminals.length > 0) {
                        setSelectedPosId(firstStore.terminals[0].external_id)
                    }
                }
            } else if (res.error) {
                console.error("Error loading stores:", res.error)
                setError(res.error)
                if (!res.stores || res.stores.length === 0) {
                    setNeedsSetup(true)
                }
            }
            setLoadingStores(false)
        }
        loadStores()
    }, [])

    // Update POS selection when Store changes
    const handleStoreChange = (storeExternalId: string) => {
        setSelectedStoreId(storeExternalId)
        const store = stores.find(s => s.external_id === storeExternalId)
        if (store && store.terminals && store.terminals.length > 0) {
            setSelectedPosId(store.terminals[0].external_id)
        } else {
            setSelectedPosId("")
        }
    }

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        setError(null)
        setQrData(null)
        setNeedsSetup(false)

        // Append selected IDs to formData
        formData.append("external_store_id", selectedStoreId)
        formData.append("external_pos_id", selectedPosId)

        const res = await createInstoreOrder(formData) as any

        if (res.needsSetup) {
            setNeedsSetup(true)
        } else if (res.error) {
            setError(res.error)
        } else if (res.qrData) {
            console.log("Setting QR Data:", res.qrData)
            setQrData(res.qrData)
        } else {
            // Fallback: Use local QR data if backend didn't return it (optimized path)
            const store = stores.find(s => s.external_id === selectedStoreId)
            const pos = store?.terminals?.find((p: any) => p.external_id === selectedPosId)
            const localQrData = pos?.qr?.qr_code || pos?.qr_code || pos?.qr?.image

            if (localQrData) {
                console.log("Using Local QR Data:", localQrData)
                setQrData(localQrData)
            } else {
                console.warn("No QR Data found locally or in response")
            }
        }

        setIsLoading(false)
    }

    const handleReset = () => {
        setQrData(null)
        setError(null)
        setNeedsSetup(false)
    }

    if (loadingStores) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (needsSetup || stores.length === 0) {
        if (error && error.includes("expiró")) {
            return (
                <div className="container mx-auto px-6 py-8">
                    <div className="max-w-md mx-auto space-y-8">
                        <Card className="border-red-200 bg-red-50">
                            <CardHeader>
                                <CardTitle className="text-red-800">Sesión Expirada</CardTitle>
                                <CardDescription className="text-red-700">
                                    Tu conexión con Mercado Pago ha expirado.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link href="/dashboard">
                                    <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                                        Reconectar Mercado Pago
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

    const selectedStore = stores.find(s => s.external_id === selectedStoreId)

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
                        <CardDescription>Selecciona la caja e ingresa el monto</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!qrData ? (
                            <form action={handleSubmit} className="space-y-4">
                                {/* Store Selection */}
                                <div className="space-y-2">
                                    <Label>Sucursal</Label>
                                    <Select value={selectedStoreId} onValueChange={handleStoreChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona una sucursal" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {stores.map((store) => (
                                                <SelectItem key={store.id} value={store.external_id}>
                                                    {store.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* POS Selection */}
                                <div className="space-y-2">
                                    <Label>Caja (POS)</Label>
                                    <Select value={selectedPosId} onValueChange={setSelectedPosId} disabled={!selectedStoreId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona una caja" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {selectedStore?.terminals?.map((pos: any) => (
                                                <SelectItem key={pos.id} value={pos.external_id}>
                                                    {pos.name} (ID: {pos.id})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Concepto</Label>
                                    <Input id="description" name="description" placeholder="Ej: Venta Mostrador" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Monto ($)</Label>
                                    <Input id="amount" name="amount" type="number" min="1" step="0.01" placeholder="0.00" required />
                                </div>

                                {error && <p className="text-sm text-red-600 font-medium text-center">{error}</p>}

                                <Button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
                                    disabled={isLoading || !selectedPosId}
                                >
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
