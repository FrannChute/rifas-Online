import Link from "next/link";
import { Search, Trash2 } from "lucide-react";

import { DatabaseSetupNotice } from "@/components/database-setup-notice";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteParticipantFromAdminAction } from "@/features/participants/actions";
import { listAdminParticipants } from "@/features/participants/service";
import { isDatabaseUnavailableError } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type AdminParticipantsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];

  return Array.isArray(value) ? value[0] : value;
}

async function loadParticipantsData(params: Record<string, string | string[] | undefined>) {
  try {
    const query = getParam(params, "q") ?? "";
    const minTicketsValue = getParam(params, "minTickets") ?? "";
    const minTickets = minTicketsValue ? Number(minTicketsValue) : undefined;
    const participants = await listAdminParticipants({
      query,
      ...(minTickets && Number.isFinite(minTickets) ? { minTickets } : {}),
    });

    return { ok: true as const, minTickets: minTicketsValue, participants, query };
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }

    return { ok: false as const };
  }
}

export default async function AdminParticipantsPage({ searchParams }: AdminParticipantsPageProps) {
  const params = await searchParams;
  const data = await loadParticipantsData(params);

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
        <Badge variant="outline">Compradores</Badge>
        <h2 className="text-2xl font-semibold">Participantes</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Compradores invitados o vinculados a cuenta. Desde aca podes encontrar compras raras,
          eliminar personas falsas y liberar sus numeros.
        </p>
      </div>

      <form className="grid gap-3 rounded-lg border border-border bg-card p-4 shadow-sm md:grid-cols-[1fr_190px_auto_auto]">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label="Buscar participante"
            className="pl-9"
            defaultValue={data.query}
            name="q"
            placeholder="Nombre, telefono o email"
          />
        </div>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          defaultValue={data.minTickets}
          name="minTickets"
        >
          <option value="">Cualquier cantidad</option>
          <option value="6">6 o mas numeros</option>
          <option value="10">10 o mas numeros</option>
          <option value="20">20 o mas numeros</option>
        </select>
        <Button type="submit">Buscar</Button>
        <Button asChild type="button" variant="outline">
          <Link href="/admin/participants">Limpiar</Link>
        </Button>
      </form>

      {data.participants.length > 0 ? (
        <form action={deleteParticipantFromAdminAction} className="space-y-3">
          <div className="grid gap-3 rounded-lg border border-rose-300 bg-rose-50 p-4 text-rose-950 md:grid-cols-[1fr_auto]">
            <div>
              <h3 className="font-semibold">Eliminar participantes seleccionados</h3>
              <p className="mt-1 text-sm leading-6">
                Esto elimina la persona, sus ordenes y pagos relacionados, y libera sus numeros para
                que otra persona los pueda comprar. No permite borrar ganadores ni participantes que
                ya esten dentro de un sorteo.
              </p>
              <Input
                className="mt-3 bg-white"
                name="reason"
                placeholder="Motivo, por ejemplo: compra falsa o broma"
              />
              <label className="mt-3 flex items-start gap-2 text-sm">
                <input className="mt-1" name="confirmDelete" required type="checkbox" />
                <span>Confirmo que quiero eliminar definitivamente a las personas marcadas.</span>
              </label>
            </div>
            <Button className="self-end" type="submit" variant="destructive">
              <Trash2 aria-hidden="true" className="mr-2 size-4" />
              Eliminar seleccionados
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
            <table className="w-full min-w-[940px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Eliminar</th>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Telefono</th>
                  <th className="px-4 py-3 font-medium">Ordenes</th>
                  <th className="px-4 py-3 font-medium">Tickets</th>
                  <th className="px-4 py-3 font-medium">Revision</th>
                  <th className="px-4 py-3 font-medium">Creado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.participants.map((participant) => (
                  <tr key={participant.id}>
                    <td className="px-4 py-3">
                      <input
                        aria-label={`Eliminar ${participant.firstName} ${participant.lastName}`}
                        name="participantIds"
                        type="checkbox"
                        value={participant.id}
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {participant.firstName} {participant.lastName}
                    </td>
                    <td className="px-4 py-3">{participant.email ?? "Sin email"}</td>
                    <td className="px-4 py-3">{participant.phone ?? "Sin telefono"}</td>
                    <td className="px-4 py-3">{participant._count.orders}</td>
                    <td className="px-4 py-3">{participant._count.tickets}</td>
                    <td className="px-4 py-3">
                      {participant._count.tickets >= 6 ? (
                        <Badge className="border-amber-300 bg-amber-100 text-amber-950">
                          Revisar: muchos numeros
                        </Badge>
                      ) : (
                        <Badge variant="outline">Normal</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">{formatDateTime(participant.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </form>
      ) : (
        <EmptyState
          description="No hay personas con esos filtros. Los participantes se crean al reservar numeros o desde una venta manual."
          title="No hay participantes"
        />
      )}
    </section>
  );
}
