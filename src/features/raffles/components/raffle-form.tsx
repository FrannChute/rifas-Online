import { CalendarDays, CreditCard, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { RaffleStatus } from "@/generated/prisma/client";

type RaffleFormAction = (formData: FormData) => void | Promise<void>;

type PaymentMethodDefaults = {
  bankTransfer: boolean;
  cash: boolean;
  mercadoPago: boolean;
  bankName?: string | null;
  bankAccountHolder?: string | null;
  bankAlias?: string | null;
  bankCbu?: string | null;
  bankCvu?: string | null;
  bankInstructions?: string | null;
};

export type RaffleFormDefaults = {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  imageUrl?: string | null;
  status?: RaffleStatus;
  price?: string | number;
  currency?: string;
  startNumber?: number;
  endNumber?: number;
  numberPadding?: number;
  startsAt?: Date | null;
  closesAt?: Date | null;
  drawScheduledAt?: Date | null;
  reservationDurationMinutes?: number;
  allowGuestPurchase?: boolean;
  allowAccountPurchase?: boolean;
  allowMultipleWinsPerTicket?: boolean;
  allowMultipleWinsPerParticipant?: boolean;
  winnerRules?: string | null;
  terms?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactWhatsapp?: string | null;
  paymentMethods?: PaymentMethodDefaults;
};

type RaffleFormProps = {
  action: RaffleFormAction;
  submitLabel: string;
  defaults?: RaffleFormDefaults;
};

function toInputDateTime(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

  return local.toISOString().slice(0, 16);
}

function boolDefault(value: boolean | undefined, fallback = false) {
  return value ?? fallback;
}

export function RaffleForm({ action, submitLabel, defaults }: RaffleFormProps) {
  const paymentMethods = defaults?.paymentMethods ?? {
    bankTransfer: true,
    cash: true,
    mercadoPago: false,
  };

  return (
    <form action={action} className="space-y-8">
      <section className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-sm lg:grid-cols-2">
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            name="name"
            defaultValue={defaults?.name ?? ""}
            placeholder="Gran rifa solidaria"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug publico</Label>
          <Input
            id="slug"
            name="slug"
            defaultValue={defaults?.slug ?? ""}
            placeholder="gran-rifa-solidaria"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="imageUrl">Imagen</Label>
          <Input
            id="imageUrl"
            name="imageUrl"
            type="url"
            defaultValue={defaults?.imageUrl ?? ""}
            placeholder="https://..."
          />
        </div>

        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="description">Descripcion</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={defaults?.description ?? ""}
            required
          />
        </div>
      </section>

      <section className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-sm md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="price">Precio por numero</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            defaultValue={defaults?.price?.toString() ?? "0"}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Moneda</Label>
          <Input
            id="currency"
            name="currency"
            maxLength={3}
            defaultValue={defaults?.currency ?? "ARS"}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reservationDurationMinutes">Reserva</Label>
          <Input
            id="reservationDurationMinutes"
            name="reservationDurationMinutes"
            type="number"
            min="1"
            defaultValue={defaults?.reservationDurationMinutes ?? 10}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="startNumber">Numero inicial</Label>
          <Input
            id="startNumber"
            name="startNumber"
            type="number"
            min="0"
            defaultValue={defaults?.startNumber ?? 1}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endNumber">Numero final</Label>
          <Input
            id="endNumber"
            name="endNumber"
            type="number"
            min="0"
            defaultValue={defaults?.endNumber ?? 1500}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="numberPadding">Padding</Label>
          <Input
            id="numberPadding"
            name="numberPadding"
            type="number"
            min="0"
            defaultValue={defaults?.numberPadding ?? 4}
            required
          />
        </div>
      </section>

      <section className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-sm md:grid-cols-3">
        <div className="flex items-center gap-2 md:col-span-3">
          <CalendarDays aria-hidden="true" className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase text-muted-foreground">Fechas</h2>
        </div>
        <div className="space-y-2">
          <Label htmlFor="startsAt">Inicio</Label>
          <Input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            defaultValue={toInputDateTime(defaults?.startsAt)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="closesAt">Cierre</Label>
          <Input
            id="closesAt"
            name="closesAt"
            type="datetime-local"
            defaultValue={toInputDateTime(defaults?.closesAt)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="drawScheduledAt">Sorteo</Label>
          <Input
            id="drawScheduledAt"
            name="drawScheduledAt"
            type="datetime-local"
            defaultValue={toInputDateTime(defaults?.drawScheduledAt)}
          />
        </div>
      </section>

      <section className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-sm lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase text-muted-foreground">Compra</h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              name="allowGuestPurchase"
              type="checkbox"
              defaultChecked={boolDefault(defaults?.allowGuestPurchase, true)}
            />
            Permitir compra invitado
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              name="allowAccountPurchase"
              type="checkbox"
              defaultChecked={boolDefault(defaults?.allowAccountPurchase, true)}
            />
            Permitir compra con cuenta
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              name="allowMultipleWinsPerTicket"
              type="checkbox"
              defaultChecked={boolDefault(defaults?.allowMultipleWinsPerTicket)}
            />
            Un ticket puede ganar mas de una vez
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              name="allowMultipleWinsPerParticipant"
              type="checkbox"
              defaultChecked={boolDefault(defaults?.allowMultipleWinsPerParticipant)}
            />
            Un participante puede ganar mas de una vez
          </label>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard aria-hidden="true" className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase text-muted-foreground">Pagos</h2>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              name="paymentBankTransfer"
              type="checkbox"
              defaultChecked={paymentMethods.bankTransfer}
            />
            Transferencia bancaria
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input name="paymentCash" type="checkbox" defaultChecked={paymentMethods.cash} />
            Efectivo manual
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              name="paymentMercadoPago"
              type="checkbox"
              defaultChecked={paymentMethods.mercadoPago}
            />
            Mercado Pago
          </label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bankAlias">Alias</Label>
          <Input id="bankAlias" name="bankAlias" defaultValue={paymentMethods.bankAlias ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bankCbu">CBU</Label>
          <Input id="bankCbu" name="bankCbu" defaultValue={paymentMethods.bankCbu ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bankCvu">CVU</Label>
          <Input id="bankCvu" name="bankCvu" defaultValue={paymentMethods.bankCvu ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bankName">Banco</Label>
          <Input id="bankName" name="bankName" defaultValue={paymentMethods.bankName ?? ""} />
        </div>
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="bankAccountHolder">Titular</Label>
          <Input
            id="bankAccountHolder"
            name="bankAccountHolder"
            defaultValue={paymentMethods.bankAccountHolder ?? ""}
          />
        </div>
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="bankInstructions">Instrucciones transferencia</Label>
          <Textarea
            id="bankInstructions"
            name="bankInstructions"
            defaultValue={paymentMethods.bankInstructions ?? ""}
          />
        </div>
      </section>

      <section className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-sm lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contactEmail">Email contacto</Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            defaultValue={defaults?.contactEmail ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactPhone">Telefono</Label>
          <Input
            id="contactPhone"
            name="contactPhone"
            defaultValue={defaults?.contactPhone ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactWhatsapp">WhatsApp</Label>
          <Input
            id="contactWhatsapp"
            name="contactWhatsapp"
            defaultValue={defaults?.contactWhatsapp ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="winnerRules">Reglas ganadores</Label>
          <Textarea
            id="winnerRules"
            name="winnerRules"
            defaultValue={defaults?.winnerRules ?? ""}
          />
        </div>
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="terms">Terminos</Label>
          <Textarea id="terms" name="terms" defaultValue={defaults?.terms ?? ""} />
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit">
          <Save aria-hidden="true" />
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
