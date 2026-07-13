import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useUsuarios } from "@/hooks/use-usuarios";
import { useClientes } from "@/hooks/use-clientes";
import {
  createUsuario,
  updateUsuario,
  deleteUsuario,
  changePassword,
} from "@/lib/usuarios-service";
import type { ApiUser } from "@/lib/types";
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
  Select,
} from "@/components/index";
import { Plus, Search, Pencil, Trash2, User, Key } from "lucide-react";
import { toast } from "sonner";

export default function UsuariosPage() {
  const { user } = useAuth();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const { usuarios, loading, error } = useUsuarios(refetchTrigger);
  const { clientes } = useClientes();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiUser | null>(null);
  const [changingPasswordFor, setChangingPasswordFor] =
    useState<ApiUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    username: "",
    nome: "",
    email: "",
    password: "",
    role: "TECNICO" as "ADMIN" | "TECNICO",
    clienteId: null as number | null,
    ativo: true,
  });

  const filtered = useMemo(() => {
    if (!search) return usuarios;
    const q = search.toLowerCase();
    return usuarios.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.nome.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.cliente && u.cliente.nomeFantasia.toLowerCase().includes(q)),
    );
  }, [usuarios, search]);

  // Verificar se é admin
  const isAdmin = user?.role === "ADMIN";

  if (!isAdmin) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <EmptyState
          icon={User}
          title="Acesso negado"
          description="Você não tem permissão para acessar esta página."
        />
      </div>
    );
  }

  function openCreate() {
    setEditing(null);
    setForm({
      username: "",
      nome: "",
      email: "",
      password: "",
      role: "TECNICO",
      clienteId: null,
      ativo: true,
    });
    setModalOpen(true);
  }

  function openEdit(usuario: ApiUser) {
    setEditing(usuario);
    setForm({
      username: usuario.username,
      nome: usuario.nome,
      email: usuario.email,
      password: "",
      role: usuario.role,
      clienteId: usuario.clienteId,
      ativo: usuario.ativo,
    });
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      if (editing) {
        // Atualizar - senha NÃO pode ser atualizada aqui
        await updateUsuario(editing.id, {
          nome: form.nome,
          email: form.email,
          role: form.role,
          clienteId: form.clienteId,
          ativo: form.ativo,
        });
        toast.success("Usuário atualizado com sucesso.");
      } else {
        // Criar - username e password são obrigatórios
        await createUsuario({
          username: form.username,
          password: form.password,
          nome: form.nome,
          email: form.email,
          role: form.role,
          ...(typeof form.clienteId === "number"
            ? { clienteId: form.clienteId }
            : {}),
        });
        toast.success("Usuário criado com sucesso.");
      }
      setModalOpen(false);
      setEditing(null);
      setRefetchTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Erro ao salvar usuário:", err);
      toast.error(
        err instanceof Error ? err.message : "Erro ao salvar usuário.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;

    try {
      await deleteUsuario(deleteId);
      setDeleteId(null);
      toast.success("Usuário excluído com sucesso.");
      setRefetchTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Erro ao excluir usuário:", err);
      toast.error(
        err instanceof Error ? err.message : "Erro ao excluir usuário.",
      );
    }
  }

  function openPasswordChange(usuario: ApiUser) {
    setChangingPasswordFor(usuario);
    setNewPassword("");
    setPasswordModalOpen(true);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!changingPasswordFor || !newPassword) return;

    setSaving(true);
    try {
      await changePassword(changingPasswordFor.id, {
        newPassword,
      });

      toast.success("Senha alterada com sucesso.");
      setPasswordModalOpen(false);
      setChangingPasswordFor(null);
      setNewPassword("");
    } catch (err) {
      console.error("Erro ao alterar senha:", err);
      toast.error(
        err instanceof Error ? err.message : "Erro ao alterar senha.",
      );
    } finally {
      setSaving(false);
    }
  }

  const roleLabels = {
    ADMIN: "Admin",
    TECNICO: "Técnico",
  };

  return (
    <>
      <PageHeader
        title="Usuários"
        description="Gerencie os usuários do sistema."
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Usuário
          </Button>
        }
      />

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar usuários..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando usuários...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-destructive">
          <p>Erro ao carregar usuários: {error}</p>
        </div>
      )}

      {!loading && !error && filtered.length === 0 ? (
        <EmptyState
          icon={User}
          title="Nenhum usuário encontrado"
          description={
            search
              ? "Tente buscar com outros termos."
              : "Adicione o primeiro usuário."
          }
        />
      ) : (
        !loading &&
        !error && (
          <div className="rounded-2xl border border-border overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden sm:table-cell">E-mail</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell className="font-medium font-mono text-sm">
                      {usuario.username}
                    </TableCell>
                    <TableCell>{usuario.nome}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {usuario.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          usuario.role === "ADMIN" ? "default" : "secondary"
                        }
                      >
                        {roleLabels[usuario.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {usuario.cliente ? usuario.cliente.nomeFantasia : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={usuario.ativo ? "default" : "secondary"}>
                        {usuario.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(usuario)}
                          aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openPasswordChange(usuario)}
                          aria-label="Alterar Senha"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(usuario.id)}
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
        )
      )}

      <Modal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditing(null);
        }}
        title={editing ? "Editar Usuário" : "Novo Usuário"}
      >
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          {!editing && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-username">Username</Label>
              <Input
                id="user-username"
                value={form.username}
                onChange={(e) =>
                  setForm((f) => ({ ...f, username: e.target.value }))
                }
                required
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="user-nome">Nome</Label>
            <Input
              id="user-nome"
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="user-email">E-mail</Label>
            <Input
              id="user-email"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              required
            />
          </div>
          {!editing && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-password">Senha</Label>
              <Input
                id="user-password"
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                required
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="user-role">Role</Label>
            <Select
              id="user-role"
              value={form.role}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  role: e.target.value as "ADMIN" | "TECNICO",
                }))
              }
            >
              <option value="TECNICO">Técnico</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="user-cliente">
              Cliente Associado {form.role === "TECNICO" ? "(obrigatório)" : "(opcional)"}
            </Label>
            <Select
              id="user-cliente"
              value={form.clienteId?.toString() || ""}
              required={form.role === "TECNICO"}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  clienteId: e.target.value ? Number(e.target.value) : null,
                }))
              }
            >
              <option value="">Nenhum</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nomeFantasia}
                </option>
              ))}
            </Select>
          </div>
          {editing && (
            <div className="flex items-center justify-between">
              <Label htmlFor="user-ativo">Ativo</Label>
              <Switch
                id="user-ativo"
                checked={form.ativo}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, ativo: checked }))
                }
              />
            </div>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={passwordModalOpen}
        onOpenChange={(open) => {
          setPasswordModalOpen(open);
          if (!open) {
            setChangingPasswordFor(null);
            setNewPassword("");
          }
        }}
        title={`Alterar Senha - ${changingPasswordFor?.nome}`}
        size="sm"
      >
        <form onSubmit={handleChangePassword} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-password">Nova Senha</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Digite a nova senha"
              required
              minLength={6}
            />
            <p className="text-xs text-muted-foreground">
              Mínimo de 6 caracteres
            </p>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPasswordModalOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Alterando..." : "Alterar Senha"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir usuário"
        description="Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
      />
    </>
  );
}
