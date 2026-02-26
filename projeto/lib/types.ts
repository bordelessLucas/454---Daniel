export type UserRole = "admin" | "tecnico";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "ativo" | "inativo";
  avatar?: string;
}

export interface RamoAtividade {
  id: number;
  nome: string;
}

export interface Contact {
  id: number;
  clienteId: number;
  nome: string;
  cargo: string | null;
  telefone: string | null;
  email: string | null;
  principal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: number;
  clienteId: number;
  numeroContrato: string;
  dataInicio: string;
  dataFim: string;
  valorMensal: number;
  descricaoServicos: string;
  condicoes: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: number;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoEstadual: string | null;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string | null;
  email: string | null;
  ramoAtividadeId: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  ramoAtividade: RamoAtividade;
  contatos: Contact[];
  contratos: Contract[];
}

export interface ApiUser {
  id: number;
  username: string;
  nome: string;
  email: string;
  role: "ADMIN" | "TECNICO";
  clienteId: number | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  cliente?: {
    id: number;
    nomeFantasia: string;
  };
}

// Checklist API
export interface ApiChecklist {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Sector {
  id: number;
  nome: string;
  descricao: string | null;
  createdAt: string;
  updatedAt: string;
}

// Configurações API
export interface ApiConfiguracoes {
  id: number;
  dataInicio: string;
  dataFim: string;
  createdAt: string;
  updatedAt: string;
}

// Tipos para API de Relatórios
export interface ReportTecnico {
  id: number;
  nome: string;
}

export interface ReportContato {
  id: number;
  nome: string;
}

export interface ReportCliente {
  id: number;
  razaoSocial: string;
  nomeFantasia: string;
}

export interface ReportCriadoPor {
  id: number;
  nome: string;
}

export interface ReportSetor {
  id: number;
  setorId: number;
  observacao: string | null;
  setor: {
    id: number;
    nome: string;
    descricao?: string | null;
  };
}

export interface ReportChecklist {
  id: number;
  checklistId: number;
  checklist: {
    id: number;
    nome: string;
    descricao?: string | null;
  };
}

export interface ReportHorario {
  id: number;
  horaChegada: string;
  horaSaida: string;
}

export interface ApiReport {
  id: number;
  clienteId: number;
  contatoId: number | null;
  criadoPorId: number;
  dataVisita: string;
  modalidadeServico?: string;
  observacoes: string | null;
  impresso: boolean;
  createdAt: string;
  updatedAt: string;
  cliente: ReportCliente;
  contato: ReportContato | null;
  criadoPor: ReportCriadoPor;
  tecnicos: ReportTecnico[];
  setores: ReportSetor[];
  horarios: ReportHorario[];
  checklists: ReportChecklist[];
}
