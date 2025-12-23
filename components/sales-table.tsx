"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"

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

  const filteredSales = sales.filter(
    (sale) =>
      sale.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.category?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
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
