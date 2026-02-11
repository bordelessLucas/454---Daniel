import { useState, useMemo } from "react";
import { mockSectors } from "@/lib/mock-data";
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
} from "@/components/index";
import { Plus, Search, Pencil, Trash2, Layers } from "lucide-react";
import { toast } from "sonner";

export default function SetoresPage() {
  const [sectors, setSectors] = useState<Sector[]>(mockSectors);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Sector | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");

  const filtered = useMemo(() => {
    if (!search) return sectors;
    const q = search.toLowerCase();
    return sectors.filter((s) => s.name.toLowerCase().includes(q));
  }, [sectors, search]);

  function openCreate() {
    setEditing(null);
    setFormName("");
    setModalOpen(true);
  }

  function openEdit(sector: Sector) {
    setEditing(sector);
    setFormName(sector.name);
    setModalOpen(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editing) {
      setSectors((prev) =>
        prev.map((s) =>
          s.id === editing.id ? { ...s, name: formName.trim() } : s,
        ),
      );
      toast.success("Setor atualizado com sucesso.");
    } else {
      const newSector: Sector = {
        id: crypto.randomUUID(),
        name: formName.trim(),
      };
      setSectors((prev) => [...prev, newSector]);
      toast.success("Setor criado com sucesso.");
    }
    setModalOpen(false);
    setEditing(null);
  }

  function handleDelete() {
    if (!deleteId) return;
    setSectors((prev) => prev.filter((s) => s.id !== deleteId));
    setDeleteId(null);
    toast.success("Setor excluido com sucesso.");
  }

  return (
    <>
      <PageHeader
        title="Setores"
        description="Gerencie os setores de servico."
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
        <div className="rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Setor</TableHead>
                <TableHead className="w-24 text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((sector) => (
                <TableRow key={sector.id}>
                  <TableCell className="font-medium">{sector.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(sector)}
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(sector.id)}
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

      <Modal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditing(null);
        }}
        title={editing ? "Editar Setor" : "Novo Setor"}
        className="sm:max-w-md"
      >
        <form onSubmit={handleSave} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="sector-name">Nome do Setor</Label>
            <Input
              id="sector-name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
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
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir setor"
        description="Tem certeza que deseja excluir este setor? Esta acao nao pode ser desfeita."
        onConfirm={handleDelete}
      />
    </>
  );
}
