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
import { Plus, Trash2, Pencil, ClipboardCheck, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface EditableChecklistItem {
  id: string;
  texto: string;
}

export default function ChecklistsPage() {
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const { checklists, loading, error } = useChecklists(refetchTrigger);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiChecklist | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescricao, setFormDescricao] = useState("");
  const [formItems, setFormItems] = useState<EditableChecklistItem[]>([]);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function buildFormItems(
    checklist?: ApiChecklist | null,
  ): EditableChecklistItem[] {
    if (!checklist?.itens || checklist.itens.length === 0) {
      return [{ id: crypto.randomUUID(), texto: "" }];
    }

    return [...checklist.itens]
      .sort((a, b) => a.ordem - b.ordem)
      .map((item) => ({
        id: String(item.id ?? crypto.randomUUID()),
        texto: item.texto,
      }));
  }

  function normalizeChecklistItems(items: EditableChecklistItem[]) {
    return items
      .map((item) => item.texto.trim())
      .filter(Boolean)
      .map((texto, index) => ({
        texto,
        ordem: index + 1,
      }));
  }

  function openCreate() {
    setEditing(null);
    setFormName("");
    setFormDescricao("");
    setFormItems(buildFormItems());
    setDraggedItemId(null);
    setModalOpen(true);
  }

  function openEdit(checklist: ApiChecklist) {
    setEditing(checklist);
    setFormName(checklist.nome);
    setFormDescricao(checklist.descricao ?? "");
    setFormItems(buildFormItems(checklist));
    setDraggedItemId(null);
    setModalOpen(true);
  }

  function addChecklistItem() {
    setFormItems((prev) => [...prev, { id: crypto.randomUUID(), texto: "" }]);
  }

  function removeChecklistItem(id: string) {
    setFormItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      return next.length > 0 ? next : [{ id: crypto.randomUUID(), texto: "" }];
    });
  }

  function updateChecklistItem(id: string, texto: string) {
    setFormItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, texto } : item)),
    );
  }

  function reorderChecklistItems(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;

    setFormItems((prev) => {
      const sourceIndex = prev.findIndex((item) => item.id === sourceId);
      const targetIndex = prev.findIndex((item) => item.id === targetId);

      if (sourceIndex < 0 || targetIndex < 0) return prev;

      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;

    const itensPayload = normalizeChecklistItems(formItems);
    setSaving(true);
    try {
      if (editing) {
        await updateChecklist(editing.id, {
          nome: formName.trim(),
          descricao: formDescricao.trim() || undefined,
          itens: itensPayload,
        });
        toast.success("Checklist atualizado com sucesso.");
      } else {
        await createChecklist({
          nome: formName.trim(),
          descricao: formDescricao.trim() || undefined,
          itens: itensPayload,
        });
        toast.success("Checklist criado com sucesso.");
      }
      setRefetchTrigger((p) => p + 1);
      setModalOpen(false);
      setEditing(null);
      setFormItems([]);
      setDraggedItemId(null);
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

  const orderedChecklists = [...checklists].sort((a, b) => a.indice - b.indice);

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
      ) : error ? (
        <p className="py-8 text-center text-sm text-destructive">
          Erro ao carregar checklists: {error}
        </p>
      ) : checklists.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Nenhum checklist cadastrado"
          description="Crie seu primeiro checklist para utilizar nos relatorios."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orderedChecklists.map((checklist) => (
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
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {checklist.descricao || "Sem descricao"}
                </p>
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Itens
                  </p>
                  {checklist.itens && checklist.itens.length > 0 ? (
                    <ul className="space-y-1 text-sm text-foreground">
                      {[...checklist.itens]
                        .sort((a, b) => a.ordem - b.ordem)
                        .map((item) => (
                          <li key={item.id}>
                            {item.ordem}. {item.texto}
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhum item cadastrado.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setEditing(null);
            setFormItems([]);
            setDraggedItemId(null);
          }
        }}
        title={editing ? "Editar Checklist" : "Novo Checklist"}
        size="lg"
      >
        <form onSubmit={handleSave} className="flex flex-col gap-5">
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
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Itens do checklist</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addChecklistItem}
              >
                <Plus className="h-4 w-4" />
                Adicionar item
              </Button>
            </div>
            <div className="flex max-h-60 flex-col gap-2 overflow-y-auto rounded-md border border-border p-2">
              {formItems.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => setDraggedItemId(item.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (draggedItemId) {
                      reorderChecklistItems(draggedItemId, item.id);
                      setDraggedItemId(null);
                    }
                  }}
                  onDragEnd={() => setDraggedItemId(null)}
                  className="flex items-center gap-2 rounded-md border border-border bg-background p-2"
                >
                  <span
                    className="cursor-grab text-muted-foreground active:cursor-grabbing"
                    aria-hidden
                  >
                    <GripVertical className="h-4 w-4" />
                  </span>
                  <span className="w-6 text-center text-xs text-muted-foreground">
                    {index + 1}
                  </span>
                  <Input
                    value={item.texto}
                    onChange={(e) => updateChecklistItem(item.id, e.target.value)}
                    placeholder="Descreva o item"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removeChecklistItem(item.id)}
                    aria-label="Remover item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Arraste os itens para alterar a ordem.
            </p>
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
