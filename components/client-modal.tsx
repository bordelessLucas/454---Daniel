"use client";

import { useState, useEffect } from "react";
import type { Client, Contact, Contract, RamoAtividade } from "@/lib/types";
import { createClient, updateClient } from "@/lib/clients-service";
import { useRamosAtividade } from "@/hooks/use-ramos-atividade";
import { Button } from "./Button";
import { Input } from "./Input";
import { Label } from "./Label";
import { Modal } from "./Modal";
import { ContactModal } from "./contact-modal";
import { ContractModal } from "./contract-modal";
import { Select } from "./Select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./Table";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface ClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSave?: (client: Client) => void;
}

const emptyForm = {
  razaoSocial: "",
  nomeFantasia: "",
  cnpj: "",
  ramoAtividadeId: "",
  inscricaoEstadual: "",
  endereco: "",
  cep: "",
  estado: "",
  cidade: "",
  telefone: "",
  email: "",
};

export function ClientModal({
  open,
  onOpenChange,
  client,
  onSave,
}: ClientModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [contatos, setContatos] = useState<Contact[]>([]);
  const [contratos, setContratos] = useState<Contract[]>([]);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar ramos de atividade da API
  const { ramos: ramosAtividade, loading: loadingRamos } = useRamosAtividade();

  const formatContractDateForApi = (value: string): string => {
    if (!value) return value;

    const dateOnly = value.includes("T") ? value.split("T")[0] : value;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
      return `${dateOnly}T00:00:00.000Z`;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
  };

  useEffect(() => {
    if (client) {
      setForm({
        razaoSocial: client.razaoSocial,
        nomeFantasia: client.nomeFantasia,
        cnpj: client.cnpj,
        ramoAtividadeId: client.ramoAtividadeId.toString(),
        inscricaoEstadual: client.inscricaoEstadual || "",
        endereco: client.endereco,
        cep: client.cep,
        estado: client.estado,
        cidade: client.cidade,
        telefone: client.telefone || "",
        email: client.email || "",
      });
      setContatos(client.contatos || []);
      setContratos(client.contratos || []);
    } else {
      setForm(emptyForm);
      setContatos([]);
      setContratos([]);
    }
  }, [client, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que há pelo menos um contato e um contrato
    if (contatos.length === 0) {
      toast.error("Adicione pelo menos um contato");
      return;
    }

    if (contratos.length === 0) {
      toast.error("Adicione pelo menos um contrato");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        razaoSocial: form.razaoSocial,
        nomeFantasia: form.nomeFantasia,
        cnpj: form.cnpj,
        inscricaoEstadual: form.inscricaoEstadual || undefined,
        endereco: form.endereco,
        cidade: form.cidade,
        estado: form.estado,
        cep: form.cep,
        telefone: form.telefone || undefined,
        email: form.email || undefined,
        ramoAtividadeId: parseInt(form.ramoAtividadeId),
      };

      let result: Client;

      if (client) {
        // Atualizar cliente usando mesmo formato de contato/contrato do create
        result = await updateClient(client.id, {
          ...payload,
          contato: {
            nome: contatos[0].nome,
            cargo: contatos[0].cargo || undefined,
            telefone: contatos[0].telefone || undefined,
            email: contatos[0].email || undefined,
            principal: contatos[0].principal,
          },
          contrato: {
            numeroContrato: contratos[0].numeroContrato,
            dataInicio: formatContractDateForApi(contratos[0].dataInicio),
            dataFim: formatContractDateForApi(contratos[0].dataFim),
            valorMensal: contratos[0].valorMensal,
            descricaoServicos: contratos[0].descricaoServicos,
            condicoes: contratos[0].condicoes || undefined,
          },
        });
        toast.success("Cliente atualizado com sucesso");
      } else {
        // Criar novo cliente (enviar apenas o primeiro contato e contrato)
        const createPayload = {
          ...payload,
          contato: {
            nome: contatos[0].nome,
            cargo: contatos[0].cargo || undefined,
            telefone: contatos[0].telefone || undefined,
            email: contatos[0].email || undefined,
            principal: contatos[0].principal,
          },
          contrato: {
            numeroContrato: contratos[0].numeroContrato,
            dataInicio: formatContractDateForApi(contratos[0].dataInicio),
            dataFim: formatContractDateForApi(contratos[0].dataFim),
            valorMensal: contratos[0].valorMensal,
            descricaoServicos: contratos[0].descricaoServicos,
            condicoes: contratos[0].condicoes || undefined,
          },
        };
        result = await createClient(createPayload);
        toast.success("Cliente criado com sucesso");
      }

      onSave?.(result);
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao salvar cliente";
      toast.error(message);
      console.error("Erro ao salvar cliente:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveContact = (
    contactData: Omit<
      Contact,
      "id" | "clienteId" | "createdAt" | "updatedAt"
    > & {
      id?: number;
    },
  ) => {
    if (contactData.id) {
      setContatos((prev) =>
        prev.map((c) =>
          c.id === contactData.id ? { ...c, ...contactData } : c,
        ),
      );
    } else {
      const newContact: Contact = {
        ...contactData,
        id: Date.now(),
        clienteId: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Contact;
      setContatos((prev) => [...prev, newContact]);
    }
    setEditingContact(null);
  };

  const handleDeleteContact = (id: number) => {
    setContatos((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSaveContract = (
    contractData: Omit<
      Contract,
      "id" | "clienteId" | "createdAt" | "updatedAt"
    > & {
      id?: number;
    },
  ) => {
    if (contractData.id) {
      setContratos((prev) =>
        prev.map((c) =>
          c.id === contractData.id ? { ...c, ...contractData } : c,
        ),
      );
    } else {
      const newContract: Contract = {
        ...contractData,
        id: Date.now(),
        clienteId: 0,
        ativo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Contract;
      setContratos((prev) => [...prev, newContract]);
    }
    setEditingContract(null);
  };

  const handleDeleteContract = (id: number) => {
    setContratos((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <>
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title={client ? "Editar Cliente" : "Novo Cliente"}
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              Informações Básicas
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="razaoSocial">
                  Razão Social <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="razaoSocial"
                  value={form.razaoSocial}
                  onChange={(e) =>
                    setForm({ ...form, razaoSocial: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nomeFantasia">
                  Nome Fantasia <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nomeFantasia"
                  value={form.nomeFantasia}
                  onChange={(e) =>
                    setForm({ ...form, nomeFantasia: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cnpj">
                  CNPJ <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cnpj"
                  value={form.cnpj}
                  onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ramoAtividadeId">
                  Ramo de Atividade <span className="text-destructive">*</span>
                </Label>
                <Select
                  id="ramoAtividadeId"
                  value={form.ramoAtividadeId}
                  onChange={(e) =>
                    setForm({ ...form, ramoAtividadeId: e.target.value })
                  }
                  disabled={loadingRamos}
                  required
                >
                  <option value="">
                    {loadingRamos ? "Carregando..." : "Selecione um ramo"}
                  </option>
                  {ramosAtividade.map((ramo) => (
                    <option key={ramo.id} value={ramo.id.toString()}>
                      {ramo.nome}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
                <Input
                  id="inscricaoEstadual"
                  value={form.inscricaoEstadual}
                  onChange={(e) =>
                    setForm({ ...form, inscricaoEstadual: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={form.telefone}
                  onChange={(e) =>
                    setForm({ ...form, telefone: e.target.value })
                  }
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="empresa@example.com"
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Endereço</h3>
            <div className="space-y-2">
              <Label htmlFor="endereco">
                Endereço <span className="text-destructive">*</span>
              </Label>
              <Input
                id="endereco"
                value={form.endereco}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                placeholder="Rua, número, complemento"
                required
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep">
                  CEP <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cep"
                  value={form.cep}
                  onChange={(e) => setForm({ ...form, cep: e.target.value })}
                  placeholder="00000-000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cidade">
                  Cidade <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cidade"
                  value={form.cidade}
                  onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                  required
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="estado">
                  Estado <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="estado"
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  placeholder="SP"
                  maxLength={2}
                  required
                />
              </div>
            </div>
          </div>

          {/* Contatos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Contatos ({contatos.length})
              </h3>
              {contatos.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>Mínimo 1 contato necessário</span>
                </div>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingContact(null);
                  setContactModalOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Contato
              </Button>
            </div>

            {contatos.length > 0 && (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead className="w-20 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contatos.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">
                          {contact.nome}
                        </TableCell>
                        <TableCell>{contact.email || "-"}</TableCell>
                        <TableCell>{contact.telefone || "-"}</TableCell>
                        <TableCell>{contact.cargo || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingContact(contact);
                                setContactModalOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteContact(contact.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Contratos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Contratos ({contratos.length})
              </h3>
              {contratos.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>Mínimo 1 contrato necessário</span>
                </div>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingContract(null);
                  setContractModalOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Contrato
              </Button>
            </div>

            {contratos.length > 0 && (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Valor Mensal</TableHead>
                      <TableHead>Início</TableHead>
                      <TableHead>Fim</TableHead>
                      <TableHead className="w-20 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contratos.map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell className="font-medium">
                          {contract.numeroContrato}
                        </TableCell>
                        <TableCell>
                          R${" "}
                          {(contract.valorMensal || 0).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>
                          {new Date(contract.dataInicio).toLocaleDateString(
                            "pt-BR",
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(contract.dataFim).toLocaleDateString(
                            "pt-BR",
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingContract(contract);
                                setContractModalOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteContract(contract.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : client ? (
                "Salvar Alterações"
              ) : (
                "Criar Cliente"
              )}
            </Button>
          </div>
        </form>
      </Modal>

      <ContactModal
        open={contactModalOpen}
        onOpenChange={setContactModalOpen}
        contact={editingContact}
        onSave={handleSaveContact}
      />

      <ContractModal
        open={contractModalOpen}
        onOpenChange={setContractModalOpen}
        contract={editingContract}
        onSave={handleSaveContract}
      />
    </>
  );
}
