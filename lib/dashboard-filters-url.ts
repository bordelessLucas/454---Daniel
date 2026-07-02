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

export function filtersFromDraft(
  draft: DashboardFilterDraft,
  options?: { isAdmin?: boolean },
): DashboardKpisFilters {
  const filters: DashboardKpisFilters = {};

  if (draft.dataInicio && draft.dataFim) {
    filters.dataInicio = draft.dataInicio;
    filters.dataFim = draft.dataFim;
  }

  if (options?.isAdmin) {
    const unidadeId = parseOptionalId(draft.unidadeId || null);
    const tecnicoId = parseOptionalId(draft.tecnicoId || null);
    const clienteId = parseOptionalId(draft.clienteId || null);

    if (unidadeId != null) {
      filters.unidadeId = unidadeId;
    }
    if (tecnicoId != null) {
      filters.tecnicoId = tecnicoId;
    }
    if (clienteId != null) {
      filters.clienteId = clienteId;
    }
  }

  const setorId = parseOptionalId(draft.setorId || null);
  if (setorId != null) {
    filters.setorId = setorId;
  }

  return filters;
}

export function filtersFromSearchParams(
  searchParams: URLSearchParams,
  options?: { isAdmin?: boolean },
): DashboardKpisFilters {
  return filtersFromDraft(draftFromSearchParams(searchParams), options);
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
