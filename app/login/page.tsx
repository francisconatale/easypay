import { login, signup } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message: string }>
}) {
    const { message } = await searchParams

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
                    <CardDescription>
                        Ingresa tu email y contraseña para acceder al sistema
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                            />
                        </div>

                        {message && (
                            <p className="text-sm text-red-500 text-center bg-red-50 p-2 rounded">
                                {message}
                            </p>
                        )}

                        <div className="flex flex-col gap-2 pt-4">
                            <Button formAction={login} className="w-full bg-blue-600 hover:bg-blue-700">
                                Ingresar
                            </Button>
                            <Button formAction={signup} variant="outline" className="w-full">
                                Registrarse
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
