import * as React from "react";

import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "type"
> {
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, onCheckedChange, checked, defaultChecked, ...props }, ref) => {
    const isChecked = Boolean(checked ?? defaultChecked);

    return (
      <label className={cn("relative inline-flex items-center", className)}>
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          defaultChecked={defaultChecked}
          onChange={(event) => onCheckedChange?.(event.target.checked)}
          className="peer sr-only"
          {...props}
        />
        <span
          className={cn(
            "h-6 w-11 rounded-full border border-transparent bg-muted transition-colors peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
            isChecked && "bg-primary",
          )}
        />
        <span
          className={cn(
            "pointer-events-none absolute left-1 top-1 h-4 w-4 rounded-full bg-background shadow transition-transform",
            isChecked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </label>
    );
  },
);

Switch.displayName = "Switch";
