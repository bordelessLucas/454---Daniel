import { apiRequest } from "@/lib/api-client";
import {
  extractCalendarioRows,
  filterEventosByTecnico,
  mapRelatorioToCalendarioEvento,
  normalizeCalendarioEvento,
} from "@/lib/calendario-mapper";
import {
  normalizeDataVisitaForApi,
  toApiDateOnly,
  toInclusiveApiEndDate,
} from "@/lib/relatorio-datetime";
import type {
  AgendamentoPayload,
  ApiReport,
  CalendarioEvento,
  ReagendarDataVisitaPayload,
} from "@/lib/types";

export interface CalendarioQueryParams {
  dataInicio: string;
  dataFim: string;
  tecnicoId?: number;
}

export function buildCalendarioRangeFromFullCalendar(
  start: string,
  end: string,
): Pick<CalendarioQueryParams, "dataInicio" | "dataFim"> {
  return {
    dataInicio: toApiDateOnly(start),
    dataFim: toInclusiveApiEndDate(end),
  };
}

function parseCalendarioPayload(payload: unknown): CalendarioEvento[] {
  return extractCalendarioRows(payload)
    .map((row) => normalizeCalendarioEvento(row))
    .filter((evento): evento is CalendarioEvento => evento !== null);
}

async function fetchRelatoriosAsEventos(
  params: CalendarioQueryParams,
): Promise<CalendarioEvento[]> {
  const search = new URLSearchParams({
    dataInicio: params.dataInicio,
    dataFim: params.dataFim,
  });

  const reports = await apiRequest<ApiReport[]>(
    `/relatorios?${search.toString()}`,
  );

  const eventos = reports
    .map((report) => mapRelatorioToCalendarioEvento(report))
    .filter((evento): evento is CalendarioEvento => evento !== null);

  return filterEventosByTecnico(eventos, params.tecnicoId);
}

export async function fetchCalendarioEventos(
  params: CalendarioQueryParams,
): Promise<CalendarioEvento[]> {
  const search = new URLSearchParams({
    dataInicio: params.dataInicio,
    dataFim: params.dataFim,
  });

  if (params.tecnicoId !== undefined) {
    search.set("tecnicoId", String(params.tecnicoId));
  }

  try {
    const payload = await apiRequest<unknown>(
      `/relatorios/calendario?${search.toString()}`,
    );
    const eventos = parseCalendarioPayload(payload);

    if (eventos.length > 0) {
      return filterEventosByTecnico(eventos, params.tecnicoId);
    }
  } catch {
    // Fallback abaixo quando o endpoint dedicado falhar ou estiver vazio.
  }

  return fetchRelatoriosAsEventos(params);
}

export async function createAgendamento(
  data: AgendamentoPayload,
): Promise<CalendarioEvento> {
  const response = await apiRequest<Record<string, unknown>>(
    "/relatorios/agendamento",
    {
      method: "POST",
      body: JSON.stringify({
        clienteId: data.clienteId,
        dataVisita: normalizeDataVisitaForApi(data.dataVisita),
        ...(data.horaVisita ? { horaVisita: data.horaVisita } : {}),
        tecnicos: data.tecnicos,
        ...(data.modalidadeServico
          ? { modalidadeServico: data.modalidadeServico }
          : {}),
      }),
    },
  );

  const evento = normalizeCalendarioEvento(response);
  if (!evento) {
    throw new Error("Resposta de agendamento inválida.");
  }
  return evento;
}

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
