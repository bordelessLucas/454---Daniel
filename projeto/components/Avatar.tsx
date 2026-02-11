import * as React from "react";

import { cn } from "@/lib/utils";

export const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground",
      className,
    )}
    {...props}
  />
));

Avatar.displayName = "Avatar";

export const AvatarFallback = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn("text-xs font-semibold", className)}
    {...props}
  />
));

AvatarFallback.displayName = "AvatarFallback";
