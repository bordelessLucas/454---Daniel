import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchActivityLogs } from "@/lib/activity-logs-service";
import type { ActivityLogFilters, ActivityLogsResponse } from "@/lib/types";

function buildFiltersKey(filters: ActivityLogFilters): string {
  return JSON.stringify(filters);
}

export function useActivityLogs(
  filters: ActivityLogFilters,
  refetchTrigger = 0,
) {
  const [data, setData] = useState<ActivityLogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filtersKey = useMemo(() => buildFiltersKey(filters), [filters]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchActivityLogs(filters);
      setData(response);
    } catch (err) {
      setData(null);
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao buscar logs de atividade",
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load, filtersKey, refetchTrigger]);

  return { data, loading, error, reload: load };
}
