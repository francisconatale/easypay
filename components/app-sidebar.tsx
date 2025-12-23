"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, CreditCard, ShoppingCart, FileText, Menu, X, Users } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Cobros MP", href: "/cobros", icon: CreditCard },
  { name: "Ventas", href: "/ventas", icon: ShoppingCart },
  { name: "Clientes", href: "/clientes", icon: Users },
  { name: "Facturas", href: "/facturas", icon: FileText },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setIsOpen(!isOpen)} className="bg-white shadow-lg">
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-64 bg-gradient-to-br from-blue-600 to-blue-700 text-white z-40 transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-blue-500/30">
            <h2 className="text-2xl font-bold">Easypay</h2>
            <p className="text-blue-100 text-sm mt-1">Gestión de cobros</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? "bg-white text-blue-600 shadow-lg" : "text-blue-50 hover:bg-blue-500/30"
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-blue-500/30">
            <p className="text-xs text-blue-200 text-center">Easypay v1.0</p>
          </div>
        </div>
      </aside>
    </>
  )
}
