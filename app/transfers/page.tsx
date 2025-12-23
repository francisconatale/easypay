import { createClient } from "@/lib/supabase/server"
import { TransfersTable } from "@/components/transfers-table"
import { DashboardStats } from "@/components/dashboard-stats"

export default async function TransfersPage() {
  const supabase = await createClient()

  const { data: transfers, error } = await supabase
    .from("transfers")
    .select("*")
    .order("transaction_date", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching transfers:", error)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 md:p-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Panel de Transferencias</h1>
          <p className="text-slate-600">Gestiona tus cobros de Mercado Pago y genera facturas para AFIP</p>
        </div>

        <DashboardStats transfers={transfers || []} />

        <TransfersTable initialTransfers={transfers || []} />
      </div>
    </div>
  )
}
