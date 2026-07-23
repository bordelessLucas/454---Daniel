import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTecnicos } from "@/hooks/use-tecnicos";
import { PageHeader } from "@/components/page-header";
import { VisitCalendar } from "@/components/agenda/VisitCalendar";
import { Button, Label, Select } from "@/components/index";

export default function AgendaPage() {
  const { user, isAdmin } = useAuth();
  const { tecnicos, loading: loadingTecnicos } = useTecnicos();
  const [tecnicoFilter, setTecnicoFilter] = useState<string>("all");
  const [novoAgendamentoOpen, setNovoAgendamentoOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isAdmin && user) {
      setTecnicoFilter(String(user.id));
    }
  }, [isAdmin, user]);

  const tecnicoId = useMemo(() => {
    if (!isAdmin) {
      return user?.id;
    }
    if (tecnicoFilter === "all") {
      return undefined;
    }
    return Number(tecnicoFilter);
  }, [isAdmin, user?.id, tecnicoFilter]);

  return (
    <div className="flex min-h-[32rem] flex-col gap-4 md:h-[calc(100vh-7rem)]">
      <PageHeader
        title="Agenda de Visitas"
        description="Visualize, agende e reagende visitas técnicas no calendário."
        action={
          <Button
            type="button"
            onClick={() => setNovoAgendamentoOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Agendamento
          </Button>
        }
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[12rem] flex-1 space-y-2 sm:max-w-xs">
          <Label htmlFor="agenda-tecnico">Técnico</Label>
          <Select
            id="agenda-tecnico"
            value={tecnicoFilter}
            disabled={!isAdmin || loadingTecnicos}
            onChange={(event) => setTecnicoFilter(event.target.value)}
          >
            {isAdmin ? <option value="all">Todos os técnicos</option> : null}
            {!isAdmin && user && !tecnicos.some((t) => t.id === user.id) ? (
              <option value={String(user.id)}>{user.nome}</option>
            ) : null}
            {tecnicos.map((tecnico) => (
              <option key={tecnico.id} value={String(tecnico.id)}>
                {tecnico.nome}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <VisitCalendar
        tecnicoId={tecnicoId}
        refreshKey={refreshKey}
        novoAgendamentoOpen={novoAgendamentoOpen}
        onNovoAgendamentoOpenChange={setNovoAgendamentoOpen}
        onAgendamentoCreated={() => setRefreshKey((prev) => prev + 1)}
      />
    </div>
  );
}
