/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, CreditCard, Gift, Ticket } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatabaseSetupNotice } from "@/components/database-setup-notice";
import { SiteNav } from "@/components/site-nav";
import { reserveTicketsWithStateAction } from "@/features/orders/public-actions";
import { PrizeImage } from "@/features/prizes/components/prize-image";
import { TicketGridPicker } from "@/features/tickets/components/ticket-grid-picker";
import { type TicketStatusValue } from "@/features/tickets/status";
import { getPlatformSettings, getPublicRaffleBySlug } from "@/features/raffles/service";
import { formatDateTime, formatMoney } from "@/lib/format";
import { isDatabaseUnavailableError } from "@/lib/errors";

export const dynamic = "force-dynamic";

type RafflePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function statValue(stats: Record<string, number>, status: TicketStatusValue) {
  return stats[status] ?? 0;
}

function publicReservedCount(stats: Record<string, number>) {
  return (
    statValue(stats, "RESERVED") +
    statValue(stats, "PAYMENT_PENDING") +
    statValue(stats, "CANCELLED")
  );
}

function publicPaidCount(stats: Record<string, number>) {
  return statValue(stats, "PAID") + statValue(stats, "WINNER");
}

async function loadPublicRaffleData(slug: string) {
  try {
    const [settings, raffle] = await Promise.all([
      getPlatformSettings(),
      getPublicRaffleBySlug(slug),
    ]);

    return {
      ok: true as const,
      platformName: settings?.platformName ?? "Rifas Online",
      raffle,
    };
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }

    return { ok: false as const };
  }
}

