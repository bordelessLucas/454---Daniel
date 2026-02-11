import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useReports } from "@/lib/reports-context";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import {
  Badge,
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
  Search,
  Pencil,
  Trash2,
  Eye,
  FileDown,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

export default function RelatoriosPage() {
  const { reports, deleteReport } = useReports();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = reports;
    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.clientName.toLowerCase().includes(q) ||
          r.contact.toLowerCase().includes(q) ||
          r.technicianNames.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [reports, search, statusFilter]);

  function handleDelete() {
    if (!deleteId) return;
    deleteReport(deleteId);
    setDeleteId(null);
    toast.success("Relatorio excluido com sucesso.");
  }

  function formatDate(dateStr: string) {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  }

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

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar relatorios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="w-40"
        >
          <option value="all">Todos</option>
          <option value="rascunho">Rascunho</option>
          <option value="finalizado">Finalizado</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhum relatorio encontrado"
          description={
            search || statusFilter !== "all"
              ? "Tente ajustar os filtros de busca."
              : "Crie seu primeiro relatorio tecnico."
          }
        />
      ) : (
        <div className="rounded-2xl border border-border overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Contato</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Modalidade
                </TableHead>
                <TableHead className="hidden md:table-cell">Tecnicos</TableHead>
                <TableHead className="hidden xl:table-cell">Setores</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32 text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(report.date)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {report.clientName}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {report.contact}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-sm">{report.modality}</span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm">
                      {report.technicianNames.join(", ")}
                    </span>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <span className="text-sm">
                      {report.sectorNames.join(", ")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        report.status === "finalizado" ? "default" : "secondary"
                      }
                    >
                      {report.status === "finalizado"
                        ? "Finalizado"
                        : "Rascunho"}
                    </Badge>
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          navigate(`/dashboard/relatorios/${report.id}/editar`)
                        }
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          toast.info(
                            "A geracao de PDF sera implementada futuramente.",
                          )
                        }
                        aria-label="Gerar PDF"
                      >
                        <FileDown className="h-4 w-4" />
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
      )}

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
