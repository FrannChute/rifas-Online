import { DatabaseSetupNotice } from "@/components/database-setup-notice";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { listAdminParticipants } from "@/features/participants/service";
import { isDatabaseUnavailableError } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

async function loadParticipantsData() {
  try {
    const participants = await listAdminParticipants();

    return { ok: true as const, participants };
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }

    return { ok: false as const };
  }
}

export default async function AdminParticipantsPage() {
  const data = await loadParticipantsData();

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
          Compradores invitados o vinculados a cuenta, sin fusionar personas por nombre.
        </p>
      </div>

      {data.participants.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Telefono</th>
                <th className="px-4 py-3 font-medium">WhatsApp</th>
                <th className="px-4 py-3 font-medium">Ordenes</th>
                <th className="px-4 py-3 font-medium">Tickets</th>
                <th className="px-4 py-3 font-medium">Creado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.participants.map((participant) => (
                <tr key={participant.id}>
                  <td className="px-4 py-3 font-semibold">
                    {participant.firstName} {participant.lastName}
                  </td>
                  <td className="px-4 py-3">{participant.email ?? "Sin email"}</td>
                  <td className="px-4 py-3">{participant.phone ?? "Sin telefono"}</td>
                  <td className="px-4 py-3">{participant.whatsapp ?? "Sin WhatsApp"}</td>
                  <td className="px-4 py-3">{participant._count.orders}</td>
                  <td className="px-4 py-3">{participant._count.tickets}</td>
                  <td className="px-4 py-3">{formatDateTime(participant.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          description="Los participantes se crean al reservar numeros o con el seed de desarrollo."
          title="No hay participantes"
        />
      )}
    </section>
  );
}
