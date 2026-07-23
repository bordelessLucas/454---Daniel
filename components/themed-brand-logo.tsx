import { cn } from "@/lib/utils";
import {
  hasConfiguredLightLogo,
  resolveDefaultLogoForMode,
  resolveLogoDisplaySrc,
  resolveSidebarLogoSrc,
  type LogoConfigSource,
} from "@/lib/configuracao-logo";

type ThemedBrandLogoProps = {
  config?: LogoConfigSource | null;
  cacheBuster?: number | string;
  alt?: string;
  className?: string;
  /** Exibe versões separadas light/dark via CSS (sincronizado com next-themes). */
  variant?: "auto" | "light" | "dark";
  onError?: (mode: "light" | "dark") => void;
};

export function ThemedBrandLogo({
  config,
  cacheBuster,
  alt = "Logo",
  className,
  variant = "auto",
  onError,
}: ThemedBrandLogoProps) {
  const lightSrc = resolveSidebarLogoSrc(config, "light", cacheBuster);
  const darkSrc = resolveSidebarLogoSrc(config, "dark", cacheBuster);
  const lightFallback = resolveDefaultLogoForMode("light");
  const darkFallback = resolveDefaultLogoForMode("dark");

  const handleError =
    (mode: "light" | "dark") =>
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const img = event.currentTarget;
      // Dark: se logoDarkUrl falhar, tenta logoUrl antes do asset LINQ.
      if (
        mode === "dark" &&
        hasConfiguredLightLogo(config) &&
        img.dataset.fallbackStage !== "light"
      ) {
        const lightConfigured = resolveLogoDisplaySrc(config, cacheBuster);
        if (img.src !== lightConfigured) {
          img.dataset.fallbackStage = "light";
          img.src = lightConfigured;
          return;
        }
      }
      const fallback = mode === "light" ? lightFallback : darkFallback;
      if (!img.src.includes(fallback)) {
        img.src = fallback;
      }
      onError?.(mode);
    };

  if (variant === "light") {
    return (
      <img
        key={`light-${lightSrc}`}
        src={lightSrc}
        alt={alt}
        className={className}
        onError={handleError("light")}
      />
    );
  }

  if (variant === "dark") {
    return (
      <img
        key={`dark-${darkSrc}`}
        src={darkSrc}
        alt={alt}
        className={className}
        onError={handleError("dark")}
      />
    );
  }

  return (
    <>
      <img
        key={`auto-light-${lightSrc}`}
        src={lightSrc}
        alt={alt}
        className={cn(className, "block dark:hidden")}
        onError={handleError("light")}
      />
      <img
        key={`auto-dark-${darkSrc}`}
        src={darkSrc}
        alt={alt}
        className={cn(className, "hidden dark:block")}
        onError={handleError("dark")}
      />
    </>
  );
}
