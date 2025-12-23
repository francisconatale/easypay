"use client"

import { useState, useMemo } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { FileText, Search, DollarSign, CheckCircle2, CreditCard, Pencil } from "lucide-react"
import { InvoiceDialog } from "@/components/invoice-dialog"
import { EditTransferDialog } from "@/components/edit-transfer-dialog"

type Transfer = {
  id: string
  mp_transaction_id: string
  amount: number
  net_amount?: number
  fee_amount?: number
  description: string | null
  notes: string | null
  payer_name: string | null
  payer_email: string | null
  payer_dni?: string | null
  status: string
  payment_method: string | null
  transaction_date: string
  invoiced: boolean
  invoice_number: string | null
  installments?: number
  card_last_four?: string | null
  created_at: string
  updated_at: string
}

export function TransfersTable({ initialTransfers }: { initialTransfers: Transfer[] }) {
  const [transfers, setTransfers] = useState<Transfer[]>(initialTransfers)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null)

  const filteredTransfers = useMemo(() => {
    return transfers.filter((transfer) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        transfer.mp_transaction_id.toLowerCase().includes(searchLower) ||
        transfer.description?.toLowerCase().includes(searchLower) ||
        transfer.payer_name?.toLowerCase().includes(searchLower) ||
        transfer.payer_email?.toLowerCase().includes(searchLower)
      )
    })
  }, [transfers, searchTerm])

  const selectedTransfers = useMemo(() => {
    return transfers.filter((t) => selectedIds.has(t.id))
  }, [transfers, selectedIds])

  const totalSelected = useMemo(() => {
    return selectedTransfers.reduce((sum, t) => sum + Number(t.amount), 0)
  }, [selectedTransfers])

  const totalNeto = useMemo(() => {
    return selectedTransfers.reduce((sum, t) => sum + Number(t.net_amount || t.amount * 0.95), 0)
  }, [selectedTransfers])

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTransfers.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredTransfers.map((t) => t.id)))
    }
  }

  const handleInvoiceSuccess = async (invoiceNumber: string) => {
    const supabase = createBrowserClient()

    const { error } = await supabase
      .from("transfers")
      .update({
        invoiced: true,
        invoice_number: invoiceNumber,
      })
      .in("id", Array.from(selectedIds))

    if (error) {
      console.error("[v0] Error updating transfers:", error)
      alert("Error al actualizar las transferencias")
      return
    }

    setTransfers((prev) =>
      prev.map((t) => (selectedIds.has(t.id) ? { ...t, invoiced: true, invoice_number: invoiceNumber } : t)),
    )

    setSelectedIds(new Set())
    setShowInvoiceDialog(false)
  }

  return (
    <>
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardTitle className="text-2xl">Transferencias de Mercado Pago</CardTitle>
          <CardDescription className="text-blue-100">{transfers.length} transferencias registradas</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por ID, descripción, pagador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={() => setShowInvoiceDialog(true)}
              disabled={selectedIds.size === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              <FileText className="mr-2 h-4 w-4" />
              Facturar Seleccionadas ({selectedIds.size})
            </Button>
          </div>

          {selectedIds.size > 0 && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-700">Monto Bruto</p>
                    <p className="font-bold text-blue-900 text-lg">
                      ${totalSelected.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-teal-600" />
                  <div>
                    <p className="text-sm text-teal-700">Monto Neto (después de comisiones)</p>
                    <p className="font-bold text-teal-900 text-lg">
                      ${totalNeto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 mt-2"
              >
                Limpiar selección
              </Button>
            </div>
          )}

          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={filteredTransfers.length > 0 && selectedIds.size === filteredTransfers.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>ID Transacción</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Pagador</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Monto Bruto</TableHead>
                    <TableHead className="text-right">Monto Neto</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Factura</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransfers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-slate-500">
                        No se encontraron transferencias
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransfers.map((transfer) => (
                      <TableRow
                        key={transfer.id}
                        className={selectedIds.has(transfer.id) ? "bg-blue-50" : "hover:bg-slate-50"}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(transfer.id)}
                            onCheckedChange={() => toggleSelect(transfer.id)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">{transfer.mp_transaction_id}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(transfer.transaction_date).toLocaleDateString("es-AR")}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{transfer.payer_name || "N/A"}</span>
                            <span className="text-xs text-slate-500">{transfer.payer_email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="flex flex-col">
                            <span className="truncate">{transfer.description || "Sin descripción"}</span>
                            {transfer.notes && (
                              <span className="text-xs text-slate-500 truncate">{transfer.notes}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ${Number(transfer.amount).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-teal-700">
                          $
                          {Number(transfer.net_amount || transfer.amount * 0.95).toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {transfer.payment_method?.replace("_", " ") || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={transfer.status === "approved" ? "default" : "secondary"}
                            className={transfer.status === "approved" ? "bg-green-600" : ""}
                          >
                            {transfer.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {transfer.invoiced ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="text-xs font-medium">{transfer.invoice_number}</span>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-xs text-slate-500">
                              Pendiente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTransfer(transfer)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <InvoiceDialog
        open={showInvoiceDialog}
        onOpenChange={setShowInvoiceDialog}
        selectedTransfers={selectedTransfers}
        totalAmount={totalSelected}
        onSuccess={handleInvoiceSuccess}
      />

      {editingTransfer && (
        <EditTransferDialog
          transfer={editingTransfer}
          open={!!editingTransfer}
          onOpenChange={(open) => !open && setEditingTransfer(null)}
        />
      )}
    </>
  )
}
