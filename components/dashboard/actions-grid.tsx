import { ActionCard } from "./action-card"

interface ActionsGridProps {
    transfers: any[] | null
}

export function ActionsGrid({ transfers }: ActionsGridProps) {
    const pendingCount = transfers?.filter((t) => !t.invoiced).length || 0

    const actions = [
        {
            title: "Cobros Pendientes",
            description: `Tienes ${pendingCount} cobros sin facturar`,
            buttonText: "Ver Cobros",
            href: "/cobros",
            buttonClassName: "bg-blue-600 hover:bg-blue-700",
        },
        {
            title: "Registrar Venta",
            description: "Agrega nuevas ventas a tu registro",
            buttonText: "Ir a Ventas",
            href: "/ventas",
            buttonClassName: "bg-green-600 hover:bg-green-700",
        },
        {
            title: "Facturas AFIP",
            description: "Gestiona tus facturas emitidas",
            buttonText: "Ver Facturas",
            href: "/facturas",
            buttonClassName: "bg-purple-600 hover:bg-purple-700",
        },
    ]

    return (
        <div className="grid gap-4 md:grid-cols-3">
            {actions.map((action, index) => (
                <ActionCard
                    key={index}
                    title={action.title}
                    description={action.description}
                    buttonText={action.buttonText}
                    href={action.href}
                    buttonClassName={action.buttonClassName}
                />
            ))}
        </div>
    )
}
