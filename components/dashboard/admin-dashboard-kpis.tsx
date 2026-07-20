import { Clock } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { VisitasSlaCard } from "@/components/dashboard/visitas-sla-card";
import { ContratosRiscoCard } from "@/components/dashboard/contratos-risco-card";
import { ProdutividadeTecnicosChart } from "@/components/dashboard/produtividade-tecnicos-chart";
import { TopClientesChart } from "@/components/dashboard/top-clientes-chart";
import { ProximosAgendamentosCard } from "@/components/dashboard/proximos-agendamentos-card";
import { decimalHorasToHHmm } from "@/lib/dashboard-hours";
import type {
  DashboardAdminKpis,
  DashboardProximoAgendamento,
} from "@/lib/types";

interface AdminDashboardKpisProps {
  data?: DashboardAdminKpis;
  proximosAgendamentos?: DashboardProximoAgendamento[];
  isLoading?: boolean;
  isLoadingAgendamentos?: boolean;
}

export function AdminDashboardKpis({
  data,
  proximosAgendamentos = [],
  isLoading,
  isLoadingAgendamentos,
}: AdminDashboardKpisProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <VisitasSlaCard data={data?.visitasSla} isLoading={isLoading} />
      <StatCard
        title="Total de Horas Apontadas"
        value={decimalHorasToHHmm(data?.totalHoras ?? "0")}
        icon={Clock}
        isLoading={isLoading}
      />
      <ProximosAgendamentosCard
        items={proximosAgendamentos}
        isLoading={isLoadingAgendamentos}
        showTecnicos
        title="Próximos Agendamentos"
      />
      <ContratosRiscoCard
        rows={data?.contratosSlaRisco}
        isLoading={isLoading}
      />
      <ProdutividadeTecnicosChart
        rows={data?.produtividadeTecnicos}
        isLoading={isLoading}
      />
      <TopClientesChart rows={data?.topClientes} isLoading={isLoading} />
    </div>
  );
}
