import { createServerClient } from "@/lib/supabase/server"
import { DashboardStats } from "@/components/dashboard-stats"
import { redirect } from "next/navigation"
import { getMPUser } from "@/lib/mercadopago"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { MetricsGrid } from "@/components/dashboard/metrics-grid"
import { ActionsGrid } from "@/components/dashboard/actions-grid"

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: transfers } = await supabase
    .from("transfers")
    .select("*")
    .order("transaction_date", { ascending: false })

  const { data: mpCredentials } = await supabase
    .from("mp_credentials")
    .select("*")
    .eq("user_id", user?.id)
    .single()

  const isConnected = !!mpCredentials
  let mpUser = null

  if (isConnected && mpCredentials?.access_token) {
    try {
      mpUser = await getMPUser(mpCredentials.access_token)
    } catch (error) {
      console.error("Error fetching MP user:", error)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader isConnected={isConnected} mpUser={mpUser} />

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Tarjetas de métricas principales */}
        <MetricsGrid transfers={transfers} />

        {/* Gráficos y análisis */}
        <DashboardStats transfers={transfers || []} />

        {/* Acciones rápidas */}
        <ActionsGrid transfers={transfers} />
      </div>
    </div>
  )
}