export default async function PublicRafflePage({ params }: RafflePageProps) {
  const { slug } = await params;
  const data = await loadPublicRaffleData(slug);

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

  if (!data.raffle) {
    notFound();
  }

  const { raffle } = data;
  const ticketCount = raffle.endNumber - raffle.startNumber + 1;
  const soldCount = publicPaidCount(raffle.ticketStats);
  const publicPaymentMethods = raffle.paymentMethods;
  const publicTicketStats = [
    { label: "Disponible", value: statValue(raffle.ticketStats, "AVAILABLE") },
    { label: "Reservado", value: publicReservedCount(raffle.ticketStats) },
    { label: "Pagado", value: soldCount },
  ];

  return (
    <main className="min-h-screen club-shell text-foreground">
      <SiteNav platformName={data.platformName} />
      <section className="relative z-10 border-b border-border/70">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="space-y-5">
            <Button asChild size="sm" variant="ghost">
              <Link href="/">
                <ArrowLeft aria-hidden="true" />
                Rifas
              </Link>
            </Button>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={raffle.status === "OPEN" ? "secondary" : "outline"}>
                  {raffle.status}
                </Badge>
                <Badge className="border-orange-200 bg-orange-50 text-orange-800" variant="outline">
                  {formatMoney(String(raffle.price), raffle.currency)}
                </Badge>
              </div>
              <h1 className="text-3xl font-semibold sm:text-4xl">{raffle.name}</h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                {raffle.description}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="club-card rounded-lg border bg-card p-3">
                <dt className="text-xs text-muted-foreground">Disponibles</dt>
                <dd className="mt-1 text-xl font-semibold">
                  {statValue(raffle.ticketStats, "AVAILABLE")}
                </dd>
              </div>
              <div className="club-card rounded-lg border bg-card p-3">
                <dt className="text-xs text-muted-foreground">Vendidos</dt>
                <dd className="mt-1 text-xl font-semibold">{soldCount}</dd>
              </div>
              <div className="club-card rounded-lg border bg-card p-3">
                <dt className="text-xs text-muted-foreground">Premios</dt>
                <dd className="mt-1 text-xl font-semibold">{raffle.prizes.length}</dd>
              </div>
              <div className="club-card rounded-lg border bg-card p-3">
                <dt className="text-xs text-muted-foreground">Numeros</dt>
                <dd className="mt-1 text-xl font-semibold">{ticketCount}</dd>
              </div>
            </dl>
          </div>
          {raffle.imageUrl ? (
            <div className="club-card relative aspect-[16/9] overflow-hidden rounded-lg border bg-muted">
              <img alt="" className="size-full object-cover" src={raffle.imageUrl} />
            </div>
          ) : null}
        </div>
      </section>

      <section className="relative z-10 mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <div className="team-photo-soft min-h-72 rounded-xl border border-blue-200 p-5 text-white shadow-xl [--team-photo-position:center_58%] [--team-photo:url('/team/bolivar-u17-trio.png')] lg:min-h-80">
            <p className="text-sm font-bold uppercase tracking-normal">Bolivar U17</p>
            <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">
              Tu numero tambien empuja al equipo
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/90">
              Cada colaboracion ayuda a sostener el esfuerzo de los chicos dentro y fuera de la
              cancha.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="team-photo-soft team-photo-plain min-h-40 rounded-xl border border-blue-200 p-4 text-white shadow-sm [--team-photo-position:center_45%] [--team-photo:url('/team/bolivar-u17-juego.jpg')]">
              <p className="mt-24 text-sm font-black">En cancha</p>
            </div>
            <div className="team-photo-soft team-photo-plain min-h-40 rounded-xl border border-blue-200 p-4 text-white shadow-sm [--team-photo-position:center_52%] [--team-photo:url('/team/bolivar-u17-noche-grupo.png')]">
              <p className="mt-24 text-sm font-black">Equipo unido</p>
            </div>
            <div className="team-photo-soft team-photo-plain min-h-40 rounded-xl border border-blue-200 p-4 text-white shadow-sm [--team-photo-position:center_48%] [--team-photo:url('/team/bolivar-u17-finalistas.jpg')]">
              <p className="mt-24 text-sm font-black">Semifinal U17</p>
            </div>
          </div>

          <div className="club-card rounded-lg border bg-card p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Gift aria-hidden="true" className="size-5 text-primary" />
                <h2 className="text-xl font-semibold">Premios</h2>
              </div>
              <span className="basketball-mark size-10" aria-hidden="true" />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {raffle.prizes.map((prize) => (
                <article
                  key={prize.id}
                  className="overflow-hidden rounded-md border border-blue-100 bg-white transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative h-20 overflow-hidden bg-blue-50 sm:h-24">
                    <PrizeImage name={prize.name} position={prize.position} src={prize.imageUrl} />
                  </div>
                  <div className="flex items-start gap-2 p-2.5">
                    <Badge
                      className="border-orange-200 bg-orange-50 text-orange-800"
                      variant="outline"
                    >
                      {prize.position}
                    </Badge>
                    <div>
                      <h3 className="text-sm font-semibold leading-5">{prize.name}</h3>
                      {prize.description ? (
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {prize.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <TicketGridPicker
            currency={raffle.currency}
            price={String(raffle.price)}
            raffleId={raffle.id}
            reserveAction={reserveTicketsWithStateAction}
            tickets={raffle.tickets.map((ticket) => ({
              ...ticket,
              status: ticket.status as TicketStatusValue,
            }))}
            totalTicketCount={ticketCount}
          />
        </div>

        <aside className="h-fit space-y-4">
          <div className="club-card rounded-lg border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays aria-hidden="true" className="size-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Fechas</h2>
            </div>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Inicio</dt>
                <dd className="font-medium">{formatDateTime(raffle.startsAt)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Cierre</dt>
                <dd className="font-medium">{formatDateTime(raffle.closesAt)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Sorteo</dt>
                <dd className="font-medium">{formatDateTime(raffle.drawScheduledAt)}</dd>
              </div>
            </dl>
          </div>

          <div className="club-card rounded-lg border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <CreditCard aria-hidden="true" className="size-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Pago</h2>
            </div>
            <div className="space-y-2">
              {publicPaymentMethods.map((method) => (
                <div className="rounded-md border border-border px-3 py-2 text-sm" key={method.id}>
                  <p className="font-medium">{method.displayName}</p>
                  {method.instructions ? (
                    <p className="mt-1 text-muted-foreground">{method.instructions}</p>
                  ) : null}
                  {method.type === "CASH" ? (
                    <p className="mt-1 text-muted-foreground">
                      Si pagas en efectivo, no necesitas subir comprobante.
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="club-card rounded-lg border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Ticket aria-hidden="true" className="size-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Estados</h2>
            </div>
            <dl className="space-y-2 text-sm">
              {publicTicketStats.map((item) => (
                <div className="flex items-center justify-between gap-3" key={item.label}>
                  <dt className="text-muted-foreground">{item.label}</dt>
                  <dd className="font-semibold">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </section>
    </main>
  );
}
