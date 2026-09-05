import Link from "next/link";
import { Eye, Gift, Plus, Ticket } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatabaseSetupNotice } from "@/components/database-setup-notice";
import { EmptyState } from "@/components/empty-state";
import { StatusActions } from "@/features/raffles/components/status-actions";
import { listAdminRaffles } from "@/features/raffles/service";
import { ticketStatusLabels, type TicketStatusValue } from "@/features/tickets/status";
import { isDatabaseUnavailableError } from "@/lib/errors";
import { formatDateTime, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

function getStatusCount(stats: Record<string, number>, status: TicketStatusValue) {
  return stats[status] ?? 0;
}

async function loadAdminRafflesData() {
  try {
    const raffles = await listAdminRaffles();

    return { ok: true as const, raffles };
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }

    return { ok: false as const };
  }
}

export default async function AdminRafflesPage() {
  const data = await loadAdminRafflesData();

  if (!data.ok) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <DatabaseSetupNotice />
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="outline">Administracion</Badge>
          <h2 className="text-2xl font-semibold">Rifas</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Crea rifas, edita configuracion, genera tickets y controla el estado operativo.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/raffles/new">
            <Plus aria-hidden="true" />
            Nueva rifa
          </Link>
        </Button>
      </div>

      {data.raffles.length > 0 ? (
        <div className="grid gap-4">
          {data.raffles.map((raffle) => {
            const sold =
              getStatusCount(raffle.ticketStats, "PAID") +
              getStatusCount(raffle.ticketStats, "WINNER");

            return (
              <article
                className="rounded-lg border border-border bg-card p-5 shadow-sm"
                key={raffle.id}
              >
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={raffle.status === "OPEN" ? "secondary" : "outline"}>
                        {raffle.status}
                      </Badge>
                      <Badge variant="outline">
                        {formatMoney(String(raffle.price), raffle.currency)}
                      </Badge>
                      <Badge variant="outline">{raffle.slug}</Badge>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{raffle.name}</h3>
                      <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                        {raffle.description}
                      </p>
                    </div>
                    <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
                      <div className="rounded-md bg-muted px-3 py-2">
                        <dt className="text-muted-foreground">Tickets</dt>
                        <dd className="mt-1 font-semibold">{raffle._count.tickets}</dd>
                      </div>
                      <div className="rounded-md bg-muted px-3 py-2">
                        <dt className="text-muted-foreground">{ticketStatusLabels.AVAILABLE}</dt>
                        <dd className="mt-1 font-semibold">
                          {getStatusCount(raffle.ticketStats, "AVAILABLE")}
                        </dd>
                      </div>
                      <div className="rounded-md bg-muted px-3 py-2">
                        <dt className="text-muted-foreground">Vendidos</dt>
                        <dd className="mt-1 font-semibold">{sold}</dd>
                      </div>
                      <div className="rounded-md bg-muted px-3 py-2">
                        <dt className="text-muted-foreground">Premios</dt>
                        <dd className="mt-1 font-semibold">{raffle._count.prizes}</dd>
                      </div>
                      <div className="rounded-md bg-muted px-3 py-2">
                        <dt className="text-muted-foreground">Cierre</dt>
                        <dd className="mt-1 font-semibold">{formatDateTime(raffle.closesAt)}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/raffles/${raffle.slug}`}>
                        <Eye aria-hidden="true" />
                        Publica
                      </Link>
                    </Button>
                    <Button asChild size="sm">
                      <Link href={`/admin/raffles/${raffle.id}/edit`}>
                        <Ticket aria-hidden="true" />
                        Editar
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/admin/raffles/${raffle.id}/prizes`}>
                        <Gift aria-hidden="true" />
                        Premios
                      </Link>
                    </Button>
                  </div>
                </div>
                <div className="mt-4 border-t border-border pt-4">
                  <StatusActions raffleId={raffle.id} status={raffle.status} />
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          description="La primera rifa que crees va a generar automaticamente su rango de numeros en PostgreSQL."
          title="Todavia no hay rifas"
        />
      )}
    </section>
  );
}
