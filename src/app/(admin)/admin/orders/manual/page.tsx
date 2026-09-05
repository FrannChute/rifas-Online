import Link from "next/link";
import { ArrowLeft, Banknote } from "lucide-react";

import { DatabaseSetupNotice } from "@/components/database-setup-notice";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createManualCashSaleAction } from "@/features/orders/actions";
import { listManualSaleRaffles } from "@/features/orders/service";
import { isDatabaseUnavailableError } from "@/lib/errors";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

async function loadManualSaleData() {
  try {
    const raffles = await listManualSaleRaffles();

    return { ok: true as const, raffles };
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }

    return { ok: false as const };
  }
}

export default async function ManualCashSalePage() {
  const data = await loadManualSaleData();

  if (!data.ok) {
    return (
      <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <DatabaseSetupNotice />
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <Button asChild className="w-fit" size="sm" variant="ghost">
        <Link href="/admin/orders">
          <ArrowLeft aria-hidden="true" />
          Ordenes
        </Link>
      </Button>
      <div className="space-y-2">
        <Badge variant="outline">Venta manual</Badge>
        <h2 className="text-2xl font-semibold">Nueva venta en efectivo</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Crea orden, pago aprobado, items y tickets pagados en una transaccion.
        </p>
      </div>

      {data.raffles.length > 0 ? (
        <form action={createManualCashSaleAction} className="space-y-6">
          <section className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-sm md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="raffleId">Rifa</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                id="raffleId"
                name="raffleId"
                required
              >
                {data.raffles.map((raffle) => (
                  <option key={raffle.id} value={raffle.id}>
                    {raffle.name} - {raffle.status} -{" "}
                    {formatMoney(String(raffle.price), raffle.currency)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="ticketNumbers">Numeros</Label>
              <Input
                id="ticketNumbers"
                name="ticketNumbers"
                placeholder="1, 2, 327 o 100 101 102"
                required
              />
            </div>
          </section>

          <section className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-sm md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre</Label>
              <Input id="firstName" name="firstName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input id="lastName" name="lastName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email opcional</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input id="phone" name="phone" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dni">DNI opcional</Label>
              <Input id="dni" name="dni" />
            </div>
          </section>

          <div className="flex justify-end">
            <Button type="submit">
              <Banknote aria-hidden="true" />
              Confirmar venta
            </Button>
          </div>
        </form>
      ) : (
        <EmptyState
          description="Crea o publica una rifa antes de registrar ventas manuales."
          title="No hay rifas disponibles"
        />
      )}
    </section>
  );
}
