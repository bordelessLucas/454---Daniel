import { useState, useMemo } from "react";
import { mockClients } from "@/lib/mock-data";
import type { Client } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ClientModal } from "@/components/client-modal";
import {
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/index";
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.contact.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q),
    );
  }, [clients, search]);

  function handleSave(data: Omit<Client, "id">) {
    if (editingClient) {
      setClients((prev) =>
        prev.map((c) => (c.id === editingClient.id ? { ...c, ...data } : c)),
      );
      toast.success("Cliente atualizado com sucesso.");
    } else {
      const newClient: Client = { ...data, id: crypto.randomUUID() };
      setClients((prev) => [...prev, newClient]);
      toast.success("Cliente criado com sucesso.");
    }
    setEditingClient(null);
  }

  function handleDelete() {
    if (!deleteId) return;
    setClients((prev) => prev.filter((c) => c.id !== deleteId));
    setDeleteId(null);
    toast.success("Cliente excluido com sucesso.");
  }

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Gerencie os clientes cadastrados."
        action={
          <Button
            onClick={() => {
              setEditingClient(null);
              setModalOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        }
      />

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum cliente encontrado"
          description={
            search
              ? "Tente buscar com outros termos."
              : "Adicione seu primeiro cliente para comecar."
          }
        />
      ) : (
        <div className="rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead className="hidden md:table-cell">Contato</TableHead>
                <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                <TableHead className="hidden lg:table-cell">E-mail</TableHead>
                <TableHead className="hidden lg:table-cell">Cidade</TableHead>
                <TableHead className="w-24 text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {client.contact}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {client.phone}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {client.email}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {client.city}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingClient(client);
                          setModalOpen(true);
                        }}
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(client.id)}
                        aria-label="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ClientModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingClient(null);
        }}
        client={editingClient}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir cliente"
        description="Tem certeza que deseja excluir este cliente? Esta acao nao pode ser desfeita."
        onConfirm={handleDelete}
      />
    </>
  );
}
