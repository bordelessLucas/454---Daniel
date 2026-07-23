import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useClientes } from "@/hooks/use-clientes";
import {
  deleteCalendarioEvento,
  updateCalendarioEvento,
} from "@/lib/calendario-service";
import type { CalendarioEvento } from "@/lib/types";
import {
  Button,
  Input,
  Label,
  SelectionField,
  Textarea,
} from "@/components/index";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatDateRange(dataInicio: string, dataFim: string): string {
  const format = (value: string) => {
    const [y, m, d] = value.slice(0, 10).split("-");
    if (!y || !m || !d) return value;
    return `${d}/${m}/${y}`;
  };

  if (dataInicio === dataFim) {
    return format(dataInicio);
  }
  return `${format(dataInicio)} → ${format(dataFim)}`;
}

interface EventoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evento: CalendarioEvento | null;
  onChanged?: () => void;
}

export function EventoDialog({
  open,
  onOpenChange,
  evento,
  onChanged,
}: EventoDialogProps) {
  const { user, isAdmin } = useAuth();
  const { clientes, loading: loadingClientes } = useClientes();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [clienteId, setClienteId] = useState("");

  const canManage =
    Boolean(evento) &&
    (isAdmin || (user != null && user.id === evento?.criadoPorId));

  const clienteOptions = useMemo(
    () => [
      { value: "", label: "Sem cliente" },
      ...clientes.map((cliente) => ({
        value: String(cliente.id),
        label: cliente.nomeFantasia,
        searchText: [cliente.nomeFantasia, cliente.razaoSocial, cliente.cidade]
          .filter(Boolean)
          .join(" "),
      })),
    ],
    [clientes],
  );

  useEffect(() => {
    if (!evento) {
      return;
    }
    setIsEditing(false);
    setTitulo(evento.title);
    setDescricao(evento.descricao ?? "");
    setDataInicio(evento.dataInicio);
    setDataFim(evento.dataFim);
    setClienteId(evento.clienteId != null ? String(evento.clienteId) : "");
  }, [evento]);

  if (!evento) {
    return null;
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setIsEditing(false);
    }
    onOpenChange(nextOpen);
  }

  async function handleSalvar() {
    if (!titulo.trim()) {
      toast.error("Informe o título do evento.");
      return;
    }
    if (!dataInicio || !dataFim) {
      toast.error("Informe data início e data fim.");
      return;
    }
    if (dataFim < dataInicio) {
      toast.error("A data fim deve ser maior ou igual à data início.");
      return;
    }

    setSaving(true);
    try {
      await updateCalendarioEvento(evento.id, {
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        dataInicio,
        dataFim,
        clienteId: clienteId ? Number(clienteId) : null,
      });
      toast.success("Evento atualizado.");
      setIsEditing(false);
      onChanged?.();
      handleOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao atualizar evento.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleExcluir() {
    const confirmed = window.confirm(
      "Excluir este evento do calendário? Esta ação não pode ser desfeita.",
    );
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    try {
      await deleteCalendarioEvento(evento.id);
      toast.success("Evento excluído.");
      onChanged?.();
      handleOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao excluir evento.";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  }

  const busy = saving || deleting;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar evento" : evento.title}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Altere os dados do evento de organização."
              : "Detalhes do evento (não é um relatório)."}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {isEditing ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="edit-evento-titulo">Título</Label>
                <Input
                  id="edit-evento-titulo"
                  value={titulo}
                  disabled={busy}
                  onChange={(event) => setTitulo(event.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-evento-inicio">Data início</Label>
                  <Input
                    id="edit-evento-inicio"
                    type="date"
                    value={dataInicio}
                    disabled={busy}
                    onChange={(event) => {
                      const next = event.target.value;
                      setDataInicio(next);
                      if (dataFim && dataFim < next) {
                        setDataFim(next);
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-evento-fim">Data fim</Label>
                  <Input
                    id="edit-evento-fim"
                    type="date"
                    value={dataFim}
                    min={dataInicio || undefined}
                    disabled={busy}
                    onChange={(event) => setDataFim(event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-evento-descricao">Descrição</Label>
                <Textarea
                  id="edit-evento-descricao"
                  value={descricao}
                  disabled={busy}
                  rows={3}
                  onChange={(event) => setDescricao(event.target.value)}
                />
              </div>
              <SelectionField
                id="edit-evento-cliente"
                label="Cliente (opcional)"
                options={clienteOptions}
                value={clienteId}
                onChange={(value) => setClienteId(String(value))}
                placeholder={
                  loadingClientes ? "Carregando..." : "Sem cliente"
                }
                searchable
                disabled={busy || loadingClientes}
              />
            </div>
          ) : (
            <dl className="space-y-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="shrink-0 text-muted-foreground">Período</dt>
                <dd className="min-w-0 break-words text-right font-medium">
                  {formatDateRange(evento.dataInicio, evento.dataFim)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="shrink-0 text-muted-foreground">Cliente</dt>
                <dd className="min-w-0 break-words text-right">
                  {evento.clienteNome || "—"}
                </dd>
              </div>
              {evento.descricao ? (
                <div className="flex justify-between gap-4">
                  <dt className="shrink-0 text-muted-foreground">Descrição</dt>
                  <dd className="min-w-0 break-words text-right">
                    {evento.descricao}
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4">
                <dt className="shrink-0 text-muted-foreground">Criado por</dt>
                <dd className="min-w-0 break-words text-right">
                  {evento.criadoPorNome || "—"}
                </dd>
              </div>
            </dl>
          )}
        </DialogBody>

        <DialogFooter className="gap-2 sm:gap-3">
          {isEditing ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setIsEditing(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={busy}
                onClick={() => void handleSalvar()}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => handleOpenChange(false)}
              >
                Fechar
              </Button>
              {canManage ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => setIsEditing(true)}
                  >
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={busy}
                    onClick={() => void handleExcluir()}
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Excluindo...
                      </>
                    ) : (
                      "Excluir"
                    )}
                  </Button>
                </>
              ) : null}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
