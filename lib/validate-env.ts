import { API_URL } from "@/lib/api-client";

/** Alerta se VITE_API_URL estiver incorreto ou ausente (logo em localhost:3000). */
export function warnMisconfiguredApiUrl(): void {
  const configured = import.meta.env.VITE_API_URL?.trim();
  const usingDefaultLocalhost =
    !configured && /localhost|127\.0\.0\.1/i.test(API_URL);

  if (import.meta.env.DEV) {
    if (usingDefaultLocalhost) {
      console.warn(
        "[env] VITE_API_URL não definido — usando http://localhost:3000. " +
          "Crie/edite .env com VITE_API_URL=https://seu-backend.onrender.com e reinicie npm run dev.",
      );
    } else {
      console.info(`[env] API: ${API_URL}`);
    }
    return;
  }

  if (/localhost|127\.0\.0\.1/i.test(API_URL)) {
    console.warn(
      "[env] VITE_API_URL aponta para localhost em build de produção. " +
        "Upload da logo, PDF e demais chamadas à API falharão para usuários reais. " +
        "Configure VITE_API_URL com a URL do backend (ex.: Render).",
    );
  }
}
