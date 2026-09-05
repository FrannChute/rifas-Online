import Link from "next/link";
import { Trophy } from "lucide-react";

import { DatabaseSetupNotice } from "@/components/database-setup-notice";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { executeDrawAction } from "@/features/draws/actions";
import { listAdminDraws, listDrawableRaffles } from "@/features/draws/service";
import { isDatabaseUnavailableError } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

async function loadDrawsData() {
  try {
    const [raffles, draws] = await Promise.all([listDrawableRaffles(), listAdminDraws()]);

    return { ok: true as const, raffles, draws };
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }

    return { ok: false as const };
  }
}

export default async function AdminDrawsPage() {
  const data = await loadDrawsData();

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
        <Badge variant="outline">Auditables</Badge>
        <h2 className="text-2xl font-semibold">Sorteos</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Sorteo reproducible con seed segura, snapshot de elegibles y ganadores persistidos.
        </p>
      </div>

      <form
        action={executeDrawAction}
        className="rounded-lg border border-border bg-card p-5 shadow-sm"
      >
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            name="raffleId"
            required
          >
            <option value="">Seleccionar rifa cerrada</option>
            {data.raffles.map((raffle) => (
              <option disabled={raffle.status !== "CLOSED"} key={raffle.id} value={raffle.id}>
                {raffle.name} - {raffle.status} - {raffle._count.prizes} premios
              </option>
            ))}
          </select>
          <Button type="submit">
            <Trophy aria-hidden="true" />
            Realizar sorteo
          </Button>
        </div>
      </form>

      {data.draws.length > 0 ? (
        <div className="grid gap-4">
          {data.draws.map((draw) => (
            <article
              className="rounded-lg border border-border bg-card p-5 shadow-sm"
              key={draw.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{draw.status}</Badge>
                    <Badge variant="secondary">{draw.algorithm}</Badge>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold">{draw.raffle.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Elegibles: {draw.eligibleTicketCount} - creado {formatDateTime(draw.createdAt)}
                  </p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    Snapshot {draw.snapshotHash ?? "pendiente"}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/raffles/${draw.raffle.slug}/winners`}>Ganadores</Link>
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {draw.winners.map((winner) => (
                  <Badge key={winner.id} variant="outline">
                    {winner.prize.name}: {winner.label}
                  </Badge>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          description="Cierra una rifa con tickets pagados para ejecutar su primer sorteo."
          title="No hay sorteos"
        />
      )}
    </section>
  );
}
