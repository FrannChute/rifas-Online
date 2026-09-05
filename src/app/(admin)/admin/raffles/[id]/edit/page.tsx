import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Gift } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DatabaseSetupNotice } from "@/components/database-setup-notice";
import { PaymentMethodType } from "@/generated/prisma/client";
import { RaffleForm, type RaffleFormDefaults } from "@/features/raffles/components/raffle-form";
import { StatusActions } from "@/features/raffles/components/status-actions";
import { updateRaffleAction } from "@/features/raffles/actions";
import { getRaffleForEdit } from "@/features/raffles/service";
import { isDatabaseUnavailableError } from "@/lib/errors";

export const dynamic = "force-dynamic";

type EditRafflePageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function loadEditRaffleData(id: string) {
  try {
    const raffle = await getRaffleForEdit(id);

    return { ok: true as const, raffle };
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }

    return { ok: false as const };
  }
}

export default async function EditRafflePage({ params }: EditRafflePageProps) {
  const { id } = await params;
  const data = await loadEditRaffleData(id);

  if (!data.ok) {
    return (
      <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <DatabaseSetupNotice />
      </section>
    );
  }

  if (!data.raffle) {
    notFound();
  }

  const { raffle } = data;
  const bank = raffle.paymentMethods.find(
    (method) => method.type === PaymentMethodType.BANK_TRANSFER,
  );
  const cash = raffle.paymentMethods.find((method) => method.type === PaymentMethodType.CASH);
  const mercadoPago = raffle.paymentMethods.find(
    (method) => method.type === PaymentMethodType.MERCADO_PAGO,
  );

  const defaults: RaffleFormDefaults = {
    id: raffle.id,
    name: raffle.name,
    slug: raffle.slug,
    description: raffle.description,
    imageUrl: raffle.imageUrl,
    status: raffle.status,
    price: raffle.price.toString(),
    currency: raffle.currency,
    startNumber: raffle.startNumber,
    endNumber: raffle.endNumber,
    numberPadding: raffle.numberPadding,
    startsAt: raffle.startsAt,
    closesAt: raffle.closesAt,
    drawScheduledAt: raffle.drawScheduledAt,
    reservationDurationMinutes: raffle.reservationDurationMinutes,
    allowGuestPurchase: raffle.allowGuestPurchase,
    allowAccountPurchase: raffle.allowAccountPurchase,
    allowMultipleWinsPerTicket: raffle.allowMultipleWinsPerTicket,
    allowMultipleWinsPerParticipant: raffle.allowMultipleWinsPerParticipant,
    winnerRules: raffle.winnerRules,
    terms: raffle.terms,
    contactEmail: raffle.contactEmail,
    contactPhone: raffle.contactPhone,
    contactWhatsapp: raffle.contactWhatsapp,
    paymentMethods: {
      bankTransfer: bank?.active ?? false,
      cash: cash?.active ?? false,
      mercadoPago: mercadoPago?.active ?? false,
      bankName: bank?.bankName ?? null,
      bankAccountHolder: bank?.accountHolder ?? null,
      bankAlias: bank?.alias ?? null,
      bankCbu: bank?.cbu ?? null,
      bankCvu: bank?.cvu ?? null,
      bankInstructions: bank?.instructions ?? null,
    },
  };

  const action = updateRaffleAction.bind(null, raffle.id);

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Button asChild size="sm" variant="ghost">
            <Link href="/admin/raffles">
              <ArrowLeft aria-hidden="true" />
              Rifas
            </Link>
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold">{raffle.name}</h2>
              <Badge variant="outline">{raffle.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {raffle._count.tickets} tickets generados y {raffle._count.prizes} premios cargados.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="secondary">
            <Link href={`/admin/raffles/${raffle.id}/prizes`}>
              <Gift aria-hidden="true" />
              Premios
            </Link>
          </Button>
          <StatusActions raffleId={raffle.id} status={raffle.status} />
        </div>
      </div>
      <RaffleForm action={action} defaults={defaults} submitLabel="Guardar cambios" />
    </section>
  );
}
