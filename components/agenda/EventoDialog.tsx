import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { userCanEditRelatorio } from "@/lib/relatorio-permissions";
import {
  getRelatorioAgendaStatus,
  isRelatorioConteudoEditavel,
} from "@/lib/relatorio-status";
import type {
  AlterarStatusRelatorioResponse,
  CalendarioEvento,
  RelatorioAgendaStatus,
} from "@/lib/types";
import { Button } from "@/components/index";
import { RelatorioStatusBadge } from "@/components/relatorio-status-badge";
import { RelatorioStatusActions } from "@/components/relatorio-status-actions";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface EventoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evento: CalendarioEvento | null;
  onStatusChanged?: (response: AlterarStatusRelatorioResponse) => void;
}

export function EventoDialog({
  open,
  onOpenChange,
  evento,
  onStatusChanged,
}: EventoDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [localStatus, setLocalStatus] = useState<RelatorioAgendaStatus | null>(
    null,
  );

  useEffect(() => {
    setLocalStatus(null);
  }, [evento?.id]);

  if (!evento) {
    return null;
  }

  const status = localStatus ?? evento.status;
  const canManageStatus = userCanEditRelatorio(user, evento.criadoPorId);
  const canEditContent =
    canManageStatus && isRelatorioConteudoEditavel(status);
  const tecnicosLabel =
    evento.tecnicos.length > 0
      ? evento.tecnicos.map((t) => t.nome).join(", ")
      : "—";

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setLocalStatus(null);
    }
    onOpenChange(nextOpen);
  }

  function handleStatusChanged(response: AlterarStatusRelatorioResponse) {
    const nextStatus =
      response.statusAtual ??
      response.status ??
      getRelatorioAgendaStatus(response);
    setLocalStatus(nextStatus);
    onStatusChanged?.(response);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{evento.cliente.nomeFantasia}</DialogTitle>
          <DialogDescription>Detalhes do agendamento / visita</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <dl className="space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Cliente</dt>
              <dd className="text-right font-medium">
                {evento.cliente.nomeFantasia}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Técnicos</dt>
              <dd className="text-right">{tecnicosLabel}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Data / hora</dt>
              <dd className="text-right">{formatDateTime(evento.start)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <RelatorioStatusBadge status={status} />
              </dd>
            </div>
            {evento.modalidadeServico ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Modalidade</dt>
                <dd className="text-right">{evento.modalidadeServico}</dd>
              </div>
            ) : null}
          </dl>

          {canManageStatus ? (
            <div className="mt-6 border-t border-border pt-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Workflow
              </p>
              <RelatorioStatusActions
                relatorioId={evento.id}
                status={status}
                onStatusChanged={handleStatusChanged}
              />
              {status === "CANCELADO" ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Relatório cancelado — reabra para editar o conteúdo.
                </p>
              ) : null}
            </div>
          ) : null}
        </DialogBody>

        <DialogFooter className="gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Fechar
          </Button>
          {canEditContent ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                handleOpenChange(false);
                navigate(`/dashboard/relatorios/${evento.id}/editar`);
              }}
            >
              Editar
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={() => {
              handleOpenChange(false);
              navigate(`/dashboard/relatorios/${evento.id}`);
            }}
          >
            Ver relatório completo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
