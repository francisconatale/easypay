"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, FileCheck, Clock, BarChart3 } from "lucide-react"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts"

type Transfer = {
  id: string
  mp_transaction_id: string
  amount: number
  description: string | null
  payer_name: string | null
  payer_email: string | null
  status: string
  payment_method: string | null
  transaction_date: string
  invoiced: boolean
  invoice_number: string | null
  created_at: string
  updated_at: string
}

export function DashboardStats({ transfers }: { transfers: Transfer[] }) {
  const stats = useMemo(() => {
    const totalAmount = transfers.reduce((sum, t) => sum + Number(t.amount), 0)
    const invoicedTransfers = transfers.filter((t) => t.invoiced)
    const pendingTransfers = transfers.filter((t) => !t.invoiced)
    const invoicedAmount = invoicedTransfers.reduce((sum, t) => sum + Number(t.amount), 0)
    const pendingAmount = pendingTransfers.reduce((sum, t) => sum + Number(t.amount), 0)

    return {
      totalAmount,
      invoicedAmount,
      pendingAmount,
      totalTransfers: transfers.length,
      invoicedTransfers: invoicedTransfers.length,
      pendingTransfers: pendingTransfers.length,
    }
  }, [transfers])

  // Datos para gráfico de facturación por mes
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, { invoiced: number; pending: number; total: number }>()

    transfers.forEach((t) => {
      const date = new Date(t.transaction_date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const monthName = date.toLocaleDateString("es-AR", { month: "short", year: "numeric" })

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { invoiced: 0, pending: 0, total: 0 })
      }

      const current = monthMap.get(monthKey)!
      const amount = Number(t.amount)
      current.total += amount

      if (t.invoiced) {
        current.invoiced += amount
      } else {
        current.pending += amount
      }
    })

    return Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, value]) => {
        const [year, month] = key.split("-")
        const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1)
        return {
          month: date.toLocaleDateString("es-AR", { month: "short", year: "2-digit" }),
          facturado: Math.round(value.invoiced),
          pendiente: Math.round(value.pending),
          total: Math.round(value.total),
        }
      })
  }, [transfers])

  // Datos para gráfico de métodos de pago
  const paymentMethodData = useMemo(() => {
    const methodMap = new Map<string, number>()

    transfers.forEach((t) => {
      const method = t.payment_method || "Otro"
      methodMap.set(method, (methodMap.get(method) || 0) + Number(t.amount))
    })

    return Array.from(methodMap.entries()).map(([method, amount]) => ({
      method: method.replace("_", " "),
      monto: Math.round(amount),
    }))
  }, [transfers])

  return (
    <div className="space-y-6 mb-8">
      {/* Cards de métricas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md border-slate-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total en Caja</CardTitle>
            <DollarSign className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              ${stats.totalAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-1">{stats.totalTransfers} transferencias totales</p>
          </CardContent>
        </Card>

        <Card className="shadow-md border-slate-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Facturado</CardTitle>
            <FileCheck className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              ${stats.invoicedAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-1">{stats.invoicedTransfers} facturas emitidas</p>
          </CardContent>
        </Card>

        <Card className="shadow-md border-slate-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Por Facturar</CardTitle>
            <Clock className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">
              ${stats.pendingAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-1">{stats.pendingTransfers} pendientes</p>
          </CardContent>
        </Card>

        <Card className="shadow-md border-slate-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">% Facturado</CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">
              {stats.totalAmount > 0 ? ((stats.invoicedAmount / stats.totalAmount) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {stats.invoicedTransfers} de {stats.totalTransfers} facturas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de facturación mensual */}
        <Card className="shadow-md border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Facturación Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => `$${value.toLocaleString("es-AR")}`}
                />
                <Legend />
                <Bar dataKey="facturado" fill="#16a34a" name="Facturado" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pendiente" fill="#ea580c" name="Pendiente" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de evolución de caja */}
        <Card className="shadow-md border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Evolución de Caja
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => `$${value.toLocaleString("es-AR")}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#2563eb"
                  strokeWidth={3}
                  name="Total"
                  dot={{ fill: "#2563eb", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de métodos de pago */}
        <Card className="shadow-md border-slate-200 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Distribución por Método de Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={paymentMethodData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis dataKey="method" type="category" tick={{ fill: "#64748b", fontSize: 12 }} width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => `$${value.toLocaleString("es-AR")}`}
                />
                <Bar dataKey="monto" fill="#0891b2" name="Monto Total" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
