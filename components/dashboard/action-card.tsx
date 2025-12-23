import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface ActionCardProps {
    title: string
    description: string
    buttonText: string
    href: string
    buttonClassName?: string
}

export function ActionCard({
    title,
    description,
    buttonText,
    href,
    buttonClassName,
}: ActionCardProps) {
    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <CardTitle className="text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-slate-600 mb-4">{description}</p>
                <Button className={cn("w-full", buttonClassName)} asChild>
                    <Link href={href}>
                        {buttonText} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    )
}
