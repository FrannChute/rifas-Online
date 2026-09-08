import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatabaseSetupNotice } from "@/components/database-setup-notice";
import { EmptyState } from "@/components/empty-state";
import { SiteNav } from "@/components/site-nav";
import { getPlatformSettings } from "@/features/raffles/service";
import {
  getPublicRaffleWinnerInfo,
  listPublicWinnersByRaffleSlug,
} from "@/features/winners/service";
import { isDatabaseUnavailableError } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type RaffleWinnersPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function loadRaffleWinnersData(slug: string) {
  try {
    const [settings, raffle, winners] = await Promise.all([
      getPlatformSettings(),
      getPublicRaffleWinnerInfo(slug),
      listPublicWinnersByRaffleSlug(slug),
    ]);

    return {
      ok: true as const,
      platformName: settings?.platformName ?? "Rifas Online",
      raffle,
      winners,
    };
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }

    return { ok: false as const };
  }
}

export default async function RaffleWinnersPage({ params }: RaffleWinnersPageProps) {
  const { slug } = await params;
  const data = await loadRaffleWinnersData(slug);

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

  const raffleName = data.raffle?.name ?? data.winners[0]?.raffle.name ?? "Rifa";
  const drawDate = data.raffle?.drawScheduledAt
    ? formatDateTime(data.raffle.drawScheduledAt)
    : "la fecha publicada";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteNav platformName={data.platformName} />
      <section className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <Button asChild className="w-fit" size="sm" variant="ghost">
          <Link href={`/raffles/${slug}`}>
            <ArrowLeft aria-hidden="true" />
            Rifa
          </Link>
        </Button>
        <div className="space-y-2">
          <Badge variant="outline">Resultados</Badge>
          <h1 className="text-3xl font-semibold">Ganadores de {raffleName}</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            El sorteo se realiza en vivo por Instagram. Los ganadores seran avisados por mensaje,
            telefono o email segun los datos cargados en la compra.
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
                  <div>
                    <h2 className="font-semibold">{winner.prize.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Numero {winner.label}</p>
                    <p className="mt-2 text-sm">
                      {winner.participant
                        ? `${winner.participant.firstName} ${winner.participant.lastName}`
                        : "Participante no publico"}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDateTime(winner.publishedAt)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            description={`Los ganadores estaran disponibles luego de realizar el sorteo en vivo por Instagram, previsto para ${drawDate}. Tambien seran avisados por mensaje o email.`}
            title="Sin ganadores publicados"
          />
        )}
      </section>
    </main>
  );
}
