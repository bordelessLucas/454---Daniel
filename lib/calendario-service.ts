import { apiRequest } from "@/lib/api-client";
import {
  extractCalendarioRows,
  filterEventosByCriadoPor,
  normalizeCalendarioEvento,
} from "@/lib/calendario-mapper";
import {
  normalizeDataVisitaForApi,
  toApiDateOnly,
  toInclusiveApiEndDate,
} from "@/lib/relatorio-datetime";
import type {
  CalendarioEvento,
  CreateCalendarioEventoPayload,
  ReagendarDataVisitaPayload,
  UpdateCalendarioEventoPayload,
} from "@/lib/types";

export interface CalendarioQueryParams {
  dataInicio: string;
  dataFim: string;
  clienteId?: number;
  criadoPorId?: number;
}

export function buildCalendarioRangeFromFullCalendar(
  start: string,
  end: string,
): Pick<CalendarioQueryParams, "dataInicio" | "dataFim"> {
  return {
    dataInicio: toApiDateOnly(start),
    // View end do FC é exclusivo — converte para inclusivo na query.
    dataFim: toInclusiveApiEndDate(end),
  };
}

function parseCalendarioPayload(payload: unknown): CalendarioEvento[] {
  return extractCalendarioRows(payload)
    .map((row) => normalizeCalendarioEvento(row))
    .filter((evento): evento is CalendarioEvento => evento !== null);
}

export async function fetchCalendarioEventos(
  params: CalendarioQueryParams,
): Promise<CalendarioEvento[]> {
  const search = new URLSearchParams({
    dataInicio: params.dataInicio,
    dataFim: params.dataFim,
  });

  if (params.clienteId !== undefined) {
    search.set("clienteId", String(params.clienteId));
  }
  if (params.criadoPorId !== undefined) {
    search.set("criadoPorId", String(params.criadoPorId));
  }

  const payload = await apiRequest<unknown>(
    `/calendario/eventos?${search.toString()}`,
  );
  const eventos = parseCalendarioPayload(payload);

  // Reforço local caso o backend ignore o filtro.
  return filterEventosByCriadoPor(eventos, params.criadoPorId);
}

export async function getCalendarioEvento(
  id: number,
): Promise<CalendarioEvento> {
  const payload = await apiRequest<Record<string, unknown>>(
    `/calendario/eventos/${id}`,
  );
  const evento = normalizeCalendarioEvento(payload);
  if (!evento) {
    throw new Error("Evento de calendário inválido.");
  }
  return evento;
}

export async function createCalendarioEvento(
  data: CreateCalendarioEventoPayload,
): Promise<CalendarioEvento> {
  const body: Record<string, unknown> = {
    titulo: data.titulo.trim(),
    dataInicio: normalizeDataVisitaForApi(data.dataInicio),
    dataFim: normalizeDataVisitaForApi(data.dataFim),
  };

  if (data.descricao?.trim()) {
    body.descricao = data.descricao.trim();
  }
  if (data.clienteId != null) {
    body.clienteId = data.clienteId;
  }

  const response = await apiRequest<Record<string, unknown>>(
    "/calendario/eventos",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );

  const evento = normalizeCalendarioEvento(response);
  if (!evento) {
    throw new Error("Resposta de criação de evento inválida.");
  }
  return evento;
}

export async function updateCalendarioEvento(
  id: number,
  data: UpdateCalendarioEventoPayload,
): Promise<CalendarioEvento> {
  const body: Record<string, unknown> = {};

  if (data.titulo !== undefined) {
    body.titulo = data.titulo.trim();
  }
  if (data.descricao !== undefined) {
    body.descricao = data.descricao?.trim() || null;
  }
  if (data.dataInicio !== undefined) {
    body.dataInicio = normalizeDataVisitaForApi(data.dataInicio);
  }
  if (data.dataFim !== undefined) {
    body.dataFim = normalizeDataVisitaForApi(data.dataFim);
  }
  if (data.clienteId !== undefined) {
    body.clienteId = data.clienteId;
  }

  const response = await apiRequest<Record<string, unknown>>(
    `/calendario/eventos/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(body),
    },
  );

  const evento = normalizeCalendarioEvento(response);
  if (!evento) {
    throw new Error("Resposta de atualização de evento inválida.");
  }
  return evento;
}

export async function deleteCalendarioEvento(id: number): Promise<void> {
  await apiRequest<void>(`/calendario/eventos/${id}`, {
    method: "DELETE",
  });
}

/**
 * Converte start/end do FullCalendar (end exclusivo em allDay)
 * para dataInicio/dataFim inclusivos da API.
 */
export function inclusiveRangeFromFullCalendarEvent(
  start: Date,
  end: Date | null,
): { dataInicio: string; dataFim: string } {
  const dataInicio = toApiDateOnly(start);
  if (!end) {
    return { dataInicio, dataFim: dataInicio };
  }
  return {
    dataInicio,
    dataFim: toInclusiveApiEndDate(end),
  };
}

/** Patch de dataVisita em relatório (fluxo de relatórios, não calendário). */
export async function reagendarRelatorioDataVisita(
  relatorioId: number,
  data: ReagendarDataVisitaPayload,
): Promise<void> {
  await apiRequest<void>(`/relatorios/${relatorioId}/data-visita`, {
    method: "PATCH",
    body: JSON.stringify({
      dataVisita: normalizeDataVisitaForApi(data.dataVisita),
      ...(data.horaVisita ? { horaVisita: data.horaVisita } : {}),
    }),
  });
}
