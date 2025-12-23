"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Pencil, Trash2 } from "lucide-react"
import { EditClientDialog } from "@/components/edit-client-dialog"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

type Client = {
  id: string
  name: string
  email: string | null
  phone: string | null
  dni: string | null
  cuit: string | null
  address: string | null
  notes: string | null
  created_at: string
}

export function ClientsTable({ clients }: { clients: Client[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const router = useRouter()

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.dni?.includes(searchTerm) ||
      client.cuit?.includes(searchTerm),
  )

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar este cliente?")) return

    const supabase = createBrowserClient()
    const { error } = await supabase.from("clients").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error al eliminar cliente:", error)
      alert("Error al eliminar el cliente")
    } else {
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 bg-white p-4 rounded-lg border">
        <Search className="h-5 w-5 text-slate-400" />
        <Input
          placeholder="Buscar por nombre, email, DNI o CUIT..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 shadow-none focus-visible:ring-0"
        />
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>DNI</TableHead>
              <TableHead>CUIT</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>{client.email || "-"}</TableCell>
                <TableCell>{client.phone || "-"}</TableCell>
                <TableCell>{client.dni || "-"}</TableCell>
                <TableCell>{client.cuit || "-"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingClient(client)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(client.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredClients.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  No se encontraron clientes
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {editingClient && (
        <EditClientDialog
          client={editingClient}
          open={!!editingClient}
          onOpenChange={(open) => !open && setEditingClient(null)}
        />
      )}
    </div>
  )
}
