export const ticketStatuses = [
  "AVAILABLE",
  "RESERVED",
  "PAYMENT_PENDING",
  "PAID",
  "WINNER",
  "CANCELLED",
] as const;

export type TicketStatusValue = (typeof ticketStatuses)[number];

export const ticketStatusLabels = {
  AVAILABLE: "Disponible",
  RESERVED: "Reservado",
  PAYMENT_PENDING: "Pago pendiente",
  PAID: "Pagado",
  WINNER: "Ganador",
  CANCELLED: "Anulado",
} satisfies Record<TicketStatusValue, string>;

export const ticketStatusClasses = {
  AVAILABLE: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
  RESERVED: "border-amber-200 bg-amber-50 text-amber-800",
  PAYMENT_PENDING: "border-sky-200 bg-sky-50 text-sky-800",
  PAID: "border-slate-300 bg-slate-100 text-slate-700",
  WINNER: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-800",
} satisfies Record<TicketStatusValue, string>;
