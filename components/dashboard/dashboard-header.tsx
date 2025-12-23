import { Button } from "@/components/ui/button"
import { ConnectMPButton } from "@/components/connect-mp-button"
import { logout } from "@/app/login/actions"
import { disconnectMercadoPago } from "@/app/cobrar/actions"
import { LogOut, Unplug } from "lucide-react"

interface DashboardHeaderProps {
    isConnected: boolean
    mpUser: any // Using any for now as the type wasn't strictly defined in the page
}

export function DashboardHeader({ isConnected, mpUser }: DashboardHeaderProps) {
    return (
        <div className="border-b bg-white">
            <div className="container mx-auto px-6 py-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-600 mt-1">Vista general de tu negocio</p>
                </div>
                <div className="flex items-center gap-4">
                    {isConnected ? (
                        <div className="flex items-center gap-2">
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
                            <form action={disconnectMercadoPago}>
                                <Button variant="ghost" size="icon" title="Desconectar Mercado Pago" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                    <Unplug className="h-5 w-5" />
                                </Button>
                            </form>
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
    )
}
