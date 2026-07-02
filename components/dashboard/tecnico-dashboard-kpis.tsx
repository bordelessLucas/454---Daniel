import { Clock, FileText } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { ProximosAgendamentosCard } from "@/components/dashboard/proximos-agendamentos-card";
import { TopClientesChart } from "@/components/dashboard/top-clientes-chart";
import { decimalHorasToHHmm } from "@/lib/dashboard-hours";
import type { DashboardProximoAgendamento, DashboardTecnicoKpis } from "@/lib/types";

interface TecnicoDashboardKpisProps {
  data?: DashboardTecnicoKpis;
  proximosAgendamentos?: DashboardProximoAgendamento[];
  isLoading?: boolean;
  isLoadingAgendamentos?: boolean;
}

export function TecnicoDashboardKpis({
  data,
  proximosAgendamentos = [],
  isLoading,
  isLoadingAgendamentos,
}: TecnicoDashboardKpisProps) {
  const visitasRealizadas = data?.visitas.realizadas ?? 0;
  const visitasAgendadas = data?.visitas.agendadas ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Visitas Realizadas"
        value={visitasRealizadas}
        description={`${visitasAgendadas} agendada(s) no período`}
        icon={FileText}
        isLoading={isLoading}
      />
      <StatCard
        title="Total de Horas"
        value={decimalHorasToHHmm(data?.totalHoras ?? "0")}
        icon={Clock}
        isLoading={isLoading}
      />
      <ProximosAgendamentosCard
        items={proximosAgendamentos}
        isLoading={isLoadingAgendamentos}
      />
      <TopClientesChart rows={data?.topClientes} isLoading={isLoading} />
    </div>
  );
}
