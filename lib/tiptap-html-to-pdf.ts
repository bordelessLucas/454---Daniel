export type ServicoPdfSegment = {
  text: string;
  bold: boolean;
  italic: boolean;
};

export type ServicoPdfBlock = {
  lines: ServicoPdfSegment[][];
};

/** Remove tags que não são inline de ênfase suportadas pelo PDF, mantendo o texto interno. */
function stripUnsupportedTags(html: string): string {
  return html.replace(
    /<\/?([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*>/g,
    (full, tagName: string) => {
      const n = tagName.toLowerCase();
      if (n === "strong" || n === "b" || n === "em" || n === "i") {
        return full;
      }
      return "";
    },
  );
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

function mergeAdjacentSegments(
  segments: ServicoPdfSegment[],
): ServicoPdfSegment[] {
  const out: ServicoPdfSegment[] = [];
  for (const seg of segments) {
    const prev = out[out.length - 1];
    if (
      prev &&
      prev.bold === seg.bold &&
      prev.italic === seg.italic
    ) {
      prev.text += seg.text;
    } else if (seg.text.length > 0) {
      out.push({ ...seg });
    }
  }
  return out;
}

/** Interpreta apenas <strong>/<b> e <em>/<i>; demais marcação vira texto (após strip de tags). */
function parseInlineToSegments(html: string): ServicoPdfSegment[] {
  let bold = false;
  let italic = false;
  let textBuffer = "";
  const segments: ServicoPdfSegment[] = [];

  const pushBuffer = () => {
    if (textBuffer === "") return;
    segments.push({
      text: decodeBasicEntities(textBuffer.replace(/\u00a0/g, " ")),
      bold,
      italic,
    });
    textBuffer = "";
  };

  const re = /<(\/?)(strong|b|em|i)\b[^>]*>/gi;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    textBuffer += html.slice(last, match.index);
    pushBuffer();
    const isClose = match[1] === "/";
    const name = match[2].toLowerCase();
    if (name === "strong" || name === "b") {
      bold = !isClose;
    } else {
      italic = !isClose;
    }
    last = match.index + match[0].length;
  }
  textBuffer += html.slice(last);
  pushBuffer();

  return mergeAdjacentSegments(segments);
}

function stripScriptsAndStyles(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
}

/**
 * Extrai um `<ul>...</ul>` ou `<ol>...</ol>` balanceado a partir de `absoluteFrom`
 * (índice do `<` da tag de abertura).
 */
function consumeBalancedList(
  html: string,
  absoluteFrom: number,
): { ordered: boolean; inner: string; end: number } | null {
  const tail = html.slice(absoluteFrom);
  const header = /^<(ul|ol)\b[^>]*>/i.exec(tail);
  if (!header) {
    return null;
  }
  const tag = header[1].toLowerCase() as "ul" | "ol";
  const openRe = tag === "ul" ? /<ul\b[^>]*>/gi : /<ol\b[^>]*>/gi;
  const closeRe = tag === "ul" ? /<\/ul>/gi : /<\/ol>/gi;

  let pos = header[0].length;
  const innerStartAbs = absoluteFrom + pos;
  let depth = 1;

  while (depth > 0 && pos < tail.length) {
    const fragment = tail.slice(pos);
    openRe.lastIndex = 0;
    closeRe.lastIndex = 0;
    const om = openRe.exec(fragment);
    const cm = closeRe.exec(fragment);
    const openIdx = om ? om.index : Number.POSITIVE_INFINITY;
    const closeIdx = cm ? cm.index : Number.POSITIVE_INFINITY;

    if (closeIdx === Number.POSITIVE_INFINITY) {
      return null;
    }

    if (openIdx < closeIdx && om) {
      depth++;
      pos += openIdx + om[0].length;
    } else if (cm) {
      depth--;
      if (depth === 0) {
        const innerEndAbs = absoluteFrom + pos + closeIdx;
        const endExclusive = innerEndAbs + cm[0].length;
        return {
          ordered: tag === "ol",
          inner: html.slice(innerStartAbs, innerEndAbs),
          end: endExclusive,
        };
      }
      pos += closeIdx + cm[0].length;
    } else {
      return null;
    }
  }

  return null;
}

/**
 * Extrai o conteúdo de cada `<li>...</li>` de primeiro nível (respeita `<li>` aninhados).
 */
function extractDirectLiBodies(listInner: string): string[] {
  const bodies: string[] = [];
  let from = 0;

  while (from < listInner.length) {
    const rel = listInner.slice(from).search(/<li\b/i);
    if (rel < 0) break;
    const liOpenAbs = from + rel;
    const gt = listInner.indexOf(">", liOpenAbs);
    if (gt < 0) break;
    const bodyStart = gt + 1;
    let depth = 1;
    let ptr = bodyStart;

    while (ptr < listInner.length && depth > 0) {
      const frag = listInner.slice(ptr);
      const openM = /<li\b[^>]*>/i.exec(frag);
      const closeM = /<\/li>/i.exec(frag);
      const oi = openM ? openM.index : Number.POSITIVE_INFINITY;
      const ci = closeM ? closeM.index : Number.POSITIVE_INFINITY;
      if (ci === Number.POSITIVE_INFINITY) break;

      if (oi < ci && openM) {
        depth++;
        ptr += oi + openM[0].length;
      } else if (closeM) {
        depth--;
        if (depth === 0) {
          bodies.push(listInner.slice(bodyStart, ptr + ci));
          from = ptr + ci + closeM[0].length;
          break;
        }
        ptr += ci + closeM[0].length;
      } else {
        break;
      }
    }

    if (ptr >= listInner.length && depth > 0) break;
  }

  return bodies;
}

/** Reduz conteúdo interno de um `<li>` a HTML “quase plano” (quebras e ênfase). */
function normalizeLiInnerHtml(fragment: string): string {
  let s = fragment
    .replace(/<\/(p|div|h[1-6])>/gi, "\n")
    .replace(/<p\b[^>]*>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n");

  s = stripUnsupportedTags(s);
  s = s.replace(/[ \t]+\n/g, "\n").replace(/\n[ \t]+/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n").trim();
  return s;
}

function formatListBlock(inner: string, ordered: boolean): string {
  const bodies = extractDirectLiBodies(inner);
  if (bodies.length === 0) {
    return "";
  }

  return bodies
    .map((raw, idx) => {
      const normalized = normalizeLiInnerHtml(raw);
      const line = normalized.replace(/\n+/g, " ").trim();
      if (!line) {
        return ordered ? `${idx + 1}. ` : "• ";
      }
      const prefix = ordered ? `${idx + 1}. ` : "• ";
      return prefix + line;
    })
    .join("\n");
}

/**
 * Substitui todos os `<ul>` e `<ol>` por blocos de texto com prefixos e quebras `\n` entre itens.
 */
function replaceListTagsWithPlainText(html: string): string {
  let out = "";
  let cursor = 0;

  while (cursor < html.length) {
    const slice = html.slice(cursor);
    const ulRel = slice.search(/<ul\b/i);
    const olRel = slice.search(/<ol\b/i);
    let nextRel = -1;

    if (ulRel >= 0 && (olRel < 0 || ulRel <= olRel)) {
      nextRel = ulRel;
    } else if (olRel >= 0) {
      nextRel = olRel;
    }

    if (nextRel < 0) {
      out += html.slice(cursor);
      break;
    }

    const absStart = cursor + nextRel;
    out += html.slice(cursor, absStart);

    const consumed = consumeBalancedList(html, absStart);
    if (!consumed) {
      out += html[absStart];
      cursor = absStart + 1;
      continue;
    }

    const block = formatListBlock(consumed.inner, consumed.ordered);
    if (block) {
      out += `\n\n${block}\n\n`;
    }
    cursor = consumed.end;
  }

  return out;
}

/**
 * Converte HTML do TipTap em parágrafos (cada string pode conter `\n` para itens de lista).
 * `<ul>` gera linhas `• …`; `<ol>` gera `1.` `2.` …; quebras reais `\n` entre itens são preservadas.
 */
export function tipTapHtmlToPdfParagraphs(
  html: string | null | undefined,
): string[] {
  if (!html?.trim()) {
    return [];
  }

  let s = stripScriptsAndStyles(html);
  s = replaceListTagsWithPlainText(s);

  s = s
    .replace(/<\/(p|div|h[1-6])>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n");

  s = stripUnsupportedTags(s);
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

/**
 * Converte HTML do TipTap em blocos com segmentos estilizados para o PDF
 * (negrito/itálico; listas viram linhas com prefixo • ou 1. 2. …).
 */
export function tipTapHtmlToServicoPdfBlocks(
  html: string | null | undefined,
): ServicoPdfBlock[] {
  const paragraphs = tipTapHtmlToPdfParagraphs(html);
  if (paragraphs.length === 0) {
    return [];
  }

  const blocks: ServicoPdfBlock[] = [];

  for (const rawPara of paragraphs) {
    const lines: ServicoPdfSegment[][] = [];
    for (const rawLine of rawPara.split("\n")) {
      const line = rawLine.trim();
      const segs = parseInlineToSegments(line);
      if (segs.length === 0 && line === "") {
        continue;
      }
      if (segs.length === 0) {
        lines.push([{ text: " ", bold: false, italic: false }]);
      } else {
        lines.push(segs);
      }
    }

    if (lines.length > 0) {
      blocks.push({ lines });
    }
  }

  return blocks;
}
