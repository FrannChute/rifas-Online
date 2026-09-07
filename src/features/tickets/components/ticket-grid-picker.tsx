"use client";

import { useActionState, useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

import { ticketStatusClasses, type TicketStatusValue } from "../status";

export type TicketGridItem = {
  id: string;
  number: number;
  label: string;
  status: TicketStatusValue;
  reservedUntil: Date | string | null;
};

type ReservationActionState = {
  error: string | null;
};

type TicketGridPickerProps = {
  raffleId: string;
  tickets: TicketGridItem[];
  totalTicketCount: number;
  price: number | string;
  currency: string;
  reserveAction: (
    previousState: ReservationActionState,
    formData: FormData,
  ) => Promise<ReservationActionState>;
};

function matchesQuery(ticket: TicketGridItem, query: string) {
  const cleanQuery = query.trim();

  if (!cleanQuery) {
    return true;
  }

  const rangeMatch = cleanQuery.match(/^(\d+)\s*-\s*(\d+)$/);
  if (rangeMatch) {
    const start = Number(rangeMatch[1]);
    const end = Number(rangeMatch[2]);

    return ticket.number >= Math.min(start, end) && ticket.number <= Math.max(start, end);
  }

  return ticket.label.includes(cleanQuery) || ticket.number.toString() === cleanQuery;
}

export function TicketGridPicker({
  currency,
  price,
  raffleId,
  reserveAction,
  tickets,
  totalTicketCount,
}: TicketGridPickerProps) {
  const [actionState, formAction, isPending] = useActionState(reserveAction, { error: null });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<TicketStatusValue | "ALL">("ALL");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const publicFilters = [
    { label: "Todos", value: "ALL" as const },
    { label: "Disponible", value: "AVAILABLE" as const },
  ];

  const visibleTickets = useMemo(
    () =>
      tickets.filter((ticket) => {
        const statusMatches = status === "ALL" || ticket.status === status;

        return statusMatches && matchesQuery(ticket, query);
      }),
    [query, status, tickets],
  );

  const selectedTickets = useMemo(
    () => tickets.filter((ticket) => selectedIds.has(ticket.id)),
    [selectedIds, tickets],
  );
  const total = selectedTickets.length * Number(price);
  const needsLargePurchaseConfirmation = selectedTickets.length > 10;

  function toggleTicket(ticket: TicketGridItem) {
    if (ticket.status !== "AVAILABLE") {
      return;
    }

    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(ticket.id)) {
        next.delete(ticket.id);
      } else {
        next.add(ticket.id);
      }

      return next;
    });
  }

  return (
    <section className="space-y-4">
      <div className="grid gap-3 rounded-lg border border-border bg-card p-4 shadow-sm lg:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label="Buscar numero"
            className="pl-9"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar 0327 o rango 100-150"
            value={query}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {publicFilters.map((filter) => (
            <Button
              key={filter.value}
              onClick={() => setStatus(filter.value)}
              size="sm"
              type="button"
              variant={status === filter.value ? "default" : "outline"}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>
              Mostrando {visibleTickets.length} de {totalTicketCount} numeros
            </span>
            {totalTicketCount > tickets.length ? (
              <span>{tickets.length} cargados en esta vista</span>
            ) : null}
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(4.2rem,1fr))] gap-2">
            {visibleTickets.map((ticket) => {
              const selected = selectedIds.has(ticket.id);

              return (
                <button
                  aria-pressed={selected}
                  className={cn(
                    "h-11 rounded-md border px-2 text-sm font-semibold tabular-nums transition-[transform,box-shadow,background-color,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    ticketStatusClasses[ticket.status],
                    ticket.status !== "AVAILABLE" && "cursor-not-allowed",
                    selected &&
                      "border-orange-900 bg-orange-500 text-white shadow-md ring-2 ring-orange-900 hover:bg-orange-600",
                  )}
                  disabled={ticket.status !== "AVAILABLE"}
                  key={ticket.id}
                  onClick={() => toggleTicket(ticket)}
                  type="button"
                >
                  {ticket.label}
                </button>
              );
            })}
          </div>
        </div>

        <form
          action={formAction}
          className="h-fit rounded-lg border border-border bg-card p-4 shadow-sm"
        >
          <input name="raffleId" type="hidden" value={raffleId} />
          {selectedTickets.map((ticket) => (
            <input key={ticket.id} name="ticketIds" type="hidden" value={ticket.id} />
          ))}
          <h2 className="text-base font-semibold">Seleccion</h2>
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Numeros</span>
              <span className="font-semibold">{selectedTickets.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">{formatMoney(total, currency)}</span>
            </div>
            {selectedTickets.length > 0 ? (
              <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                {selectedTickets.map((ticket) => (
                  <Badge key={ticket.id} variant="secondary">
                    {ticket.label}
                    <button
                      aria-label={`Quitar ${ticket.label}`}
                      className="ml-1 rounded-sm"
                      onClick={() => toggleTicket(ticket)}
                      type="button"
                    >
                      <X aria-hidden="true" className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="border-t border-border pt-3 text-sm leading-6 text-muted-foreground">
                Elegi uno o mas numeros disponibles.
              </p>
            )}
            {needsLargePurchaseConfirmation ? (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                <p className="font-semibold">Estas eligiendo mas de 10 numeros.</p>
                <p className="mt-1 leading-5">
                  Es una ayuda muy grande para los chicos de la U17. Confirmalo solo si estas seguro
                  de continuar.
                </p>
                <label className="mt-3 flex items-start gap-2 text-sm">
                  <input className="mt-1" name="largePurchaseConfirmed" required type="checkbox" />
                  <span>Si, confirmo que quiero reservar esta cantidad de numeros.</span>
                </label>
              </div>
            ) : null}
            <div className="space-y-3 border-t border-border pt-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input id="firstName" name="firstName" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input id="lastName" name="lastName" required />
                </div>
                <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                  <Label htmlFor="email">Email (opcional)</Label>
                  <Input id="email" name="email" type="email" />
                </div>
                <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                  <Label htmlFor="phone">Telefono</Label>
                  <Input id="phone" name="phone" required />
                </div>
              </div>
              {actionState.error ? (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm leading-5 text-destructive">
                  {actionState.error}
                </p>
              ) : null}
              <Button
                className="shiny-action w-full"
                disabled={selectedTickets.length === 0 || isPending}
                type="submit"
              >
                {isPending ? "Reservando..." : "Reservar y continuar"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
