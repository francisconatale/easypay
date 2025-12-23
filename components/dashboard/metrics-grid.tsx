import { DollarSign, FileText, TrendingUp, CreditCard } from "lucide-react"
import { MetricCard } from "./metric-card"

interface MetricsGridProps {
    transfers: any[] | null
}

export function MetricsGrid({ transfers }: MetricsGridProps) {
    // Calcular métricas
    const totalCaja = transfers?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
    const totalFacturado =
        transfers?.filter((t) => t.invoiced).reduce((sum, t) => sum + Number(t.amount), 0) || 0
    const pendienteFacturar = totalCaja - totalFacturado
    const totalNeto =
        transfers?.reduce((sum, t) => sum + Number(t.net_amount || t.amount * 0.95), 0) || 0

    const metrics = [
        {
            title: "Total Bruto",
            value: `$${totalCaja.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
            description: `${transfers?.length || 0} transferencias`,
            icon: DollarSign,
            iconColorClass: "text-blue-600",
            valueColorClass: "text-blue-600",
        },
        {
            title: "Total Neto (95%)",
            value: `$${totalNeto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
            description: "Después de comisiones MP",
            icon: CreditCard,
            iconColorClass: "text-teal-600",
            valueColorClass: "text-teal-600",
        },
        {
            title: "Facturado",
            value: `$${totalFacturado.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
            description: `${transfers?.filter((t) => t.invoiced).length || 0} facturas emitidas`,
            icon: FileText,
            iconColorClass: "text-green-600",
            valueColorClass: "text-green-600",
        },
        {
            title: "Por Facturar",
            value: `$${pendienteFacturar.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
            description: `${transfers?.filter((t) => !t.invoiced).length || 0} pendientes`,
            icon: TrendingUp,
            iconColorClass: "text-orange-600",
            valueColorClass: "text-orange-600",
        },
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric, index) => (
                <MetricCard
                    key={index}
                    title={metric.title}
                    value={metric.value}
                    description={metric.description}
                    icon={metric.icon}
                    iconColorClass={metric.iconColorClass}
                    valueColorClass={metric.valueColorClass}
                />
            ))}
        </div>
    )
}
