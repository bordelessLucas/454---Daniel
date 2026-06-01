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
  const allowedTags = [
    "b",
    "i",
    "em",
    "strong",
    "a",
    "p",
    "ul",
    "ol",
    "li",
    "br",
  ];

  const clean = sanitized.replace(
    /<\/?([a-zA-Z0-9]+)(\s[^>]*?)?>/g,
    (tag, tagName, attributes) => {
      const name = String(tagName).toLowerCase();
      if (!allowedTags.includes(name)) {
        return "";
      }

      if (name === "br") {
        return "<br>";
      }

      if (name === "a") {
        if (tag.startsWith("</")) {
          return "</a>";
        }
        const hrefMatch = /href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(
          String(attributes) || "",
        );
        const href = hrefMatch?.[1] ?? hrefMatch?.[2] ?? hrefMatch?.[3] ?? "";
        return href ? `<a href="${href}">` : "<a>";
      }

      if (tag.startsWith("</")) {
        return `</${name}>`;
      }

      return `<${name}>`;
    },
  );

  const textOnly = clean.replace(/<[^>]*>/g, "").trim();
  return textOnly ? clean : "";
}
