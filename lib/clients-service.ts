import type { Client } from "./types";
import { apiRequest } from "./api-client";

export interface CreateClientPayload {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoEstadual?: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone?: string;
  email?: string;
  ramoAtividadeId: number;
  contato: {
    nome: string;
    cargo?: string;
    telefone?: string;
    email?: string;
    principal?: boolean;
  };
  contrato: {
    numeroContrato: string;
    dataInicio: string;
    dataFim: string;
    valorMensal: number;
    descricaoServicos: string;
    condicoes?: string;
  };
}

export interface UpdateClientPayload extends Omit<
  CreateClientPayload,
  "contato" | "contrato"
> {
  contato?: {
    nome: string;
    cargo?: string;
    telefone?: string;
    email?: string;
    principal?: boolean;
  };
  contrato?: {
    numeroContrato: string;
    dataInicio: string;
    dataFim: string;
    valorMensal: number;
    descricaoServicos: string;
    condicoes?: string;
  };
}

export async function createClient(data: CreateClientPayload): Promise<Client> {
  return apiRequest<Client>("/clientes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateClient(
  id: number,
  data: UpdateClientPayload,
): Promise<Client> {
  return apiRequest<Client>(`/clientes/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteClient(id: number): Promise<void> {
  return apiRequest<void>(`/clientes/${id}`, {
    method: "DELETE",
  });
}

export async function getClient(id: number): Promise<Client> {
  return apiRequest<Client>(`/clientes/${id}`);
}
