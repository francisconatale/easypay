"use client"

import { useState, useTransition } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { deleteSale } from "@/app/ventas/actions"

interface Sale {
  id: string
  client_name: string
  client_email: string | null
  client_phone: string | null
  description: string
  quantity: number
  unit_price: number
  total_amount: number
  sale_date: string
  category: string | null
  notes: string | null
}

interface SalesTableProps {
  sales: Sale[]
}

export function SalesTable({ sales }: SalesTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const filteredSales = sales.filter(
    (sale) =>
      sale.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.category?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      try {
        await deleteSale(id)
        toast({
          title: "Venta eliminada",
          description: "La venta ha sido eliminada correctamente.",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar la venta.",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <Card>
      <div className="p-6 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por cliente, descripción o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Precio Unit.</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{sale.client_name}</p>
                    {sale.client_email && <p className="text-xs text-slate-500">{sale.client_email}</p>}
                    {sale.client_phone && <p className="text-xs text-slate-500">{sale.client_phone}</p>}
                  </div>
                </TableCell>
                <TableCell>
                  <p className="max-w-xs truncate">{sale.description}</p>
                </TableCell>
                <TableCell>
                  {sale.category && (
                    <Badge variant="outline" className="text-xs">
                      {sale.category}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">{sale.quantity}</TableCell>
                <TableCell className="text-right">
                  ${Number(sale.unit_price).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-semibold text-purple-600">
                    ${Number(sale.total_amount).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </span>
                </TableCell>
                <TableCell>{new Date(sale.sale_date).toLocaleDateString("es-AR")}</TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={isPending}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Esto eliminará permanentemente la venta de la base de datos.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(sale.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredSales.length === 0 && (
        <div className="text-center py-12 text-slate-500">No se encontraron ventas que coincidan con la búsqueda</div>
      )}
    </Card>
  )
}
