import { createServerClient } from "@/lib/supabase/server"
import { DashboardStats } from "@/components/dashboard-stats"
import { redirect } from "next/navigation"
import { getMPUser } from "@/lib/mercadopago"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { MetricsGrid } from "@/components/dashboard/metrics-grid"
import { ActionsGrid } from "@/components/dashboard/actions-grid"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle } from "lucide-react"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
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
        {params?.success === "mp_connected" && (
          <Alert className="border-green-200 bg-green-50 text-green-900">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>Conexión exitosa</AlertTitle>
            <AlertDescription>
              Tu cuenta de Mercado Pago se ha conectado correctamente.
            </AlertDescription>
          </Alert>
        )}

        {params?.success === "mp_disconnected" && (
          <Alert className="border-blue-200 bg-blue-50 text-blue-900">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <AlertTitle>Desconexión exitosa</AlertTitle>
            <AlertDescription>
              Tu cuenta de Mercado Pago se ha desconectado correctamente.
            </AlertDescription>
          </Alert>
        )}

        {params?.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error de conexión</AlertTitle>
            <AlertDescription>
              {params.error === "access_denied"
                ? "No se otorgaron los permisos necesarios."
                : params.error === "invalid_state"
                  ? "La sesión de conexión expiró. Intenta nuevamente."
                  : "Ocurrió un error al conectar con Mercado Pago."}
            </AlertDescription>
          </Alert>
        )}

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
