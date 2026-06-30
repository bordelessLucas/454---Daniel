import type { DashboardFilterDraft } from "@/components/dashboard/dashboard-filters";
import type { DashboardKpisFilters } from "@/lib/types";
import { getDefaultDashboardDateRange } from "@/lib/dashboard-datetime";

function parseOptionalId(value: string | null): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function draftFromSearchParams(
  searchParams: URLSearchParams,
): DashboardFilterDraft {
  const defaults = getDefaultDashboardDateRange();
  return {
    dataInicio: searchParams.get("dataInicio") ?? defaults.dataInicio,
    dataFim: searchParams.get("dataFim") ?? defaults.dataFim,
    unidadeId: searchParams.get("unidadeId") ?? "",
    tecnicoId: searchParams.get("tecnicoId") ?? "",
    clienteId: searchParams.get("clienteId") ?? "",
    setorId: searchParams.get("setorId") ?? "",
  };
}

export function filtersFromSearchParams(
  searchParams: URLSearchParams,
): DashboardKpisFilters {
  const draft = draftFromSearchParams(searchParams);
  return {
    dataInicio: draft.dataInicio,
    dataFim: draft.dataFim,
    unidadeId: parseOptionalId(draft.unidadeId || null),
    tecnicoId: parseOptionalId(draft.tecnicoId || null),
    clienteId: parseOptionalId(draft.clienteId || null),
    setorId: parseOptionalId(draft.setorId || null),
  };
}

export function searchParamsFromDraft(
  draft: DashboardFilterDraft,
): URLSearchParams {
  const params = new URLSearchParams();
  params.set("dataInicio", draft.dataInicio);
  params.set("dataFim", draft.dataFim);
  if (draft.unidadeId) {
    params.set("unidadeId", draft.unidadeId);
  }
  if (draft.tecnicoId) {
    params.set("tecnicoId", draft.tecnicoId);
  }
  if (draft.clienteId) {
    params.set("clienteId", draft.clienteId);
  }
  if (draft.setorId) {
    params.set("setorId", draft.setorId);
  }
  return params;
}

export function areDraftsEqual(
  a: DashboardFilterDraft,
  b: DashboardFilterDraft,
): boolean {
  return (
    a.dataInicio === b.dataInicio &&
    a.dataFim === b.dataFim &&
    a.unidadeId === b.unidadeId &&
    a.tecnicoId === b.tecnicoId &&
    a.clienteId === b.clienteId &&
    a.setorId === b.setorId
  );
}
