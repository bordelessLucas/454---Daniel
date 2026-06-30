import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useDashboardKpis } from "@/hooks/use-dashboard-kpis";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import {
  DashboardFilters,
  type DashboardFilterDraft,
} from "@/components/dashboard/dashboard-filters";
import { AdminDashboardKpis } from "@/components/dashboard/admin-dashboard-kpis";
import { TecnicoDashboardKpis } from "@/components/dashboard/tecnico-dashboard-kpis";
import {
  areDraftsEqual,
  draftFromSearchParams,
  filtersFromSearchParams,
  searchParamsFromDraft,
} from "@/lib/dashboard-filters-url";
import { getDefaultDashboardDateRange } from "@/lib/dashboard-datetime";

const FILTER_DEBOUNCE_MS = 400;

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [draft, setDraft] = useState<DashboardFilterDraft>(() =>
    draftFromSearchParams(searchParams),
  );

  const appliedFilters = useMemo(
    () => filtersFromSearchParams(searchParams),
    [searchParams],
  );

  const { data, isLoading, error } = useDashboardKpis(appliedFilters);

  useEffect(() => {
    const fromUrl = draftFromSearchParams(searchParams);
    setDraft((current) => (areDraftsEqual(current, fromUrl) ? current : fromUrl));
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("dataInicio") && searchParams.get("dataFim")) {
      return;
    }

    const defaults = getDefaultDashboardDateRange();
    const params = searchParamsFromDraft({
      ...draftFromSearchParams(searchParams),
      dataInicio: defaults.dataInicio,
      dataFim: defaults.dataFim,
    });
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const applyDraft = useCallback(
    (nextDraft: DashboardFilterDraft) => {
      setSearchParams(searchParamsFromDraft(nextDraft), { replace: true });
    },
    [setSearchParams],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const fromUrl = draftFromSearchParams(searchParams);
      if (!areDraftsEqual(draft, fromUrl)) {
        applyDraft(draft);
      }
    }, FILTER_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [draft, searchParams, applyDraft]);

  function handleApplyFilters() {
    applyDraft(draft);
  }

  const showAdminKpis = isAdmin && (data?.role === "ADMIN" || !data);
  const adminData = data?.admin;
  const tecnicoData = data?.tecnico;

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
        <TecnicoDashboardKpis data={tecnicoData} isLoading={isLoading} />
      )}

      {!isLoading && !error && data && user && data.role !== user.role ? (
        <p className="text-sm text-muted-foreground">
          Exibindo indicadores para o perfil {data.role}.
        </p>
      ) : null}
    </div>
  );
}
