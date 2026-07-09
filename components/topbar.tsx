"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback, Button, Separator } from "@/components/index";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function Topbar() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const initials = user?.nome
    ? user.nome
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center border-b border-primary/15 bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mx-3 h-5" />
      <div className="flex flex-1 items-center justify-end gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-8 w-8"
          aria-label="Alternar tema"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 ring-2 ring-primary/20">
            <AvatarFallback className="bg-brand-surface text-brand-surface-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden flex-col sm:flex">
            <span className="text-sm font-medium leading-tight text-foreground">
              {user?.nome}
            </span>
            <span className="text-xs font-medium text-primary">
              {user?.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
