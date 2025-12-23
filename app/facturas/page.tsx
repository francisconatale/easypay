import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileText, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function FacturasPage() {
  const supabase = await createServerClient()

  // Obtener transferencias facturadas
  const { data: invoicedTransfers } = await supabase
    .from("transfers")
    .select("*")
    .eq("invoiced", true)
    .order("updated_at", { ascending: false })

  // Agrupar por número de factura
  const invoices = invoicedTransfers?.reduce(
    (acc, transfer) => {
      const invoiceNum = transfer.invoice_number || "Sin número"
      if (!acc[invoiceNum]) {
        acc[invoiceNum] = {
          invoice_number: invoiceNum,
          transfers: [],
          total: 0,
          date: transfer.updated_at,
        }
      }
      acc[invoiceNum].transfers.push(transfer)
      acc[invoiceNum].total += Number(transfer.amount)
      return acc
    },
    {} as Record<string, { invoice_number: string; transfers: any[]; total: number; date: string }>,
  )

  const invoiceList = invoices ? Object.values(invoices) : []

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Facturas AFIP</h1>
              <p className="text-slate-600 mt-1">Historial de facturas emitidas</p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {invoiceList.length} facturas
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
            <CardTitle className="text-2xl flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Listado de Facturas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Número de Factura</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cantidad de Cobros</TableHead>
                    <TableHead className="text-right">Monto Total</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        No hay facturas emitidas aún
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoiceList.map((invoice) => (
                      <TableRow key={invoice.invoice_number} className="hover:bg-slate-50">
                        <TableCell className="font-semibold text-purple-700">{invoice.invoice_number}</TableCell>
                        <TableCell>{new Date(invoice.date).toLocaleDateString("es-AR")}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{invoice.transfers.length} cobros</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ${invoice.total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Descargar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
