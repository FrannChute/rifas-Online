import Link from "next/link";
import { Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatabaseSetupNotice } from "@/components/database-setup-notice";
import { EmptyState } from "@/components/empty-state";
import { SiteNav } from "@/components/site-nav";
import { getPlatformSettings } from "@/features/raffles/service";
import { listPublicWinners } from "@/features/winners/service";
import { isDatabaseUnavailableError } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

async function loadWinnersData() {
  try {
    const [settings, winners] = await Promise.all([getPlatformSettings(), listPublicWinners()]);

    return {
      ok: true as const,
      platformName: settings?.platformName ?? "Rifas Online",
      winners,
    };
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }

    return { ok: false as const };
  }
}

export default async function WinnersPage() {
  const data = await loadWinnersData();

  if (!data.ok) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <SiteNav />
        <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
          <DatabaseSetupNotice />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteNav platformName={data.platformName} />
      <section className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <div className="space-y-2">
          <Badge variant="outline">Resultados</Badge>
          <h1 className="text-3xl font-semibold">Ganadores</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Ganadores publicados desde sorteos guardados en PostgreSQL.
          </p>
        </div>

        {data.winners.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.winners.map((winner) => (
              <article
                className="rounded-lg border border-border bg-card p-5 shadow-sm"
                key={winner.id}
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                    <Trophy aria-hidden="true" className="size-5" />
                  </span>
                  <div className="space-y-2">
                    <div>
                      <h2 className="font-semibold">{winner.prize.name}</h2>
                      <p className="text-sm text-muted-foreground">
                        {winner.raffle.name} - numero {winner.label}
                      </p>
                    </div>
                    <p className="text-sm">
                      {winner.participant
                        ? `${winner.participant.firstName} ${winner.participant.lastName}`
                        : "Participante no publico"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(winner.publishedAt)}
                    </p>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/raffles/${winner.raffle.slug}/winners`}>Ver rifa</Link>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            description="Cuando completes y publiques sorteos, los ganadores apareceran en esta seccion."
            title="Todavia no hay ganadores publicados"
          />
        )}
      </section>
    </main>
  );
}
