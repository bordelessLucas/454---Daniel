import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/index";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DashboardProdutividadeTecnico } from "@/lib/types";

const chartConfig = {
  horas: {
    label: "Horas",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

function parseHorasToNumber(totalHoras: string): number {
  const [hoursPart, minutesPart] = totalHoras.split(":");
  const hours = Number(hoursPart) || 0;
  const minutes = Number(minutesPart) || 0;
  return hours + minutes / 60;
}

interface ProdutividadeTecnicosChartProps {
  rows?: DashboardProdutividadeTecnico[];
  isLoading?: boolean;
}

export function ProdutividadeTecnicosChart({
  rows = [],
  isLoading,
}: ProdutividadeTecnicosChartProps) {
  const topFive = [...rows]
    .sort(
      (a, b) =>
        parseHorasToNumber(b.totalHoras) - parseHorasToNumber(a.totalHoras),
    )
    .slice(0, 5)
    .map((row) => ({
      nome: row.tecnicoNome,
      horas: parseHorasToNumber(row.totalHoras),
      horasLabel: row.totalHoras,
    }));

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Produtividade dos Técnicos</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : topFive.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sem dados de produtividade no período.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <BarChart
              data={topFive}
              layout="vertical"
              margin={{ left: 8, right: 16 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="nome"
                width={120}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(_, __, item) => item.payload.horasLabel}
                  />
                }
              />
              <Bar
                dataKey="horas"
                fill="var(--color-horas)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
