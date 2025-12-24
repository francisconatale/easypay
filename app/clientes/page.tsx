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
        </div>
      </div>


      <div className="container mx-auto px-6 py-8">
        <ClientsTable clients={clients || []} />
      </div>
    </div>
  )
}
