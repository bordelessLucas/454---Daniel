import { Modal } from "./Modal";
import { Button } from "./Button";
import { Label } from "./Label";
import { Input } from "./Input";
import { Select } from "./Select";
import { useRamosAtividade } from "@/hooks/use-ramos-atividade";

export interface ClientsFilters {
  nomeFantasia: string;
  cnpj: string;
  ramoAtividade: string;
}

interface ClientsFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ClientsFilters;
  onFiltersChange: (filters: ClientsFilters) => void;
}

export function ClientsFilterModal({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
}: ClientsFilterModalProps) {
  // Buscar ramos de atividade da API
  const { ramos: ramosAtividade, loading: loadingRamos } = useRamosAtividade();
  const handleReset = () => {
    onFiltersChange({
      nomeFantasia: "",
      cnpj: "",
      ramoAtividade: "all",
    });
  };

  const handleApply = () => {
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Filtrar Clientes">
      <p className="mb-4 text-sm text-muted-foreground">
        Aplique filtros para refinar sua busca
      </p>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="filter-nome-fantasia">Nome Fantasia</Label>
          <Input
            id="filter-nome-fantasia"
            placeholder="Digite o nome fantasia"
            value={filters.nomeFantasia}
            onChange={(e) =>
              onFiltersChange({ ...filters, nomeFantasia: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-cnpj">CNPJ</Label>
          <Input
            id="filter-cnpj"
            placeholder="00.000.000/0000-00"
            value={filters.cnpj}
            onChange={(e) =>
              onFiltersChange({ ...filters, cnpj: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-ramo">Ramo de Atividade</Label>
          <Select
            id="filter-ramo"
            value={filters.ramoAtividade}
            onChange={(e) =>
              onFiltersChange({ ...filters, ramoAtividade: e.target.value })
            }
            disabled={loadingRamos}
          >
            <option value="all">
              {loadingRamos ? "Carregando..." : "Todos os ramos"}
            </option>
            {ramosAtividade.map((ramo) => (
              <option key={ramo.id} value={ramo.id.toString()}>
                {ramo.nome}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleReset}>
            Limpar Filtros
          </Button>
          <Button onClick={handleApply}>Aplicar Filtros</Button>
        </div>
      </div>
    </Modal>
  );
}
