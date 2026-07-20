import { Link } from "react-router-dom";
import { CalendarClock, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/index";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardProximoAgendamento } from "@/lib/types";

interface ProximosAgendamentosCardProps {
  items?: DashboardProximoAgendamento[];
  isLoading?: boolean;
  /** Quando true, destaca o(s) técnico(s) em cada linha (visão admin). */
  showTecnicos?: boolean;
  title?: string;
}

function formatAgendamentoDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  const hasTime = iso.includes("T") && !iso.endsWith("T00:00:00.000Z");
  if (!hasTime) {
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ProximosAgendamentosCard({
  items = [],
  isLoading,
  showTecnicos = false,
  title = "Próximos Agendamentos",
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
            Ver agenda
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
            Nenhum agendamento futuro encontrado.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => {
              const tecnicosLabel =
                item.tecnicos.length > 0
                  ? item.tecnicos.join(", ")
                  : "Sem técnico";

              return (
                <li key={item.relatorioId}>
                  <Link
                    to={`/dashboard/relatorios/${item.relatorioId}`}
                    className="flex items-start justify-between gap-3 py-3 text-sm transition-colors hover:text-primary"
                  >
                    <span className="min-w-0 space-y-1">
                      <span className="block font-medium">
                        {item.clienteNome}
                      </span>
                      {showTecnicos ? (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <UserRound className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{tecnicosLabel}</span>
                        </span>
                      ) : null}
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
                      <CalendarClock className="h-4 w-4" />
                      {formatAgendamentoDateTime(item.dataVisita)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
