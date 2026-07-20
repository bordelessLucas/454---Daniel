import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ApiError } from "@/lib/api-client";
import { alterarStatusRelatorio } from "@/lib/relatorios-service";
import {
  TRANSICOES_STATUS_PERMITIDAS,
  getStatusActionLabel,
  getStatusActionSuccessMessage,
} from "@/lib/relatorio-status";
import type {
  AlterarStatusRelatorioResponse,
  RelatorioAgendaStatus,
} from "@/lib/types";
import { CheckCircle2, RotateCcw, XCircle, Loader2 } from "lucide-react";

interface RelatorioStatusActionsProps {
  relatorioId: number;
  status: RelatorioAgendaStatus;
  /** Quando false, esconde as ações (ex.: sem permissão de edição). */
  enabled?: boolean;
  size?: "default" | "sm";
  className?: string;
  onStatusChanged?: (response: AlterarStatusRelatorioResponse) => void;
}

function actionVariant(
  to: RelatorioAgendaStatus,
): "default" | "outline" | "destructive" {
  if (to === "CANCELADO") return "destructive";
  if (to === "FINALIZADO") return "default";
  return "outline";
}

function ActionIcon({
  to,
  spinning,
}: {
  to: RelatorioAgendaStatus;
  spinning: boolean;
}) {
  if (spinning) {
    return <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
  }
  if (to === "FINALIZADO") {
    return <CheckCircle2 className="mr-2 h-4 w-4" />;
  }
  if (to === "CANCELADO") {
    return <XCircle className="mr-2 h-4 w-4" />;
  }
  return <RotateCcw className="mr-2 h-4 w-4" />;
}

export function RelatorioStatusActions({
  relatorioId,
  status,
  enabled = true,
  size = "sm",
  className,
  onStatusChanged,
}: RelatorioStatusActionsProps) {
  const [pendingStatus, setPendingStatus] =
    useState<RelatorioAgendaStatus | null>(null);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  if (!enabled) {
    return null;
  }

  const transitions = TRANSICOES_STATUS_PERMITIDAS[status];
  if (transitions.length === 0) {
    return null;
  }

  async function applyTransition(to: RelatorioAgendaStatus) {
    if (pendingStatus) return;

    setPendingStatus(to);
    try {
      const response = await alterarStatusRelatorio(relatorioId, to);
      toast.success(getStatusActionSuccessMessage(to));
      // Garante status na UI mesmo se a API omitir statusAtual/status.
      onStatusChanged?.({
        ...response,
        status: response.statusAtual ?? response.status ?? to,
        statusAtual: response.statusAtual ?? response.status ?? to,
        statusAnterior: response.statusAnterior ?? status,
        transicoesPermitidas:
          response.transicoesPermitidas ?? TRANSICOES_STATUS_PERMITIDAS[to],
      });
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível alterar o status do relatório.",
      );
    } finally {
      setPendingStatus(null);
    }
  }

  function handleClick(to: RelatorioAgendaStatus) {
    if (to === "CANCELADO") {
      setConfirmCancelOpen(true);
      return;
    }
    void applyTransition(to);
  }

  return (
    <>
      <div className={className ?? "flex flex-wrap gap-2"}>
        {transitions.map((to) => (
          <Button
            key={to}
            type="button"
            size={size}
            variant={actionVariant(to)}
            disabled={pendingStatus !== null}
            onClick={() => handleClick(to)}
          >
            <ActionIcon to={to} spinning={pendingStatus === to} />
            {getStatusActionLabel(to)}
          </Button>
        ))}
      </div>

      <ConfirmDialog
        open={confirmCancelOpen}
        onOpenChange={setConfirmCancelOpen}
        title="Cancelar visita"
        description="Tem certeza que deseja cancelar esta visita? O conteúdo do relatório não poderá ser editado até reabrir."
        confirmLabel="Confirmar cancelamento"
        cancelLabel="Voltar"
        onConfirm={() => {
          void applyTransition("CANCELADO");
        }}
      />
    </>
  );
}
