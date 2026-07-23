import { Link } from "react-router-dom";
import { CalendarClock, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/index";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardProximoAgendamento } from "@/lib/types";

interface ProximosAgendamentosCardProps {
  items?: DashboardProximoAgendamento[];
  isLoading?: boolean;
  /** Quando true, destaca quem criou o evento (visão admin). */
  showTecnicos?: boolean;
  title?: string;
}

function formatPeriodo(dataInicio: string, dataFim: string): string {
  const format = (value: string) => {
    const [y, m, d] = value.slice(0, 10).split("-");
    if (!y || !m || !d) return value;
    return `${d}/${m}/${y}`;
  };

  if (dataInicio === dataFim) {
    return format(dataInicio);
  }
  return `${format(dataInicio)} → ${format(dataFim)}`;
}

export function ProximosAgendamentosCard({
  items = [],
  isLoading,
  showTecnicos = false,
  title = "Próximos eventos",
}: ProximosAgendamentosCardProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle>{title}</CardTitle>
        {!isLoading && items.length > 0 ? (
          <Link
            to="/dashboard/agenda"
            className="text-xs font-medium text-primary hover:underline"
          >
            Ver calendário
          </Link>
        ) : null}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum evento futuro encontrado.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  to="/dashboard/agenda"
                  className="flex items-start justify-between gap-3 py-3 text-sm transition-colors hover:text-primary"
                >
                  <span className="min-w-0 space-y-1">
                    <span className="block font-medium">{item.titulo}</span>
                    {item.clienteNome ? (
                      <span className="block text-xs text-muted-foreground">
                        {item.clienteNome}
                      </span>
                    ) : null}
                    {showTecnicos && item.criadoPorNome ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <UserRound className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{item.criadoPorNome}</span>
                      </span>
                    ) : null}
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
                    <CalendarClock className="h-4 w-4" />
                    {formatPeriodo(item.dataInicio, item.dataFim)}
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
