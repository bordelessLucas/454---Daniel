import { useCallback, useEffect, useState } from "react";
import {
  resolveConfiguracaoLogoUrl,
  withLogoCacheBuster,
} from "@/lib/configuracao-logo";
import { getConfiguracoesPdf } from "@/lib/configuracoes-service";

const LOGO_UPDATED_EVENT = "system-logo-updated";

type LogoUpdatedDetail = {
  logoUrl?: string | null;
};

export function notifySystemLogoUpdated(logoUrl?: string | null): void {
  window.dispatchEvent(
    new CustomEvent<LogoUpdatedDetail>(LOGO_UPDATED_EVENT, {
      detail: { logoUrl },
    }),
  );
}

export function useSystemLogo() {
  const [logoSrc, setLogoSrc] = useState(() =>
    resolveConfiguracaoLogoUrl(null),
  );
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  const reload = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const config = await getConfiguracoesPdf();
        if (!cancelled) {
          setLogoSrc(resolveConfiguracaoLogoUrl(config?.logoUrl));
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn(
            "[useSystemLogo] Falha ao carregar GET /configuracoes/pdf:",
            error,
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [version]);

  useEffect(() => {
    const onUpdate = (event: Event) => {
      const detail = (event as CustomEvent<LogoUpdatedDetail>).detail;
      if (detail?.logoUrl) {
        setLogoSrc(resolveConfiguracaoLogoUrl(detail.logoUrl));
      }
      reload();
    };
    window.addEventListener(LOGO_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(LOGO_UPDATED_EVENT, onUpdate);
  }, [reload]);

  const displaySrc =
    version > 0 ? withLogoCacheBuster(logoSrc, version) : logoSrc;

  return { logoSrc: displaySrc, loading, reload };
}
