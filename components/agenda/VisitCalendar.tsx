import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import type {
  DateSelectArg,
  EventClickArg,
  EventDropArg,
  EventSourceFunc,
} from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import { toast } from "sonner";
import { useCalendarioEventos } from "@/hooks/use-calendario-eventos";
import {
  inclusiveRangeFromFullCalendarEvent,
  updateCalendarioEvento,
} from "@/lib/calendario-service";
import { useAuth } from "@/lib/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";
import type { CalendarioEvento } from "@/lib/types";
import { EventoDialog } from "@/components/agenda/EventoDialog";
import { NovoAgendamentoDialog } from "@/components/agenda/NovoAgendamentoDialog";
import "@/src/styles/calendar-overrides.css";

interface VisitCalendarProps {
  criadoPorId?: number;
  refreshKey?: number;
  novoAgendamentoOpen?: boolean;
  onNovoAgendamentoOpenChange?: (open: boolean) => void;
  onAgendamentoCreated?: () => void;
}

function canManageEvento(
  evento: CalendarioEvento,
  userId: number | undefined,
  isAdmin: boolean,
): boolean {
  return isAdmin || (userId != null && userId === evento.criadoPorId);
}

export function VisitCalendar({
  criadoPorId,
  refreshKey = 0,
  novoAgendamentoOpen = false,
  onNovoAgendamentoOpenChange,
  onAgendamentoCreated,
}: VisitCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const isMobile = useIsMobile();
  const { user, isAdmin } = useAuth();
  const { fetchEvents } = useCalendarioEventos({ criadoPorId });

  const [selectedEvento, setSelectedEvento] = useState<CalendarioEvento | null>(
    null,
  );
  const [eventoDialogOpen, setEventoDialogOpen] = useState(false);
  const [slotDate, setSlotDate] = useState<Date | null>(null);
  const [slotDialogOpen, setSlotDialogOpen] = useState(false);
  const [headerDialogDate] = useState(() => new Date());
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCalendarReady, setIsCalendarReady] = useState(false);

  useEffect(() => {
    setIsCalendarReady(true);
  }, []);

  const initialView = isMobile ? "listWeek" : "dayGridMonth";

  const headerToolbar = useMemo(
    () =>
      isMobile
        ? {
            left: "prev,next",
            center: "title",
            right: "today",
          }
        : {
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
          },
    [isMobile],
  );

  const footerToolbar = useMemo(
    () =>
      isMobile
        ? {
            center: "dayGridMonth,timeGridDay,listWeek",
          }
        : false,
    [isMobile],
  );

  const refetchCalendar = useCallback(() => {
    calendarRef.current?.getApi().refetchEvents();
  }, []);

  useEffect(() => {
    if (!isCalendarReady) {
      return;
    }
    refetchCalendar();
  }, [refreshKey, refetchCalendar, criadoPorId, isCalendarReady]);

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
            : "Erro ao carregar eventos do calendário.";
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
    const evento = info.event.extendedProps.evento as
      | CalendarioEvento
      | undefined;
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
    openSlotDialog(info.date);
  }

  async function persistEventDates(
    info: EventDropArg | EventResizeDoneArg,
  ): Promise<void> {
    const evento = info.event.extendedProps.evento as
      | CalendarioEvento
      | undefined;
    if (!evento) {
      info.revert();
      return;
    }

    if (!canManageEvento(evento, user?.id, isAdmin)) {
      info.revert();
      toast.error("Você não tem permissão para alterar este evento.");
      return;
    }

    const start = info.event.start;
    if (!start) {
      info.revert();
      return;
    }

    const { dataInicio, dataFim } = inclusiveRangeFromFullCalendarEvent(
      start,
      info.event.end,
    );

    try {
      await updateCalendarioEvento(evento.id, { dataInicio, dataFim });
      toast.success("Datas do evento atualizadas.");
      refetchCalendar();
    } catch (error) {
      info.revert();
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o evento.";
      toast.error(message);
    }
  }

  function handleEventoSuccess() {
    refetchCalendar();
    setSlotDialogOpen(false);
    setSlotDate(null);
    onNovoAgendamentoOpenChange?.(false);
    onAgendamentoCreated?.();
  }

  const novoDialogOpen = novoAgendamentoOpen || slotDialogOpen;
  const initialDateForDialog =
    slotDialogOpen && slotDate ? slotDate : headerDialogDate;

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
        <div className="pointer-events-none absolute right-3 top-3 z-10 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground md:right-4 md:top-4">
          Carregando eventos...
        </div>
      ) : null}
      {loadError ? (
        <div className="mb-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {loadError}
        </div>
      ) : null}
      {!isCalendarReady ? (
        <div className="flex h-full min-h-[20rem] items-center justify-center text-sm text-muted-foreground">
          Carregando calendário...
        </div>
      ) : (
        <FullCalendar
          ref={calendarRef}
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            interactionPlugin,
            listPlugin,
          ]}
          locale={ptBrLocale}
          initialView={initialView}
          headerToolbar={headerToolbar}
          footerToolbar={footerToolbar}
          height={isMobile ? "auto" : "100%"}
          contentHeight={isMobile ? "auto" : undefined}
          expandRows={!isMobile}
          dayMaxEvents={isMobile ? 2 : true}
          moreLinkText={(count) => `+${count}`}
          nowIndicator
          selectable
          selectMirror
          editable
          eventStartEditable
          eventDurationEditable
          events={eventsSource}
          eventClick={handleEventClick}
          select={handleDateSelect}
          dateClick={handleDateClick}
          eventDrop={(info) => void persistEventDates(info)}
          eventResize={(info) => void persistEventDates(info)}
          eventAllow={(_dropInfo, draggedEvent) => {
            const evento = draggedEvent?.extendedProps?.evento as
              | CalendarioEvento
              | undefined;
            if (!evento) {
              return false;
            }
            return canManageEvento(evento, user?.id, isAdmin);
          }}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          allDaySlot
          weekends
          buttonText={{
            today: "Hoje",
            month: "Mês",
            week: "Semana",
            day: "Dia",
            list: "Lista",
          }}
        />
      )}

      <EventoDialog
        open={eventoDialogOpen}
        onOpenChange={setEventoDialogOpen}
        evento={selectedEvento}
        onChanged={refetchCalendar}
      />

      <NovoAgendamentoDialog
        open={novoDialogOpen}
        onOpenChange={handleNovoDialogChange}
        initialDate={initialDateForDialog}
        onSuccess={handleEventoSuccess}
      />
    </div>
  );
}
