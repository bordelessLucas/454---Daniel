/**
 * Sanitização leve antes de repassar HTML ao TipTap (remove script/style e handlers inline).
 * O backend aplica sanitize-html na persistência; aqui evitamos conteúdo óbvio no cliente.
 */
const MAX_RICH_TEXT_LENGTH = 50_000;

export function sanitizeTipTapHtmlInput(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.length > MAX_RICH_TEXT_LENGTH) {
    throw new Error(
      `Conteúdo excede o limite de ${MAX_RICH_TEXT_LENGTH} caracteres.`,
    );
  }

  return trimmed
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

/** Sanitiza e retorna string vazia se não houver texto visível. */
export function sanitizeTipTapHtmlForSave(html: string): string {
  const sanitized = sanitizeTipTapHtmlInput(html);
  const textOnly = sanitized.replace(/<[^>]*>/g, "").trim();
  return textOnly ? sanitized : "";
}
