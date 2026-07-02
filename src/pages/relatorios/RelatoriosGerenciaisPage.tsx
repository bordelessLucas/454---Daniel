import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";
import { AlertCircle, BarChart3, Download, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { useRelatoriosGerenciais } from "@/hooks/use-relatorios-gerenciais";
import { useClientes } from "@/hooks/use-clientes";
import { useTecnicos } from "@/hooks/use-tecnicos";
import { useUnidades } from "@/hooks/use-unidades";
import { useAuth } from "@/lib/auth-context";
import {
  canUseGerencialUnidadeFilter,
  getGerencialTiposForRole,
  GERENCIAL_FORMATOS,
  isGerencialTipoAllowedForRole,
  parseGerencialFormato,
  parseGerencialTipo,
} from "@/lib/gerencial-constants";
import {
  currentMonthPeriodo,
  isValidPeriodo,
  normalizePeriodoInput,
  toPeriodoYYYYMM,
} from "@/lib/gerencial-periodo";
import type { GerencialFormato, GerencialTipo } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { GerencialTable } from "@/components/relatorios/GerencialTable";
import { SelectionField } from "@/components/selection-field";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
} from "@/components/index";

const gerencialFiltersSchema = z.object({
  tipo: z.enum([
    "resumo-cliente",
    "produtividade-tecnico",
    "sla-contratos",
  ]),
  periodo: z
    .string()
    .min(1, "Informe o período.")
    .refine(isValidPeriodo, "Período inválido. Use o formato AAAA-MM."),
  formato: z.enum(["json", "xlsx"]),
  clienteId: z.number().int().positive().optional(),
  tecnicoId: z.number().int().positive().optional(),
  unidadeId: z.number().int().positive().optional(),
});

type GerencialFilters = z.infer<typeof gerencialFiltersSchema>;

function buildFiltersKey(filters: GerencialFilters): string {
  return [
    filters.tipo,
    filters.periodo,
    filters.formato,
    filters.clienteId ?? "",
    filters.tecnicoId ?? "",
    filters.unidadeId ?? "",
  ].join("|");
}

