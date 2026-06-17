"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import type { AuthUser, LoginResponse } from "./types";
import { API_URL } from "./api-client";
import {
  finishAuthPerf,
  measureAuthStep,
  resetAuthPerf,
} from "./auth-perf";

interface AuthContextType {
  user: AuthUser | null;
  login: (
    username: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function getErrorMessageFromResponse(
  payload: unknown,
  status: number,
  statusText: string,
): string {
  if (payload && typeof payload === "object") {
    const candidate = payload as { error?: unknown; message?: unknown };
    if (typeof candidate.error === "string" && candidate.error.trim()) {
      return candidate.error;
    }
    if (typeof candidate.message === "string" && candidate.message.trim()) {
      return candidate.message;
    }
  }
  return `Erro ${status}: ${statusText}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Recuperar sessão via cookie httpOnly
  useEffect(() => {
    async function bootstrapSession() {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          credentials: "include",
        });

        if (!response.ok) {
          setUser(null);
          return;
        }

        const apiUser = (await response.json()) as AuthUser;
        setUser(apiUser);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    void bootstrapSession();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    resetAuthPerf();
    try {
      const response = await measureAuthStep("POST /auth/login", () =>
        fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ username, password }),
        }),
      );

      const responseText = await response.text();
      let parsedPayload: unknown = {};
      if (responseText) {
        try {
          parsedPayload = JSON.parse(responseText);
        } catch {
          parsedPayload = { error: responseText };
        }
      }

      if (!response.ok) {
        finishAuthPerf("login");
        return {
          success: false,
          error: getErrorMessageFromResponse(
            parsedPayload,
            response.status,
            response.statusText,
          ),
        };
      }

      const data = parsedPayload as Partial<LoginResponse>;
      const apiUser = data.user;
      if (apiUser) {
        setUser(apiUser);
        finishAuthPerf("login");
        return { success: true };
      }

      // Caso o backend não retorne user no /login, busca via /me (cookie).
      const meResponse = await measureAuthStep("GET /auth/me (fallback)", () =>
        fetch(`${API_URL}/auth/me`, {
          credentials: "include",
        }),
      );
      if (!meResponse.ok) {
        finishAuthPerf("login");
        return {
          success: false,
          error: "Não foi possível validar a sessão após o login.",
        };
      }
      const meUser = (await meResponse.json()) as AuthUser;
      setUser(meUser);
      finishAuthPerf("login");
      return { success: true };
    } catch (error) {
      finishAuthPerf("login");
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Erro de conexão: ${errorMessage}`,
      };
    }
  }, []);

  const logout = useCallback(() => {
    // Cookie httpOnly não pode ser limpo pelo frontend; tentativa best-effort.
    void fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => undefined);
    setUser(null);
  }, []);

  const isAdmin = user?.role === "ADMIN";

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
