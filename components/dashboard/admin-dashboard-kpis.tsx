import { Clock } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { VisitasSlaCard } from "@/components/dashboard/visitas-sla-card";
import { ContratosRiscoCard } from "@/components/dashboard/contratos-risco-card";
import { ProdutividadeTecnicosChart } from "@/components/dashboard/produtividade-tecnicos-chart";
import { TopClientesChart } from "@/components/dashboard/top-clientes-chart";
import type { DashboardAdminKpis } from "@/lib/types";

interface AdminDashboardKpisProps {
  data?: DashboardAdminKpis;
  isLoading?: boolean;
}

export function AdminDashboardKpis({ data, isLoading }: AdminDashboardKpisProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <VisitasSlaCard data={data?.visitasSla} isLoading={isLoading} />
      <StatCard
        title="Total de Horas Apontadas"
        value={data?.totalHoras ?? "00:00"}
        icon={Clock}
        isLoading={isLoading}
      />
      <ContratosRiscoCard rows={data?.contratosEmRisco} isLoading={isLoading} />
      <ProdutividadeTecnicosChart
        rows={data?.produtividadeTecnicos}
        isLoading={isLoading}
      />
      <TopClientesChart rows={data?.topClientes} isLoading={isLoading} />
    </div>
  );
}
