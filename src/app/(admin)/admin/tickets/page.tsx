import Link from "next/link";
import { Search } from "lucide-react";

import { DatabaseSetupNotice } from "@/components/database-setup-notice";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listAdminTickets } from "@/features/tickets/service";
import { ticketStatusLabels, ticketStatuses } from "@/features/tickets/status";
import { isDatabaseUnavailableError } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type AdminTicketsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];

  return Array.isArray(value) ? value[0] : value;
}

async function loadTicketsData(params: Record<string, string | string[] | undefined>) {
  try {
    const query = getParam(params, "q");
    const status = getParam(params, "status");
    const page = Number(getParam(params, "page") ?? "1");
    const result = await listAdminTickets({
      ...(query ? { query } : {}),
      ...(status ? { status } : {}),
      page,
    });

    return { ok: true as const, query: query ?? "", result, status: status ?? "" };
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }

    return { ok: false as const };
  }
}

export default async function AdminTicketsPage({ searchParams }: AdminTicketsPageProps) {
  const params = await searchParams;
  const data = await loadTicketsData(params);

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
        <Badge variant="outline">Consulta operativa</Badge>
        <h2 className="text-2xl font-semibold">Tickets</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Busca por numero exacto, rango o estado. La tabla muestra datos persistidos.
        </p>
      </div>

      <form className="grid gap-3 rounded-lg border border-border bg-card p-4 shadow-sm md:grid-cols-[1fr_220px_auto]">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label="Buscar ticket"
            className="pl-9"
            defaultValue={data.query}
            name="q"
            placeholder="0327 o 100-150"
          />
        </div>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          defaultValue={data.status}
          name="status"
        >
          <option value="">Todos los estados</option>
          {ticketStatuses.map((status) => (
            <option key={status} value={status}>
              {ticketStatusLabels[status]}
            </option>
          ))}
        </select>
        <Button type="submit">Buscar</Button>
      </form>

      {data.result.tickets.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Numero</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Rifa</th>
                <th className="px-4 py-3 font-medium">Participante</th>
                <th className="px-4 py-3 font-medium">Orden</th>
                <th className="px-4 py-3 font-medium">Reserva</th>
                <th className="px-4 py-3 font-medium">Accion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.result.tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="px-4 py-3 font-semibold tabular-nums">{ticket.label}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{ticketStatusLabels[ticket.status]}</Badge>
                  </td>
                  <td className="px-4 py-3">{ticket.raffle.name}</td>
                  <td className="px-4 py-3">
                    {ticket.participant
                      ? `${ticket.participant.firstName} ${ticket.participant.lastName}`
                      : "Sin asignar"}
                  </td>
                  <td className="px-4 py-3">{ticket.currentOrder?.publicCode ?? "Sin orden"}</td>
                  <td className="px-4 py-3">{formatDateTime(ticket.reservedUntil)}</td>
                  <td className="px-4 py-3">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/tickets/${ticket.id}`}>Historial</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          description="Ajusta los filtros o genera tickets creando una rifa."
          title="No se encontraron tickets"
        />
      )}

      <p className="text-sm text-muted-foreground">
        Mostrando pagina {data.result.page} de {data.result.pageCount}. Total: {data.result.total}.
      </p>
    </section>
  );
}
