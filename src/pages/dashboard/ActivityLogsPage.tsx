import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  dateInputEndToIso,
  dateInputStartToIso,
  isoToDateInput,
} from "@/lib/activity-log-datetime";
import {
  ACTIVITY_ACTION_OPTIONS,
  ACTIVITY_ENTITY_OPTIONS,
} from "@/lib/activity-log-labels";
import type { ActivityLogFilters } from "@/lib/types";
import { useActivityLogs } from "@/hooks/use-activity-logs";
import { useUsuarios } from "@/hooks/use-usuarios";
import { useAuth } from "@/lib/auth-context";
import { ActivityLogTable } from "@/components/activity-logs/activity-log-table";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Select,
  Switch,
} from "@/components/index";
import { RefreshCw, ScrollText } from "lucide-react";

const LIMIT_OPTIONS = [25, 50, 100] as const;
const AUTO_REFRESH_MS = 45_000;
const FILTER_DEBOUNCE_MS = 300;

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;

function parsePositiveInt(
  value: string | null,
  fallback: number,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.floor(parsed);
}

function parseUsuarioId(value: string | null): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function parseEnumValue<T extends string>(
  value: string | null,
  allowed: readonly T[],
): T | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  return allowed.includes(value as T) ? (value as T) : undefined;
}

function ActivityLogTableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

