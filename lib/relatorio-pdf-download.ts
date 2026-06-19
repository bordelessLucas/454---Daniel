import { ApiError, apiRequestBlob } from "@/lib/api-client";
import { buildRelatorioPdfFilename } from "@/lib/relatorio-naming";

function isPdfContentType(contentType: string | null): boolean {
  if (!contentType) {
    return true;
  }

  return contentType.toLowerCase().includes("pdf");
}

/**
 * Baixa o PDF gerado no backend.
 * Rota: GET /relatorios/:id/pdf-file
 * A logo e o layout vêm do servidor (Puppeteer) — o front só baixa o binário.
 */
export async function downloadRelatorioPdf(reportId: number): Promise<{
  blob: Blob;
  filename: string;
}> {
  const defaultFilename = buildRelatorioPdfFilename(reportId);

  const { blob, filename, contentType } = await apiRequestBlob(
    `/relatorios/${reportId}/pdf-file`,
    {
      method: "GET",
      headers: {
        Accept: "application/pdf",
      },
    },
  );

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
  };
}
