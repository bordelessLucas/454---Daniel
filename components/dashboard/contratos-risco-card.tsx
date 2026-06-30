import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/index";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardContratoRisco } from "@/lib/types";

interface ContratosRiscoCardProps {
  rows?: DashboardContratoRisco[];
  isLoading?: boolean;
}

function formatPercent(value: number): string {
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })}%`;
}

export function ContratosRiscoCard({
  rows = [],
  isLoading,
}: ContratosRiscoCardProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Contratos com SLA em Risco</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum contrato em risco no período selecionado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Visitas</TableHead>
                  <TableHead className="text-right">% Concluído</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.clienteId}>
                    <TableCell>
                      <Link
                        to={`/dashboard/clientes/${row.clienteId}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {row.clienteNome}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {row.visitasRealizadas} / {row.visitasEsperadas}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercent(row.percentualConcluido)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
