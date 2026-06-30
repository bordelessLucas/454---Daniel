import { Cell, Pie, PieChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/index";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DashboardVisitasSla } from "@/lib/types";

const chartConfig = {
  realizadas: {
    label: "Realizadas",
    color: "hsl(var(--chart-1))",
  },
  restantes: {
    label: "Restantes",
    color: "hsl(var(--muted))",
  },
} satisfies ChartConfig;

interface VisitasSlaCardProps {
  data?: DashboardVisitasSla;
  isLoading?: boolean;
}

export function VisitasSlaCard({ data, isLoading }: VisitasSlaCardProps) {
  const realizadas = data?.realizadas ?? 0;
  const esperadas = data?.esperadas ?? 0;
  const restantes = Math.max(esperadas - realizadas, 0);
  const percentual = data?.percentual ?? 0;

  const chartData = [
    { name: "realizadas", value: realizadas, fill: "var(--color-realizadas)" },
    { name: "restantes", value: restantes, fill: "var(--color-restantes)" },
  ];

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Visitas vs. SLA</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-6">
            <Skeleton className="h-40 w-40 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <ChartContainer config={chartConfig} className="mx-auto h-44 w-44">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={72}
                  strokeWidth={2}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="text-center sm:text-left">
              <p className="text-3xl font-bold">
                {realizadas} / {esperadas}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                visitas realizadas / esperadas
              </p>
              <p className="mt-3 text-2xl font-semibold text-primary">
                {percentual.toLocaleString("pt-BR", {
                  maximumFractionDigits: 1,
                })}
                %
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
