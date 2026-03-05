"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import type { User } from "./types";
import { API_URL } from "./api-client";

interface AuthContextType {
  user: User | null;
  login: (
    username: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Recuperar token do localStorage na inicialização
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      console.log(`[AUTH] Tentando fazer login em: ${API_URL}/auth/login`);
      console.log("[AUTH] Payload:", { username, password });
      console.log("[AUTH] Headers:", { "Content-Type": "application/json" });

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      console.log("[AUTH] Status da resposta:", response.status);
      console.log("[AUTH] Status text:", response.statusText);
      console.log(
        "[AUTH] Headers da resposta:",
        Object.fromEntries(response.headers.entries()),
      );

      if (!response.ok) {
        const responseText = await response.text();
        console.log("[AUTH] Resposta completa (texto):", responseText);

        let data;
        try {
          data = JSON.parse(responseText);
          console.log("[AUTH] Resposta parseada (JSON):", data);
        } catch {
          console.log("[AUTH] Não foi possível parsear como JSON");
          data = {};
        }

        return {
          success: false,
          error:
            data.message ||
            data.error ||
            `Erro ${response.status}: ${response.statusText}`,
        };
      }

      const responseText = await response.text();
      console.log("[AUTH] Resposta de sucesso (texto):", responseText);

      const data = JSON.parse(responseText);
      console.log("[AUTH] Dados parseados:", data);

      const token = data.token;
      console.log("[AUTH] Token recebido:", token ? "Sim" : "Não");

      if (!token) {
        console.log("[AUTH] ERRO: Token não encontrado na resposta");
        return {
          success: false,
          error: "Token não recebido do servidor.",
        };
      }

      // Armazenar token
      localStorage.setItem("authToken", token);
      console.log("[AUTH] Token armazenado no localStorage");

      // Transformar os dados do usuário para o formato esperado
      if (data.user) {
        console.log("[AUTH] Dados do usuário recebidos:", data.user);
        const userFormatted = {
          id: String(data.user.id),
          email: data.user.username,
          name: data.user.nome,
          role: data.user.role.toLowerCase() as "admin" | "tecnico",
          status: "ativo" as const,
        };
        console.log("[AUTH] Usuário formatado:", userFormatted);
        setUser(userFormatted);
        localStorage.setItem("user", JSON.stringify(userFormatted));
      }

      console.log("[AUTH] Login bem-sucedido!");
      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Erro ao fazer login:", error);
      console.error("Mensagem:", errorMessage);

      return {
        success: false,
        error: `Erro de conexão: ${errorMessage}. Verifique se a API está rodando em ${API_URL}`,
      };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  }, []);

  const isAdmin = user?.role === "admin";

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