function parseOptionalId(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function GerencialTableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

export default function RelatoriosGerenciaisPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    data,
    responseTipo,
    loading,
    exporting,
    error,
    fetchGerencial,
    exportGerencial,
    reset,
  } = useRelatoriosGerenciais();

  const availableTipos = useMemo(
    () => getGerencialTiposForRole(user?.role),
    [user?.role],
  );
  const showUnidadeFilter = canUseGerencialUnidadeFilter(user?.role);

  const { clientes, loading: loadingClientes } = useClientes();
  const { tecnicos, loading: loadingTecnicos } = useTecnicos();
  const { unidades, loading: loadingUnidades } = useUnidades();

  const [tipo, setTipo] = useState<GerencialTipo>(() => {
    const parsed = parseGerencialTipo(searchParams.get("tipo"));
    return isGerencialTipoAllowedForRole(parsed, user?.role)
      ? parsed
      : "resumo-cliente";
  });
  const [periodo, setPeriodo] = useState(() => {
    const fromUrl = searchParams.get("periodo");
    return fromUrl ? normalizePeriodoInput(fromUrl) : currentMonthPeriodo();
  });
  const [formato, setFormato] = useState<GerencialFormato>(() =>
    parseGerencialFormato(searchParams.get("formato")),
  );
  const [clienteId, setClienteId] = useState(
    () => searchParams.get("clienteId") ?? "",
  );
  const [tecnicoId, setTecnicoId] = useState(
    () => searchParams.get("tecnicoId") ?? "",
  );
  const [unidadeId, setUnidadeId] = useState(
    () => (showUnidadeFilter ? searchParams.get("unidadeId") ?? "" : ""),
  );
  const [submittedKey, setSubmittedKey] = useState<string | null>(null);

  const filters = useMemo<GerencialFilters>(
    () => ({
      tipo,
      periodo: normalizePeriodoInput(periodo),
      formato,
      clienteId: parseOptionalId(clienteId),
      tecnicoId: parseOptionalId(tecnicoId),
      unidadeId: showUnidadeFilter ? parseOptionalId(unidadeId) : undefined,
    }),
    [
      tipo,
      periodo,
      formato,
      clienteId,
      tecnicoId,
      unidadeId,
      showUnidadeFilter,
    ],
  );
  const currentKey = buildFiltersKey(filters);

  const clienteOptions = useMemo(
    () => [
      { value: "", label: "Todos os clientes" },
      ...clientes.map((cliente) => ({
        value: String(cliente.id),
        label: cliente.nomeFantasia,
        searchText: [cliente.nomeFantasia, cliente.razaoSocial, cliente.cnpj]
          .filter(Boolean)
          .join(" "),
      })),
    ],
    [clientes],
  );

  const tecnicoOptions = useMemo(
    () => [
      { value: "", label: "Todos os técnicos" },
      ...tecnicos.map((tecnico) => ({
        value: String(tecnico.id),
        label: tecnico.nome,
        searchText: [tecnico.nome, tecnico.username, tecnico.email]
          .filter(Boolean)
          .join(" "),
      })),
    ],
    [tecnicos],
  );

  const unidadeOptions = useMemo(
    () => [
      { value: "", label: "Todas as unidades" },
      ...unidades.map((unidade) => ({
        value: String(unidade.id),
        label: unidade.nome,
      })),
    ],
    [unidades],
  );

  const syncUrl = useCallback(
    (next: GerencialFilters) => {
      const params = new URLSearchParams();
      params.set("tipo", next.tipo);
      params.set("periodo", next.periodo);
      params.set("formato", next.formato);
      if (next.clienteId != null) {
        params.set("clienteId", String(next.clienteId));
      }
      if (next.tecnicoId != null) {
        params.set("tecnicoId", String(next.tecnicoId));
      }
      if (next.unidadeId != null) {
        params.set("unidadeId", String(next.unidadeId));
      }
      setSearchParams(params, { replace: true });
    },
    [setSearchParams],
  );

  const validateFilters = useCallback((): GerencialFilters | null => {
    if (!isGerencialTipoAllowedForRole(tipo, user?.role)) {
      toast.error("Você não tem permissão para este tipo de relatório.");
      return null;
    }

    const result = gerencialFiltersSchema.safeParse(filters);
    if (!result.success) {
      const firstError = result.error.errors[0]?.message ?? "Filtros inválidos.";
      toast.error(firstError);
      return null;
    }

    if (!showUnidadeFilter && result.data.unidadeId != null) {
      toast.error("Você não tem permissão para filtrar por unidade.");
      return null;
    }

    return result.data;
  }, [filters, showUnidadeFilter, tipo, user?.role]);

  const urlJsonFetchKey = useMemo(() => {
    const urlFormato = parseGerencialFormato(searchParams.get("formato"));
    if (urlFormato !== "json") {
      return null;
    }

    const urlTipo = parseGerencialTipo(searchParams.get("tipo"));
    if (!isGerencialTipoAllowedForRole(urlTipo, user?.role)) {
      return null;
    }

    const result = gerencialFiltersSchema.safeParse({
      tipo: urlTipo,
      periodo: normalizePeriodoInput(searchParams.get("periodo") ?? ""),
      formato: "json",
      clienteId: parseOptionalId(searchParams.get("clienteId")),
      tecnicoId: parseOptionalId(searchParams.get("tecnicoId")),
      unidadeId: showUnidadeFilter
        ? parseOptionalId(searchParams.get("unidadeId"))
        : undefined,
    });

    if (!result.success) {
      return null;
    }

    return buildFiltersKey(result.data);
  }, [searchParams, showUnidadeFilter, user?.role]);

  useEffect(() => {
    const urlTipo = parseGerencialTipo(searchParams.get("tipo"));
    const safeTipo = isGerencialTipoAllowedForRole(urlTipo, user?.role)
      ? urlTipo
      : "resumo-cliente";
    const urlPeriodo = searchParams.get("periodo");
    const urlFormato = parseGerencialFormato(searchParams.get("formato"));

    setTipo(safeTipo);
    setPeriodo(
      urlPeriodo ? normalizePeriodoInput(urlPeriodo) : currentMonthPeriodo(),
    );
    setFormato(urlFormato);
    setClienteId(searchParams.get("clienteId") ?? "");
    setTecnicoId(searchParams.get("tecnicoId") ?? "");
    setUnidadeId(
      showUnidadeFilter ? searchParams.get("unidadeId") ?? "" : "",
    );
  }, [searchParams, showUnidadeFilter, user?.role]);

  useEffect(() => {
    if (!availableTipos.some((item) => item.value === tipo)) {
      setTipo("resumo-cliente");
    }
  }, [availableTipos, tipo]);

  useEffect(() => {
    if (!urlJsonFetchKey) {
      return;
    }

    setSubmittedKey(urlJsonFetchKey);

    const [t, p, , c, tech, uni] = urlJsonFetchKey.split("|");
    void fetchGerencial({
      tipo: t as GerencialTipo,
      periodo: p,
      clienteId: c ? Number(c) : undefined,
      tecnicoId: tech ? Number(tech) : undefined,
      unidadeId: uni ? Number(uni) : undefined,
    }).catch(() => undefined);
  }, [urlJsonFetchKey, fetchGerencial]);

  useEffect(() => {
    if (submittedKey && submittedKey !== currentKey) {
      reset();
      setSubmittedKey(null);
    }
  }, [currentKey, submittedKey, reset]);

  function handlePeriodoChange(value: string) {
    setPeriodo(normalizePeriodoInput(value));
  }

  function handleGerar() {
    const validated = validateFilters();
    if (!validated || validated.formato !== "json") {
      if (validated?.formato === "xlsx") {
        toast.error('Selecione "Visualizar" para gerar a tabela.');
      }
      return;
    }

    const periodoNormalizado = toPeriodoYYYYMM(
      new Date(`${validated.periodo}-01T12:00:00`),
    );
    const next = { ...validated, periodo: periodoNormalizado };
    syncUrl(next);
  }

  async function handleExportar() {
    const validated = validateFilters();
    if (!validated || validated.formato !== "xlsx") {
      return;
    }

    const periodoNormalizado = toPeriodoYYYYMM(
      new Date(`${validated.periodo}-01T12:00:00`),
    );
    const next = { ...validated, periodo: periodoNormalizado };
    syncUrl(next);

    try {
      await exportGerencial(next);
      toast.success("Excel exportado com sucesso.");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro ao exportar relatório para Excel.";
      toast.error(message);
    }
  }

  const isBusy = loading || exporting;
  const isSubmittedJson =
    formato === "json" && submittedKey === currentKey && submittedKey !== null;
  const showTable = isSubmittedJson;
  const showEmpty = showTable && !loading && !error && (!data || data.length === 0);
  const tableTipo = responseTipo ?? tipo;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios Gerenciais"
        description="Análises consolidadas por cliente, técnico e cumprimento de SLA de contratos."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="gerencial-tipo">Tipo</Label>
              <Select
                id="gerencial-tipo"
                value={tipo}
                disabled={isBusy}
                onChange={(event) =>
                  setTipo(parseGerencialTipo(event.target.value))
                }
              >
                {availableTipos.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gerencial-periodo">Período</Label>
              <Input
                id="gerencial-periodo"
                type="month"
                value={periodo}
                disabled={isBusy}
                onChange={(event) => handlePeriodoChange(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gerencial-formato">Formato</Label>
              <Select
                id="gerencial-formato"
                value={formato}
                disabled={isBusy}
                onChange={(event) =>
                  setFormato(parseGerencialFormato(event.target.value))
                }
              >
                {GERENCIAL_FORMATOS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex items-end gap-2">
              {formato === "json" ? (
                <Button
                  type="button"
                  className="w-full"
                  disabled={isBusy}
                  onClick={handleGerar}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  Gerar
                </Button>
              ) : (
                <Button
                  type="button"
                  className="w-full"
                  disabled={isBusy}
                  onClick={() => void handleExportar()}
                >
                  {exporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Exportar
                </Button>
              )}
            </div>

            <SelectionField
              label="Cliente"
              placeholder="Todos os clientes"
              value={clienteId}
              onChange={(value) =>
                setClienteId(typeof value === "string" ? value : "")
              }
              options={clienteOptions}
              disabled={isBusy || loadingClientes}
              searchable
            />

            <SelectionField
              label="Técnico"
              placeholder="Todos os técnicos"
              value={tecnicoId}
              onChange={(value) =>
                setTecnicoId(typeof value === "string" ? value : "")
              }
              options={tecnicoOptions}
              disabled={isBusy || loadingTecnicos}
              searchable
            />

            {showUnidadeFilter ? (
              <SelectionField
                label="Unidade"
                placeholder="Todas as unidades"
                value={unidadeId}
                onChange={(value) =>
                  setUnidadeId(typeof value === "string" ? value : "")
                }
                options={unidadeOptions}
                disabled={isBusy || loadingUnidades}
                searchable
              />
            ) : null}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {showTable && loading && (
        <Card>
          <CardContent className="pt-6">
            <GerencialTableSkeleton />
          </CardContent>
        </Card>
      )}

      {showTable && !loading && data && data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resultado</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <GerencialTable tipo={tableTipo} data={data} />
          </CardContent>
        </Card>
      )}

      {showEmpty && (
        <EmptyState
          icon={BarChart3}
          title="Nenhum dado encontrado"
          description="Não há registros para o período e tipo selecionados."
        />
      )}
    </div>
  );
}
