"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

type Transfer = {
  id: string
  mp_transaction_id: string
  description: string | null
  notes: string | null
}

export function EditTransferDialog({
  transfer,
  open,
  onOpenChange,
}: {
  transfer: Transfer
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    const updates = {
      description: formData.get("description"),
      notes: formData.get("notes") || null,
      updated_at: new Date().toISOString(),
    }

    const supabase = createBrowserClient()
    const { error } = await supabase.from("transfers").update(updates).eq("id", transfer.id)

    if (error) {
      console.error("[v0] Error al actualizar transferencia:", error)
      alert("Error al actualizar la transferencia")
    } else {
      onOpenChange(false)
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Motivo de Pago</DialogTitle>
          <DialogDescription>Actualiza la descripción de la transferencia de Mercado Pago</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>ID Transacción</Label>
            <Input value={transfer.mp_transaction_id} readOnly className="bg-slate-50" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Motivo / Descripción *</Label>
            <Input
              id="description"
              name="description"
              defaultValue={transfer.description || ""}
              placeholder="Ej: Pago por servicio de diseño web"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas adicionales</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={transfer.notes || ""}
              placeholder="Información adicional sobre este pago"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
