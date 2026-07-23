import { addDays } from "date-fns";
import { apiRequest } from "./api-client";
import { fetchCalendarioEventos } from "./calendario-service";
import { toDateInput } from "./dashboard-datetime";
import type {
  DashboardKpisApiResponse,
  DashboardKpisFilters,
  DashboardProximoAgendamento,
} from "./types";

function buildDashboardKpisEndpoint(filters?: DashboardKpisFilters | null): string {
  const params = new URLSearchParams();

  if (filters?.dataInicio && filters?.dataFim) {
    params.set("dataInicio", filters.dataInicio);
    params.set("dataFim", filters.dataFim);
  }

  if (filters?.unidadeId != null) {
    params.set("unidadeId", String(filters.unidadeId));
  }
  if (filters?.tecnicoId != null) {
    params.set("tecnicoId", String(filters.tecnicoId));
  }
  if (filters?.clienteId != null) {
    params.set("clienteId", String(filters.clienteId));
  }
  if (filters?.setorId != null) {
    params.set("setorId", String(filters.setorId));
  }

  const query = params.toString();
  return query ? `/dashboard/kpis?${query}` : "/dashboard/kpis";
}

export async function fetchDashboardKpis(
  filters?: DashboardKpisFilters | null,
): Promise<DashboardKpisApiResponse> {
  return apiRequest<DashboardKpisApiResponse>(
    buildDashboardKpisEndpoint(filters),
  );
}

export interface FetchProximosAgendamentosOptions {
  /** Filtra por técnico (obrigatório no dashboard do técnico). */
  tecnicoId?: number;
  /** Limite de itens após ordenação (default 8). */
  limit?: number;
}

export async function fetchProximosAgendamentos(
  options: FetchProximosAgendamentosOptions = {},
): Promise<DashboardProximoAgendamento[]> {
  const { tecnicoId, limit = 8 } = options;
  const today = new Date();
  const dataInicio = toDateInput(today);
  const dataFim = toDateInput(addDays(today, 30));

  const eventos = await fetchCalendarioEventos({
    dataInicio,
    dataFim,
    criadoPorId: tecnicoId,
  });

  return eventos
    .filter((evento) => evento.dataInicio >= dataInicio)
    .sort((a, b) => {
      const byStart = a.dataInicio.localeCompare(b.dataInicio);
      if (byStart !== 0) {
        return byStart;
      }
      return a.dataFim.localeCompare(b.dataFim);
    })
    .slice(0, limit)
    .map((evento) => ({
      id: evento.id,
      titulo: evento.title,
      clienteNome: evento.clienteNome ?? null,
      dataInicio: evento.dataInicio,
      dataFim: evento.dataFim,
      criadoPorNome: evento.criadoPorNome ?? null,
    }));
}
