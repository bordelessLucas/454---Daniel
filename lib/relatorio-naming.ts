import { sanitizeFilename } from "@/lib/utils";

/** Prefixo exibido na aplicação e no nome do arquivo PDF. */
export const RELATORIO_TECNICO_PREFIX = "Relatório Técnico";

/**
 * Título do relatório na UI (listagem, detalhe, formulário, PDF).
 * O número é o `id` do banco (ordem crescente: 1, 2, 3…).
 */
export function formatRelatorioTitulo(numeroRelatorio: number): string {
  return `${RELATORIO_TECNICO_PREFIX} - ${numeroRelatorio}`;
}

/** Nome do arquivo ao baixar o PDF: Relatório Técnico - [número].pdf */
export function buildRelatorioPdfFilename(numeroRelatorio: number): string {
  return sanitizeFilename(`${formatRelatorioTitulo(numeroRelatorio)}.pdf`);
}
