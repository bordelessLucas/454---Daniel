import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useClientes } from "@/hooks/use-clientes";
import { useTecnicos } from "@/hooks/use-tecnicos";
import { createAgendamento } from "@/lib/calendario-service";
import {
  extractHhmmFromDatetimeLocal,
  normalizeDataVisitaForApi,
} from "@/lib/relatorio-datetime";
import { Button, Input, Label, SelectionField } from "@/components/index";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function toDatetimeLocalValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function datetimeLocalToParts(value: string): {
  dataVisita: string;
  horaVisita: string;
} {
  return {
    dataVisita: normalizeDataVisitaForApi(value),
    horaVisita: extractHhmmFromDatetimeLocal(value),
  };
}

interface NovoAgendamentoDialogProps {
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
}: NovoAgendamentoDialogProps) {
  const { clientes, loading: loadingClientes } = useClientes();
  const { tecnicos, loading: loadingTecnicos } = useTecnicos();

  const [clienteId, setClienteId] = useState("");
  const [tecnicoIds, setTecnicoIds] = useState<string[]>([]);
  const [dataHora, setDataHora] = useState("");
  const [saving, setSaving] = useState(false);
  const wasOpenRef = useRef(false);

  const clienteOptions = useMemo(
    () =>
      clientes.map((cliente) => ({
        value: String(cliente.id),
        label: cliente.nomeFantasia,
        searchText: [cliente.nomeFantasia, cliente.razaoSocial, cliente.cidade]
          .filter(Boolean)
          .join(" "),
      })),
    [clientes],
  );

  const tecnicoOptions = useMemo(
    () =>
      tecnicos.map((tecnico) => ({
        value: String(tecnico.id),
        label: tecnico.nome,
      })),
    [tecnicos],
  );

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      const baseDate = initialDate ?? new Date();
      setDataHora(toDatetimeLocalValue(baseDate));
      setClienteId("");
      setTecnicoIds([]);
    }
    wasOpenRef.current = open;
  }, [open, initialDate]);

  async function handleAgendar() {
    if (!clienteId) {
      toast.error("Selecione um cliente.");
      return;
    }
    if (tecnicoIds.length === 0) {
      toast.error("Selecione ao menos um técnico.");
      return;
    }
    if (!dataHora) {
      toast.error("Informe a data e hora da visita.");
      return;
    }

    setSaving(true);
    try {
      const { dataVisita, horaVisita } = datetimeLocalToParts(dataHora);
      const tecnicoNomes = tecnicoIds
        .map((id) => tecnicos.find((t) => String(t.id) === id)?.nome)
        .filter((nome): nome is string => Boolean(nome));

      if (tecnicoNomes.length === 0) {
        toast.error("Não foi possível resolver os técnicos selecionados.");
        return;
      }

      await createAgendamento({
        clienteId: Number(clienteId),
        dataVisita,
        horaVisita,
        tecnicos: tecnicoNomes,
      });
      toast.success("Agendamento criado com sucesso.");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao criar agendamento.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  const isLoadingOptions = loadingClientes || loadingTecnicos;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
          <DialogDescription>
            Agende uma visita com status AGENDADO.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="agendamento-data-hora">Data e hora</Label>
            <Input
              id="agendamento-data-hora"
              type="datetime-local"
              value={dataHora}
              disabled={saving}
              onChange={(event) => setDataHora(event.target.value)}
            />
          </div>

          <SelectionField
            id="agendamento-cliente"
            label="Cliente"
            options={clienteOptions}
            value={clienteId}
            onChange={(value) => setClienteId(String(value))}
            placeholder={
              isLoadingOptions ? "Carregando clientes..." : "Selecione o cliente"
            }
            searchPlaceholder="Buscar cliente..."
            searchable
            disabled={saving || isLoadingOptions}
          />

          <SelectionField
            id="agendamento-tecnicos"
            label="Técnicos"
            options={tecnicoOptions}
            value={tecnicoIds}
            onChange={(value) =>
              setTecnicoIds(Array.isArray(value) ? value : [])
            }
            selectionMode="multiple"
            placeholder={
              isLoadingOptions ? "Carregando técnicos..." : "Selecione técnicos"
            }
            disabled={saving || isLoadingOptions}
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
          <Button type="button" disabled={saving} onClick={() => void handleAgendar()}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Agendando...
              </>
            ) : (
              "Agendar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
