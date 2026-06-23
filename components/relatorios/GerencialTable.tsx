import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/index";
import type {
  GerencialJsonData,
  GerencialProdutividadeTecnicoRow,
  GerencialResumoClienteRow,
  GerencialSlaContratoRow,
  GerencialSlaStatus,
  GerencialTipo,
} from "@/lib/types";

interface GerencialTableProps {
  tipo: GerencialTipo;
  data: GerencialJsonData;
}

const SLA_STATUS_LABELS: Record<GerencialSlaStatus, string> = {
  dentro: "Dentro do SLA",
  fora: "Fora do SLA",
  ok: "OK",
  atencao: "Atenção",
};

function isSlaStatusPositive(status: GerencialSlaStatus): boolean {
  return status === "dentro" || status === "ok";
}

function SlaStatusBadge({ status }: { status: GerencialSlaStatus }) {
  const positive = isSlaStatusPositive(status);
  return (
    <Badge
      className={
        positive
          ? "border-transparent bg-emerald-600 text-white dark:bg-emerald-700"
          : "border-transparent bg-red-600 text-white dark:bg-red-700"
      }
    >
      {SLA_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

function formatPercent(value: number): string {
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })}%`;
}

function ResumoClienteTable({ rows }: { rows: GerencialResumoClienteRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead className="text-right">Total de Relatórios</TableHead>
          <TableHead className="text-right">Total de Horas</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.clienteId}>
            <TableCell className="font-medium">{row.clienteNome}</TableCell>
            <TableCell className="text-right">{row.totalRelatorios}</TableCell>
            <TableCell className="text-right">{row.totalHoras}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ProdutividadeTecnicoTable({
  rows,
}: {
  rows: GerencialProdutividadeTecnicoRow[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Técnico</TableHead>
          <TableHead className="text-right">Total de Relatórios</TableHead>
          <TableHead className="text-right">Total de Horas</TableHead>
          <TableHead className="text-right">Média por Relatório</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.tecnicoId}>
            <TableCell className="font-medium">{row.tecnicoNome}</TableCell>
            <TableCell className="text-right">{row.totalRelatorios}</TableCell>
            <TableCell className="text-right">{row.totalHoras}</TableCell>
            <TableCell className="text-right">
              {row.mediaHorasPorRelatorio ?? "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SlaContratosTable({ rows }: { rows: GerencialSlaContratoRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Contrato</TableHead>
          <TableHead className="text-right">Visitas Realizadas</TableHead>
          <TableHead className="text-right">Visitas Previstas</TableHead>
          <TableHead className="text-right">% SLA</TableHead>
          <TableHead>Status SLA</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={`${row.clienteId}-${row.numeroContrato}`}>
            <TableCell className="font-medium">{row.clienteNome}</TableCell>
            <TableCell>{row.numeroContrato}</TableCell>
            <TableCell className="text-right">{row.visitasRealizadas}</TableCell>
            <TableCell className="text-right">{row.visitasPrevistas}</TableCell>
            <TableCell className="text-right">
              {formatPercent(row.percentualSla)}
            </TableCell>
            <TableCell>
              <SlaStatusBadge status={row.statusSla} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function GerencialTable({ tipo, data }: GerencialTableProps) {
  if (data.length === 0) {
    return null;
  }

  switch (tipo) {
    case "resumo-cliente":
      return (
        <ResumoClienteTable rows={data as GerencialResumoClienteRow[]} />
      );
    case "produtividade-tecnico":
      return (
        <ProdutividadeTecnicoTable
          rows={data as GerencialProdutividadeTecnicoRow[]}
        />
      );
    case "sla-contratos":
      return (
        <SlaContratosTable rows={data as GerencialSlaContratoRow[]} />
      );
    default:
      return null;
  }
}
