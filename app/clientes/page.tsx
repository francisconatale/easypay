import { createServerClient } from "@/lib/supabase/server"
import { ClientsTable } from "@/components/clients-table"
import { AddClientDialog } from "@/components/add-client-dialog"
import { Users } from "lucide-react"

export default async function ClientesPage() {
  const supabase = await createServerClient()

  const { data: clients } = await supabase.from("clients").select("*").order("name", { ascending: true })

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-8 w-8 text-blue-600" />
                Clientes
              </h1>
              <p className="text-slate-600 mt-1">Gestiona tu base de datos de clientes</p>
            </div>
            <AddClientDialog />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-700 font-medium mb-1">Total Clientes</p>
              <p className="text-2xl font-bold text-blue-900">{clients?.length || 0}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm text-green-700 font-medium mb-1">Con Email</p>
              <p className="text-2xl font-bold text-green-900">{clients?.filter((c) => c.email).length || 0}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-purple-700 font-medium mb-1">Con CUIT</p>
              <p className="text-2xl font-bold text-purple-900">{clients?.filter((c) => c.cuit).length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <ClientsTable clients={clients || []} />
      </div>
    </div>
  )
}
