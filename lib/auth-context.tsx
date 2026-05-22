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

function parseStoredUser(value: string): AuthUser | null {
  try {
    const parsed = JSON.parse(value) as Partial<AuthUser>;
    if (
      typeof parsed.id === "number" &&
      typeof parsed.username === "string" &&
      typeof parsed.nome === "string" &&
      (parsed.role === "ADMIN" || parsed.role === "TECNICO")
    ) {
      return {
        id: parsed.id,
        username: parsed.username,
        nome: parsed.nome,
        role: parsed.role,
        clienteId: parsed.clienteId ?? null,
        unidadeId: parsed.unidadeId ?? null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Recuperar sessão e validar token com a API
  useEffect(() => {
    async function bootstrapSession() {
      const token = localStorage.getItem("authToken");
      const storedUser = localStorage.getItem("user");

      if (!token || !storedUser) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          setUser(null);
          return;
        }

        const apiUser = (await response.json()) as AuthUser;
        setUser(apiUser);
        localStorage.setItem("user", JSON.stringify(apiUser));
      } catch {
        const normalizedUser = parseStoredUser(storedUser);
        if (normalizedUser) {
          setUser(normalizedUser);
        } else {
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
        }
      } finally {
        setIsLoading(false);
      }
    }

    void bootstrapSession();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

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
      const token = data.token;
      const apiUser = data.user;

      if (!token || !apiUser) {
        return {
          success: false,
          error: "Resposta de autenticação inválida.",
        };
      }

      // Armazenar token
      localStorage.setItem("authToken", token);

      const sessionUser: AuthUser = {
        id: apiUser.id,
        username: apiUser.username,
        nome: apiUser.nome,
        role: apiUser.role,
        clienteId: apiUser.clienteId,
        unidadeId: apiUser.unidadeId,
      };

      setUser(sessionUser);
      localStorage.setItem("user", JSON.stringify(sessionUser));
      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Erro de conexão: ${errorMessage}`,
      };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
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
