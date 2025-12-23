"use client"

import type React from "react"
import { useState } from "react"
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
import { Plus } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function AddClientDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSuccess,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
} = {}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    const newClient = {
      name: formData.get("name"),
      email: formData.get("email") || null,
      phone: formData.get("phone") || null,
      dni: formData.get("dni") || null,
      cuit: formData.get("cuit") || null,
      address: formData.get("address") || null,
      notes: formData.get("notes") || null,
    }

    const supabase = createBrowserClient()
    const { error } = await supabase.from("clients").insert([newClient])

    if (error) {
      console.error("[v0] Error al agregar cliente:", error)
      alert("Error al agregar el cliente")
    } else {
      setOpen(false)
      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
      ;(e.target as HTMLFormElement).reset()
    }

    setLoading(false)
  }

  const dialogContent = (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
        <DialogDescription>Ingresa los datos del cliente</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 col-span-2">
            <Label htmlFor="name">Nombre Completo / Razón Social *</Label>
            <Input id="name" name="name" required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="cliente@email.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" name="phone" placeholder="+54 11 1234-5678" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dni">DNI</Label>
            <Input id="dni" name="dni" placeholder="12345678" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cuit">CUIT</Label>
            <Input id="cuit" name="cuit" placeholder="20-12345678-9" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Dirección</Label>
          <Input id="address" name="address" placeholder="Calle, número, localidad" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notas</Label>
          <Textarea id="notes" name="notes" placeholder="Información adicional sobre el cliente" />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? "Guardando..." : "Guardar Cliente"}
          </Button>
        </div>
      </form>
    </DialogContent>
  )

  if (controlledOpen === undefined) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        </DialogTrigger>
        {dialogContent}
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {dialogContent}
    </Dialog>
  )
}
