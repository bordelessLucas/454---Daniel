import { useState } from "react";
import { useChecklists } from "@/hooks/use-checklists";
import type { ApiChecklist } from "@/lib/types";
import {
  createChecklist,
  updateChecklist,
  deleteChecklist,
} from "@/lib/checklist-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Modal,
  Textarea,
} from "@/components/index";
import { Plus, Trash2, Pencil, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";

export default function ChecklistsPage() {
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const { checklists, loading } = useChecklists(refetchTrigger);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiChecklist | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescricao, setFormDescricao] = useState("");
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setFormName("");
    setFormDescricao("");
    setModalOpen(true);
  }

  function openEdit(checklist: ApiChecklist) {
    setEditing(checklist);
    setFormName(checklist.nome);
    setFormDescricao(checklist.descricao ?? "");
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateChecklist(editing.id, {
          nome: formName.trim(),
          descricao: formDescricao.trim() || undefined,
        });
        toast.success("Checklist atualizado com sucesso.");
      } else {
        await createChecklist({
          nome: formName.trim(),
          descricao: formDescricao.trim() || undefined,
        });
        toast.success("Checklist criado com sucesso.");
      }
      setRefetchTrigger((p) => p + 1);
      setModalOpen(false);
      setEditing(null);
    } catch {
      toast.error("Erro ao salvar checklist.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteChecklist(deleteId);
      setRefetchTrigger((p) => p + 1);
      toast.success("Checklist excluido com sucesso.");
    } catch {
      toast.error("Erro ao excluir checklist.");
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Checklists"
        description="Gerencie os checklists disponiveis para relatorios."
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Checklist
          </Button>
        }
      />

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Carregando...
        </p>
      ) : checklists.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Nenhum checklist cadastrado"
          description="Crie seu primeiro checklist para utilizar nos relatorios."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {checklists.map((checklist) => (
            <Card key={checklist.id} className="border-border">
              <CardHeader className="flex flex-row items-start justify-between pb-3">
                <CardTitle className="text-base font-medium">
                  {checklist.nome}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(checklist)}
                    aria-label="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(checklist.id)}
                    aria-label="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              {checklist.descricao && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {checklist.descricao}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditing(null);
        }}
        title={editing ? "Editar Checklist" : "Novo Checklist"}
        className="sm:max-w-md"
      >
        <form onSubmit={handleSave} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="checklist-name">Nome</Label>
            <Input
              id="checklist-name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="checklist-desc">Descricao (opcional)</Label>
            <Textarea
              id="checklist-desc"
              value={formDescricao}
              onChange={(e) => setFormDescricao(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir checklist"
        description="Tem certeza que deseja excluir este checklist? Esta acao nao pode ser desfeita."
        onConfirm={handleDelete}
      />
    </>
  );
}
