import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { DatabaseSetupNotice } from "@/components/database-setup-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminTicket } from "@/features/tickets/service";
import { ticketStatusLabels } from "@/features/tickets/status";
import { isDatabaseUnavailableError } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type AdminTicketPageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function loadTicketData(id: string) {
  try {
    const ticket = await getAdminTicket(id);

    return { ok: true as const, ticket };
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }

    return { ok: false as const };
  }
}

export default async function AdminTicketPage({ params }: AdminTicketPageProps) {
  const { id } = await params;
  const data = await loadTicketData(id);

  if (!data.ok) {
    return (
      <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <DatabaseSetupNotice />
      </section>
    );
  }

  if (!data.ticket) {
    notFound();
  }

  const { ticket } = data;

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <Button asChild className="w-fit" size="sm" variant="ghost">
        <Link href="/admin/tickets">
          <ArrowLeft aria-hidden="true" />
          Tickets
        </Link>
      </Button>
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <Badge variant="outline">{ticket.raffle.name}</Badge>
        <h2 className="mt-2 text-2xl font-semibold">Ticket {ticket.label}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Estado actual: {ticketStatusLabels[ticket.status]}
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h3 className="text-xl font-semibold">Historial</h3>
        <div className="mt-4 space-y-3">
          {ticket.history.map((entry) => (
            <article className="rounded-md border border-border p-4" key={entry.id}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{entry.event}</Badge>
                <Badge variant="outline">
                  {entry.fromStatus ? ticketStatusLabels[entry.fromStatus] : "Inicio"} -{" "}
                  {ticketStatusLabels[entry.toStatus]}
                </Badge>
              </div>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Fecha</dt>
                  <dd className="font-medium">{formatDateTime(entry.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Participante</dt>
                  <dd className="font-medium">
                    {entry.participant
                      ? `${entry.participant.firstName} ${entry.participant.lastName}`
                      : "Sin participante"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Orden</dt>
                  <dd className="font-medium">{entry.order?.publicCode ?? "Sin orden"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Usuario</dt>
                  <dd className="font-medium">
                    {entry.actorUser?.email ?? entry.actorUser?.name ?? "Sistema"}
                  </dd>
                </div>
              </dl>
              {entry.reason ? (
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{entry.reason}</p>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
