import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRamosAtividade } from "@/hooks/use-ramos-atividade";
import { RamoAtividade } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Button,
  Input,
  Label,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/index";
import { Plus, Search, Pencil, Trash2, Briefcase } from "lucide-react";
import { toast } from "sonner";
import {
  createRamoAtividade,
  updateRamoAtividade,
  deleteRamoAtividade,
} from "@/lib/ramos-atividade-service";

export default function RamosAtividadePage() {
  const { user } = useAuth();
  const [refetch, setRefetch] = useState(0);
  const { ramos, loading, error } = useRamosAtividade(refetch);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RamoAtividade | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return ramos;
    const q = search.toLowerCase();
    return ramos.filter((r) => r.nome.toLowerCase().includes(q));
  }, [ramos, search]);

  function openCreate() {
    setEditing(null);
    setFormName("");
    setModalOpen(true);
  }

  function openEdit(ramo: RamoAtividade) {
    setEditing(ramo);
    setFormName(ramo.nome);
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Por favor, preencha o nome do ramo de atividade.");
      return;
    }

    try {
      setIsSaving(true);

      if (editing) {
        await updateRamoAtividade(editing.id, formName.trim());
        toast.success("Ramo de atividade atualizado com sucesso.");
      } else {
        await createRamoAtividade(formName.trim());
        toast.success("Ramo de atividade criado com sucesso.");
      }

      setModalOpen(false);
      setEditing(null);
      setRefetch((prev) => prev + 1);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao salvar ramo de atividade";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;

    try {
      setIsSaving(true);
      await deleteRamoAtividade(deleteId);
      setDeleteId(null);
      toast.success("Ramo de atividade excluído com sucesso.");
      setRefetch((prev) => prev + 1);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro ao excluir ramo de atividade";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  if (user?.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground">
          Você não tem permissão para acessar esta página.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground">
          Carregando ramos de atividade...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-destructive">Erro ao carregar: {error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => setRefetch((prev) => prev + 1)}
        >
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Ramos de Atividade"
        description="Gerencie os ramos de atividade do sistema."
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Ramo de Atividade
          </Button>
        }
      />

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar ramos de atividade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Nenhum ramo de atividade encontrado"
          description={
            search
              ? "Tente buscar com outros termos."
              : "Adicione seu primeiro ramo de atividade."
          }
        />
      ) : (
        <div className="rounded-2xl border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Ramo de Atividade</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((ramo) => (
                <TableRow key={ramo.id}>
                  <TableCell className="font-medium">{ramo.nome}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(ramo)}
                        aria-label="Editar"
                        disabled={isSaving}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(ramo.id)}
                        aria-label="Excluir"
                        disabled={isSaving}
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

      <Modal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditing(null);
        }}
        title={editing ? "Editar Ramo de Atividade" : "Novo Ramo de Atividade"}
      >
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ramo-name">Nome do Ramo de Atividade</Label>
            <Input
              id="ramo-name"
              placeholder="Ex: Recreação, Saúde, Educação..."
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              disabled={isSaving}
              required
            />
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir ramo de atividade"
        description="Tem certeza que deseja excluir este ramo de atividade? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
      />
    </>
  );
}
