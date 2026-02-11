import { useState } from "react";
import { mockChecklists } from "@/lib/mock-data";
import type { Checklist, ChecklistItem } from "@/lib/types";
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
} from "@/components/index";
import {
  Plus,
  Trash2,
  Pencil,
  ClipboardCheck,
  GripVertical,
  X,
} from "lucide-react";
import { toast } from "sonner";

export default function ChecklistsPage() {
  const [checklists, setChecklists] = useState<Checklist[]>(mockChecklists);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Checklist | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formItems, setFormItems] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function openCreate() {
    setEditing(null);
    setFormName("");
    setFormItems([]);
    setNewItemText("");
    setModalOpen(true);
  }

  function openEdit(checklist: Checklist) {
    setEditing(checklist);
    setFormName(checklist.name);
    setFormItems([...checklist.items]);
    setNewItemText("");
    setModalOpen(true);
  }

  function addItem() {
    if (!newItemText.trim()) return;
    const item: ChecklistItem = {
      id: crypto.randomUUID(),
      text: newItemText.trim(),
      order: formItems.length,
    };
    setFormItems((prev) => [...prev, item]);
    setNewItemText("");
  }

  function removeItem(id: string) {
    setFormItems((prev) =>
      prev.filter((i) => i.id !== id).map((i, idx) => ({ ...i, order: idx })),
    );
  }

  function updateItem(id: string, text: string) {
    setFormItems((prev) => prev.map((i) => (i.id === id ? { ...i, text } : i)));
  }

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const newItems = [...formItems];
    const [moved] = newItems.splice(dragIndex, 1);
    newItems.splice(index, 0, moved);
    setFormItems(newItems.map((item, idx) => ({ ...item, order: idx })));
    setDragIndex(index);
  }

  function handleDragEnd() {
    setDragIndex(null);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editing) {
      setChecklists((prev) =>
        prev.map((c) =>
          c.id === editing.id
            ? { ...c, name: formName.trim(), items: formItems }
            : c,
        ),
      );
      toast.success("Checklist atualizado com sucesso.");
    } else {
      const newChecklist: Checklist = {
        id: crypto.randomUUID(),
        name: formName.trim(),
        items: formItems,
      };
      setChecklists((prev) => [...prev, newChecklist]);
      toast.success("Checklist criado com sucesso.");
    }
    setModalOpen(false);
    setEditing(null);
  }

  function handleDelete() {
    if (!deleteId) return;
    setChecklists((prev) => prev.filter((c) => c.id !== deleteId));
    setDeleteId(null);
    toast.success("Checklist excluido com sucesso.");
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

      {checklists.length === 0 ? (
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
                  {checklist.name}
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
              <CardContent>
                <ul className="flex flex-col gap-2">
                  {checklist.items.map((item, idx) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground">
                        {idx + 1}
                      </span>
                      {item.text}
                    </li>
                  ))}
                </ul>
              </CardContent>
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
        className="max-h-[90svh] overflow-y-auto sm:max-w-lg"
      >
        <form onSubmit={handleSave} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="checklist-name">Nome do Checklist</Label>
            <Input
              id="checklist-name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Itens</Label>
            {formItems.length > 0 && (
              <div className="flex flex-col gap-1 rounded-xl border border-border p-2">
                {formItems.map((item, idx) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={item.text}
                      onChange={(e) => updateItem(item.id, e.target.value)}
                      className="h-8"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                      onClick={() => removeItem(item.id)}
                      aria-label="Remover item"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Novo item"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
              />
              <Button type="button" variant="outline" onClick={addItem}>
                Adicionar
              </Button>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
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
