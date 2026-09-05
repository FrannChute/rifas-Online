import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye, RotateCcw, Save, Trash2 } from "lucide-react";

import { DatabaseSetupNotice } from "@/components/database-setup-notice";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createPrizeAction,
  restorePrizeAction,
  softDeletePrizeAction,
  updatePrizeAction,
} from "@/features/prizes/actions";
import { listAdminPrizes } from "@/features/prizes/service";
import { isDatabaseUnavailableError } from "@/lib/errors";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

type AdminPrizesPageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function loadPrizesData(raffleId: string) {
  try {
    const data = await listAdminPrizes(raffleId);

    return { ok: true as const, data };
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }

    return { ok: false as const };
  }
}

export default async function AdminPrizesPage({ params }: AdminPrizesPageProps) {
  const { id } = await params;
  const result = await loadPrizesData(id);

  if (!result.ok) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <DatabaseSetupNotice />
      </section>
    );
  }

  if (!result.data) {
    notFound();
  }

  const { prizes, raffle } = result.data;
  const createAction = createPrizeAction.bind(null, raffle.id);

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Button asChild className="w-fit" size="sm" variant="ghost">
            <Link href={`/admin/raffles/${raffle.id}/edit`}>
              <ArrowLeft aria-hidden="true" />
              Rifa
            </Link>
          </Button>
          <div>
            <Badge variant="outline">{raffle.slug}</Badge>
            <h2 className="mt-2 text-2xl font-semibold">Premios de {raffle.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {raffle._count.prizes} premios cargados. No hay limite artificial de cantidad.
            </p>
          </div>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={`/raffles/${raffle.slug}`}>
            <Eye aria-hidden="true" />
            Ver publica
          </Link>
        </Button>
      </div>

      <form action={createAction} className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h3 className="text-lg font-semibold">Crear premio</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="new-name">Nombre</Label>
            <Input id="new-name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-position">Posicion</Label>
            <Input
              defaultValue={prizes.length + 1}
              id="new-position"
              min="1"
              name="position"
              required
              type="number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-value">Valor</Label>
            <Input id="new-value" min="0" name="monetaryValue" step="0.01" type="number" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="new-image">Imagen</Label>
            <Input id="new-image" name="imageUrl" placeholder="/prizes/bolivar-01.svg" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="new-description">Descripcion</Label>
            <Textarea id="new-description" name="description" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input defaultChecked name="active" type="checkbox" />
            Activo
          </label>
        </div>
        <Button className="mt-4" type="submit">
          <Save aria-hidden="true" />
          Crear premio
        </Button>
      </form>

      {prizes.length > 0 ? (
        <div className="grid gap-4">
          {prizes.map((prize) => {
            const updateAction = updatePrizeAction.bind(null, raffle.id, prize.id);
            const deleteAction = softDeletePrizeAction.bind(null, raffle.id, prize.id);
            const restoreAction = restorePrizeAction.bind(null, raffle.id, prize.id);

            return (
              <article
                className="rounded-lg border border-border bg-card p-5 shadow-sm"
                key={prize.id}
              >
                <form action={updateAction} className="grid gap-4 md:grid-cols-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor={`name-${prize.id}`}>Nombre</Label>
                    <Input
                      defaultValue={prize.name}
                      disabled={Boolean(prize.deletedAt)}
                      id={`name-${prize.id}`}
                      name="name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`position-${prize.id}`}>Posicion</Label>
                    <Input
                      defaultValue={prize.position}
                      disabled={Boolean(prize.deletedAt)}
                      id={`position-${prize.id}`}
                      min="1"
                      name="position"
                      required
                      type="number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`value-${prize.id}`}>Valor</Label>
                    <Input
                      defaultValue={prize.monetaryValue?.toString() ?? ""}
                      disabled={Boolean(prize.deletedAt)}
                      id={`value-${prize.id}`}
                      min="0"
                      name="monetaryValue"
                      step="0.01"
                      type="number"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor={`image-${prize.id}`}>Imagen</Label>
                    <Input
                      defaultValue={prize.imageUrl ?? ""}
                      disabled={Boolean(prize.deletedAt)}
                      id={`image-${prize.id}`}
                      name="imageUrl"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-4">
                    <Label htmlFor={`description-${prize.id}`}>Descripcion</Label>
                    <Textarea
                      defaultValue={prize.description ?? ""}
                      disabled={Boolean(prize.deletedAt)}
                      id={`description-${prize.id}`}
                      name="description"
                    />
                  </div>
                  <div className="flex flex-col justify-between gap-3 md:col-span-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={prize.active ? "secondary" : "outline"}>
                        {prize.active ? "Activo" : "Inactivo"}
                      </Badge>
                      {prize.deletedAt ? <Badge variant="destructive">Eliminado</Badge> : null}
                      {prize.monetaryValue ? (
                        <Badge variant="outline">
                          {formatMoney(prize.monetaryValue.toString(), "ARS")}
                        </Badge>
                      ) : null}
                    </div>
                    {!prize.deletedAt ? (
                      <label className="flex items-center gap-2 text-sm">
                        <input defaultChecked={prize.active} name="active" type="checkbox" />
                        Activo
                      </label>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      {!prize.deletedAt ? (
                        <>
                          <Button size="sm" type="submit">
                            <Save aria-hidden="true" />
                            Guardar
                          </Button>
                          <Button
                            form={`delete-${prize.id}`}
                            size="sm"
                            type="submit"
                            variant="outline"
                          >
                            <Trash2 aria-hidden="true" />
                            Eliminar
                          </Button>
                        </>
                      ) : (
                        <Button
                          form={`restore-${prize.id}`}
                          size="sm"
                          type="submit"
                          variant="outline"
                        >
                          <RotateCcw aria-hidden="true" />
                          Restaurar
                        </Button>
                      )}
                    </div>
                  </div>
                </form>
                <form action={deleteAction} id={`delete-${prize.id}`} />
                <form action={restoreAction} id={`restore-${prize.id}`} />
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          description="Carga el primer premio para que aparezca en la pagina publica de la rifa."
          title="Sin premios cargados"
        />
      )}
    </section>
  );
}
