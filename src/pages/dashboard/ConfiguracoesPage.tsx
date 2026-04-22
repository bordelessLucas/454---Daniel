import { useState, useEffect } from "react";
import {
  getConfiguracoes,
  updateConfiguracoes,
} from "@/lib/configuracoes-service";
import { PageHeader } from "@/components/page-header";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@/components/index";
import { Clock, Save } from "lucide-react";
import { toast } from "sonner";

export default function ConfiguracoesPage() {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getConfiguracoes();
        // API retorna ISO 8601, extrair apenas HH:mm
        setStartTime(
          new Date(data.dataInicio).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
        );
        setEndTime(
          new Date(data.dataFim).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
        );
      } catch {
        toast.error("Erro ao carregar configuracoes.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      // Construir ISO 8601 com data atual e o horario
      const hoje = new Date().toISOString().split("T")[0];
      await updateConfiguracoes(
        `${hoje}T${startTime}:00`,
        `${hoje}T${endTime}:00`,
      );
      toast.success("Configuracoes salvas com sucesso.");
    } catch {
      toast.error("Erro ao salvar configuracoes.");
    } finally {
      setSaving(false);
    }
  }

  function isCurrentlyOutside() {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [sH, sM] = startTime.split(":").map(Number);
    const [eH, eM] = endTime.split(":").map(Number);
    return currentMinutes < sH * 60 + sM || currentMinutes > eH * 60 + eM;
  }

  return (
    <>
      <PageHeader
        title="Configuracoes"
        description="Gerencie as configuracoes do sistema."
      />

      <div className="max-w-lg">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Horario Permitido de Login
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Defina o intervalo de horario em que os usuarios podem acessar o
              sistema.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="start-time">Hora Inicio</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="end-time">Hora Fim</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {isCurrentlyOutside() && (
              <div className="rounded-xl border border-border bg-muted p-3">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Atencao:</span>{" "}
                  O horario atual esta fora do intervalo configurado. Novos
                  logins serao bloqueados.
                </p>
              </div>
            )}

            <Button
              onClick={handleSave}
              className="w-fit"
              disabled={saving || loading}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Salvando..." : "Salvar Configuracoes"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
