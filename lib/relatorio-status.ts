import type { ApiReport, RelatorioAgendaStatus } from "@/lib/types";

export const RELATORIO_AGENDA_STATUS_LABELS: Record<
  RelatorioAgendaStatus,
  string
> = {
  AGENDADO: "Agendado",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
};

export const RELATORIO_AGENDA_STATUS_BADGE_CLASS: Record<
  RelatorioAgendaStatus,
  string
> = {
  AGENDADO: "border-transparent bg-blue-600 text-white",
  FINALIZADO: "border-transparent bg-emerald-600 text-white",
  CANCELADO: "border-transparent bg-red-600 text-white",
};

/** Transições espelhando o backend (para habilitar botões na UI). */
export const TRANSICOES_STATUS_PERMITIDAS: Record<
  RelatorioAgendaStatus,
  RelatorioAgendaStatus[]
> = {
  AGENDADO: ["FINALIZADO", "CANCELADO"],
  FINALIZADO: ["CANCELADO", "AGENDADO"],
  CANCELADO: ["AGENDADO"],
};

function resolveAgendaStatus(
  raw: Record<string, unknown>,
): RelatorioAgendaStatus {
  const candidates = [raw.status, raw.statusAgenda, raw.situacao];
  for (const candidate of candidates) {
    if (
      candidate === "AGENDADO" ||
      candidate === "FINALIZADO" ||
      candidate === "CANCELADO"
    ) {
      return candidate;
    }
  }

  const horarios = raw.horarios;
  if (Array.isArray(horarios) && horarios.length > 0) {
    return "FINALIZADO";
  }

  return "AGENDADO";
}

export function getRelatorioAgendaStatus(
  report: Pick<ApiReport, "status" | "statusAgenda" | "horarios">,
): RelatorioAgendaStatus {
  return resolveAgendaStatus(report as unknown as Record<string, unknown>);
}

export function canTransitionRelatorioStatus(
  from: RelatorioAgendaStatus,
  to: RelatorioAgendaStatus,
): boolean {
  return TRANSICOES_STATUS_PERMITIDAS[from].includes(to);
}

export function isRelatorioConteudoEditavel(
  status: RelatorioAgendaStatus,
): boolean {
  return status !== "CANCELADO";
}

export function getStatusActionLabel(to: RelatorioAgendaStatus): string {
  switch (to) {
    case "FINALIZADO":
      return "Finalizar";
    case "CANCELADO":
      return "Cancelar";
    case "AGENDADO":
      return "Reabrir";
  }
}

export function getStatusActionSuccessMessage(
  to: RelatorioAgendaStatus,
): string {
  switch (to) {
    case "FINALIZADO":
      return "Relatório finalizado com sucesso.";
    case "CANCELADO":
      return "Visita cancelada com sucesso.";
    case "AGENDADO":
      return "Relatório reaberto como agendado.";
  }
}
