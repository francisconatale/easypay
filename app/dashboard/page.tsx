import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, FileText, TrendingUp, CreditCard, ArrowRight } from "lucide-react"
import { DashboardStats } from "@/components/dashboard-stats"
import Link from "next/link"
import { Button } from "@/components/ui/button"

import { ConnectMPButton } from "@/components/connect-mp-button"

import { redirect } from "next/navigation"

import { getMPUser } from "@/lib/mercadopago"

import { logout } from "@/app/login/actions"
import { LogOut } from "lucide-react"

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


  // Calcular métricas rápidas
  const totalCaja = transfers?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
  const totalFacturado = transfers?.filter((t) => t.invoiced).reduce((sum, t) => sum + Number(t.amount), 0) || 0
  const pendienteFacturar = totalCaja - totalFacturado
  const totalNeto = transfers?.reduce((sum, t) => sum + Number(t.net_amount || t.amount * 0.95), 0) || 0

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600 mt-1">Vista general de tu negocio</p>
          </div>
          <div className="flex items-center gap-4">
            {isConnected ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-md border border-green-200">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <div className="flex flex-col">
                  <span className="font-medium text-sm">Conectado</span>
                  {mpUser && (
                    <span className="text-xs text-green-800">
                      {mpUser.first_name} {mpUser.last_name}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <ConnectMPButton />
            )}

            <form action={logout}>
              <Button variant="ghost" size="icon" title="Cerrar sesión">
                <LogOut className="h-5 w-5 text-slate-500 hover:text-red-600" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Tarjetas de métricas principales */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Bruto</CardTitle>
              <DollarSign className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ${totalCaja.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-500 mt-1">{transfers?.length || 0} transferencias</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Neto (95%)</CardTitle>
              <CreditCard className="h-5 w-5 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-600">
                ${totalNeto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-500 mt-1">Después de comisiones MP</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Facturado</CardTitle>
              <FileText className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${totalFacturado.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {transfers?.filter((t) => t.invoiced).length || 0} facturas emitidas
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Por Facturar</CardTitle>
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                ${pendienteFacturar.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {transfers?.filter((t) => !t.invoiced).length || 0} pendientes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos y análisis */}
        <DashboardStats transfers={transfers || []} />

        {/* Acciones rápidas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Cobros Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Tienes {transfers?.filter((t) => !t.invoiced).length || 0} cobros sin facturar
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700" asChild>
                <Link href="/cobros">
                  Ver Cobros <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Registrar Venta</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">Agrega nuevas ventas a tu registro</p>
              <Button className="w-full bg-green-600 hover:bg-green-700" asChild>
                <Link href="/ventas">
                  Ir a Ventas <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Facturas AFIP</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">Gestiona tus facturas emitidas</p>
              <Button className="w-full bg-purple-600 hover:bg-purple-700" asChild>
                <Link href="/facturas">
                  Ver Facturas <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
