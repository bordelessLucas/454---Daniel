import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useDashboardKpis } from "@/hooks/use-dashboard-kpis";
import { useProximosAgendamentos } from "@/hooks/use-proximos-agendamentos";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import {
  DashboardFilters,
  type DashboardFilterDraft,
} from "@/components/dashboard/dashboard-filters";
import { AdminDashboardKpis } from "@/components/dashboard/admin-dashboard-kpis";
import { TecnicoDashboardKpis } from "@/components/dashboard/tecnico-dashboard-kpis";
import { QuickActions } from "@/components/dashboard/quick-actions";
import {
  areDraftsEqual,
  draftFromSearchParams,
  filtersFromDraft,
  searchParamsFromDraft,
} from "@/lib/dashboard-filters-url";
import { isDashboardAdminKpis } from "@/lib/types";
import type { DashboardKpisFilters } from "@/lib/types";

function hasAppliedFiltersInUrl(searchParams: URLSearchParams): boolean {
  return (
    searchParams.has("dataInicio") ||
    searchParams.has("dataFim") ||
    searchParams.has("unidadeId") ||
    searchParams.has("tecnicoId") ||
    searchParams.has("clienteId") ||
    searchParams.has("setorId")
  );
}

export default function DashboardPage() {
  const { isAdmin, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [draft, setDraft] = useState<DashboardFilterDraft>(() =>
    draftFromSearchParams(searchParams),
  );
  const [appliedFilters, setAppliedFilters] = useState<DashboardKpisFilters | null>(
    () =>
      hasAppliedFiltersInUrl(searchParams)
        ? filtersFromDraft(draftFromSearchParams(searchParams), { isAdmin })
        : null,
  );

  const { data, isLoading, error } = useDashboardKpis(appliedFilters);
  const {
    items: proximosAgendamentos,
    isLoading: isLoadingAgendamentos,
  } = useProximosAgendamentos(!isAdmin);

  useEffect(() => {
    const fromUrl = draftFromSearchParams(searchParams);
    setDraft((current) => (areDraftsEqual(current, fromUrl) ? current : fromUrl));
  }, [searchParams]);

  const applyDraft = useCallback(
    (nextDraft: DashboardFilterDraft) => {
      const nextFilters = filtersFromDraft(nextDraft, { isAdmin });
      setAppliedFilters(nextFilters);
      setSearchParams(searchParamsFromDraft(nextDraft), { replace: true });
    },
    [isAdmin, setSearchParams],
  );

  function handleApplyFilters() {
    applyDraft(draft);
  }

  const showAdminKpis = data != null ? isDashboardAdminKpis(data) : isAdmin;

  const adminData = useMemo(
    () => (data && isDashboardAdminKpis(data) ? data : undefined),
    [data],
  );

  const tecnicoData = useMemo(
    () => (data && !isDashboardAdminKpis(data) ? data : undefined),
    [data],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={
          isAdmin
            ? "Visão geral dos indicadores do negócio."
            : "Resumo das suas visitas e agendamentos."
        }
      />

      {user ? <QuickActions role={user.role} /> : null}

      <DashboardFilters
        draft={draft}
        onDraftChange={setDraft}
        onApply={handleApplyFilters}
        isApplying={isLoading}
      />

      {error ? (
        <EmptyState
          icon={AlertCircle}
          title="Erro ao carregar indicadores"
          description={error}
        />
      ) : showAdminKpis ? (
        <AdminDashboardKpis data={adminData} isLoading={isLoading} />
      ) : (
        <TecnicoDashboardKpis
          data={tecnicoData}
          proximosAgendamentos={proximosAgendamentos}
          isLoading={isLoading}
          isLoadingAgendamentos={isLoadingAgendamentos}
        />
      )}
    </div>
  );
}
