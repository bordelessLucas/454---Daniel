import { useState, useEffect, useRef } from "react";
import { ApiError } from "@/lib/api-client";
import {
  hasConfiguredLogo,
  resolveLogoDisplaySrc,
} from "@/lib/configuracao-logo";
import {
  getConfiguracoes,
  updateConfiguracoes,
  uploadConfiguracaoLogo,
} from "@/lib/configuracoes-service";
import {
  horarioFromConfig,
  isHorarioAtualDentroDoIntervalo,
} from "@/lib/configuracao-horario";
import {
  notifySystemLogoUpdated,
  useSystemLogo,
} from "@/hooks/use-system-logo";
import { extractPaletteFromImage } from "@/lib/extract-logo-colors";
import { notifyBrandThemeUpdated } from "@/lib/brand-theme";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/page-header";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
} from "@/components/index";
import { Clock, FileText, ImageIcon, Save, Upload } from "lucide-react";
import { toast } from "sonner";

export default function ConfiguracoesPage() {
  const { isAdmin } = useAuth();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [textoRodapeRelatorio, setTextoRodapeRelatorio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [hasLogo, setHasLogo] = useState(false);
  const [localPreviewSrc, setLocalPreviewSrc] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { logoSrc } = useSystemLogo();
  const displayLogoSrc = localPreviewSrc ?? logoSrc;

  const MAX_LOGO_BYTES = 2 * 1024 * 1024;

  useEffect(() => {
    async function load() {
      try {
        const data = await getConfiguracoes();
        if (data) {
          const horario = horarioFromConfig(data);
          setStartTime(horario.inicio);
          setEndTime(horario.fim);
          setTextoRodapeRelatorio(data.textoRodapeRelatorio ?? "");
          setHasLogo(hasConfiguredLogo(data));
        }
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : "Erro ao carregar configuracoes.";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    if (!startTime || !endTime) {
      toast.error("Informe o horario de inicio e fim.");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateConfiguracoes({
        horaInicio: startTime,
        horaFim: endTime,
        textoRodapeRelatorio: textoRodapeRelatorio.trim() || null,
      });
      const horario = horarioFromConfig(updated);
      setStartTime(horario.inicio);
      setEndTime(horario.fim);
      toast.success("Configuracoes salvas com sucesso.");
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Erro ao salvar configuracoes.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Envie apenas arquivos de imagem (PNG, JPG, SVG, etc.).");
      return;
    }

    if (file.size > MAX_LOGO_BYTES) {
      toast.error("A logo deve ter no maximo 2 MB.");
      return;
    }

    if (!isAdmin) {
      toast.error("Apenas administradores podem alterar a logo do sistema.");
      return;
    }

    setUploadingLogo(true);
    try {
      const themePalette = await extractPaletteFromImage(file);
      const updated = await uploadConfiguracaoLogo(file, themePalette);
      const previewVersion = Date.now();
      setLocalPreviewSrc(resolveLogoDisplaySrc(updated, previewVersion));
      setHasLogo(hasConfiguredLogo(updated));
      notifySystemLogoUpdated(updated);
      notifyBrandThemeUpdated(themePalette);
      toast.success("Logo e identidade visual atualizadas com sucesso.");
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Erro ao enviar a logo.";
      toast.error(message);
    } finally {
      setUploadingLogo(false);
    }
  }

  function isCurrentlyOutside() {
    if (!startTime || !endTime) {
      return false;
    }
    return !isHorarioAtualDentroDoIntervalo(startTime, endTime);
  }

  return (
    <>
      <PageHeader
        title="Configuracoes"
        description="Gerencie as configuracoes do sistema."
      />

      <div className="flex max-w-2xl flex-col gap-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="h-4 w-4" />
              Logo do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Exibida na barra lateral. Ao enviar uma nova logo, o sistema também
              ajusta automaticamente as cores da interface para combinar com a
              marca. Nos PDFs gerados no servidor, o backend usa o arquivo salvo
              em Configuracoes. Formatos de imagem, ate 2 MB.
            </p>
            <p className="text-xs font-medium text-foreground">
              {hasLogo ? "Logo configurada" : "Nenhuma logo configurada"}
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-24 w-40 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/50 p-3">
                <img
                  src={displayLogoSrc}
                  alt="Logo atual do sistema"
                  className="max-h-full max-w-full object-contain"
                  onError={(event) => {
                    const img = event.currentTarget;
                    if (!img.src.endsWith("/LogoIcon.png")) {
                      img.src = "/LogoIcon.png";
                    }
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                  className="sr-only"
                  disabled={loading || uploadingLogo || !isAdmin}
                  onChange={handleLogoFileChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-fit"
                  disabled={loading || uploadingLogo || !isAdmin}
                  onClick={() => logoInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploadingLogo ? "Enviando..." : "Trocar logo"}
                </Button>
                {!isAdmin ? (
                  <p className="text-xs text-muted-foreground">
                    Apenas administradores podem enviar uma nova logo.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    O upload e salvo imediatamente; nao e necessario clicar em
                    Salvar Configuracoes. Apos redeploy do backend, reenvie a
                    logo se ela sumir do PDF.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

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
                  disabled={loading}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="end-time">Hora Fim</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={loading}
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
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Rodape do Relatorio (PDF)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Texto exibido na coluna esquerda do rodape ao gerar o PDF do
              relatorio. Use uma linha por informacao (endereco, telefone,
              suporte, etc.).
            </p>
            <div className="flex flex-col gap-2">
              <Label htmlFor="texto-rodape-relatorio">Conteudo do rodape</Label>
              <Textarea
                id="texto-rodape-relatorio"
                rows={8}
                value={textoRodapeRelatorio}
                onChange={(e) => setTextoRodapeRelatorio(e.target.value)}
                disabled={loading}
                placeholder={
                  "LINQ INFORMÁTICA\n" +
                  "Rua Geraldo Pereira, 338 - Sala 704\n" +
                  "Alto da Bronze, Estrela/RS - CEP: 95.880-000\n" +
                  "Suporte: 51 3720-4462"
                }
                className="font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleSave}
          className="w-fit"
          disabled={saving || loading}
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Salvando..." : "Salvar Configuracoes"}
        </Button>
      </div>
    </>
  );
}
