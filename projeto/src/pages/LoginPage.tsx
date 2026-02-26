import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth-context";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Label,
} from "@/components/index";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const logoSrc = theme === "dark" ? "/LogoBlack.png" : "/logoWhite.png";

  useEffect(() => {
    if (user) {
      navigate("/dashboard/relatorios", { replace: true });
    }
  }, [user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    console.log("[LOGIN] Iniciando processo de login");
    console.log("[LOGIN] Username:", username);
    console.log("[LOGIN] Password length:", password.length);
    console.log(
      "[LOGIN] Password (primeiros 3 chars):",
      password.substring(0, 3) + "***",
    );

    if (!username || !password) {
      console.log("[LOGIN] ERRO: Campos vazios");
      setError("Preencha todos os campos.");
      return;
    }

    setIsLoading(true);
    console.log("[LOGIN] Chamando função login do auth-context...");
    try {
      const result = await login(username, password);
      console.log("[LOGIN] Resultado do login:", result);
      if (result.success) {
        console.log("[LOGIN] Login bem-sucedido, navegando para dashboard...");
        navigate("/dashboard/relatorios", { replace: true });
      } else {
        console.log("[LOGIN] Login falhou:", result.error);
        setError(result.error ?? "Erro ao fazer login.");
      }
    } catch (err) {
      console.error("[LOGIN] EXCEÇÃO capturada:", err);
      setError("Erro inesperado ao fazer login.");
      console.error(err);
    } finally {
      setIsLoading(false);
      console.log("[LOGIN] Processo finalizado");
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm border-border">
        <CardHeader className="items-center pb-2">
          <img src={logoSrc} alt="Logo" className="h-44 w-auto" />
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Usuário</Label>
              <Input
                id="username"
                type="text"
                placeholder="Seu usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
