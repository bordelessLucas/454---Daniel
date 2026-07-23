import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Label } from "./Label";
import { Input } from "./Input";
import type { Contact } from "@/lib/types";

interface ContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
  onSave: (
    contact: Omit<Contact, "id" | "clienteId" | "createdAt" | "updatedAt"> & {
      id?: number;
    },
  ) => void;
}

export function ContactModal({
  open,
  onOpenChange,
  contact,
  onSave,
}: ContactModalProps) {
  const [formData, setFormData] = useState({
    nome: "",
    cargo: "",
    email: "",
    telefone: "",
    principal: false,
  });

  useEffect(() => {
    if (contact) {
      setFormData({
        nome: contact.nome,
        cargo: contact.cargo || "",
        email: contact.email || "",
        telefone: contact.telefone || "",
        principal: contact.principal,
      });
    } else {
      setFormData({
        nome: "",
        cargo: "",
        email: "",
        telefone: "",
        principal: false,
      });
    }
  }, [contact, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(contact ? { ...formData, id: contact.id } : formData);
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={contact ? "Editar Contato" : "Novo Contato"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="contact-name">
            Nome <span className="text-destructive">*</span>
          </Label>
          <Input
            id="contact-name"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            placeholder="João Silva"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-position">Cargo</Label>
          <Input
            id="contact-position"
            value={formData.cargo}
            onChange={(e) =>
              setFormData({ ...formData, cargo: e.target.value })
            }
            placeholder="Gerente de TI"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-email">E-mail</Label>
          <Input
            id="contact-email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="joao@empresa.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-phone">Telefone</Label>
          <Input
            id="contact-phone"
            value={formData.telefone}
            onChange={(e) =>
              setFormData({ ...formData, telefone: e.target.value })
            }
            placeholder="(11) 99999-9999"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              id="contact-principal"
              type="checkbox"
              checked={formData.principal}
              onChange={(e) =>
                setFormData({ ...formData, principal: e.target.checked })
              }
              className="h-4 w-4 rounded border border-input bg-background"
            />
            <Label htmlFor="contact-principal" className="mb-0 cursor-pointer">
              Contato Principal
            </Label>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" className="w-full sm:w-auto">
            {contact ? "Salvar Alterações" : "Adicionar Contato"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
