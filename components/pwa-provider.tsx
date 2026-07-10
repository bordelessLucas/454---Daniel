import * as React from "react";
import { Download, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "@/components/Button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const INSTALL_DISMISS_KEY = "linq-pwa-install-dismissed";
const MOBILE_TOAST_DISMISS_KEY = "linq-pwa-mobile-toast-dismissed";
const MOBILE_TOAST_ID = "linq-pwa-install-mobile";
const DISMISS_COOLDOWN_DAYS = 14;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function isDismissedRecently(storageKey: string): boolean {
  const dismissedAt = localStorage.getItem(storageKey);
  if (!dismissedAt) return false;
  const days = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
  return days < DISMISS_COOLDOWN_DAYS;
}

function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|Chrome|Android/.test(ua);
  return isIos && (isSafari || /iPhone|iPad|iPod/.test(ua));
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const deferredPromptRef = React.useRef<BeforeInstallPromptEvent | null>(null);
  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;
      setInterval(() => {
        void registration.update();
      }, 60 * 60 * 1000);
      if (import.meta.env.DEV) {
        console.info("[PWA] Service Worker registrado:", swUrl);
      }
    },
    onRegisterError(error) {
      console.error("[PWA] Falha ao registrar Service Worker:", error);
    },
  });

  const handleInstall = React.useCallback(async () => {
    const promptEvent = deferredPromptRef.current;
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    deferredPromptRef.current = null;
    setDeferredPrompt(null);
    setShowInstall(false);
    toast.dismiss(MOBILE_TOAST_ID);
    if (outcome === "dismissed") {
      localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now()));
      localStorage.setItem(MOBILE_TOAST_DISMISS_KEY, String(Date.now()));
    } else {
      localStorage.removeItem(INSTALL_DISMISS_KEY);
      localStorage.removeItem(MOBILE_TOAST_DISMISS_KEY);
    }
  }, []);

  React.useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  React.useEffect(() => {
    if (isStandaloneDisplay()) return;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      deferredPromptRef.current = promptEvent;
      setDeferredPrompt(promptEvent);
      if (!isDismissedRecently(INSTALL_DISMISS_KEY)) {
        setShowInstall(true);
      }
    };

    const onAppInstalled = () => {
      deferredPromptRef.current = null;
      setDeferredPrompt(null);
      setShowInstall(false);
      toast.dismiss(MOBILE_TOAST_ID);
      localStorage.removeItem(INSTALL_DISMISS_KEY);
      localStorage.removeItem(MOBILE_TOAST_DISMISS_KEY);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  React.useEffect(() => {
    if (!isMobile || isStandaloneDisplay()) return;
    if (isDismissedRecently(MOBILE_TOAST_DISMISS_KEY)) return;

    const timeoutId = window.setTimeout(() => {
      const canPromptInstall = Boolean(deferredPromptRef.current);
      const iosHint = isIosSafari();

      toast("Baixe o aplicativo Linq", {
        id: MOBILE_TOAST_ID,
        description: canPromptInstall
          ? "Instale o app para acesso rápido, tela cheia e uso offline."
          : iosHint
            ? "No Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”."
            : "Adicione o Linq à tela inicial do celular para usar como aplicativo.",
        duration: 12_000,
        position: "top-center",
        action: canPromptInstall
          ? {
              label: "Instalar",
              onClick: () => {
                void handleInstall();
              },
            }
          : undefined,
        cancel: {
          label: "Agora não",
          onClick: () => {
            localStorage.setItem(MOBILE_TOAST_DISMISS_KEY, String(Date.now()));
          },
        },
      });
    }, 1200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isMobile, handleInstall]);

  const handleDismissInstall = () => {
    setShowInstall(false);
    localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now()));
  };

  return (
    <>
      {children}

      {!isOnline ? (
        <div
          role="status"
          className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center px-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
        >
          <div className="rounded-full bg-warning px-3 py-1.5 text-xs font-medium text-warning-foreground shadow-md">
            Você está offline — algumas ações podem falhar
          </div>
        </div>
      ) : null}

      {needRefresh ? (
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-[100] flex justify-center px-3",
            "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
          )}
        >
          <div className="flex w-full max-w-md items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-lg">
            <RefreshCw className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                Nova versão disponível
              </p>
              <p className="text-xs text-muted-foreground">
                Atualize para obter as últimas melhorias.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => void updateServiceWorker(true)}
              className="shrink-0"
            >
              Atualizar
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Dispensar atualização"
              onClick={() => setNeedRefresh(false)}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {!isMobile && showInstall && deferredPrompt && !needRefresh ? (
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-[100] flex justify-center px-3",
            "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
          )}
        >
          <div className="flex w-full max-w-md items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-lg">
            <Download className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                Instalar o Linq
              </p>
              <p className="text-xs text-muted-foreground">
                Use como app no celular ou desktop, com acesso rápido e offline.
              </p>
            </div>
            <Button size="sm" onClick={() => void handleInstall()} className="shrink-0">
              Instalar
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Dispensar instalação"
              onClick={handleDismissInstall}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
