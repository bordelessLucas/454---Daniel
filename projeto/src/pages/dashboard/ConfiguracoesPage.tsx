import { useState } from "react";
import { mockLoginSettings } from "@/lib/mock-data";
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
  const [startTime, setStartTime] = useState(mockLoginSettings.startTime);
  const [endTime, setEndTime] = useState(mockLoginSettings.endTime);

  function handleSave() {
    mockLoginSettings.startTime = startTime;
    mockLoginSettings.endTime = endTime;
    toast.success("Configuracoes salvas com sucesso.");
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

            <Button onClick={handleSave} className="w-fit">
              <Save className="mr-2 h-4 w-4" />
              Salvar Configuracoes
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
