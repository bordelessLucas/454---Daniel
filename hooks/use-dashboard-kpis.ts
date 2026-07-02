import { useEffect, useMemo, useState } from "react";
import { fetchDashboardKpis } from "@/lib/dashboard-service";
import type { DashboardKpisApiResponse, DashboardKpisFilters } from "@/lib/types";

function filtersKey(filters: DashboardKpisFilters | null): string {
  if (!filters) {
    return "__default__";
  }
  return JSON.stringify(filters);
}

export function useDashboardKpis(filters: DashboardKpisFilters | null) {
  const [data, setData] = useState<DashboardKpisApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const serializedFilters = useMemo(() => filtersKey(filters), [filters]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchDashboardKpis(filters);
        if (!cancelled) {
          setData(response);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Erro ao carregar KPIs.";
          setError(message);
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [serializedFilters, filters]);

  return { data, isLoading, error };
}
