import { resolveLogoForPdfEmbed } from "@/lib/configuracao-logo";
import { getConfiguracoesPdf } from "@/lib/configuracoes-service";
import type { ApiConfiguracoesPdf } from "@/lib/types";

export type BuildRelatorioPdfOptions = {
  logoUrl?: string;
  footer?: RelatorioPdfFooterConfig;
};

export type RelatorioPdfFooterConfig = {
  /** Linhas exibidas à esquerda no rodapé (endereço, contato, etc.). */
  lines: string[];
  websiteTitle?: string;
  websiteSubtitle?: string;
};

const DEFAULT_FOOTER_LINES = [
  "LINQ INFORMÁTICA",
  "Rua Geraldo Pereira, 338 - Sala 704",
  "Alto da Bronze, Estrela/RS - CEP: 95.880-000",
  "Suporte: 51 3720-4462",
] as const;

/** Converte texto do rodapé (texto puro ou HTML simples) em linhas para o PDF. */
export function rodapeTextoToLines(raw: string): string[] {
  const text = raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\r\n/g, "\n");

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Converte configurações da API em props do rodapé do PDF. */
export function mapConfiguracoesToPdfFooter(
  config: ApiConfiguracoesPdf,
): RelatorioPdfFooterConfig {
  const raw = config.textoRodapeRelatorio?.trim() ?? "";
  const lines =
    raw.length > 0 ? rodapeTextoToLines(raw) : [...DEFAULT_FOOTER_LINES];

  return {
    lines,
    websiteTitle: "linqbr",
    websiteSubtitle: "www.linq.com.br",
  };
}

export function getDefaultPdfFooter(): RelatorioPdfFooterConfig {
  return {
    lines: [...DEFAULT_FOOTER_LINES],
    websiteTitle: "linqbr",
    websiteSubtitle: "www.linq.com.br",
  };
}

/**
 * Carrega logo + rodapé para o PDF gerado no browser (react-pdf).
 * A logo vem de GET /configuracoes/pdf e é embutida em base64 no header e footer do PDF.
 */
export async function loadRelatorioPdfBuildOptions(): Promise<BuildRelatorioPdfOptions> {
  try {
    const config = await getConfiguracoesPdf();
    const logoUrl = await resolveLogoForPdfEmbed(config.logoUrl);
    return {
      footer: mapConfiguracoesToPdfFooter(config),
      logoUrl,
    };
  } catch {
    return {};
  }
}
