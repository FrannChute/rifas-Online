import { Gift, Ticket } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DatabaseSetupNotice } from "@/components/database-setup-notice";
import { EmptyState } from "@/components/empty-state";
import { SiteNav } from "@/components/site-nav";
import { RaffleCard } from "@/features/raffles/components/raffle-card";
import { getPlatformSettings, listPublicRaffles } from "@/features/raffles/service";
import { isDatabaseUnavailableError } from "@/lib/errors";

export const dynamic = "force-dynamic";

async function loadHomeData() {
  try {
    const [settings, raffles] = await Promise.all([getPlatformSettings(), listPublicRaffles()]);

    return {
      ok: true as const,
      platformName: settings?.platformName ?? "Rifas Online",
      raffles,
    };
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }

    return { ok: false as const };
  }
}

export default async function HomePage() {
  const data = await loadHomeData();

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
    <main className="min-h-screen club-shell text-foreground">
      <SiteNav platformName={data.platformName} />
      <section className="relative z-10 border-b border-border/70">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_0.68fr] lg:items-center">
          <div className="space-y-4">
            <Badge
              className="w-fit border-blue-200 bg-white/80 text-secondary-foreground"
              variant="outline"
            >
              Basquet formativo U17
            </Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold sm:text-4xl">{data.platformName}</h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Elegi una rifa, revisa premios, disponibilidad y numeros reales cargados desde la
                base de datos. Todo queda conectado al panel administrativo.
              </p>
            </div>
          </div>
          <div className="team-photo-soft min-h-60 rounded-xl border border-blue-200 p-5 text-white shadow-xl [--team-photo:url('/team/bolivar-u17-finalistas.jpg')]">
            <div className="max-w-sm">
              <span className="basketball-mark mb-4" aria-hidden="true" />
              <p className="text-sm font-bold uppercase">Somos Bolivar</p>
              <p className="mt-2 text-2xl font-black leading-tight">Gracias por apoyar a la U17</p>
            </div>
          </div>
          <div className="grid grid-cols-[auto_1fr] items-center gap-4 rounded-lg border border-blue-100 bg-white/80 p-4 shadow-sm backdrop-blur lg:col-span-2">
            <span className="basketball-mark" aria-hidden="true" />
            <div className="grid grid-cols-2 gap-3">
              <div className="court-chip rounded-lg border border-blue-100 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Ticket aria-hidden="true" className="size-4" />
                  Rifas
                </div>
                <p className="mt-2 text-2xl font-semibold">{data.raffles.length}</p>
              </div>
              <div className="court-chip rounded-lg border border-blue-100 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Gift aria-hidden="true" className="size-4" />
                  Premios
                </div>
                <p className="mt-2 text-2xl font-semibold">
                  {data.raffles.reduce((total, raffle) => total + raffle._count.prizes, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        {data.raffles.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {data.raffles.map((raffle) => (
              <RaffleCard key={raffle.id} raffle={raffle} />
            ))}
          </div>
        ) : (
          <EmptyState
            description="Cuando publiques o abras una rifa desde el panel administrativo va a aparecer aca automaticamente."
            title="Todavia no hay rifas publicas"
          />
        )}
      </section>
    </main>
  );
}
