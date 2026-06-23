import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import type {
  DateSelectArg,
  EventClickArg,
  EventDropArg,
  EventSourceFunc,
} from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import { toast } from "sonner";
import { useCalendarioEventos } from "@/hooks/use-calendario-eventos";
import { useReagendarRelatorio } from "@/hooks/use-reagendar-relatorio";
import { toApiDateOnly } from "@/lib/relatorio-datetime";
import { useIsMobile } from "@/hooks/use-mobile";
import type { CalendarioEvento } from "@/lib/types";
import { EventoDialog } from "@/components/agenda/EventoDialog";
import { NovoAgendamentoDialog } from "@/components/agenda/NovoAgendamentoDialog";
import "@/src/styles/calendar-overrides.css";

interface VisitCalendarProps {
  tecnicoId?: number;
  refreshKey?: number;
  novoAgendamentoOpen?: boolean;
  onNovoAgendamentoOpenChange?: (open: boolean) => void;
  onAgendamentoCreated?: () => void;
}

export function VisitCalendar({
  tecnicoId,
  refreshKey = 0,
  novoAgendamentoOpen = false,
  onNovoAgendamentoOpenChange,
  onAgendamentoCreated,
}: VisitCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const isMobile = useIsMobile();
  const { fetchEvents } = useCalendarioEventos(tecnicoId);
  const { reagendar } = useReagendarRelatorio();

  const [selectedEvento, setSelectedEvento] = useState<CalendarioEvento | null>(
    null,
  );
  const [eventoDialogOpen, setEventoDialogOpen] = useState(false);
  const [slotDate, setSlotDate] = useState<Date | null>(null);
  const [slotDialogOpen, setSlotDialogOpen] = useState(false);
  const [headerDialogDate] = useState(() => new Date());
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const initialView = isMobile ? "listWeek" : "dayGridMonth";

  const refetchCalendar = useCallback(() => {
    calendarRef.current?.getApi().refetchEvents();
  }, []);

  useEffect(() => {
    refetchCalendar();
  }, [refreshKey, refetchCalendar, tecnicoId]);

  const eventsSource = useMemo<EventSourceFunc>(
    () => async (fetchInfo, successCallback, failureCallback) => {
      setIsLoadingEvents(true);
      setLoadError(null);
      try {
        const events = await fetchEvents(fetchInfo.startStr, fetchInfo.endStr);
        successCallback(events);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao carregar agendamentos.";
        setLoadError(message);
        toast.error(message);
        failureCallback(
          error instanceof Error ? error : new Error(String(error)),
        );
      } finally {
        setIsLoadingEvents(false);
      }
    },
    [fetchEvents],
  );

  function handleEventClick(info: EventClickArg) {
    const evento = info.event.extendedProps.evento as CalendarioEvento | undefined;
    if (!evento) {
      return;
    }
    setSelectedEvento(evento);
    setEventoDialogOpen(true);
  }

  function openSlotDialog(date: Date) {
    setSlotDate(date);
    setSlotDialogOpen(true);
  }

  function handleDateSelect(info: DateSelectArg) {
    openSlotDialog(info.start);
    info.view.calendar.unselect();
  }

  function handleDateClick(info: { date: Date; allDay: boolean }) {
    if (!info.allDay) {
      openSlotDialog(info.date);
      return;
    }

    const date = new Date(info.date);
    date.setHours(9, 0, 0, 0);
    openSlotDialog(date);
  }

  async function handleEventDrop(info: EventDropArg) {
    const evento = info.event.extendedProps.evento as CalendarioEvento | undefined;
    if (!evento) {
      info.revert();
      return;
    }

    if (evento.status !== "AGENDADO") {
      info.revert();
      toast.error("Não é possível reagendar relatório finalizado ou cancelado.");
      return;
    }

    const newStart = info.event.start;
    if (!newStart) {
      info.revert();
      return;
    }

    try {
      const horaVisita = `${String(newStart.getHours()).padStart(2, "0")}:${String(newStart.getMinutes()).padStart(2, "0")}`;
      await reagendar(evento.id, {
        dataVisita: toApiDateOnly(newStart),
        horaVisita,
      });
      toast.success("Visita reagendada com sucesso.");
      refetchCalendar();
    } catch (error) {
      info.revert();
      const message =
        error instanceof Error
          ? error.message
          : "Não é possível reagendar este relatório.";
      toast.error(message);
    }
  }

  function handleAgendamentoSuccess() {
    refetchCalendar();
    setSlotDialogOpen(false);
    setSlotDate(null);
    onNovoAgendamentoOpenChange?.(false);
    onAgendamentoCreated?.();
  }

  const novoDialogOpen = novoAgendamentoOpen || slotDialogOpen;
  const initialDateForDialog = slotDialogOpen && slotDate ? slotDate : headerDialogDate;

  function handleNovoDialogChange(open: boolean) {
    if (!open) {
      setSlotDialogOpen(false);
      setSlotDate(null);
      onNovoAgendamentoOpenChange?.(false);
    }
  }

  return (
    <div className="visit-calendar relative min-h-0 flex-1 rounded-lg border bg-card p-2 md:p-4">
      {isLoadingEvents ? (
        <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
          Carregando visitas...
        </div>
      ) : null}
      {loadError ? (
        <div className="mb-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {loadError}
        </div>
      ) : null}
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        locale={ptBrLocale}
        initialView={initialView}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
        }}
        height="100%"
        expandRows
        nowIndicator
        selectable
        selectMirror
        editable
        eventStartEditable
        events={eventsSource}
        eventClick={handleEventClick}
        select={handleDateSelect}
        dateClick={handleDateClick}
        eventDrop={(info) => void handleEventDrop(info)}
        eventAllow={(dropInfo, draggedEvent) => {
          const evento = draggedEvent.extendedProps.evento as
            | CalendarioEvento
            | undefined;
          return evento?.status === "AGENDADO";
        }}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={false}
        weekends
        buttonText={{
          today: "Hoje",
          month: "Mês",
          week: "Semana",
          day: "Dia",
          list: "Lista",
        }}
      />

      <EventoDialog
        open={eventoDialogOpen}
        onOpenChange={setEventoDialogOpen}
        evento={selectedEvento}
      />

      <NovoAgendamentoDialog
        open={novoDialogOpen}
        onOpenChange={handleNovoDialogChange}
        initialDate={initialDateForDialog}
        onSuccess={handleAgendamentoSuccess}
      />
    </div>
  );
}
