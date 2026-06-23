import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";
import { BarChart3, Download, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { useRelatoriosGerenciais } from "@/hooks/use-relatorios-gerenciais";
import type { GerencialFormato, GerencialTipo } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { GerencialTable } from "@/components/relatorios/GerencialTable";
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

const GERENCIAL_TIPOS = [
  { value: "resumo-cliente", label: "Resumo por Cliente" },
  { value: "produtividade-tecnico", label: "Produtividade por Técnico" },
  { value: "sla-contratos", label: "SLA de Contratos" },
] as const satisfies ReadonlyArray<{ value: GerencialTipo; label: string }>;

const GERENCIAL_FORMATOS = [
  { value: "json", label: "Visualizar" },
  { value: "xlsx", label: "Exportar Excel" },
] as const satisfies ReadonlyArray<{ value: GerencialFormato; label: string }>;

function currentMonthPeriodo(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function parseTipo(value: string | null): GerencialTipo {
  const match = GERENCIAL_TIPOS.find((item) => item.value === value);
  return match?.value ?? "resumo-cliente";
}

function parseFormato(value: string | null): GerencialFormato {
  return value === "xlsx" ? "xlsx" : "json";
}

const gerencialFiltersSchema = z.object({
  tipo: z.enum([
    "resumo-cliente",
    "produtividade-tecnico",
    "sla-contratos",
  ]),
  periodo: z
    .string()
    .min(1, "Informe o período.")
    .regex(/^\d{4}-\d{2}$/, "Período inválido. Use o formato AAAA-MM."),
  formato: z.enum(["json", "xlsx"]),
});

type GerencialFilters = z.infer<typeof gerencialFiltersSchema>;

function buildFiltersKey(filters: GerencialFilters): string {
  return `${filters.tipo}|${filters.periodo}|${filters.formato}`;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, loading, exporting, fetchGerencial, exportGerencial, reset } =
    useRelatoriosGerenciais();

  const [tipo, setTipo] = useState<GerencialTipo>(() =>
    parseTipo(searchParams.get("tipo")),
  );
  const [periodo, setPeriodo] = useState(
    () => searchParams.get("periodo") ?? currentMonthPeriodo(),
  );
  const [formato, setFormato] = useState<GerencialFormato>(() =>
    parseFormato(searchParams.get("formato")),
  );
  const [submittedKey, setSubmittedKey] = useState<string | null>(null);

  const filters = useMemo<GerencialFilters>(
    () => ({ tipo, periodo, formato }),
    [tipo, periodo, formato],
  );
  const currentKey = buildFiltersKey(filters);

  const syncUrl = useCallback(
    (next: GerencialFilters) => {
      const params = new URLSearchParams();
      params.set("tipo", next.tipo);
      params.set("periodo", next.periodo);
      params.set("formato", next.formato);
      setSearchParams(params, { replace: true });
    },
    [setSearchParams],
  );

  const validateFilters = useCallback((): GerencialFilters | null => {
    const result = gerencialFiltersSchema.safeParse(filters);
    if (!result.success) {
      const firstError = result.error.errors[0]?.message ?? "Filtros inválidos.";
      toast.error(firstError);
      return null;
    }
    return result.data;
  }, [filters]);

  const urlJsonFetchKey = useMemo(() => {
    const urlFormato = parseFormato(searchParams.get("formato"));
    if (urlFormato !== "json") {
      return null;
    }

    const result = gerencialFiltersSchema.safeParse({
      tipo: parseTipo(searchParams.get("tipo")),
      periodo: searchParams.get("periodo") ?? "",
      formato: "json",
    });

    if (!result.success) {
      return null;
    }

    return buildFiltersKey(result.data);
  }, [searchParams]);

  useEffect(() => {
    const urlTipo = parseTipo(searchParams.get("tipo"));
    const urlPeriodo = searchParams.get("periodo") ?? currentMonthPeriodo();
    const urlFormato = parseFormato(searchParams.get("formato"));

    setTipo(urlTipo);
    setPeriodo(urlPeriodo);
    setFormato(urlFormato);
  }, [searchParams]);

  useEffect(() => {
    if (!urlJsonFetchKey) {
      return;
    }

    setSubmittedKey(urlJsonFetchKey);

    const [t, p] = urlJsonFetchKey.split("|") as [GerencialTipo, string, string];
    void fetchGerencial({ tipo: t, periodo: p, formato: "json" })
      .then(() => {
        toast.success("Relatório gerado com sucesso.");
      })
      .catch(() => {
        toast.error("Erro ao gerar relatório gerencial.");
      });
  }, [urlJsonFetchKey, fetchGerencial]);

  useEffect(() => {
    if (submittedKey && submittedKey !== currentKey) {
      reset();
      setSubmittedKey(null);
    }
  }, [currentKey, submittedKey, reset]);

  function handleGerar() {
    const validated = validateFilters();
    if (!validated || validated.formato !== "json") {
      if (validated?.formato === "xlsx") {
        toast.error('Selecione "Visualizar" para gerar a tabela.');
      }
      return;
    }
    syncUrl(validated);
  }

  async function handleExportar() {
    const validated = validateFilters();
    if (!validated || validated.formato !== "xlsx") {
      return;
    }

    syncUrl(validated);

    try {
      await exportGerencial(validated);
      toast.success("Excel exportado com sucesso.");
    } catch {
      toast.error("Erro ao exportar relatório para Excel.");
    }
  }

  const isBusy = loading || exporting;
  const isSubmittedJson =
    formato === "json" && submittedKey === currentKey && submittedKey !== null;
  const showTable = isSubmittedJson;
  const showEmpty = showTable && !loading && (!data || data.length === 0);

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
                  setTipo(parseTipo(event.target.value))
                }
              >
                {GERENCIAL_TIPOS.map((item) => (
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
                onChange={(event) => setPeriodo(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gerencial-formato">Formato</Label>
              <Select
                id="gerencial-formato"
                value={formato}
                disabled={isBusy}
                onChange={(event) =>
                  setFormato(parseFormato(event.target.value))
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
          </div>
        </CardContent>
      </Card>

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
            <GerencialTable tipo={tipo} data={data} />
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
