import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/index";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { decimalHorasToHHmm, decimalHorasToNumber } from "@/lib/dashboard-hours";
import type { DashboardProdutividadeTecnico } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";

const chartConfig = {
  horas: {
    label: "Horas",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

function parseHorasToNumber(totalHoras: string): number {
  return decimalHorasToNumber(totalHoras);
}

function truncateLabel(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1)}…`;
}

interface ProdutividadeTecnicosChartProps {
  rows?: DashboardProdutividadeTecnico[];
  isLoading?: boolean;
}

export function ProdutividadeTecnicosChart({
  rows = [],
  isLoading,
}: ProdutividadeTecnicosChartProps) {
  const isMobile = useIsMobile();
  const labelMaxLength = isMobile ? 10 : 18;
  const axisWidth = isMobile ? 72 : 120;

  const topFive = [...rows]
    .sort(
      (a, b) =>
        parseHorasToNumber(b.totalHoras) - parseHorasToNumber(a.totalHoras),
    )
    .slice(0, 5)
    .map((row) => ({
      nome: truncateLabel(row.tecnicoNome, labelMaxLength),
      nomeCompleto: row.tecnicoNome,
      horas: parseHorasToNumber(row.totalHoras),
      horasLabel: decimalHorasToHHmm(row.totalHoras),
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
              margin={{ left: 4, right: 12 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="nome"
                width={axisWidth}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: isMobile ? 11 : 12 }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) =>
                      String(payload?.[0]?.payload?.nomeCompleto ?? "")
                    }
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
