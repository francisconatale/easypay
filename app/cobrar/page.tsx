"use client"

import { useState, useEffect } from "react"
import { createPaymentPreference, getTerminalData, createInstoreOrder, createStoreAndPos, getPosDetails, deleteInstoreOrder, listStores, listPos, createAdditionalPos } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, QrCode, Link as LinkIcon, Copy, Check, Smartphone, Monitor, Store, Info, RefreshCw, Trash2, ArrowLeft, Wallet, Plus } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function CobrarPage() {
    // Estado Link de Pago
    const [isLoadingLink, setIsLoadingLink] = useState(false)
    const [linkResult, setLinkResult] = useState<{ init_point: string } | null>(null)
    const [linkError, setLinkError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    // Estado QR Interoperable (Terminal)
    const [isLoadingTerminal, setIsLoadingTerminal] = useState(true)
    const [terminalData, setTerminalData] = useState<{ qr_image: string; external_pos_id: string } | null>(null)
    const [terminalError, setTerminalError] = useState<string | null>(null)
    const [isPushingOrder, setIsPushingOrder] = useState(false)

    // Estado Selección de Caja
    const [posList, setPosList] = useState<any[]>([])
    const [selectedPosId, setSelectedPosId] = useState<string>("")
    const [isCreatingPos, setIsCreatingPos] = useState(false)
    const [newPosName, setNewPosName] = useState("")
    const [isNewPosDialogOpen, setIsNewPosDialogOpen] = useState(false)

    // Estado de UI para el flujo de venta
    const [showQr, setShowQr] = useState(false)
    const [isResetting, setIsResetting] = useState(false)

    // Estado Configuración Sucursal
    const [needsSetup, setNeedsSetup] = useState(false)
    const [isCreatingStore, setIsCreatingStore] = useState(false)

    // Estado Debug
    const [posDetails, setPosDetails] = useState<any>(null)
    const [storesList, setStoresList] = useState<any[] | null>(null)

    // Cargar datos de la terminal al iniciar (siempre necesario para QR Interoperable)
    useEffect(() => {
        loadTerminal()
    }, [])

    async function loadTerminal() {
        setIsLoadingTerminal(true)
        setNeedsSetup(false)
        setTerminalError(null)

        // 1. Cargar lista de cajas disponibles
        const posRes = await listPos()

        if (posRes.results && posRes.results.length > 0) {
            setPosList(posRes.results)
            // Seleccionar la primera por defecto si no hay seleccionada
            if (!selectedPosId) {
                const defaultPos = posRes.results[0]
                setSelectedPosId(defaultPos.external_id)
                setTerminalData({
                    qr_image: defaultPos.qr?.image,
                    external_pos_id: defaultPos.external_id
                })
            }
        } else {
            // Si no hay cajas, intentamos el flujo antiguo de "getTerminalData" que crea una por defecto
            const res = await getTerminalData()
            if (res.error) {
                setTerminalError(res.error)
            } else if (res.needs_setup) {
                setNeedsSetup(true)
            } else if (res.qr_image && res.external_pos_id) {
                setTerminalData({ qr_image: res.qr_image, external_pos_id: res.external_pos_id })
                setSelectedPosId(res.external_pos_id)
                // Actualizamos la lista con esta nueva caja
                setPosList([{
                    name: "Caja Principal",
                    external_id: res.external_pos_id,
                    qr: { image: res.qr_image }
                }])
            }
        }

        setIsLoadingTerminal(false)
    }

    // Manejar cambio de caja
    const handlePosChange = (value: string) => {
        setSelectedPosId(value)
        const selectedPos = posList.find(p => p.external_id === value)
        if (selectedPos) {
            setTerminalData({
                qr_image: selectedPos.qr?.image,
                external_pos_id: selectedPos.external_id
            })
            // Si cambiamos de caja, ocultamos el QR anterior si estaba visible
            setShowQr(false)
        }
    }

    // Handler Crear Nueva Caja
    async function handleCreatePos() {
        if (!newPosName.trim()) return
        setIsCreatingPos(true)

        const res = await createAdditionalPos(newPosName)

        if (res.error) {
            alert(res.error)
        } else if (res.pos) {
            // Recargar lista y seleccionar la nueva
            const posRes = await listPos()
            if (posRes.results) {
                setPosList(posRes.results)
                setSelectedPosId(res.pos.external_id)
                setTerminalData({
                    qr_image: res.pos.qr?.image,
                    external_pos_id: res.pos.external_id
                })
                setShowQr(false)
                setIsNewPosDialogOpen(false)
                setNewPosName("")
            }
        }

        setIsCreatingPos(false)
    }

    // Handler Link de Pago
    async function handleLinkSubmit(formData: FormData) {
        setIsLoadingLink(true)
        setLinkError(null)
        setLinkResult(null)

        const res = await createPaymentPreference(formData)

        if (res.error) {
            setLinkError(res.error)
        } else if (res.init_point) {
            setLinkResult({ init_point: res.init_point })
        }

        setIsLoadingLink(false)
    }

    // Handler QR Interoperable
    async function handleTerminalSubmit(formData: FormData) {
        if (!terminalData) return
        setIsPushingOrder(true)

        formData.append("external_pos_id", terminalData.external_pos_id)

        // Primero aseguramos que no haya orden previa
        await deleteInstoreOrder(terminalData.external_pos_id)

        const res = await createInstoreOrder(formData)

        if (res.error) {
            alert(res.error)
        } else {
            // Éxito: Mostramos el QR
            setShowQr(true)
        }

        setIsPushingOrder(false)
    }

    // Handler Crear Sucursal
    async function handleCreateStore(formData: FormData) {
        setIsCreatingStore(true)
        const res = await createStoreAndPos(formData)

        if (res.error) {
            setTerminalError(res.error)
        } else {
            await loadTerminal()
        }
        setIsCreatingStore(false)
    }

    async function handleViewDebugInfo() {
        if (!terminalData?.external_pos_id) return

        // Cargar detalles del POS
        const posRes = await getPosDetails(terminalData.external_pos_id)
        if (posRes.success) {
            setPosDetails(posRes.data)
        }

        // Cargar lista de sucursales
        const storesRes = await listStores()
        if (storesRes.success) {
            setStoresList(storesRes.results)
        }
    }

    async function handleNewSale() {
        if (!terminalData?.external_pos_id) return
        setIsResetting(true)
        // Limpiamos la orden del POS para dejarlo listo
        await deleteInstoreOrder(terminalData.external_pos_id)
        setShowQr(false)
        setIsResetting(false)
    }

    const copyToClipboard = () => {
        if (linkResult?.init_point) {
            navigator.clipboard.writeText(linkResult.init_point)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const resetLinkFlow = () => {
        setLinkResult(null)
        setLinkError(null)
    }

    return (
        <div className="container mx-auto px-6 py-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Generar Cobro</h1>
                    <p className="text-slate-600 mt-1">Elige cómo quieres cobrar a tus clientes</p>
                </div>

                <Tabs defaultValue="interoperable" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="interoperable">
                            <Wallet className="mr-2 h-4 w-4" />
                            QR Interoperable (Todos los Bancos)
                        </TabsTrigger>
                        <TabsTrigger value="link">
                            <LinkIcon className="mr-2 h-4 w-4" />
                            Link de Pago
                        </TabsTrigger>
                    </TabsList>

                    {/* TAB: QR INTEROPERABLE (INSTORE) */}
                    <TabsContent value="interoperable" className="mt-6">
                        {needsSetup ? (
                            <Card className="max-w-xl mx-auto border-orange-200 bg-orange-50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-orange-800">
                                        <Store className="h-5 w-5" />
                                        Configurar Sucursal
                                    </CardTitle>
                                    <CardDescription className="text-orange-700">
                                        Para usar el QR interoperable, necesitamos registrar tu sucursal en Mercado Pago.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form action={handleCreateStore} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Nombre del Negocio / Sucursal</Label>
                                            <Input id="name" name="name" placeholder="Ej: Mi Tienda Centro" required className="bg-white" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="street_name">Calle</Label>
                                                <Input id="street_name" name="street_name" placeholder="Ej: Av. Corrientes" required className="bg-white" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="street_number">Número</Label>
                                                <Input id="street_number" name="street_number" placeholder="1234" required className="bg-white" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="city_name">Ciudad</Label>
                                                <Input id="city_name" name="city_name" placeholder="Ej: Buenos Aires" required className="bg-white" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="state_name">Provincia</Label>
                                                <Input id="state_name" name="state_name" placeholder="Ej: Buenos Aires" required className="bg-white" />
                                            </div>
                                        </div>

                                        {terminalError && <p className="text-sm text-red-600 font-medium">{terminalError}</p>}

                                        <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white" disabled={isCreatingStore}>
                                            {isCreatingStore ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Creando Sucursal...
                                                </>
                                            ) : (
                                                "Crear Sucursal y Generar QR"
                                            )}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        ) : !showQr ? (
                            // VISTA FORMULARIO (QR OCULTO)
                            <Card>
                                <CardHeader>
                                    <CardTitle>Nuevo Cobro QR</CardTitle>
                                    <CardDescription>Genera un QR que puede ser escaneado por <strong>cualquier banco o billetera virtual</strong>.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {isLoadingTerminal ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                        </div>
                                    ) : terminalError ? (
                                        <div className="text-red-500 text-center py-4">{terminalError}</div>
                                    ) : (
                                        <form action={handleTerminalSubmit} className="space-y-4">
                                            {posList.length > 0 && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="pos-select">Seleccionar Caja</Label>
                                                    <div className="flex gap-2">
                                                        <Select value={selectedPosId} onValueChange={handlePosChange}>
                                                            <SelectTrigger id="pos-select" className="flex-1">
                                                                <SelectValue placeholder="Selecciona una caja" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {posList.map((pos) => (
                                                                    <SelectItem key={pos.external_id} value={pos.external_id}>
                                                                        {pos.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>

                                                        <Dialog open={isNewPosDialogOpen} onOpenChange={setIsNewPosDialogOpen}>
                                                            <DialogTrigger asChild>
                                                                <Button type="button" variant="outline" size="icon" title="Crear Nueva Caja">
                                                                    <Plus className="h-4 w-4" />
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader>
                                                                    <DialogTitle>Crear Nueva Caja</DialogTitle>
                                                                    <DialogDescription>
                                                                        Agrega una nueva terminal para cobrar en otro punto de venta.
                                                                    </DialogDescription>
                                                                </DialogHeader>
                                                                <div className="space-y-4 py-4">
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="new-pos-name">Nombre de la Caja</Label>
                                                                        <Input
                                                                            id="new-pos-name"
                                                                            placeholder="Ej: Barra, Terraza, Caja 2"
                                                                            value={newPosName}
                                                                            onChange={(e) => setNewPosName(e.target.value)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <DialogFooter>
                                                                    <Button type="button" onClick={handleCreatePos} disabled={isCreatingPos || !newPosName.trim()}>
                                                                        {isCreatingPos ? (
                                                                            <>
                                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                                Creando...
                                                                            </>
                                                                        ) : (
                                                                            "Crear Caja"
                                                                        )}
                                                                    </Button>
                                                                </DialogFooter>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </div>

                                                    {selectedPosId && (
                                                        <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-md border border-slate-100">
                                                            <div className="flex flex-col gap-1">
                                                                <p><span className="font-semibold">Caja:</span> {posList.find(p => p.external_id === selectedPosId)?.name}</p>
                                                                <p><span className="font-semibold">ID Externo:</span> {selectedPosId}</p>
                                                                <p><span className="font-semibold">ID Sistema:</span> {posList.find(p => p.external_id === selectedPosId)?.id}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <Label htmlFor="description">Concepto</Label>
                                                <Input id="description" name="description" placeholder="Ej: Venta Mostrador" required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="amount">Monto ($)</Label>
                                                <Input id="amount" name="amount" type="number" min="1" step="0.01" placeholder="0.00" required />
                                            </div>
                                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6" disabled={isPushingOrder}>
                                                {isPushingOrder ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                        Generando QR...
                                                    </>
                                                ) : (
                                                    <>
                                                        <QrCode className="mr-2 h-5 w-5" />
                                                        Generar QR
                                                    </>
                                                )}
                                            </Button>
                                        </form>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            // VISTA QR (MOSTRAR)
                            <Card className="border-2 border-blue-100 shadow-lg">
                                <CardHeader className="bg-blue-50/50 border-b border-blue-100">
                                    <CardTitle className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-blue-900">
                                            <Check className="h-5 w-5 text-green-600" />
                                            Listo para cobrar
                                        </span>
                                        <Button variant="ghost" size="sm" onClick={handleNewSale} disabled={isResetting}>
                                            {isResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeft className="h-4 w-4 mr-2" />}
                                            Nueva Venta
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col items-center space-y-8 py-8">
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-slate-100 relative">
                                        {terminalData?.qr_image ? (
                                            <img
                                                src={terminalData.qr_image}
                                                alt="QR Interoperable"
                                                className="w-64 h-64 object-contain"
                                            />
                                        ) : (
                                            <div className="w-64 h-64 bg-slate-100 flex items-center justify-center">
                                                <QrCode className="h-16 w-16 text-slate-300" />
                                            </div>
                                        )}
                                        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">
                                            INTEROPERABLE
                                        </div>
                                    </div>

                                    <div className="text-center space-y-2">
                                        <h3 className="font-medium text-slate-900 text-lg">Escanea con cualquier App</h3>
                                        <p className="text-sm text-slate-500 max-w-xs mx-auto">
                                            Mercado Pago, Modo, Cuenta DNI, BNA+, y cualquier app bancaria.
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            Caja: {posList.find(p => p.external_id === selectedPosId)?.name || selectedPosId}
                                        </p>
                                    </div>

                                    <div className="flex gap-2 mt-4">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600" onClick={handleViewDebugInfo}>
                                                    <Info className="h-4 w-4 mr-2" />
                                                    Debug Info
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                                <DialogHeader>
                                                    <DialogTitle>Información de Debug</DialogTitle>
                                                    <DialogDescription>Detalles técnicos de la integración</DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-6">
                                                    <div>
                                                        <h4 className="font-medium mb-2">Caja Actual (POS)</h4>
                                                        {posDetails ? (
                                                            <pre className="bg-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
                                                                {JSON.stringify(posDetails, null, 2)}
                                                            </pre>
                                                        ) : (
                                                            <div className="text-sm text-slate-500">Cargando...</div>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <h4 className="font-medium mb-2">Mis Sucursales ({storesList?.length || 0})</h4>
                                                        {storesList ? (
                                                            <div className="space-y-2">
                                                                {storesList.map((store: any) => (
                                                                    <div key={store.id} className="bg-slate-50 p-3 rounded border text-sm">
                                                                        <div className="font-medium">{store.name}</div>
                                                                        <div className="text-slate-500 text-xs">ID: {store.id} | Ext: {store.external_id}</div>
                                                                        <div className="text-slate-500 text-xs">{store.location?.street_name} {store.location?.street_number}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-sm text-slate-500">Cargando...</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* TAB: LINK DE PAGO */}
                    <TabsContent value="link" className="mt-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Crear Link de Pago</CardTitle>
                                    <CardDescription>Genera un link único para compartir por WhatsApp o redes.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form action={handleLinkSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="link-title">Concepto / Producto</Label>
                                            <Input id="link-title" name="title" placeholder="Ej: Consulta Online" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="link-price">Monto ($)</Label>
                                            <Input id="link-price" name="price" type="number" min="1" step="0.01" placeholder="0.00" required />
                                        </div>
                                        <Button type="submit" className="w-full" disabled={isLoadingLink}>
                                            {isLoadingLink ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Generando...
                                                </>
                                            ) : (
                                                <>
                                                    <LinkIcon className="mr-2 h-4 w-4" />
                                                    Generar Link
                                                </>
                                            )}
                                        </Button>
                                        {linkError && <p className="text-sm text-red-500 text-center">{linkError}</p>}
                                    </form>
                                </CardContent>
                            </Card>

                            <Card className={`transition-opacity duration-500 ${linkResult ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Smartphone className="h-5 w-5" />
                                        Link Generado
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col items-center space-y-6">
                                    {linkResult ? (
                                        <>
                                            <div className="bg-white p-4 rounded-lg shadow-sm border">
                                                <img
                                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(linkResult.init_point)}`}
                                                    alt="QR Link"
                                                    className="w-48 h-48 object-contain"
                                                />
                                            </div>

                                            <div className="w-full space-y-2">
                                                <Label className="text-xs text-slate-500">Link para compartir</Label>
                                                <div className="flex gap-2">
                                                    <Input value={linkResult.init_point} readOnly className="text-xs" />
                                                    <Button size="icon" variant="outline" onClick={copyToClipboard}>
                                                        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </div>

                                            <Button className="w-full" variant="secondary" asChild>
                                                <a href={linkResult.init_point} target="_blank" rel="noopener noreferrer">
                                                    Abrir Link
                                                </a>
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center p-4">
                                            <LinkIcon className="h-12 w-12 mb-2 opacity-20" />
                                            <p className="text-sm">Genera un link para ver el resultado aquí</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
