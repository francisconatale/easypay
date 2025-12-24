"use client"

import { useState, useEffect } from "react"
import { createStoreAndPos, getTerminalData, deleteStore, listPos, createAdditionalPos, deletePos } from "../cobrar/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Store, MapPin, CheckCircle, Trash2, Plus, MonitorSmartphone } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Link from "next/link"

export default function NegociosPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [terminalData, setTerminalData] = useState<any>(null)
    const [posList, setPosList] = useState<any[]>([])
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [needsReauth, setNeedsReauth] = useState(false)

    // New POS State
    const [isCreatingPos, setIsCreatingPos] = useState(false)
    const [newPosName, setNewPosName] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setIsLoading(true)
        const data = await getTerminalData()

        if (data.error && !data.needs_setup) {
            setError(data.error)
            setTerminalData(null) // Clear data to ensure Error Card is shown
            if (data.needs_reauth) {
                setNeedsReauth(true)
            }
        } else {
            setTerminalData(data)
            if (data.success) {
                // Load POS list if store exists
                const posRes = await listPos()
                if (posRes.success) {
                    setPosList(posRes.results || [])
                }
            }
        }
        setIsLoading(false)
    }

    async function handleSetup(formData: FormData) {
        setIsLoading(true)
        setError(null)
        setSuccess(null)

        const res = await createStoreAndPos(formData)

        if (res.error) {
            setError(res.error)
        } else {
            setSuccess("¡Negocio configurado exitosamente!")
            await loadData()
        }
        setIsLoading(false)
    }

    async function handleCreatePos() {
        if (!newPosName.trim()) return

        setIsCreatingPos(true)
        const res = await createAdditionalPos(newPosName)

        if (res.error) {
            setError(res.error)
        } else {
            setSuccess("¡Caja creada exitosamente!")
            setNewPosName("")
            setIsDialogOpen(false)
            const posRes = await listPos()
            if (posRes.success) {
                setPosList(posRes.results || [])
            }
        }
        setIsCreatingPos(false)
    }

    async function handleDeletePos(posId: number | string) {
        if (!confirm("¿Estás seguro de que quieres eliminar esta caja?")) {
            return
        }

        setIsLoading(true)
        const res = await deletePos(posId)

        if (res.error) {
            setError(res.error)
        } else {
            setSuccess("¡Caja eliminada exitosamente!")
            // Refresh list
            const posRes = await listPos()
            if (posRes.success) {
                setPosList(posRes.results || [])
            }
        }
        setIsLoading(false)
    }

    async function handleDelete() {
        if (!confirm("¿Estás seguro de que quieres eliminar este negocio? Esta acción no se puede deshacer.")) {
            return
        }

        setIsLoading(true)
        setError(null)

        if (!terminalData?.store_id) {
            setError("No se encontró el ID del negocio")
            setIsLoading(false)
            return
        }

        const res = await deleteStore(terminalData.store_id)

        if (res.error) {
            setError(res.error)
        } else {
            setTerminalData(null) // Clear data to show setup form
            setPosList([])
            await loadData()
        }
        setIsLoading(false)
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="container mx-auto px-6 py-8">
            <div className="max-w-3xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Mis Negocios</h1>
                    <p className="text-slate-600 mt-1">Gestiona tu Sucursal y Cajas de Mercado Pago</p>
                </div>

                {error && !terminalData ? (
                    <Card className="border-red-200 bg-red-50">
                        <CardHeader>
                            <CardTitle className="text-red-800">
                                {needsReauth ? "Sesión Expirada" : "Error"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-red-600 font-medium">{error}</p>
                            {needsReauth ? (
                                <Link href="/dashboard">
                                    <Button className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white">
                                        Reconectar Mercado Pago
                                    </Button>
                                </Link>
                            ) : (
                                <Button
                                    className="mt-4 w-full bg-red-600 hover:bg-red-700"
                                    onClick={loadData}
                                >
                                    Reintentar
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : terminalData?.needs_setup ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>No tienes negocios configurados</CardTitle>
                            <CardDescription>Crea una sucursal para comenzar a operar y cobrar con QR.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form action={handleSetup} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nombre del Negocio</Label>
                                    <Input id="name" name="name" placeholder="Ej: Mi Tienda" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="street_name">Calle</Label>
                                        <Input id="street_name" name="street_name" placeholder="Av. Siempre Viva" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="street_number">Número</Label>
                                        <Input id="street_number" name="street_number" placeholder="123" required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="city_name">Ciudad</Label>
                                        <Input id="city_name" name="city_name" placeholder="CABA" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="state_name">Provincia</Label>
                                        <Input id="state_name" name="state_name" placeholder="Buenos Aires" required />
                                    </div>
                                </div>

                                {error && <p className="text-sm text-red-600 font-medium text-center">{error}</p>}

                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-lg">
                                    <Store className="mr-2 h-5 w-5" />
                                    Crear Negocio
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                ) : terminalData ? (
                    <div className="space-y-6">
                        {/* Store Info */}
                        <Card className="border-green-200 bg-green-50">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                    <CardTitle className="text-green-800">Negocio Configurado</CardTitle>
                                </div>
                                <CardDescription className="text-green-700">
                                    Tu sucursal está lista para operar.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-1">{terminalData?.store_name || "Mi Negocio"}</h3>
                                    <div className="flex items-start gap-2 text-sm text-slate-600">
                                        <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                        <span>
                                            {terminalData?.store_location?.address_line || "Dirección no disponible"}
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    variant="destructive"
                                    className="w-full"
                                    onClick={handleDelete}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar Negocio
                                </Button>

                                {success && (
                                    <div className="bg-green-100 text-green-800 p-3 rounded-md text-sm font-medium text-center">
                                        {success}
                                    </div>
                                )}

                                {error && (
                                    <div className="space-y-4">
                                        <p className="text-sm text-red-600 font-medium text-center">{error}</p>
                                        {terminalData?.needs_reauth && (
                                            <Button
                                                className="w-full bg-blue-600 hover:bg-blue-700"
                                                onClick={() => window.location.href = "/dashboard"}
                                            >
                                                Ir al Dashboard para reconectar
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* POS Management */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Mis Cajas (POS)</CardTitle>
                                    <CardDescription>Administra las cajas de tu negocio</CardDescription>
                                </div>
                                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Agregar Caja
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Agregar Nueva Caja</DialogTitle>
                                            <DialogDescription>
                                                Crea una nueva caja para cobrar en tu sucursal.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="pos-name">Nombre de la Caja</Label>
                                                <Input
                                                    id="pos-name"
                                                    placeholder="Ej: Caja 2"
                                                    value={newPosName}
                                                    onChange={(e) => setNewPosName(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                                            <Button onClick={handleCreatePos} disabled={isCreatingPos || !newPosName.trim()}>
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
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {posList.length === 0 ? (
                                        <p className="text-center text-slate-500 py-4">No se encontraron cajas.</p>
                                    ) : (
                                        <div className="grid gap-4 md:grid-cols-2">
                                            {posList.map((pos) => (
                                                <div key={pos.id} className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                            <MonitorSmartphone className="h-5 w-5 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-slate-900">{pos.name}</p>
                                                            <p className="text-xs text-slate-500">ID: {pos.external_id}</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDeletePos(pos.id)}
                                                        disabled={isLoading}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
