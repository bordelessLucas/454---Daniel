import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Label } from "./Label";
import { Input } from "./Input";
import { Textarea } from "./Textarea";
import type { Contract } from "@/lib/types";

interface ContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract | null;
  onSave: (
    contract: Omit<Contract, "id" | "clienteId" | "createdAt" | "updatedAt"> & {
      id?: number;
    },
  ) => void;
}

export function ContractModal({
  open,
  onOpenChange,
  contract,
  onSave,
}: ContractModalProps) {
  const [formData, setFormData] = useState({
    numeroContrato: "",
    valorMensal: "",
    dataInicio: "",
    dataFim: "",
    descricaoServicos: "",
    condicoes: "",
  });

  useEffect(() => {
    if (contract) {
      setFormData({
        numeroContrato: contract.numeroContrato,
        valorMensal: contract.valorMensal.toString(),
        dataInicio: contract.dataInicio.split("T")[0],
        dataFim: contract.dataFim.split("T")[0],
        descricaoServicos: contract.descricaoServicos,
        condicoes: contract.condicoes || "",
      });
    } else {
      setFormData({
        numeroContrato: "",
        valorMensal: "",
        dataInicio: "",
        dataFim: "",
        descricaoServicos: "",
        condicoes: "",
      });
    }
  }, [contract, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      contract
        ? {
            ...formData,
            id: contract.id,
            valorMensal: parseFloat(formData.valorMensal),
            ativo: true,
          }
        : {
            ...formData,
            valorMensal: parseFloat(formData.valorMensal),
            ativo: true,
          },
    );
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={contract ? "Editar Contrato" : "Novo Contrato"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="contract-number">
            Número do Contrato <span className="text-destructive">*</span>
          </Label>
          <Input
            id="contract-number"
            value={formData.numeroContrato}
            onChange={(e) =>
              setFormData({ ...formData, numeroContrato: e.target.value })
            }
            placeholder="CONT-2024-001"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contract-value">
            Valor Mensal (R$) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="contract-value"
            type="number"
            step="0.01"
            min="0"
            value={formData.valorMensal}
            onChange={(e) =>
              setFormData({ ...formData, valorMensal: e.target.value })
            }
            placeholder="15000.00"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contract-start">
              Data Início <span className="text-destructive">*</span>
            </Label>
            <Input
              id="contract-start"
              type="date"
              value={formData.dataInicio}
              onChange={(e) =>
                setFormData({ ...formData, dataInicio: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contract-end">
              Data Fim <span className="text-destructive">*</span>
            </Label>
            <Input
              id="contract-end"
              type="date"
              value={formData.dataFim}
              onChange={(e) =>
                setFormData({ ...formData, dataFim: e.target.value })
              }
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contract-description">
            Descrição dos Serviços <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="contract-description"
            value={formData.descricaoServicos}
            onChange={(e) =>
              setFormData({ ...formData, descricaoServicos: e.target.value })
            }
            placeholder="Descreva os serviços inclusos neste contrato..."
            rows={3}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contract-conditions">Condições</Label>
          <Textarea
            id="contract-conditions"
            value={formData.condicoes}
            onChange={(e) =>
              setFormData({ ...formData, condicoes: e.target.value })
            }
            placeholder="Descreva as condições do contrato (opcional)..."
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="submit">
            {contract ? "Salvar Alterações" : "Adicionar Contrato"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
