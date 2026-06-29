import React from "react";
import { Navigate } from "react-router-dom";
import { ShieldOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { UserRole } from "@/lib/types";
import { EmptyState } from "@/components/empty-state";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
}

export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user.role)) {
      return (
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <EmptyState
            icon={ShieldOff}
            title="Acesso negado"
            description="Você não tem permissão para acessar esta página."
          />
        </div>
      );
    }
  }

  return <>{children}</>;
}
