import Link from "next/link";
import { Search } from "lucide-react";

import { DatabaseSetupNotice } from "@/components/database-setup-notice";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteParticipantFromAdminAction } from "@/features/participants/actions";
import {
  markTicketsPaidFromAdminAction,
  releaseTicketsFromAdminAction,
} from "@/features/tickets/actions";
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
    const sort = getParam(params, "sort") ?? "numberAsc";
    const dateFrom = getParam(params, "dateFrom") ?? "";
    const dateTo = getParam(params, "dateTo") ?? "";
    const page = Number(getParam(params, "page") ?? "1");
    const result = await listAdminTickets({
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
      ...(query ? { query } : {}),
      sort,
      ...(status ? { status } : {}),
      page,
    });

    return {
      ok: true as const,
      dateFrom,
      dateTo,
      query: query ?? "",
      result,
      sort,
      status: status ?? "",
    };
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
          Busca por nombre, telefono, numero exacto, rango o estado. Desde aca podes liberar numeros
          ocupados por error o por bromas.
        </p>
      </div>

      <form className="grid gap-3 rounded-lg border border-border bg-card p-4 shadow-sm md:grid-cols-[1fr_210px_210px] xl:grid-cols-[1fr_190px_170px_170px_190px_auto_auto]">
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
            placeholder="Nombre, telefono, 0327 o 100-150"
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
        <Input aria-label="Desde fecha" defaultValue={data.dateFrom} name="dateFrom" type="date" />
        <Input aria-label="Hasta fecha" defaultValue={data.dateTo} name="dateTo" type="date" />
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          defaultValue={data.sort}
          name="sort"
        >
          <option value="numberAsc">Numero: primero al ultimo</option>
          <option value="numberDesc">Numero: ultimo al primero</option>
          <option value="purchaseNewest">Compra: mas reciente</option>
          <option value="purchaseOldest">Compra: mas vieja</option>
          <option value="updatedNewest">Actualizado recientemente</option>
        </select>
        <Button type="submit">Buscar</Button>
        <Button asChild type="button" variant="outline">
          <Link href="/admin/tickets">Limpiar</Link>
        </Button>
      </form>

      <div className="grid gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-950 md:grid-cols-[1fr_auto]">
        <div>
          <h3 className="font-semibold">Aprobar transferencias</h3>
          <p className="mt-1 text-sm leading-6">
            Cuando alguien sube un comprobante, revisalo desde Pagos. Ahi podes aprobarlo o
            rechazarlo; al aprobar, los numeros quedan pagados automaticamente.
          </p>
        </div>
        <Button asChild className="self-end">
          <Link href="/admin/payments">Ir a pagos</Link>
        </Button>
      </div>

      <div className="grid gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-950 md:grid-cols-[1fr_auto]">
        <div>
          <h3 className="font-semibold">Limpiar compradores falsos</h3>
          <p className="mt-1 text-sm leading-6">
            Si alguien carga muchos numeros sin pagar, revisalo en Participantes. Podes filtrar por
            nombre, telefono o por compradores con 6 o mas numeros, eliminarlos y liberar sus
            tickets.
          </p>
        </div>
        <Button asChild className="self-end" variant="destructive">
          <Link href="/admin/participants?minTickets=6">Revisar personas</Link>
        </Button>
      </div>

      {data.result.tickets.length > 0 ? (
        <form action={releaseTicketsFromAdminAction} className="space-y-3">
          <div className="grid gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950 md:grid-cols-[1fr_auto]">
            <div>
              <h3 className="font-semibold">Liberar numeros seleccionados</h3>
              <p className="mt-1 text-sm leading-6">
                Esto deja los numeros disponibles para otra persona y guarda el historial. No toca
                los demas compradores.
              </p>
              <Input
                className="mt-3 bg-white"
                name="reason"
                placeholder="Motivo, por ejemplo: compra falsa o correccion manual"
              />
            </div>
            <Button className="self-end" type="submit" variant="destructive">
              Liberar seleccionados
            </Button>
          </div>

          <div className="grid gap-3 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-950 md:grid-cols-[1fr_auto]">
            <div>
              <h3 className="font-semibold">Marcar como pagado</h3>
              <p className="mt-1 text-sm leading-6">
                Usalo cuando la persona ya te pago por fuera, aunque no haya subido comprobante o la
                reserva haya vencido. Recupera la orden y deja todos sus numeros como pagados.
              </p>
            </div>
            <Button
              className="self-end bg-emerald-700 text-white hover:bg-emerald-800"
              formAction={markTicketsPaidFromAdminAction}
              type="submit"
            >
              Marcar seleccionados pagados
            </Button>
          </div>

          <div className="grid gap-3 rounded-lg border border-rose-300 bg-rose-50 p-4 text-rose-950 md:grid-cols-[1fr_auto]">
            <div>
              <h3 className="font-semibold">Eliminar participante completo</h3>
              <p className="mt-1 text-sm leading-6">
                Marca el comprador en la tabla y esto borra esa persona, sus ordenes/pagos y libera
                todos sus numeros. Usalo para bromas o compras falsas.
              </p>
              <label className="mt-3 flex items-start gap-2 text-sm">
                <input className="mt-1" name="confirmDelete" type="checkbox" />
                <span>Confirmo que quiero eliminar definitivamente a la persona marcada.</span>
              </label>
            </div>
            <Button
              className="self-end"
              formAction={deleteParticipantFromAdminAction}
              type="submit"
              variant="destructive"
            >
              Eliminar participante marcado
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
            <table className="w-full min-w-[1140px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Seleccionar</th>
                  <th className="px-4 py-3 font-medium">Eliminar persona</th>
                  <th className="px-4 py-3 font-medium">Numero</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Rifa</th>
                  <th className="px-4 py-3 font-medium">Participante</th>
                  <th className="px-4 py-3 font-medium">Orden</th>
                  <th className="px-4 py-3 font-medium">Fecha compra</th>
                  <th className="px-4 py-3 font-medium">Reserva</th>
                  <th className="px-4 py-3 font-medium">Accion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.result.tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="px-4 py-3">
                      <input
                        aria-label={`Seleccionar numero ${ticket.label}`}
                        disabled={ticket.status === "WINNER"}
                        name="ticketIds"
                        type="checkbox"
                        value={ticket.id}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {ticket.participant ? (
                        <input
                          aria-label={`Eliminar participante ${ticket.participant.firstName} ${ticket.participant.lastName}`}
                          name="participantIds"
                          type="checkbox"
                          value={ticket.participant.id}
                        />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
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
                    <td className="px-4 py-3">{formatDateTime(ticket.currentOrder?.createdAt)}</td>
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
        </form>
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
