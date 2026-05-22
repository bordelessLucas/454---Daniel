import { useCallback, useEffect, useState } from "react";
import { resolveConfiguracaoLogoUrl } from "@/lib/configuracao-logo";
import { getConfiguracoesPdf } from "@/lib/configuracoes-service";

const LOGO_UPDATED_EVENT = "system-logo-updated";

export function notifySystemLogoUpdated(): void {
  window.dispatchEvent(new Event(LOGO_UPDATED_EVENT));
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
      } catch {
        if (!cancelled) {
          setLogoSrc(resolveConfiguracaoLogoUrl(null));
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
    const onUpdate = () => reload();
    window.addEventListener(LOGO_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(LOGO_UPDATED_EVENT, onUpdate);
  }, [reload]);

  const displaySrc =
    version > 0 ? `${logoSrc}${logoSrc.includes("?") ? "&" : "?"}v=${version}` : logoSrc;

  return { logoSrc: displaySrc, loading, reload };
}
