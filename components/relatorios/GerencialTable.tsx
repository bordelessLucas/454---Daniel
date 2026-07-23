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
  DENTRO: "Dentro do SLA",
  ABAIXO: "Abaixo do SLA",
  SEM_META: "Sem meta",
};

function isSlaStatusPositive(status: GerencialSlaStatus): boolean {
  return status === "DENTRO";
}

function SlaStatusBadge({ status }: { status: GerencialSlaStatus }) {
  const positive = isSlaStatusPositive(status);
  const neutral = status === "SEM_META";

  return (
    <Badge
      className={
        neutral
          ? "border-transparent bg-muted text-muted-foreground"
          : positive
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

function formatHoras(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
}

function ResumoClienteTable({ rows }: { rows: GerencialResumoClienteRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead className="text-right">Total de Visitas</TableHead>
          <TableHead className="text-right">Total de Horas</TableHead>
          <TableHead className="text-right">Setores Visitados</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={`${row.clienteId}-${row.periodo}`}>
            <TableCell className="font-medium">{row.clienteNome}</TableCell>
            <TableCell className="text-right">{row.totalVisitas}</TableCell>
            <TableCell className="text-right">
              {formatHoras(row.totalHoras)}
            </TableCell>
            <TableCell className="text-right">
              {row.totalSetoresVisitados}
            </TableCell>
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
          <TableHead className="text-right">Total de Visitas</TableHead>
          <TableHead className="text-right">Total de Horas</TableHead>
          <TableHead className="text-right">Clientes Atendidos</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={`${row.tecnicoNome}-${row.periodo}`}>
            <TableCell className="font-medium">{row.tecnicoNome}</TableCell>
            <TableCell className="text-right">{row.totalVisitas}</TableCell>
            <TableCell className="text-right">
              {formatHoras(row.totalHoras)}
            </TableCell>
            <TableCell className="text-right">{row.clientesAtendidos}</TableCell>
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
          <TableHead className="text-right">Visitas Esperadas</TableHead>
          <TableHead className="text-right">% SLA</TableHead>
          <TableHead>Status SLA</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={`${row.contratoId}-${row.periodo}`}>
            <TableCell className="font-medium">{row.clienteNome}</TableCell>
            <TableCell>#{row.contratoId}</TableCell>
            <TableCell className="text-right">{row.visitasRealizadas}</TableCell>
            <TableCell className="text-right">{row.visitasEsperadas}</TableCell>
            <TableCell className="text-right">
              {formatPercent(row.slaPercentual)}
            </TableCell>
            <TableCell>
              <SlaStatusBadge status={row.slaStatus} />
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

  const table =
    tipo === "resumo-cliente" ? (
      <ResumoClienteTable rows={data as GerencialResumoClienteRow[]} />
    ) : tipo === "produtividade-tecnico" ? (
      <ProdutividadeTecnicoTable
        rows={data as GerencialProdutividadeTecnicoRow[]}
      />
    ) : tipo === "sla-contratos" ? (
      <SlaContratosTable rows={data as GerencialSlaContratoRow[]} />
    ) : null;

  if (!table) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <div
        className={
          tipo === "sla-contratos" ? "min-w-[640px]" : "min-w-[480px]"
        }
      >
        {table}
      </div>
    </div>
  );
}
