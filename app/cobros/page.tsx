import { createServerClient } from "@/lib/supabase/server"
import { TransfersTable } from "@/components/transfers-table"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function CobrosPage() {
  const supabase = await createServerClient()

  const { data: transfers, error } = await supabase
    .from("transfers")
    .select("*")
    .order("transaction_date", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching transfers:", error)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Cobros de Mercado Pago</h1>
              <p className="text-slate-600 mt-1">Gestiona tus transferencias y genera facturas para AFIP</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Sincronizar MP
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <TransfersTable initialTransfers={transfers || []} />
      </div>
    </div>
  )
}
