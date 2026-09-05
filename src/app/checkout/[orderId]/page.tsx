import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CreditCard, Ticket } from "lucide-react";

import { DatabaseSetupNotice } from "@/components/database-setup-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/site-nav";
import { getCheckoutOrder } from "@/features/orders/service";
import { PaymentReceiptForm } from "@/features/payments/components/payment-receipt-form";
import { submitPaymentReceiptWithStateAction } from "@/features/payments/public-actions";
import { PaymentMethodType } from "@/generated/prisma/client";
import { isDatabaseUnavailableError } from "@/lib/errors";
import { formatDateTime, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

type CheckoutPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

async function loadCheckoutData(orderId: string) {
  try {
    const order = await getCheckoutOrder(orderId);

    return { ok: true as const, order };
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }

    return { ok: false as const };
  }
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { orderId } = await params;
  const data = await loadCheckoutData(orderId);

  if (!data.ok) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <SiteNav />
        <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
          <DatabaseSetupNotice />
        </section>
      </main>
    );
  }

  if (!data.order) {
    notFound();
  }

  const { order } = data;
  const bankMethod = order.raffle.paymentMethods.find(
    (method) => method.type === PaymentMethodType.BANK_TRANSFER,
  );
  const receiptMethods = order.raffle.paymentMethods.filter(
    (method) =>
      method.type === PaymentMethodType.BANK_TRANSFER ||
      method.type === PaymentMethodType.MERCADO_PAGO,
  );
  const latestPayment = order.payments[0];
  const uploadAction = submitPaymentReceiptWithStateAction.bind(null, order.id);

  return (
    <main className="min-h-screen club-shell text-foreground">
      <SiteNav />
      <section className="relative z-10 mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <Button asChild className="w-fit" size="sm" variant="ghost">
          <Link href={`/raffles/${order.raffle.slug}`}>
            <ArrowLeft aria-hidden="true" />
            Rifa
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-5">
            <div className="club-card rounded-lg border bg-card p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Badge variant="outline">{order.status}</Badge>
                  <h1 className="mt-2 text-2xl font-semibold">Orden {order.publicCode}</h1>
                  <p className="text-sm text-muted-foreground">{order.raffle.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-semibold">
                    {formatMoney(String(order.totalAmount), order.currency)}
                  </p>
                </div>
              </div>
              <dl className="grid gap-3 text-sm sm:grid-cols-3">
                <div className="court-chip rounded-md px-3 py-2">
                  <dt className="text-muted-foreground">Comprador</dt>
                  <dd className="mt-1 font-medium">
                    {order.participant.firstName} {order.participant.lastName}
                  </dd>
                </div>
                <div className="court-chip rounded-md px-3 py-2">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="mt-1 font-medium">{order.participant.email}</dd>
                </div>
                <div className="court-chip rounded-md px-3 py-2">
                  <dt className="text-muted-foreground">Expira</dt>
                  <dd className="mt-1 font-medium">{formatDateTime(order.expiresAt)}</dd>
                </div>
              </dl>
            </div>

            <div className="club-card rounded-lg border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <Ticket aria-hidden="true" className="size-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Numeros reservados</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {order.items.map((item) => (
                  <Badge key={item.id} variant="secondary">
                    {item.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="club-card rounded-lg border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <CreditCard aria-hidden="true" className="size-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Datos de pago</h2>
              </div>
              {bankMethod ? (
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Alias</dt>
                    <dd className="font-semibold">{bankMethod.alias ?? "Sin alias"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">CBU</dt>
                    <dd className="font-semibold">{bankMethod.cbu ?? "Sin CBU"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">CVU</dt>
                    <dd className="font-semibold">{bankMethod.cvu ?? "Sin CVU"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Titular</dt>
                    <dd className="font-semibold">{bankMethod.accountHolder ?? "Sin titular"}</dd>
                  </div>
                  {bankMethod.instructions ? (
                    <div>
                      <dt className="text-muted-foreground">Instrucciones</dt>
                      <dd className="leading-6">{bankMethod.instructions}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">
                  Esta rifa no tiene transferencia bancaria activa.
                </p>
              )}
            </div>

            {latestPayment ? (
              <div className="club-card rounded-lg border bg-card p-5">
                <Badge variant="outline">{latestPayment.status}</Badge>
                <h2 className="mt-2 text-lg font-semibold">Comprobante recibido</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  El pago queda pendiente de revision administrativa hasta su aprobacion. Metodo:{" "}
                  {latestPayment.method === PaymentMethodType.MERCADO_PAGO
                    ? "Mercado Pago"
                    : "Transferencia bancaria"}
                </p>
                {latestPayment.receiptAsset ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Archivo privado: {latestPayment.receiptAsset.originalName}
                  </p>
                ) : null}
              </div>
            ) : (
              <PaymentReceiptForm action={uploadAction} methods={receiptMethods} />
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
