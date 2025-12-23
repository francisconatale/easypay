import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface RecentSalesProps {
  sales: Array<{
    id: string
    client_name: string
    description: string
    total_amount: number
    sale_date: string
    category: string | null
  }>
}

export function RecentSales({ sales }: RecentSalesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sales.map((sale) => (
            <div key={sale.id} className="flex items-center justify-between border-b pb-4 last:border-0">
              <div className="space-y-1">
                <p className="font-medium text-slate-900">{sale.client_name}</p>
                <p className="text-sm text-slate-600">{sale.description}</p>
                <div className="flex items-center gap-2">
                  {sale.category && (
                    <Badge variant="outline" className="text-xs">
                      {sale.category}
                    </Badge>
                  )}
                  <span className="text-xs text-slate-500">{new Date(sale.sale_date).toLocaleDateString("es-AR")}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-600">
                  ${Number(sale.total_amount).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
