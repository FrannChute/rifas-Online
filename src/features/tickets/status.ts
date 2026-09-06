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
  AVAILABLE:
    "border-emerald-800 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 hover:shadow-md",
  RESERVED: "border-slate-700 bg-slate-800 text-white",
  PAYMENT_PENDING: "border-blue-800 bg-blue-700 text-white",
  PAID: "border-slate-950 bg-slate-900 text-white",
  WINNER: "border-fuchsia-800 bg-fuchsia-700 text-white",
  CANCELLED: "border-rose-800 bg-rose-700 text-white",
} satisfies Record<TicketStatusValue, string>;
