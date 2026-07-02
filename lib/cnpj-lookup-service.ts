import {
  formatCep,
  formatCnpjInput,
  formatPhoneFromApi,
  sanitizeCnpj,
} from "@/lib/cnpj-utils";

const BRASIL_API_CNPJ_URL = "https://brasilapi.com.br/api/cnpj/v1";

interface BrasilApiCnpjResponse {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  municipio: string;
  uf: string;
  ddd_telefone_1: string | null;
  ddd_telefone_2: string | null;
  email: string | null;
  descricao_tipo_de_logradouro: string | null;
  situacao_cadastral: number;
  descricao_situacao_cadastral: string;
}

export interface CnpjLookupResult {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  endereco: string;
  cep: string;
  cidade: string;
  estado: string;
  telefone: string;
  email: string;
  situacaoCadastral: string;
  isAtiva: boolean;
}

function buildEndereco(data: BrasilApiCnpjResponse): string {
  const numero =
    data.numero?.toUpperCase() === "SN" || !data.numero
      ? "s/n"
      : `nº ${data.numero}`;

  return [
    data.descricao_tipo_de_logradouro,
    data.logradouro,
    numero,
    data.complemento,
    data.bairro,
  ]
    .filter((part) => part && part.trim())
    .join(", ");
}

function mapBrasilApiResponse(data: BrasilApiCnpjResponse): CnpjLookupResult {
  const telefoneRaw = data.ddd_telefone_1 || data.ddd_telefone_2 || "";

  return {
    razaoSocial: data.razao_social?.trim() ?? "",
    nomeFantasia:
      data.nome_fantasia?.trim() || data.razao_social?.trim() || "",
    cnpj: formatCnpjInput(data.cnpj),
    endereco: buildEndereco(data),
    cep: formatCep(data.cep ?? ""),
    cidade: data.municipio?.trim() ?? "",
    estado: data.uf?.trim().toUpperCase() ?? "",
    telefone: telefoneRaw ? formatPhoneFromApi(telefoneRaw) : "",
    email: data.email?.trim() ?? "",
    situacaoCadastral: data.descricao_situacao_cadastral ?? "",
    isAtiva: data.situacao_cadastral === 2,
  };
}

export async function lookupCnpj(cnpj: string): Promise<CnpjLookupResult> {
  const digits = sanitizeCnpj(cnpj);

  if (digits.length !== 14) {
    throw new Error("Informe um CNPJ válido com 14 dígitos.");
  }

  const response = await fetch(`${BRASIL_API_CNPJ_URL}/${digits}`);

  if (response.status === 404) {
    throw new Error("CNPJ não encontrado na base da Receita Federal.");
  }

  if (response.status === 429) {
    throw new Error(
      "Muitas consultas em sequência. Aguarde alguns segundos e tente novamente.",
    );
  }

  if (!response.ok) {
    throw new Error("Não foi possível consultar o CNPJ no momento.");
  }

  const data = (await response.json()) as BrasilApiCnpjResponse;
  return mapBrasilApiResponse(data);
}
