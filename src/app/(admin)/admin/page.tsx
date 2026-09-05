import Link from "next/link";
import { CircleDollarSign, Plus, Ticket, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatabaseSetupNotice } from "@/components/database-setup-notice";
import { EmptyState } from "@/components/empty-state";
import { getAdminDashboardStats, listAdminRaffles } from "@/features/raffles/service";
import { ticketStatusLabels, type TicketStatusValue } from "@/features/tickets/status";
import { isDatabaseUnavailableError } from "@/lib/errors";

export const dynamic = "force-dynamic";

function getStatusCount(stats: Record<string, number>, status: TicketStatusValue) {
  return stats[status] ?? 0;
}

async function loadAdminDashboardData() {
  try {
    const [stats, raffles] = await Promise.all([getAdminDashboardStats(), listAdminRaffles()]);

    return { ok: true as const, stats, raffles };
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }

    return { ok: false as const };
  }
}

export default async function AdminDashboardPage() {
  const data = await loadAdminDashboardData();

  if (!data.ok) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <DatabaseSetupNotice />
      </section>
    );
  }

  const { raffles, stats } = data;
  const soldTickets =
    getStatusCount(stats.ticketsByStatus, "PAID") + getStatusCount(stats.ticketsByStatus, "WINNER");

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Badge
            className="border-blue-200 bg-white/80 text-secondary-foreground"
            variant="outline"
          >
            Datos reales
          </Badge>
          <h2 className="text-2xl font-semibold">Dashboard</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Metricas calculadas desde rifas, tickets, ordenes y pagos guardados en PostgreSQL.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/raffles/new">
            <Plus aria-hidden="true" />
            Nueva rifa
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="club-card rounded-lg border bg-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Ticket aria-hidden="true" className="size-4" />
            Rifas
          </div>
          <p className="mt-2 text-3xl font-semibold">{stats.raffles}</p>
          <p className="mt-1 text-xs text-muted-foreground">{stats.openRaffles} abiertas</p>
        </div>
        <div className="club-card rounded-lg border bg-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CircleDollarSign aria-hidden="true" className="size-4" />
            Ordenes
          </div>
          <p className="mt-2 text-3xl font-semibold">{stats.orders}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats.pendingPayments} pagos pendientes
          </p>
        </div>
        <div className="club-card rounded-lg border bg-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Ticket aria-hidden="true" className="size-4" />
            Vendidos
          </div>
          <p className="mt-2 text-3xl font-semibold">{soldTickets}</p>
          <p className="mt-1 text-xs text-muted-foreground">Tickets pagados o ganadores</p>
        </div>
        <div className="club-card rounded-lg border bg-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Trophy aria-hidden="true" className="size-4" />
            Disponibles
          </div>
          <p className="mt-2 text-3xl font-semibold">
            {getStatusCount(stats.ticketsByStatus, "AVAILABLE")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Numeros libres</p>
        </div>
      </div>

      <div className="club-card rounded-lg border bg-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Rifas recientes</h2>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/raffles">Ver todas</Link>
          </Button>
        </div>
        {raffles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-3 pr-4 font-medium">Rifa</th>
                  <th className="py-3 pr-4 font-medium">Estado</th>
                  <th className="py-3 pr-4 font-medium">Disponibles</th>
                  <th className="py-3 pr-4 font-medium">Pagados</th>
                  <th className="py-3 pr-4 font-medium">Premios</th>
                  <th className="py-3 font-medium">Accion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {raffles.slice(0, 5).map((raffle) => (
                  <tr key={raffle.id}>
                    <td className="py-3 pr-4 font-medium">{raffle.name}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="outline">{raffle.status}</Badge>
                    </td>
                    <td className="py-3 pr-4">{getStatusCount(raffle.ticketStats, "AVAILABLE")}</td>
                    <td className="py-3 pr-4">{getStatusCount(raffle.ticketStats, "PAID")}</td>
                    <td className="py-3 pr-4">{raffle._count.prizes}</td>
                    <td className="py-3">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/raffles/${raffle.id}/edit`}>Editar</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            description="Crea la primera rifa para generar sus tickets y comenzar la administracion."
            title="No hay rifas cargadas"
          />
        )}
      </div>

      <div className="club-card rounded-lg border bg-card p-5">
        <h2 className="mb-4 text-xl font-semibold">Tickets por estado</h2>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(ticketStatusLabels).map(([status, label]) => (
            <div className="court-chip rounded-md px-3 py-2" key={status}>
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-lg font-semibold">{stats.ticketsByStatus[status] ?? 0}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
