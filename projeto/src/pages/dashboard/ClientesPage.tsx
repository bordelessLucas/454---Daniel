import { useState, useMemo, useEffect } from "react";
import { useClientes } from "@/hooks/use-clientes";
import type { Client } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ClientModal } from "@/components/client-modal";
import {
  ClientsFilterModal,
  ClientsFilters,
} from "@/components/clients-filter-modal";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/index";
import { Plus, Pencil, Trash2, Users, Filter, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ClientesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [filters, setFilters] = useState<ClientsFilters>({
    nomeFantasia: "",
    cnpj: "",
    ramoAtividade: "all",
  });

  // Preparar os filtros para a API
  const apiFilters = useMemo(() => {
    return {
      nomeFantasia: filters.nomeFantasia || undefined,
      cnpj: filters.cnpj || undefined,
      ramoAtividadeId:
        filters.ramoAtividade !== "all"
          ? parseInt(filters.ramoAtividade)
          : undefined,
    };
  }, [filters]);

  const { clientes, loading, error } = useClientes(apiFilters);

  const ramosAtividade = useMemo(() => {
    const ramosMap = new Map<number, string>();
    clientes.forEach((c) => {
      ramosMap.set(c.ramoAtividade.id, c.ramoAtividade.nome);
    });
    return Array.from(ramosMap, ([id, nome]) => ({ id, nome })).sort((a, b) =>
      a.nome.localeCompare(b.nome),
    );
  }, [clientes]);

  const hasActiveFilters =
    filters.nomeFantasia !== "" ||
    filters.cnpj !== "" ||
    filters.ramoAtividade !== "all";

  function handleSave(client: Client) {
    // Recarregar dados dos clientes
    setRefetchTrigger((prev) => prev + 1);
    setModalOpen(false);
    setEditingClient(null);
  }

  function handleDelete() {
    if (!deleteId) return;
    // TODO: Implementar DELETE para remover cliente
    toast.success("Cliente excluido com sucesso.");
    setDeleteId(null);
    // Recarregar clientes
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

      <div className="mb-4 flex justify-end">
        <Button
          variant="outline"
          onClick={() => setFilterModalOpen(true)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtrar
          {hasActiveFilters && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {
                Object.values(filters).filter((v) => v !== "all" && v !== "")
                  .length
              }
            </span>
          )}
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : clientes.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum cliente encontrado"
          description={
            hasActiveFilters
              ? "Tente ajustar os filtros de busca."
              : "Adicione seu primeiro cliente para comecar."
          }
        />
      ) : (
        <div className="rounded-2xl border border-border overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead>Razão Social</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Ramo de Atividade</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    {client.razaoSocial}
                  </TableCell>
                  <TableCell>{client.cnpj}</TableCell>
                  <TableCell>{client.ramoAtividade.nome}</TableCell>
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

      <ClientsFilterModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        filters={filters}
        onFiltersChange={setFilters}
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
