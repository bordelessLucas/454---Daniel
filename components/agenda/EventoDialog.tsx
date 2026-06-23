import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { userCanEditRelatorio } from "@/lib/relatorio-permissions";
import type { CalendarioEvento, RelatorioAgendaStatus } from "@/lib/types";
import { Badge, Button } from "@/components/index";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_LABELS: Record<RelatorioAgendaStatus, string> = {
  AGENDADO: "Agendado",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
};

const STATUS_BADGE_CLASS: Record<RelatorioAgendaStatus, string> = {
  AGENDADO: "border-transparent bg-blue-600 text-white",
  FINALIZADO: "border-transparent bg-emerald-600 text-white",
  CANCELADO: "border-transparent bg-red-600 text-white",
};

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
}

export function EventoDialog({
  open,
  onOpenChange,
  evento,
}: EventoDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!evento) {
    return null;
  }

  const canEdit = userCanEditRelatorio(user, evento.criadoPorId);
  const tecnicosLabel =
    evento.tecnicos.length > 0
      ? evento.tecnicos.map((t) => t.nome).join(", ")
      : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{evento.cliente.nomeFantasia}</DialogTitle>
          <DialogDescription>Detalhes do agendamento / visita</DialogDescription>
        </DialogHeader>

        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Cliente</dt>
            <dd className="text-right font-medium">{evento.cliente.nomeFantasia}</dd>
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
              <Badge className={STATUS_BADGE_CLASS[evento.status]}>
                {STATUS_LABELS[evento.status]}
              </Badge>
            </dd>
          </div>
          {evento.modalidadeServico ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Modalidade</dt>
              <dd className="text-right">{evento.modalidadeServico}</dd>
            </div>
          ) : null}
        </dl>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {canEdit ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                navigate(`/dashboard/relatorios/${evento.id}/editar`);
              }}
            >
              Editar
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={() => {
              onOpenChange(false);
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
