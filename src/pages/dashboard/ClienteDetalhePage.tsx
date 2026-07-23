import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import { getClient } from "@/lib/clients-service";
import type { Client } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ClientModal } from "@/components/client-modal";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/index";

export default function ClienteDetalhePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const clientId = Number(id);

  useEffect(() => {
    if (!Number.isFinite(clientId) || clientId <= 0) {
      setError("Cliente inválido.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getClient(clientId);
        if (!cancelled) {
          setClient(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Erro ao carregar cliente.",
          );
          setClient(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  if (loading) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        Carregando cliente...
      </div>
    );
  }

  if (error || !client) {
    return (
      <EmptyState
        title="Cliente não encontrado"
        description={error ?? "Não foi possível localizar este cliente."}
      />
    );
  }

  return (
    <>
      <PageHeader
        title={client.nomeFantasia}
        description={client.razaoSocial}
        action={
          <>
            <Button variant="outline" onClick={() => navigate("/dashboard/clientes")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button onClick={() => setModalOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dados cadastrais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">CNPJ:</span> {client.cnpj}
            </p>
            <p>
              <span className="text-muted-foreground">Ramo:</span>{" "}
              {client.ramoAtividade.nome}
            </p>
            <p>
              <span className="text-muted-foreground">Cidade:</span>{" "}
              {client.cidade} / {client.estado}
            </p>
            <p>
              <span className="text-muted-foreground">E-mail:</span>{" "}
              {client.email || "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contratos ativos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {client.contratos.filter((c) => c.ativo).length === 0 ? (
              <p className="text-muted-foreground">Nenhum contrato ativo.</p>
            ) : (
              client.contratos
                .filter((c) => c.ativo)
                .map((contrato) => (
                  <p key={contrato.id}>
                    {contrato.numeroContrato} — até{" "}
                    {new Date(contrato.dataFim).toLocaleDateString("pt-BR")}
                  </p>
                ))
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground">
        <Link to="/dashboard/clientes" className="text-primary hover:underline">
          Ver todos os clientes
        </Link>
      </p>

      <ClientModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        client={client}
        onSave={(updated) => setClient(updated)}
      />
    </>
  );
}
