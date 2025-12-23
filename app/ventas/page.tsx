import { createServerClient } from "@/lib/supabase/server"
import { SalesTable } from "@/components/sales-table"
import { AddSaleDialog } from "@/components/add-sale-dialog"
import { Package } from "lucide-react"

export default async function VentasPage() {
  const supabase = await createServerClient()

  const { data: sales } = await supabase.from("sales").select("*").order("sale_date", { ascending: false })

  const totalVentas = sales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0
  const ventasMesActual =
    sales?.filter((s) => {
      const saleMonth = new Date(s.sale_date).getMonth()
      const currentMonth = new Date().getMonth()
      return saleMonth === currentMonth
    }).length || 0

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                <Package className="h-8 w-8 text-purple-600" />
                Registro de Ventas
              </h1>
              <p className="text-slate-600 mt-1">Gestiona productos y servicios vendidos</p>
            </div>
            <AddSaleDialog />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-purple-700 font-medium mb-1">Total Ventas</p>
              <p className="text-2xl font-bold text-purple-900">
                ${totalVentas.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-700 font-medium mb-1">Ventas Registradas</p>
              <p className="text-2xl font-bold text-blue-900">{sales?.length || 0}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm text-green-700 font-medium mb-1">Este Mes</p>
              <p className="text-2xl font-bold text-green-900">{ventasMesActual}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <SalesTable sales={sales || []} />
      </div>
    </div>
  )
}
