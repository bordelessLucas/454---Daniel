import { useState, useMemo } from "react";
import { useClientes } from "@/hooks/use-clientes";
import type { Client } from "@/lib/types";
import { deleteClient } from "@/lib/clients-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ClientModal } from "@/components/client-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [isDeleting, setIsDeleting] = useState(false);
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

  const { clientes, loading, error } = useClientes(apiFilters, refetchTrigger);

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

  function handleSave() {
    // Recarregar dados dos clientes
    setRefetchTrigger((prev) => prev + 1);
    setModalOpen(false);
    setEditingClient(null);
  }

  async function handleDelete() {
    if (!deleteId) return;

    try {
      setIsDeleting(true);
      await deleteClient(deleteId);
      toast.success("Cliente excluído com sucesso.");
      setDeleteId(null);
      setRefetchTrigger((prev) => prev + 1);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao excluir cliente.",
      );
    } finally {
      setIsDeleting(false);
    }
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

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          onClick={() => setFilterModalOpen(true)}
          className="w-full gap-2 sm:w-auto"
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

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
