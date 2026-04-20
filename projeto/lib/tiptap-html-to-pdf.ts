/** Converte HTML do TipTap em blocos de texto para o PDF (sem tags, parágrafos e quebras preservados). */
export function tipTapHtmlToPdfParagraphs(
  html: string | null | undefined,
): string[] {
  if (!html?.trim()) {
    return [];
  }

  let s = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  s = s
    .replace(/<\/(p|div|h[1-6])>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ");

  s = s.replace(/<[^>]+>/g, "");
  s = decodeBasicEntities(s);
  s = s.replace(/\u00a0/g, " ").replace(/\n{3,}/g, "\n\n").trim();

  if (!s) {
    return [];
  }

  return s
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function decodeBasicEntities(t: string): string {
  return t
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}
