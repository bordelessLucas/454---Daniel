import { Link } from "react-router-dom";
import { CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/index";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDataVisitaBr } from "@/lib/relatorio-datetime";
import type { DashboardProximoAgendamento } from "@/lib/types";

interface ProximosAgendamentosCardProps {
  items?: DashboardProximoAgendamento[];
  isLoading?: boolean;
}

export function ProximosAgendamentosCard({
  items = [],
  isLoading,
}: ProximosAgendamentosCardProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Próximos Agendamentos</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum agendamento futuro encontrado.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={item.relatorioId}>
                <Link
                  to={`/dashboard/relatorios/${item.relatorioId}`}
                  className="flex items-center justify-between gap-3 py-3 text-sm transition-colors hover:text-primary"
                >
                  <span className="font-medium">{item.clienteNome}</span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <CalendarClock className="h-4 w-4" />
                    {formatDataVisitaBr(item.dataVisita) || item.dataVisita}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
