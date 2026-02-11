import { useState, useMemo } from "react";
import { mockTechnicians } from "@/lib/mock-data";
import type { Technician } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Badge,
  Button,
  Input,
  Label,
  Modal,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/index";
import { Plus, Search, Pencil, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";

export default function TecnicosPage() {
  const [technicians, setTechnicians] = useState<Technician[]>(mockTechnicians);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Technician | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    status: "ativo" as "ativo" | "inativo",
  });

  const filtered = useMemo(() => {
    if (!search) return technicians;
    const q = search.toLowerCase();
    return technicians.filter(
      (t) =>
        t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q),
    );
  }, [technicians, search]);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", email: "", password: "", status: "ativo" });
    setModalOpen(true);
  }

  function openEdit(tech: Technician) {
    setEditing(tech);
    setForm({
      name: tech.name,
      email: tech.email,
      password: "",
      status: tech.status,
    });
    setModalOpen(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      setTechnicians((prev) =>
        prev.map((t) =>
          t.id === editing.id
            ? { ...t, name: form.name, email: form.email, status: form.status }
            : t,
        ),
      );
      toast.success("Tecnico atualizado com sucesso.");
    } else {
      const newTech: Technician = {
        id: crypto.randomUUID(),
        name: form.name,
        email: form.email,
        status: form.status,
      };
      setTechnicians((prev) => [...prev, newTech]);
      toast.success("Tecnico criado com sucesso.");
    }
    setModalOpen(false);
    setEditing(null);
  }

  function handleDelete() {
    if (!deleteId) return;
    setTechnicians((prev) => prev.filter((t) => t.id !== deleteId));
    setDeleteId(null);
    toast.success("Tecnico excluido com sucesso.");
  }

  return (
    <>
      <PageHeader
        title="Tecnicos"
        description="Gerencie a equipe tecnica."
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Tecnico
          </Button>
        }
      />

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar tecnicos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="Nenhum tecnico encontrado"
          description={
            search
              ? "Tente buscar com outros termos."
              : "Adicione seu primeiro tecnico."
          }
        />
      ) : (
        <div className="rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">E-mail</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((tech) => (
                <TableRow key={tech.id}>
                  <TableCell className="font-medium">{tech.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {tech.email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        tech.status === "ativo" ? "default" : "secondary"
                      }
                    >
                      {tech.status === "ativo" ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(tech)}
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(tech.id)}
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
        title={editing ? "Editar Tecnico" : "Novo Tecnico"}
        className="sm:max-w-md"
      >
        <form onSubmit={handleSave} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tech-name">Nome</Label>
            <Input
              id="tech-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tech-email">E-mail</Label>
            <Input
              id="tech-email"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tech-password">
              Senha{editing ? " (deixe vazio para manter)" : ""}
            </Label>
            <Input
              id="tech-password"
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              required={!editing}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="tech-status">Ativo</Label>
            <Switch
              id="tech-status"
              checked={form.status === "ativo"}
              onCheckedChange={(checked) =>
                setForm((f) => ({
                  ...f,
                  status: checked ? "ativo" : "inativo",
                }))
              }
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
        title="Excluir tecnico"
        description="Tem certeza que deseja excluir este tecnico? Esta acao nao pode ser desfeita."
        onConfirm={handleDelete}
      />
    </>
  );
}
