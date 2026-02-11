"use client";

import React from "react";

import { useState, useEffect } from "react";
import type { Client } from "@/lib/types";
import { Button, Input, Label, Modal, Textarea } from "@/components/index";

interface ClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSave: (client: Omit<Client, "id">) => void;
}

const emptyClient = {
  name: "",
  cnpjCpf: "",
  contact: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  observations: "",
};

export function ClientModal({
  open,
  onOpenChange,
  client,
  onSave,
}: ClientModalProps) {
  const [form, setForm] = useState(emptyClient);

  useEffect(() => {
    if (client) {
      setForm({
        name: client.name,
        cnpjCpf: client.cnpjCpf,
        contact: client.contact,
        phone: client.phone,
        email: client.email,
        address: client.address,
        city: client.city,
        observations: client.observations,
      });
    } else {
      setForm(emptyClient);
    }
  }, [client, open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
    onOpenChange(false);
  }

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={client ? "Editar Cliente" : "Novo Cliente"}
      className="max-h-[90svh] overflow-y-auto sm:max-w-lg"
    >
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="client-name">Nome da empresa</Label>
            <Input
              id="client-name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="client-cnpj">CNPJ/CPF</Label>
            <Input
              id="client-cnpj"
              value={form.cnpjCpf}
              onChange={(e) => update("cnpjCpf", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="client-contact">Contato</Label>
            <Input
              id="client-contact"
              value={form.contact}
              onChange={(e) => update("contact", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="client-phone">Telefone</Label>
            <Input
              id="client-phone"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="client-email">E-mail</Label>
            <Input
              id="client-email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="client-address">Endereço</Label>
            <Input
              id="client-address"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="client-city">Cidade</Label>
            <Input
              id="client-city"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="client-obs">Observações</Label>
            <Textarea
              id="client-obs"
              value={form.observations}
              onChange={(e) => update("observations", e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Modal>
  );
}
