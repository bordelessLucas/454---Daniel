/**
 * Sanitização leve antes de repassar HTML ao TipTap (remove script/style e handlers inline).
 * O próprio TipTap ainda descarta nós que não existem no schema das extensões.
 */
export function sanitizeTipTapHtmlInput(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}
