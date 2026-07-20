import { Badge } from "@/components/Badge";
import type { RelatorioAgendaStatus } from "@/lib/types";
import {
  RELATORIO_AGENDA_STATUS_BADGE_CLASS,
  RELATORIO_AGENDA_STATUS_LABELS,
} from "@/lib/relatorio-status";
import { cn } from "@/lib/utils";

interface RelatorioStatusBadgeProps {
  status: RelatorioAgendaStatus;
  className?: string;
}

export function RelatorioStatusBadge({
  status,
  className,
}: RelatorioStatusBadgeProps) {
  return (
    <Badge
      className={cn(RELATORIO_AGENDA_STATUS_BADGE_CLASS[status], className)}
    >
      {RELATORIO_AGENDA_STATUS_LABELS[status]}
    </Badge>
  );
}
