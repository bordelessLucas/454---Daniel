import {
  parseLocalDate,
  toApiDateOnly,
} from "@/lib/relatorio-datetime";
import type { CalendarioEvento } from "@/lib/types";

const RESPONSE_LIST_KEYS = [
  "eventos",
  "events",
  "data",
  "items",
  "results",
] as const;

export function extractCalendarioRows(
  payload: unknown,
): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload as Record<string, unknown>[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const obj = payload as Record<string, unknown>;
  for (const key of RESPONSE_LIST_KEYS) {
    const value = obj[key];
    if (Array.isArray(value)) {
      return value as Record<string, unknown>[];
    }
  }

  return [];
}

/** Soma dias a uma data YYYY-MM-DD (calendário local). */
export function addDaysToDateOnly(dateStr: string, days: number): string {
  const date = parseLocalDate(dateStr);
  if (!date) {
    return dateStr.slice(0, 10);
  }
  date.setDate(date.getDate() + days);
  return toApiDateOnly(date);
}

function resolveInclusiveRange(raw: Record<string, unknown>): {
  dataInicio: string;
  dataFim: string;
} | null {
  const extended = (raw.extendedProps as Record<string, unknown> | undefined) ?? {};

  const dataInicio = String(
    extended.dataInicio ?? raw.dataInicio ?? "",
  )
    .trim()
    .slice(0, 10);

  const dataFim = String(extended.dataFim ?? raw.dataFim ?? "")
    .trim()
    .slice(0, 10);

  if (/^\d{4}-\d{2}-\d{2}$/.test(dataInicio) && /^\d{4}-\d{2}-\d{2}$/.test(dataFim)) {
    return { dataInicio, dataFim };
  }

  const start = String(raw.start ?? "")
    .trim()
    .slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) {
    return null;
  }

  // Sem dataFim explícito: 1 dia (ou end exclusivo − 1).
  const endExclusive = String(raw.end ?? "")
    .trim()
    .slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(endExclusive)) {
    return {
      dataInicio: start,
      dataFim: addDaysToDateOnly(endExclusive, -1),
    };
  }

  return { dataInicio: start, dataFim: start };
}

/**
 * Normaliza resposta do backend (formato FullCalendar ou DTO cru)
 * para o modelo interno do front.
 */
export function normalizeCalendarioEvento(
  raw: Record<string, unknown>,
): CalendarioEvento | null {
  const id = Number(raw.id);
  if (!id || Number.isNaN(id)) {
    return null;
  }

  const range = resolveInclusiveRange(raw);
  if (!range) {
    return null;
  }

  const extended = (raw.extendedProps as Record<string, unknown> | undefined) ?? {};

  const title =
    (typeof raw.title === "string" && raw.title.trim()) ||
    (typeof raw.titulo === "string" && raw.titulo.trim()) ||
    (typeof extended.titulo === "string" && extended.titulo.trim()) ||
    "Evento";

  const start =
    typeof raw.start === "string" && raw.start.trim()
      ? raw.start.trim().slice(0, 10)
      : range.dataInicio;

  const endFromApi =
    typeof raw.end === "string" && raw.end.trim()
      ? raw.end.trim().slice(0, 10)
      : null;

  // FullCalendar allDay: end exclusivo = dataFim + 1.
  const end = endFromApi ?? addDaysToDateOnly(range.dataFim, 1);

  const clienteIdRaw = extended.clienteId ?? raw.clienteId;
  const clienteId =
    clienteIdRaw == null || clienteIdRaw === ""
      ? null
      : Number(clienteIdRaw);

  const clienteNome =
    (typeof extended.clienteNome === "string" && extended.clienteNome) ||
    (typeof raw.clienteNome === "string" && raw.clienteNome) ||
    ((raw.cliente as { nomeFantasia?: string } | undefined)?.nomeFantasia ??
      null);

  const criadoPorId = Number(
    extended.criadoPorId ??
      raw.criadoPorId ??
      (raw.criadoPor as { id?: number } | undefined)?.id ??
      0,
  );

  const criadoPorNome =
    (typeof extended.criadoPorNome === "string" && extended.criadoPorNome) ||
    (typeof raw.criadoPorNome === "string" && raw.criadoPorNome) ||
    ((raw.criadoPor as { nome?: string } | undefined)?.nome ?? null);

  const descricao =
    (typeof extended.descricao === "string" && extended.descricao) ||
    (typeof raw.descricao === "string" && raw.descricao) ||
    null;

  return {
    id,
    title,
    start,
    end,
    allDay: raw.allDay !== false,
    dataInicio: range.dataInicio,
    dataFim: range.dataFim,
    descricao,
    clienteId: Number.isFinite(clienteId) ? clienteId : null,
    clienteNome,
    criadoPorId,
    criadoPorNome,
  };
}

export function filterEventosByCriadoPor(
  eventos: CalendarioEvento[],
  criadoPorId?: number,
): CalendarioEvento[] {
  if (criadoPorId === undefined) {
    return eventos;
  }
  return eventos.filter((evento) => evento.criadoPorId === criadoPorId);
}
