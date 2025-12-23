"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, DollarSign } from "lucide-react"

type Transfer = {
  id: string
  mp_transaction_id: string
  amount: number
  description: string | null
  payer_name: string | null
  transaction_date: string
}

type InvoiceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedTransfers: Transfer[]
  totalAmount: number
  onSuccess: (invoiceNumber: string) => void
}

export function InvoiceDialog({ open, onOpenChange, selectedTransfers, totalAmount, onSuccess }: InvoiceDialogProps) {
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invoiceNumber.trim()) return

    setIsSubmitting(true)

    // Simular delay de generación de factura
    await new Promise((resolve) => setTimeout(resolve, 1000))

    onSuccess(invoiceNumber)
    setInvoiceNumber("")
    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <FileText className="h-6 w-6 text-blue-600" />
            Generar Factura AFIP
          </DialogTitle>
          <DialogDescription>Ingresa el número de factura para las transferencias seleccionadas</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Transferencias seleccionadas:</span>
                <span className="font-semibold">{selectedTransfers.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Monto total:</span>
                <span className="text-xl font-bold text-green-600 flex items-center gap-1">
                  <DollarSign className="h-5 w-5" />
                  {totalAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="max-h-[200px] overflow-y-auto space-y-2 border rounded-lg p-3 bg-white">
              {selectedTransfers.map((transfer) => (
                <div key={transfer.id} className="flex justify-between items-start text-sm py-2 border-b last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{transfer.mp_transaction_id}</p>
                    <p className="text-xs text-slate-500">{transfer.description || "Sin descripción"}</p>
                  </div>
                  <span className="font-semibold text-slate-900">
                    ${Number(transfer.amount).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice-number">Número de Factura</Label>
              <Input
                id="invoice-number"
                placeholder="Ej: 0001-00012345"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                required
                className="text-lg"
              />
              <p className="text-xs text-slate-500">Ingresa el número de comprobante generado en AFIP</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!invoiceNumber.trim() || isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Generando..." : "Confirmar Factura"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
