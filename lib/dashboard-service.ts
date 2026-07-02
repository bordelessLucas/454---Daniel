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

export async function fetchProximosAgendamentos(): Promise<
  DashboardProximoAgendamento[]
> {
  const today = new Date();
  const dataInicio = toDateInput(today);
  const dataFim = toDateInput(addDays(today, 30));
  const now = Date.now();

  const eventos = await fetchCalendarioEventos({ dataInicio, dataFim });

  return eventos
    .filter(
      (evento) =>
        evento.status === "AGENDADO" &&
        new Date(evento.start).getTime() >= now,
    )
    .sort(
      (a, b) =>
        new Date(a.start).getTime() - new Date(b.start).getTime(),
    )
    .map((evento) => ({
      relatorioId: evento.id,
      clienteNome: evento.cliente.nomeFantasia,
      dataVisita: evento.start,
    }));
}
