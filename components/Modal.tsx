import * as React from "react";

import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  className?: string;
  children: React.ReactNode;
}

export function Modal({
  open,
  onOpenChange,
  title,
  className,
  children,
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg",
          className,
        )}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 text-sm text-muted-foreground hover:text-foreground"
          aria-label="Fechar"
        >
          X
        </button>
        {title && (
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
}
