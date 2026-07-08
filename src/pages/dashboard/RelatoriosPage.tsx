import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useRelatorios } from "@/hooks/use-relatorios";
import { formatDataVisitaBr } from "@/lib/relatorio-datetime";
import type { ApiReport } from "@/lib/types";
import { ApiError, apiRequest } from "@/lib/api-client";
import { downloadRelatorioPdf } from "@/lib/relatorio-pdf-download";
import { enviarRelatorioPorEmail } from "@/lib/relatorio-enviar-email";
import { downloadBlobFile } from "@/lib/utils";
import { formatRelatorioTitulo } from "@/lib/relatorio-naming";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import {
  ReportsFilterModal,
  ReportsFilters,
} from "@/components/reports-filter-modal";
import { Switch } from "@/components/Switch";
import {
  Button,
  Input,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/index";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  FileDown,
  FileText,
  Filter,
  Loader2,
  Mail,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { userCanEditRelatorio } from "@/lib/relatorio-permissions";

export default function RelatoriosPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [downloadingIds, setDownloadingIds] = useState<Set<number>>(new Set());
  const [sendingEmailIds, setSendingEmailIds] = useState<Set<number>>(
    new Set(),
  );
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<ReportsFilters>({
    clientId: "all",
    dateStart: "",
    dateEnd: "",
    createdById: "all",
    printed: "all",
  });
  const [searchCliente, setSearchCliente] = useState("");
  const [searchData, setSearchData] = useState("");
  const [searchStatus, setSearchStatus] = useState<
    "all" | "printed" | "not_printed"
  >("all");

  // Converter filtros do componente para API
  const apiFilters = {
    clienteId:
      filters.clientId !== "all" ? Number(filters.clientId) : undefined,
    criadoPorId:
      filters.createdById !== "all" ? Number(filters.createdById) : undefined,
    dataInicio: filters.dateStart || undefined,
    dataFim: filters.dateEnd || undefined,
    impresso: filters.printed !== "all" ? filters.printed === "yes" : undefined,
  };

  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const { relatorios, loading, error } = useRelatorios({
    ...apiFilters,
    refetchTrigger,
  });

  // Extrair clientes únicos para filtro
  const clientesUnicos = useMemo(() => {
    return Array.from(
      new Map(
        relatorios.map((r) => [
          r.clienteId,
          { id: String(r.clienteId), name: r.cliente.nomeFantasia },
        ]),
      ).values(),
    );
  }, [relatorios]);

  // Extrair criadores únicos para filtro
  const criadoresUnicos = useMemo(() => {
    return Array.from(
      new Map(
        relatorios.map((r) => [
          r.criadoPorId,
          { id: String(r.criadoPorId), name: r.criadoPor.nome },
        ]),
      ).values(),
    );
  }, [relatorios]);

  const filteredRelatorios = useMemo(() => {
    return relatorios.filter((report) => {
      const clienteMatch =
        searchCliente.trim() === "" ||
        report.cliente.nomeFantasia
          .toLowerCase()
          .includes(searchCliente.trim().toLowerCase());

      const reportDate =
        report.dataVisitaHhmm?.trim() || report.dataVisita.slice(0, 10);
      const dataMatch = searchData === "" || reportDate === searchData;

      const statusMatch =
        searchStatus === "all" ||
        (searchStatus === "printed" && report.impresso) ||
        (searchStatus === "not_printed" && !report.impresso);

      return clienteMatch && dataMatch && statusMatch;
    });
  }, [relatorios, searchCliente, searchData, searchStatus]);

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await apiRequest(`/relatorios/${deleteId}`, { method: "DELETE" });
      setRefetchTrigger((p) => p + 1);
      toast.success("Relatorio excluido com sucesso.");
    } catch {
      toast.error("Erro ao excluir relatorio.");
    } finally {
      setDeleteId(null);
    }
  }

  async function handleTogglePrinted(reportId: number, currentValue: boolean) {
    try {
      await apiRequest(`/relatorios/${reportId}`, {
        method: "PUT",
        body: JSON.stringify({ impresso: !currentValue }),
      });
      setRefetchTrigger((p) => p + 1);
      toast.success(
        !currentValue
          ? "Relatorio marcado como impresso."
          : "Relatorio desmarcado como impresso.",
      );
    } catch {
      toast.error("Erro ao atualizar relatorio.");
    }
  }

  function getPdfErrorMessage(error: unknown) {
    if (error instanceof ApiError) {
      if (error.status === 400) return "ID do relatorio invalido.";
      if (error.status === 401 || error.status === 403)
        return "Sem permissao para baixar o PDF.";
      if (error.status === 404) return "Relatorio nao encontrado.";
      if (error.status === 500)
        return "Falha ao gerar PDF no servidor. Tente novamente.";
    }

    return "Erro ao baixar PDF.";
  }

  async function handleDownloadPdf(report: ApiReport) {
    const reportId = report.id;
    if (downloadingIds.has(reportId)) {
      return;
    }

    setDownloadingIds((prev) => new Set(prev).add(reportId));

    try {
      const { blob, filename } = await downloadRelatorioPdf(reportId);
      downloadBlobFile(blob, filename);
      setRefetchTrigger((p) => p + 1);
      toast.success("PDF baixado com sucesso.");
    } catch (error) {
      toast.error(getPdfErrorMessage(error));
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(reportId);
        return next;
      });
    }
  }

  async function handleEnviarEmail(report: ApiReport) {
    const reportId = report.id;
    if (sendingEmailIds.has(reportId)) {
      return;
    }

    setSendingEmailIds((prev) => new Set(prev).add(reportId));

    try {
      await enviarRelatorioPorEmail(reportId);
      toast.success("E-mail enviado com sucesso para o cliente.");
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Erro ao enviar e-mail do relatório.";
      toast.error(message);
    } finally {
      setSendingEmailIds((prev) => {
        const next = new Set(prev);
        next.delete(reportId);
        return next;
      });
    }
  }

  function formatDate(dateStr: string, dataVisitaHhmm?: string | null) {
    return formatDataVisitaBr(dateStr, dataVisitaHhmm) || dateStr;
  }

  const hasActiveFilters =
    filters.clientId !== "all" ||
    filters.dateStart !== "" ||
    filters.dateEnd !== "" ||
    filters.createdById !== "all" ||
    filters.printed !== "all";

  const hasSearchFilters =
    searchCliente.trim() !== "" || searchData !== "" || searchStatus !== "all";

  return (
    <>
      <PageHeader
        title="Relatorios"
        description="Visualize e gerencie os relatorios tecnicos."
        action={
          <Button onClick={() => navigate("/dashboard/relatorios/novo")}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Relatorio
          </Button>
        }
      />

      <div className="mb-4 flex justify-end">
        <Button
          variant="outline"
          onClick={() => setFilterModalOpen(true)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtrar
          {hasActiveFilters && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {
                Object.values(filters).filter((v) => v !== "all" && v !== "")
                  .length
              }
            </span>
          )}
        </Button>
      </div>

      <div className="mb-4 grid gap-3 rounded-2xl border border-border p-4 md:grid-cols-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchCliente}
            onChange={(e) => setSearchCliente(e.target.value)}
            placeholder="Buscar por cliente"
            className="pl-9"
          />
        </div>
        <Input
          type="date"
          value={searchData}
          onChange={(e) => setSearchData(e.target.value)}
        />
        <Select
          value={searchStatus}
          onChange={(e) =>
            setSearchStatus(
              e.target.value as "all" | "printed" | "not_printed",
            )
          }
        >
          <option value="all">Todos os status</option>
          <option value="printed">Impresso</option>
          <option value="not_printed">Nao impresso</option>
        </Select>
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando relatórios...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-destructive">
          <p>Erro ao carregar relatórios: {error}</p>
        </div>
      )}

      {!loading && !error && filteredRelatorios.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhum relatorio encontrado"
          description={
            hasActiveFilters || hasSearchFilters
              ? "Tente ajustar os filtros de busca."
              : "Crie seu primeiro relatorio tecnico."
          }
        />
      ) : (
        !loading &&
        !error && (
          <div className="rounded-2xl border border-border overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Relatório</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Criado por</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead className="w-28">Impresso</TableHead>
                  <TableHead className="w-40 text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRelatorios.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="text-sm font-medium">
                      {formatRelatorioTitulo(report.id)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(report.dataVisita, report.dataVisitaHhmm)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {report.cliente.nomeFantasia}
                    </TableCell>
                    <TableCell>{report.criadoPor.nome}</TableCell>
                    <TableCell>{report.contato?.nome || "-"}</TableCell>
                    <TableCell>
                      <Switch
                        checked={report.impresso}
                        onCheckedChange={() =>
                          handleTogglePrinted(report.id, report.impresso)
                        }
                        aria-label="Impresso"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            navigate(`/dashboard/relatorios/${report.id}`)
                          }
                          aria-label="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {userCanEditRelatorio(user, report.criadoPorId) ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              navigate(
                                `/dashboard/relatorios/${report.id}/editar`,
                              )
                            }
                            aria-label="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDownloadPdf(report)}
                          disabled={downloadingIds.has(report.id)}
                          aria-label="Gerar PDF"
                        >
                          {downloadingIds.has(report.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileDown className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEnviarEmail(report)}
                          disabled={sendingEmailIds.has(report.id)}
                          aria-label="Enviar por E-mail"
                          title="Enviar por E-mail"
                        >
                          {sendingEmailIds.has(report.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Mail className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(report.id)}
                          aria-label="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      )}

      <ReportsFilterModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        filters={filters}
        onFiltersChange={setFilters}
        clients={clientesUnicos}
        users={criadoresUnicos}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir relatorio"
        description="Tem certeza que deseja excluir este relatorio? Esta acao nao pode ser desfeita."
        onConfirm={handleDelete}
      />
    </>
  );
}
