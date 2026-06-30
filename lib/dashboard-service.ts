import { apiRequest } from "./api-client";
import type { DashboardKpisFilters, DashboardKpisResponse } from "./types";

function buildDashboardKpisEndpoint(filters: DashboardKpisFilters): string {
  const params = new URLSearchParams({
    dataInicio: filters.dataInicio,
    dataFim: filters.dataFim,
  });

  if (filters.unidadeId != null) {
    params.set("unidadeId", String(filters.unidadeId));
  }
  if (filters.tecnicoId != null) {
    params.set("tecnicoId", String(filters.tecnicoId));
  }
  if (filters.clienteId != null) {
    params.set("clienteId", String(filters.clienteId));
  }
  if (filters.setorId != null) {
    params.set("setorId", String(filters.setorId));
  }

  return `/dashboard/kpis?${params.toString()}`;
}

export async function fetchDashboardKpis(
  filters: DashboardKpisFilters,
): Promise<DashboardKpisResponse> {
  return apiRequest<DashboardKpisResponse>(buildDashboardKpisEndpoint(filters));
}
