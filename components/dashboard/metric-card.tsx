import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
    title: string
    value: string
    description: string
    icon: LucideIcon
    iconColorClass: string
    valueColorClass: string
}

export function MetricCard({
    title,
    value,
    description,
    icon: Icon,
    iconColorClass,
    valueColorClass,
}: MetricCardProps) {
    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
                <Icon className={cn("h-5 w-5", iconColorClass)} />
            </CardHeader>
            <CardContent>
                <div className={cn("text-2xl font-bold", valueColorClass)}>{value}</div>
                <p className="text-xs text-slate-500 mt-1">{description}</p>
            </CardContent>
        </Card>
    )
}
