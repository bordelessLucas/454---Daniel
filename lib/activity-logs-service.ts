import { apiRequest } from "@/lib/api-client";
import type { ActivityLogFilters, ActivityLogsResponse } from "@/lib/types";

function buildActivityLogsQuery(filters: ActivityLogFilters): string {
  const params = new URLSearchParams();

  if (filters.usuarioId != null) {
    params.set("usuarioId", String(filters.usuarioId));
  }
  if (filters.entidade) {
    params.set("entidade", filters.entidade);
  }
  if (filters.acao) {
    params.set("acao", filters.acao);
  }
  if (filters.from) {
    params.set("from", filters.from);
  }
  if (filters.to) {
    params.set("to", filters.to);
  }
  if (filters.page != null) {
    params.set("page", String(filters.page));
  }
  if (filters.limit != null) {
    params.set("limit", String(filters.limit));
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function fetchActivityLogs(
  filters: ActivityLogFilters,
): Promise<ActivityLogsResponse> {
  return apiRequest<ActivityLogsResponse>(
    `/admin/activity-logs${buildActivityLogsQuery(filters)}`,
    { method: "GET" },
  );
}
