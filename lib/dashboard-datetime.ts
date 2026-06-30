import {
  endOfMonth,
  format,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";

export type DateRangePreset = "este-mes" | "mes-passado" | "ultimos-30";

export function toDateInput(value: Date): string {
  return format(value, "yyyy-MM-dd");
}

export function formatDateRangeLabel(from: string, to: string): string {
  const fromDate = new Date(`${from}T12:00:00`);
  const toDate = new Date(`${to}T12:00:00`);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return `${from} — ${to}`;
  }
  return `${format(fromDate, "dd MMM yyyy", { locale: ptBR })} — ${format(toDate, "dd MMM yyyy", { locale: ptBR })}`;
}

export function getPresetDateRange(preset: DateRangePreset): {
  dataInicio: string;
  dataFim: string;
} {
  const today = new Date();

  if (preset === "este-mes") {
    return {
      dataInicio: toDateInput(startOfMonth(today)),
      dataFim: toDateInput(endOfMonth(today)),
    };
  }

  if (preset === "mes-passado") {
    const lastMonth = subMonths(today, 1);
    return {
      dataInicio: toDateInput(startOfMonth(lastMonth)),
      dataFim: toDateInput(endOfMonth(lastMonth)),
    };
  }

  return {
    dataInicio: toDateInput(subDays(today, 29)),
    dataFim: toDateInput(today),
  };
}

export function getDefaultDashboardDateRange(): {
  dataInicio: string;
  dataFim: string;
} {
  return getPresetDateRange("este-mes");
}
