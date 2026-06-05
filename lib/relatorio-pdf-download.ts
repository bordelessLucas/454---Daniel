import { buildRelatorioPdfBlob } from "@/components/RelatorioPDF";
import { ApiError, apiRequestBlob } from "@/lib/api-client";
import { buildRelatorioPdfFilename } from "@/lib/relatorio-naming";
import { loadRelatorioPdfBuildOptions } from "@/lib/relatorio-pdf-footer";
import { fetchRelatorioParaPdf } from "@/lib/relatorios-service";

/** `server` = PDF binário do backend (Puppeteer). `client` = react-pdf no browser (legado). */
export type PdfGeneratorMode = "server" | "client";

const PDF_FILE_ENDPOINT = "/relatorios";

export function getPdfGeneratorMode(): PdfGeneratorMode {
  const mode = import.meta.env.VITE_PDF_GENERATOR?.trim().toLowerCase();
  return mode === "client" ? "client" : "server";
}

/**
 * Baixa o PDF gerado no servidor (Puppeteer).
 * Rota: GET /relatorios/:id/pdf-file
 * A logo vem do disco do backend (/uploads/system-logo.*), configurada em POST /configuracoes/logo.
 * Não enviar logo nem body nesta requisição.
 */
export async function fetchRelatorioPdfFile(reportId: number) {
  return apiRequestBlob(`${PDF_FILE_ENDPOINT}/${reportId}/pdf-file`, {
    method: "GET",
    headers: {
      Accept: "application/pdf",
    },
  });
}

async function buildRelatorioPdfClient(reportId: number) {
  const [relatorioPdf, pdfOptions] = await Promise.all([
    fetchRelatorioParaPdf(reportId),
    loadRelatorioPdfBuildOptions(),
  ]);

  const blob = await buildRelatorioPdfBlob(relatorioPdf, pdfOptions);

  return {
    blob,
    filename: buildRelatorioPdfFilename(reportId),
  };
}

function shouldFallbackToClientPdf(error: unknown): boolean {
  if (!(error instanceof ApiError)) {
    return false;
  }

  // Endpoint ainda não deployado ou serviço temporariamente indisponível.
  return [404, 501, 503].includes(error.status);
}

function isPdfContentType(contentType: string | null): boolean {
  if (!contentType) {
    return true;
  }

  return contentType.toLowerCase().includes("pdf");
}

/**
 * Obtém o blob do PDF do relatório.
 * Padrão: servidor (GET /relatorios/:id/pdf-file).
 * Fallback automático para react-pdf local se o endpoint ainda não existir.
 */
export async function downloadRelatorioPdf(reportId: number): Promise<{
  blob: Blob;
  filename: string;
  source: PdfGeneratorMode;
}> {
  const defaultFilename = buildRelatorioPdfFilename(reportId);

  if (getPdfGeneratorMode() === "client") {
    const result = await buildRelatorioPdfClient(reportId);
    return { ...result, source: "client" };
  }

  try {
    const { blob, filename, contentType } =
      await fetchRelatorioPdfFile(reportId);

    if (!isPdfContentType(contentType)) {
      throw new ApiError(
        502,
        "Bad Gateway",
        JSON.stringify({ error: "Resposta do servidor não é um PDF válido." }),
      );
    }

    if (!blob || blob.size === 0) {
      throw new ApiError(
        502,
        "Bad Gateway",
        JSON.stringify({ error: "PDF vazio retornado pelo servidor." }),
      );
    }

    return {
      blob,
      filename: filename ?? defaultFilename,
      source: "server",
    };
  } catch (error) {
    if (shouldFallbackToClientPdf(error)) {
      console.warn(
        "[relatorio-pdf] Endpoint /pdf-file indisponível; usando react-pdf local.",
        error,
      );
      const result = await buildRelatorioPdfClient(reportId);
      return { ...result, source: "client" };
    }

    throw error;
  }
}
