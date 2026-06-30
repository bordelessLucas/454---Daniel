import { useEffect, useState } from "react";
import { fetchDashboardKpis } from "@/lib/dashboard-service";
import type { DashboardKpisFilters, DashboardKpisResponse } from "@/lib/types";

export function useDashboardKpis(filters: DashboardKpisFilters | null) {
  const [data, setData] = useState<DashboardKpisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filters?.dataInicio || !filters?.dataFim) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchDashboardKpis(filters!);
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
  }, [
    filters?.dataInicio,
    filters?.dataFim,
    filters?.unidadeId,
    filters?.tecnicoId,
    filters?.clienteId,
    filters?.setorId,
  ]);

  return { data, isLoading, error };
}
