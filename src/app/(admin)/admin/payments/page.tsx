import Link from "next/link";
import { Check, ExternalLink, X } from "lucide-react";

import { DatabaseSetupNotice } from "@/components/database-setup-notice";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { approvePaymentAction, rejectPaymentAction } from "@/features/payments/actions";
import { listAdminPayments } from "@/features/payments/service";
import { PaymentStatus } from "@/generated/prisma/client";
import { isDatabaseUnavailableError } from "@/lib/errors";
import { formatDateTime, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

async function loadPaymentsData() {
  try {
    const payments = await listAdminPayments();

    return { ok: true as const, payments };
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }

    return { ok: false as const };
  }
}

export default async function AdminPaymentsPage() {
  const data = await loadPaymentsData();

  if (!data.ok) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <DatabaseSetupNotice />
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="space-y-2">
        <Badge variant="outline">Revision manual</Badge>
        <h2 className="text-2xl font-semibold">Pagos</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Transferencias y pagos manuales guardados en PostgreSQL.
        </p>
      </div>

      {data.payments.length > 0 ? (
        <div className="grid gap-4">
          {data.payments.map((payment) => {
            const approve = approvePaymentAction.bind(null, payment.id);
            const reject = rejectPaymentAction.bind(null, payment.id);
            const canReview =
              payment.status === PaymentStatus.MANUAL_REVIEW ||
              payment.status === PaymentStatus.PENDING;

            return (
              <article
                className="rounded-lg border border-border bg-card p-5 shadow-sm"
                key={payment.id}
              >
                <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{payment.status}</Badge>
                      <Badge variant="secondary">{payment.method}</Badge>
                      <Badge variant="outline">
                        {formatMoney(String(payment.amount), payment.currency)}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{payment.raffle.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Orden {payment.order?.publicCode ?? "sin orden"} -{" "}
                        {payment.participant
                          ? `${payment.participant.firstName} ${payment.participant.lastName}`
                          : "sin participante"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Creado {formatDateTime(payment.createdAt)}
                      </p>
                    </div>
                    {payment.receiptAsset ? (
                      <p className="text-sm text-muted-foreground">
                        Comprobante privado: {payment.receiptAsset.originalName}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-start gap-2 lg:justify-end">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/raffles/${payment.raffle.slug}`}>
                        <ExternalLink aria-hidden="true" />
                        Rifa
                      </Link>
                    </Button>
                    {canReview ? (
                      <>
                        <form action={approve}>
                          <Button size="sm" type="submit">
                            <Check aria-hidden="true" />
                            Aprobar
                          </Button>
                        </form>
                        <form action={reject} className="flex gap-2">
                          <Input
                            aria-label="Motivo de rechazo"
                            name="reason"
                            placeholder="Motivo"
                            required
                          />
                          <Button size="sm" type="submit" variant="destructive">
                            <X aria-hidden="true" />
                            Rechazar
                          </Button>
                        </form>
                      </>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          description="Cuando un comprador suba un comprobante, aparecera aca para revision."
          title="No hay pagos registrados"
        />
      )}
    </section>
  );
}
