export type UserRole = "ADMIN" | "TECNICO";

export interface AuthUser {
  id: number;
  username: string;
  nome: string;
  role: UserRole;
  clienteId: number | null;
  unidadeId: number | null;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface CreateUserPayload {
  username: string;
  password: string;
  nome: string;
  email: string;
  role: UserRole;
  clienteId?: number;
}

export type User = AuthUser;

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
export type ChecklistItem = {
  id: number;
  checklistId: number;
  texto: string;
  ordem: number;
  createdAt: string;
  updatedAt: string;
};

export type Checklist = {
  id: number;
  nome: string;
  descricao: string | null;
  indice: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  itens: ChecklistItem[];
};

export type ApiChecklist = Checklist;

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
  /** Texto do rodapé do relatório/PDF (coluna `texto_rodape_relatorio`). */
  textoRodapeRelatorio?: string | null;
  /** URL pública da logo do sistema (PDF, sidebar, etc.). */
  logoUrl?: string | null;
  /** Data URL da logo (opcional; prioridade sobre logoUrl no preview). */
  logoDataUrl?: string | null;
}

/** Configurações públicas para PDF/sidebar (sem horário de login). */
export interface ApiConfiguracoesPdf {
  logoUrl?: string | null;
  /** Data URL da logo (opcional; prioridade sobre logoUrl no preview). */
  logoDataUrl?: string | null;
  textoRodapeRelatorio?: string | null;
}

export type AuditAction = "CREATE" | "UPDATE" | "DELETE";

export interface ApiAuditLog {
  id: number;
  relatorioId: number;
  usuarioId: number;
  acao: AuditAction;
  timestamp: string;
  usuario: {
    id: number;
    nome: string;
    username: string;
  };
}

// Tipos para API de Relatórios
export interface ReportTecnico {
  id: number;
  nome: string;
}

export interface ReportContato {
  id: number;
  nome: string;
  cargo?: string | null;
}

export interface ReportCliente {
  id: number;
  razaoSocial: string;
  nomeFantasia: string;
  /** Presentes na API quando o backend envia o cliente completo (ex.: PDF). */
  cidade?: string;
  estado?: string;
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
    itens?: ChecklistItem[];
  };
}

export interface ReportHorario {
  id: number;
  relatorioId?: number;
  periodo?: "Manhã" | "Tarde" | "Noite";
  horaChegada: string;
  horaSaida: string;
  horaChegadaHhmm?: string;
  horaSaidaHhmm?: string;
  totalHoras?: string;
}

export interface ApiReport {
  id: number;
  clienteId: number;
  contatoId: number | null;
  contatoCargo?: string | null;
  criadoPorId: number;
  dataVisita: string;
  dataVisitaHhmm?: string;
  modalidadeServico?: string;
  numeroContrato?: string | null;
  localizacaoCidade?: string | null;
  localizacaoEstado?: string | null;
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
