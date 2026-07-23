import { useMemo } from "react";
import type { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  formatDateRangeLabel,
  getPresetDateRange,
  toDateInput,
  type DateRangePreset,
} from "@/lib/dashboard-datetime";

const PRESETS: { id: DateRangePreset; label: string }[] = [
  { id: "este-mes", label: "Este Mês" },
  { id: "mes-passado", label: "Mês Passado" },
  { id: "ultimos-30", label: "Últimos 30 dias" },
];

interface DateRangePickerProps {
  dataInicio: string;
  dataFim: string;
  onChange: (range: { dataInicio: string; dataFim: string }) => void;
  className?: string;
  disabled?: boolean;
}

function parseDateInput(value: string): Date | undefined {
  if (!value) {
    return undefined;
  }
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function DateRangePicker({
  dataInicio,
  dataFim,
  onChange,
  className,
  disabled,
}: DateRangePickerProps) {
  const selectedRange = useMemo<DateRange | undefined>(() => {
    const from = parseDateInput(dataInicio);
    const to = parseDateInput(dataFim);
    if (!from && !to) {
      return undefined;
    }
    return { from, to };
  }, [dataInicio, dataFim]);

  const label = useMemo(() => {
    if (dataInicio && dataFim) {
      return formatDateRangeLabel(dataInicio, dataFim);
    }
    return "Selecione o período";
  }, [dataInicio, dataFim]);

  function handleSelect(range: DateRange | undefined) {
    if (!range?.from) {
      return;
    }

    const nextInicio = toDateInput(range.from);
    const nextFim = toDateInput(range.to ?? range.from);
    onChange({ dataInicio: nextInicio, dataFim: nextFim });
  }

  function applyPreset(preset: DateRangePreset) {
    onChange(getPresetDateRange(preset));
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !dataInicio && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto max-w-[calc(100vw-2rem)] p-0"
        align="start"
      >
        <div className="flex flex-wrap gap-2 border-b p-3">
          {PRESETS.map((preset) => (
            <Button
              key={preset.id}
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => applyPreset(preset.id)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <Calendar
          mode="range"
          selected={selectedRange}
          onSelect={handleSelect}
          numberOfMonths={1}
          locale={ptBR}
          initialFocus
        />
        {selectedRange?.from ? (
          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            {selectedRange.to
              ? `${format(selectedRange.from, "dd/MM/yyyy")} — ${format(selectedRange.to, "dd/MM/yyyy")}`
              : format(selectedRange.from, "dd/MM/yyyy")}
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
