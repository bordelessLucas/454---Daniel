import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useClientes } from "@/hooks/use-clientes";
import { createCalendarioEvento } from "@/lib/calendario-service";
import { toApiDateOnly } from "@/lib/relatorio-datetime";
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

function toDateInputValue(date: Date): string {
  return toApiDateOnly(date);
}

interface NovoEventoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date | null;
  onSuccess?: () => void;
}

export function NovoAgendamentoDialog({
  open,
  onOpenChange,
  initialDate,
  onSuccess,
}: NovoEventoDialogProps) {
  const { clientes, loading: loadingClientes } = useClientes();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [saving, setSaving] = useState(false);
  const wasOpenRef = useRef(false);

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
    if (open && !wasOpenRef.current) {
      const base = toDateInputValue(initialDate ?? new Date());
      setTitulo("");
      setDescricao("");
      setDataInicio(base);
      setDataFim(base);
      setClienteId("");
    }
    wasOpenRef.current = open;
  }, [open, initialDate]);

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
      await createCalendarioEvento({
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        dataInicio,
        dataFim,
        clienteId: clienteId ? Number(clienteId) : null,
      });
      toast.success("Evento criado com sucesso.");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao criar evento.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo evento</DialogTitle>
          <DialogDescription>
            Organize a equipe no calendário. Isso não cria relatório de visita.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="evento-titulo">
              Título <span className="text-destructive">*</span>
            </Label>
            <Input
              id="evento-titulo"
              value={titulo}
              disabled={saving}
              onChange={(event) => setTitulo(event.target.value)}
              placeholder="Ex.: Demanda sprint"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="evento-data-inicio">
                Data início <span className="text-destructive">*</span>
              </Label>
              <Input
                id="evento-data-inicio"
                type="date"
                value={dataInicio}
                disabled={saving}
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
              <Label htmlFor="evento-data-fim">
                Data fim <span className="text-destructive">*</span>
              </Label>
              <Input
                id="evento-data-fim"
                type="date"
                value={dataFim}
                min={dataInicio || undefined}
                disabled={saving}
                onChange={(event) => setDataFim(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="evento-descricao">Descrição</Label>
            <Textarea
              id="evento-descricao"
              value={descricao}
              disabled={saving}
              rows={3}
              onChange={(event) => setDescricao(event.target.value)}
              placeholder="Opcional"
            />
          </div>

          <SelectionField
            id="evento-cliente"
            label="Cliente (opcional)"
            options={clienteOptions}
            value={clienteId}
            onChange={(value) => setClienteId(String(value))}
            placeholder={
              loadingClientes ? "Carregando clientes..." : "Sem cliente"
            }
            searchPlaceholder="Buscar cliente..."
            searchable
            disabled={saving || loadingClientes}
          />
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={saving}
            onClick={() => void handleSalvar()}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Criar evento"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