export default function ActivityLogsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { usuarios, loading: loadingUsuarios } = useUsuarios();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const [usuarioId, setUsuarioId] = useState<string>(
    () => searchParams.get("usuarioId") ?? "",
  );
  const [entidade, setEntidade] = useState<string>(
    () => searchParams.get("entidade") ?? "",
  );
  const [acao, setAcao] = useState<string>(() => searchParams.get("acao") ?? "");
  const [fromDate, setFromDate] = useState(() =>
    isoToDateInput(searchParams.get("from")),
  );
  const [toDate, setToDate] = useState(() =>
    isoToDateInput(searchParams.get("to")),
  );
  const [page, setPage] = useState(() =>
    parsePositiveInt(searchParams.get("page"), DEFAULT_PAGE),
  );
  const [limit, setLimit] = useState(() => {
    const parsed = parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT);
    return LIMIT_OPTIONS.includes(parsed as (typeof LIMIT_OPTIONS)[number])
      ? parsed
      : DEFAULT_LIMIT;
  });
  const [autoRefresh, setAutoRefresh] = useState(
    () => searchParams.get("autoRefresh") === "1",
  );

  const [debouncedFilters, setDebouncedFilters] = useState<ActivityLogFilters>(
    () => ({
      usuarioId: parseUsuarioId(searchParams.get("usuarioId")),
      entidade: parseEnumValue(
        searchParams.get("entidade"),
        ACTIVITY_ENTITY_OPTIONS.map((item) => item.value),
      ),
      acao: parseEnumValue(
        searchParams.get("acao"),
        ACTIVITY_ACTION_OPTIONS.map((item) => item.value),
      ),
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      page: parsePositiveInt(searchParams.get("page"), DEFAULT_PAGE),
      limit: parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT),
    }),
  );

  const syncUrl = useCallback(
    (next: {
      usuarioId: string;
      entidade: string;
      acao: string;
      fromDate: string;
      toDate: string;
      page: number;
      limit: number;
      autoRefresh: boolean;
    }) => {
      const params = new URLSearchParams();
      if (next.usuarioId) {
        params.set("usuarioId", next.usuarioId);
      }
      if (next.entidade) {
        params.set("entidade", next.entidade);
      }
      if (next.acao) {
        params.set("acao", next.acao);
      }
      if (next.fromDate) {
        params.set("from", dateInputStartToIso(next.fromDate));
      }
      if (next.toDate) {
        params.set("to", dateInputEndToIso(next.toDate));
      }
      if (next.page > DEFAULT_PAGE) {
        params.set("page", String(next.page));
      }
      if (next.limit !== DEFAULT_LIMIT) {
        params.set("limit", String(next.limit));
      }
      if (next.autoRefresh) {
        params.set("autoRefresh", "1");
      }
      setSearchParams(params, { replace: true });
    },
    [setSearchParams],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextFilters: ActivityLogFilters = {
        usuarioId: parseUsuarioId(usuarioId || null),
        entidade: parseEnumValue(
          entidade || null,
          ACTIVITY_ENTITY_OPTIONS.map((item) => item.value),
        ),
        acao: parseEnumValue(
          acao || null,
          ACTIVITY_ACTION_OPTIONS.map((item) => item.value),
        ),
        from: fromDate ? dateInputStartToIso(fromDate) : undefined,
        to: toDate ? dateInputEndToIso(toDate) : undefined,
        page,
        limit,
      };
      setDebouncedFilters(nextFilters);
      syncUrl({
        usuarioId,
        entidade,
        acao,
        fromDate,
        toDate,
        page,
        limit,
        autoRefresh,
      });
    }, FILTER_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [
    usuarioId,
    entidade,
    acao,
    fromDate,
    toDate,
    page,
    limit,
    autoRefresh,
    syncUrl,
  ]);

  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    const interval = window.setInterval(() => {
      setRefetchTrigger((value) => value + 1);
    }, AUTO_REFRESH_MS);

    return () => window.clearInterval(interval);
  }, [autoRefresh]);

  const { data, loading, error, reload } = useActivityLogs(
    debouncedFilters,
    refetchTrigger,
  );

  const pagination = data?.pagination;
  const logs = data?.data ?? [];

  const rangeLabel = useMemo(() => {
    if (!pagination || pagination.total === 0) {
      return "Nenhum registro";
    }
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.page * pagination.limit, pagination.total);
    return `Mostrando ${start}–${end} de ${pagination.total} registros`;
  }, [pagination]);

  function handleClearFilters() {
    setUsuarioId("");
    setEntidade("");
    setAcao("");
    setFromDate("");
    setToDate("");
    setPage(DEFAULT_PAGE);
    setLimit(DEFAULT_LIMIT);
  }

  function handleFilterFieldChange<T>(setter: (value: T) => void, value: T) {
    setter(value);
    setPage(DEFAULT_PAGE);
  }

  const isAdmin = user?.role === "ADMIN";

  if (!isAdmin) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <EmptyState
          icon={ScrollText}
          title="Acesso negado"
          description="Você não tem permissão para acessar esta página."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Logs de Atividade"
        description="Histórico de ações realizadas pelos usuários"
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setRefetchTrigger((value) => value + 1);
              void reload();
            }}
            disabled={loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
        }
      />

      <Card className="mb-6">
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="filter-usuario">Usuário</Label>
            <Select
              id="filter-usuario"
              value={usuarioId}
              onChange={(e) =>
                handleFilterFieldChange(setUsuarioId, e.target.value)
              }
              disabled={loadingUsuarios}
            >
              <option value="">Todos</option>
              {usuarios.map((usuario) => (
                <option key={usuario.id} value={String(usuario.id)}>
                  {usuario.nome} (@{usuario.username})
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="filter-entidade">Entidade</Label>
            <Select
              id="filter-entidade"
              value={entidade}
              onChange={(e) =>
                handleFilterFieldChange(setEntidade, e.target.value)
              }
            >
              <option value="">Todas</option>
              {ACTIVITY_ENTITY_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="filter-acao">Ação</Label>
            <Select
              id="filter-acao"
              value={acao}
              onChange={(e) => handleFilterFieldChange(setAcao, e.target.value)}
            >
              <option value="">Todas</option>
              {ACTIVITY_ACTION_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="filter-limit">Itens por página</Label>
            <Select
              id="filter-limit"
              value={String(limit)}
              onChange={(e) => {
                const nextLimit = Number(e.target.value);
                setLimit(nextLimit);
                setPage(DEFAULT_PAGE);
              }}
            >
              {LIMIT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="filter-from">De</Label>
            <Input
              id="filter-from"
              type="date"
              value={fromDate}
              onChange={(e) =>
                handleFilterFieldChange(setFromDate, e.target.value)
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="filter-to">Até</Label>
            <Input
              id="filter-to"
              type="date"
              value={toDate}
              onChange={(e) => handleFilterFieldChange(setToDate, e.target.value)}
            />
          </div>

          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
            <Button
              type="button"
              variant="outline"
              onClick={handleClearFilters}
            >
              Limpar filtros
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 sm:col-span-2 lg:col-span-3">
            <div>
              <Label htmlFor="auto-refresh" className="text-sm font-medium">
                Atualização automática
              </Label>
              <p className="text-xs text-muted-foreground">
                Recarrega a cada {AUTO_REFRESH_MS / 1000}s
              </p>
            </div>
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={(checked) => setAutoRefresh(checked)}
            />
          </div>
        </CardContent>
      </Card>

      {loading ? <ActivityLogTableSkeleton /> : null}

      {!loading && error ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setRefetchTrigger((value) => value + 1);
              void reload();
            }}
          >
            Tentar novamente
          </Button>
        </div>
      ) : null}

      {!loading && !error && logs.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="Nenhuma atividade encontrada"
          description="Nenhuma atividade encontrada para os filtros selecionados."
        />
      ) : null}

      {!loading && !error && logs.length > 0 ? (
        <>
          <ActivityLogTable logs={logs} />

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">{rangeLabel}</p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!pagination || pagination.page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {pagination?.page ?? 1} de {pagination?.totalPages ?? 1}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={
                  !pagination || pagination.page >= pagination.totalPages
                }
                onClick={() =>
                  setPage((current) =>
                    pagination
                      ? Math.min(pagination.totalPages, current + 1)
                      : current + 1,
                  )
                }
              >
                Próxima
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
