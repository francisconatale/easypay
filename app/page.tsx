import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BarChart3, Package, CreditCard } from "lucide-react"
import { redirect } from "next/navigation"

export default function Home() {
  redirect("/dashboard")

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
            <CreditCard className="h-4 w-4" />
            Panel Administrativo
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 text-balance">
            Sistema de Gestión Mercado Pago
          </h1>

          <p className="text-xl text-slate-600 text-balance max-w-2xl mx-auto">
            Dashboard completo, registro de ventas y control de transferencias con facturación AFIP
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild size="lg" className="text-lg h-14 px-8 bg-blue-600 hover:bg-blue-700">
              <Link href="/dashboard">
                <BarChart3 className="mr-2 h-5 w-5" />
                Ir al Dashboard
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg h-14 px-8 border-2 bg-transparent">
              <Link href="/ventas">
                <Package className="mr-2 h-5 w-5" />
                Registrar Ventas
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 pt-12">
            <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Dashboard Completo</h3>
              <p className="text-slate-600 text-sm">
                Métricas en tiempo real, gráficos de facturación y análisis de caja
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Registro de Ventas</h3>
              <p className="text-slate-600 text-sm">Gestiona productos y servicios vendidos con datos de clientes</p>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Control de Transferencias</h3>
              <p className="text-slate-600 text-sm">Selección múltiple y facturación AFIP de tus cobros</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
