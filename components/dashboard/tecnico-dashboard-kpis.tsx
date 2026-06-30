import { Clock, FileText } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { ProximosAgendamentosCard } from "@/components/dashboard/proximos-agendamentos-card";
import type { DashboardTecnicoKpis } from "@/lib/types";

interface TecnicoDashboardKpisProps {
  data?: DashboardTecnicoKpis;
  isLoading?: boolean;
}

export function TecnicoDashboardKpis({
  data,
  isLoading,
}: TecnicoDashboardKpisProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Minhas Visitas"
        value={data?.minhasVisitas ?? 0}
        icon={FileText}
        isLoading={isLoading}
      />
      <StatCard
        title="Minhas Horas"
        value={data?.minhasHoras ?? "00:00"}
        icon={Clock}
        isLoading={isLoading}
      />
      <ProximosAgendamentosCard
        items={data?.proximosAgendamentos}
        isLoading={isLoading}
      />
    </div>
  );
}
