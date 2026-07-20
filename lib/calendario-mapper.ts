import { extractHhmmFromIso } from "@/lib/relatorio-datetime";
import type {
  ApiReport,
  CalendarioEvento,
  CalendarioEventoTecnico,
  RelatorioAgendaStatus,
  ReportHorario,
} from "@/lib/types";

const RESPONSE_LIST_KEYS = [
  "eventos",
  "events",
  "data",
  "relatorios",
  "items",
  "results",
] as const;

export function extractCalendarioRows(payload: unknown): Record<string, unknown>[] {
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

function normalizeTecnicos(raw: Record<string, unknown>): CalendarioEventoTecnico[] {
  const tecnicosRaw = raw.tecnicos;
  if (!Array.isArray(tecnicosRaw)) {
    return [];
  }

  return tecnicosRaw
    .map((item, index) => {
      if (typeof item === "string") {
        return { id: index, nome: item };
      }
      if (item && typeof item === "object") {
        const tecnico = item as Record<string, unknown>;
        return {
          id: Number(tecnico.id ?? index),
          nome: String(tecnico.nome ?? tecnico.name ?? "Técnico"),
        };
      }
      return null;
    })
    .filter((item): item is CalendarioEventoTecnico => item !== null);
}

export function resolveAgendaStatus(
  raw: Record<string, unknown>,
): RelatorioAgendaStatus {
  // Preferir `status` (campo atual do workflow); `statusAgenda` é alias legado.
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

function resolveHoraFromHorarios(
  horarios: ReportHorario[] | undefined,
): string | null {
  const primeiro = horarios?.[0];
  if (!primeiro) {
    return null;
  }

  const hhmm = primeiro.horaChegadaHhmm?.trim();
  if (hhmm && /^\d{2}:\d{2}/.test(hhmm)) {
    return hhmm.slice(0, 5);
  }

  const fromIso = extractHhmmFromIso(primeiro.horaChegada);
  return fromIso || null;
}

export function buildEventStartFromRaw(raw: Record<string, unknown>): {
  start: string;
  allDay: boolean;
} {
  const explicitStart = [
    raw.start,
    raw.inicio,
    raw.startDate,
    raw.dataHora,
  ].find((value) => typeof value === "string" && value.trim());

  if (explicitStart) {
    const start = explicitStart.trim();
    const hasTime = start.includes("T") && !start.endsWith("T00:00:00.000Z");
    if (hasTime || /T\d{2}:\d{2}/.test(start)) {
      return { start, allDay: false };
    }
    return { start: start.slice(0, 10), allDay: true };
  }

  const datePart = String(
    raw.dataVisitaHhmm ?? raw.dataVisita ?? raw.date ?? "",
  )
    .trim()
    .slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return { start: "", allDay: true };
  }

  const hora =
    (typeof raw.horaVisita === "string" && raw.horaVisita.trim()) ||
    resolveHoraFromHorarios(raw.horarios as ReportHorario[] | undefined);

  if (hora && /^\d{2}:\d{2}/.test(hora)) {
    return {
      start: `${datePart}T${hora.slice(0, 5)}:00`,
      allDay: false,
    };
  }

  return { start: datePart, allDay: true };
}

export function normalizeCalendarioEvento(
  raw: Record<string, unknown>,
): CalendarioEvento | null {
  const id = Number(raw.id ?? raw.relatorioId);
  if (!id || Number.isNaN(id)) {
    return null;
  }

  const { start, allDay } = buildEventStartFromRaw(raw);
  if (!start) {
    return null;
  }

  const clienteRaw = raw.cliente as CalendarioEvento["cliente"] | undefined;
  const clienteNome =
    clienteRaw?.nomeFantasia ??
    (typeof raw.clienteNome === "string" ? raw.clienteNome : undefined) ??
    (typeof raw.title === "string" ? raw.title.split(" - ")[0] : undefined) ??
    "Cliente";

  const extended = raw.extendedProps as Record<string, unknown> | undefined;
  const fromExtended = extended?.evento as CalendarioEvento | undefined;

  if (fromExtended?.id && fromExtended.start) {
    return {
      ...fromExtended,
      id,
      start: fromExtended.start || start,
      // Top-level da resposta prevalece sobre cópia aninhada (pode estar stale).
      status: resolveAgendaStatus({
        ...fromExtended,
        ...raw,
      }),
    };
  }

  const title =
    (typeof raw.title === "string" && raw.title.trim()) ||
    (typeof raw.titulo === "string" && raw.titulo.trim()) ||
    clienteNome;

  return {
    id,
    title,
    start,
    end: (raw.end as string | null | undefined) ?? null,
    status: resolveAgendaStatus(raw),
    cliente: clienteRaw ?? {
      id: Number(raw.clienteId ?? 0),
      nomeFantasia: clienteNome,
    },
    tecnicos: normalizeTecnicos(raw),
    modalidadeServico: (raw.modalidadeServico as string | null) ?? null,
    criadoPorId: Number(
      raw.criadoPorId ??
        (raw.criadoPor as { id?: number } | undefined)?.id ??
        0,
    ),
    allDay,
  };
}

export function mapRelatorioToCalendarioEvento(
  report: ApiReport & { statusAgenda?: RelatorioAgendaStatus },
): CalendarioEvento | null {
  return normalizeCalendarioEvento(
    report as unknown as Record<string, unknown>,
  );
}

export function filterEventosByTecnico(
  eventos: CalendarioEvento[],
  tecnicoId?: number,
): CalendarioEvento[] {
  if (tecnicoId === undefined) {
    return eventos;
  }

  return eventos.filter(
    (evento) =>
      evento.criadoPorId === tecnicoId ||
      evento.tecnicos.some((tecnico) => tecnico.id === tecnicoId),
  );
}
