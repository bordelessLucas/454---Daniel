import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/index";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DashboardTopCliente } from "@/lib/types";

const chartConfig = {
  visitas: {
    label: "Visitas",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

interface TopClientesChartProps {
  rows?: DashboardTopCliente[];
  isLoading?: boolean;
}

export function TopClientesChart({ rows = [], isLoading }: TopClientesChartProps) {
  const topFive = [...rows]
    .sort((a, b) => b.totalVisitas - a.totalVisitas)
    .slice(0, 5)
    .map((row) => ({
      nome: row.clienteNome,
      visitas: row.totalVisitas,
    }));

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Top Clientes</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : topFive.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sem visitas registradas no período.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <BarChart data={topFive} margin={{ bottom: 8 }}>
              <XAxis
                dataKey="nome"
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={72}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="visitas"
                fill="var(--color-visitas)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
