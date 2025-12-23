"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, UserPlus } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { AddClientDialog } from "@/components/add-client-dialog"

export function AddSaleDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [isNewClient, setIsNewClient] = useState(false)
  const [showAddClientDialog, setShowAddClientDialog] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (open) {
      loadClients()
    }
  }, [open])

  async function loadClients() {
    const supabase = createBrowserClient()
    const { data } = await supabase.from("clients").select("*").order("name", { ascending: true })
    setClients(data || [])
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const quantity = Number(formData.get("quantity"))
    const unitPrice = Number(formData.get("unit_price"))

    const newSale = {
      client_id: selectedClientId || null,
      client_name: formData.get("client_name"),
      client_email: formData.get("client_email"),
      client_phone: formData.get("client_phone"),
      description: formData.get("description"),
      quantity,
      unit_price: unitPrice,
      total_amount: quantity * unitPrice,
      category: formData.get("category"),
      notes: formData.get("notes"),
      sale_date: new Date().toISOString(),
    }

    const supabase = createBrowserClient()
    const { error } = await supabase.from("sales").insert([newSale])

    if (error) {
      console.error("[v0] Error al agregar venta:", error)
      alert("Error al agregar la venta")
    } else {
      setOpen(false)
      setSelectedClientId("")
      setIsNewClient(false)
      router.refresh()
    }

    setLoading(false)
  }

  function handleClientSelect(clientId: string) {
    setSelectedClientId(clientId)
    const client = clients.find((c) => c.id === clientId)
    if (client) {
      setIsNewClient(false)
      // Los campos se llenarán automáticamente en el formulario
    }
  }

  const selectedClient = clients.find((c) => c.id === selectedClientId)

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="mr-2 h-4 w-4" />
            Registrar Venta
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Nueva Venta</DialogTitle>
            <DialogDescription>Selecciona un cliente o crea uno nuevo</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Label>Cliente</Label>
              <div className="flex gap-2">
                <Select value={selectedClientId} onValueChange={handleClientSelect}>
                  <SelectTrigger className="flex-1 bg-white">
                    <SelectValue placeholder="Seleccionar cliente existente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} {client.email ? `(${client.email})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddClientDialog(true)}
                  className="shrink-0"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Nuevo Cliente
                </Button>
              </div>
              {!selectedClientId && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => setIsNewClient(true)}
                  className="text-blue-600 p-0 h-auto"
                >
                  O ingresar datos manualmente
                </Button>
              )}
            </div>

            {(isNewClient || !selectedClientId) && !selectedClient && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name">Nombre del Cliente *</Label>
                  <Input id="client_name" name="client_name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_email">Email</Label>
                  <Input id="client_email" name="client_email" type="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_phone">Teléfono</Label>
                  <Input id="client_phone" name="client_phone" placeholder="+54 11 1234-5678" />
                </div>
              </div>
            )}

            {selectedClient && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border">
                <div className="space-y-2">
                  <Label>Nombre del Cliente</Label>
                  <Input name="client_name" value={selectedClient.name} readOnly className="bg-white" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input name="client_email" value={selectedClient.email || ""} readOnly className="bg-white" />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input name="client_phone" value={selectedClient.phone || ""} readOnly className="bg-white" />
                </div>
                <div className="space-y-2">
                  <Label>CUIT</Label>
                  <Input value={selectedClient.cuit || "N/A"} readOnly className="bg-white" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe el producto o servicio vendido"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Input id="category" name="category" placeholder="Ej: Servicios, Desarrollo, Diseño" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Cantidad *</Label>
                <Input id="quantity" name="quantity" type="number" min="1" defaultValue="1" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_price">Precio Unitario ($) *</Label>
              <Input id="unit_price" name="unit_price" type="number" step="0.01" min="0" placeholder="0.00" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas adicionales</Label>
              <Textarea id="notes" name="notes" placeholder="Información adicional sobre la venta" />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700">
                {loading ? "Guardando..." : "Guardar Venta"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {showAddClientDialog && (
        <AddClientDialog
          open={showAddClientDialog}
          onOpenChange={setShowAddClientDialog}
          onSuccess={() => {
            loadClients()
            setShowAddClientDialog(false)
          }}
        />
      )}
    </>
  )
}
