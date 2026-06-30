import { useAuth } from "@/lib/auth-context";
import { useClientes } from "@/hooks/use-clientes";
import { useTecnicos } from "@/hooks/use-tecnicos";
import { useUnidades } from "@/hooks/use-unidades";
import { useSetores } from "@/hooks/use-setores";
import { Button, Label } from "@/components/index";
import { SelectionField } from "@/components/selection-field";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { Filter } from "lucide-react";

export interface DashboardFilterDraft {
  dataInicio: string;
  dataFim: string;
  unidadeId: string;
  tecnicoId: string;
  clienteId: string;
  setorId: string;
}

interface DashboardFiltersProps {
  draft: DashboardFilterDraft;
  onDraftChange: (next: DashboardFilterDraft) => void;
  onApply: () => void;
  isApplying?: boolean;
}

export function DashboardFilters({
  draft,
  onDraftChange,
  onApply,
  isApplying,
}: DashboardFiltersProps) {
  const { isAdmin } = useAuth();
  const { unidades, loading: loadingUnidades } = useUnidades();
  const { tecnicos, loading: loadingTecnicos } = useTecnicos();
  const { clientes, loading: loadingClientes } = useClientes();
  const { setores, loading: loadingSetores } = useSetores();

  const unidadeOptions = [
    { value: "", label: "Todas as unidades" },
    ...unidades.map((unidade) => ({
      value: String(unidade.id),
      label: unidade.nome,
    })),
  ];

  const tecnicoOptions = [
    { value: "", label: "Todos os técnicos" },
    ...tecnicos.map((tecnico) => ({
      value: String(tecnico.id),
      label: tecnico.nome,
      searchText: [tecnico.nome, tecnico.username, tecnico.email]
        .filter(Boolean)
        .join(" "),
    })),
  ];

  const clienteOptions = [
    { value: "", label: "Todos os clientes" },
    ...clientes.map((cliente) => ({
      value: String(cliente.id),
      label: cliente.nomeFantasia,
      searchText: [cliente.nomeFantasia, cliente.razaoSocial, cliente.cnpj]
        .filter(Boolean)
        .join(" "),
    })),
  ];

  const setorOptions = [
    { value: "", label: "Todos os setores" },
    ...setores.map((setor) => ({
      value: String(setor.id),
      label: setor.nome,
      searchText: [setor.nome, setor.descricao].filter(Boolean).join(" "),
    })),
  ];

  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium">
        <Filter className="h-4 w-4" />
        Filtros
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <div className="space-y-2 md:col-span-2 lg:col-span-1">
          <Label>Período</Label>
          <DateRangePicker
            dataInicio={draft.dataInicio}
            dataFim={draft.dataFim}
            onChange={({ dataInicio, dataFim }) =>
              onDraftChange({ ...draft, dataInicio, dataFim })
            }
          />
        </div>

        {isAdmin ? (
          <>
            <SelectionField
              label="Unidade"
              placeholder="Todas as unidades"
              value={draft.unidadeId}
              onChange={(value) =>
                onDraftChange({
                  ...draft,
                  unidadeId: typeof value === "string" ? value : "",
                })
              }
              options={unidadeOptions}
              disabled={loadingUnidades}
              searchable
            />
            <SelectionField
              label="Técnico"
              placeholder="Todos os técnicos"
              value={draft.tecnicoId}
              onChange={(value) =>
                onDraftChange({
                  ...draft,
                  tecnicoId: typeof value === "string" ? value : "",
                })
              }
              options={tecnicoOptions}
              disabled={loadingTecnicos}
              searchable
            />
            <SelectionField
              label="Cliente"
              placeholder="Todos os clientes"
              value={draft.clienteId}
              onChange={(value) =>
                onDraftChange({
                  ...draft,
                  clienteId: typeof value === "string" ? value : "",
                })
              }
              options={clienteOptions}
              disabled={loadingClientes}
              searchable
            />
            <SelectionField
              label="Setor"
              placeholder="Todos os setores"
              value={draft.setorId}
              onChange={(value) =>
                onDraftChange({
                  ...draft,
                  setorId: typeof value === "string" ? value : "",
                })
              }
              options={setorOptions}
              disabled={loadingSetores}
              searchable
            />
          </>
        ) : null}
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="button" onClick={onApply} disabled={isApplying}>
          Aplicar Filtros
        </Button>
      </div>
    </div>
  );
}
