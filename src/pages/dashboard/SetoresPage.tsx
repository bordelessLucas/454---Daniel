import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useSetores } from "@/hooks/use-setores";
import type { Sector } from "@/lib/types";
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
  Textarea,
} from "@/components/index";
import { Plus, Search, Pencil, Trash2, Layers } from "lucide-react";
import { toast } from "sonner";
import { createSetor, updateSetor, deleteSetor } from "@/lib/setores-service";

export default function SetoresPage() {
  const { user } = useAuth();
  const [refetch, setRefetch] = useState(0);
  const { setores, loading, error } = useSetores(refetch);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Sector | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescricao, setFormDescricao] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return setores;
    const q = search.toLowerCase();
    return setores.filter((s) => s.nome.toLowerCase().includes(q));
  }, [setores, search]);

  function openCreate() {
    setEditing(null);
    setFormName("");
    setFormDescricao("");
    setModalOpen(true);
  }

  function openEdit(setor: Sector) {
    setEditing(setor);
    setFormName(setor.nome);
    setFormDescricao(setor.descricao || "");
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Por favor, preencha o nome do setor.");
      return;
    }

    try {
      setIsSaving(true);

      if (editing) {
        await updateSetor(
          editing.id,
          formName.trim(),
          formDescricao.trim() || undefined,
        );
        toast.success("Setor atualizado com sucesso.");
      } else {
        await createSetor(formName.trim(), formDescricao.trim() || undefined);
        toast.success("Setor criado com sucesso.");
      }

      setModalOpen(false);
      setEditing(null);
      setRefetch((prev) => prev + 1);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao salvar setor";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;

    try {
      setIsSaving(true);
      await deleteSetor(deleteId);
      setDeleteId(null);
      toast.success("Setor excluído com sucesso.");
      setRefetch((prev) => prev + 1);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao excluir setor";
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
        <p className="text-muted-foreground">Carregando setores...</p>
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
        title="Setores"
        description="Gerencie os setores de serviço."
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Setor
          </Button>
        }
      />

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar setores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Nenhum setor encontrado"
          description={
            search
              ? "Tente buscar com outros termos."
              : "Adicione seu primeiro setor."
          }
        />
      ) : (
        <div className="rounded-2xl border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Setor</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((setor) => (
                <TableRow key={setor.id}>
                  <TableCell className="font-medium">{setor.nome}</TableCell>
                  <TableCell className="max-w-[12rem] truncate text-sm text-muted-foreground sm:max-w-none sm:whitespace-normal">
                    {setor.descricao || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(setor)}
                        aria-label="Editar"
                        disabled={isSaving}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(setor.id)}
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
        title={editing ? "Editar Setor" : "Novo Setor"}
      >
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="sector-name">Nome do Setor</Label>
            <Input
              id="sector-name"
              placeholder="Ex: Limpeza, Manutenção, Segurança..."
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              disabled={isSaving}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sector-descricao">Descrição (opcional)</Label>
            <Textarea
              id="sector-descricao"
              placeholder="Descreva o setor..."
              value={formDescricao}
              onChange={(e) => setFormDescricao(e.target.value)}
              disabled={isSaving}
              className="resize-none"
              rows={3}
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
        title="Excluir setor"
        description="Tem certeza que deseja excluir este setor? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
      />
    </>
  );
}
