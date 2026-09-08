import { z } from "zod";

const optionalString = z.preprocess((value) => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

const optionalEmail = z.preprocess((value) => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().email().max(180).optional());

export const participantCheckoutSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  email: optionalEmail,
  phone: z.string().trim().min(6).max(40),
  whatsapp: optionalString,
  dni: optionalString,
});

export type ParticipantCheckoutInput = z.infer<typeof participantCheckoutSchema>;

export function parseReservationForm(formData: FormData) {
  const ticketIds = formData
    .getAll("ticketIds")
    .filter((value): value is string => typeof value === "string" && value.length > 0);

  if (ticketIds.length === 0) {
    throw new Error("Selecciona al menos un numero disponible.");
  }

  const uniqueTicketIds = Array.from(new Set(ticketIds));
  if (uniqueTicketIds.length > 5 && formData.get("largePurchaseConfirmed") !== "on") {
    throw new Error("Confirma la compra de mas de 5 numeros para continuar.");
  }

  const raffleId = formData.get("raffleId");
  if (typeof raffleId !== "string" || raffleId.length === 0) {
    throw new Error("No se pudo identificar la rifa.");
  }

  const phone = formData.get("phone");
  const participant = participantCheckoutSchema.parse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone,
    whatsapp: phone,
    dni: formData.get("dni"),
  });

  return {
    raffleId,
    ticketIds: uniqueTicketIds,
    participant,
  };
}

function parseTicketNumbers(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    throw new Error("Ingresa los numeros de la venta.");
  }

  const numbers = value
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map(Number);

  if (numbers.length === 0 || numbers.some((number) => !Number.isInteger(number) || number < 0)) {
    throw new Error("Ingresa numeros validos separados por coma o espacio.");
  }

  return Array.from(new Set(numbers));
}

export function parseManualCashSaleForm(formData: FormData) {
  const raffleId = formData.get("raffleId");
  if (typeof raffleId !== "string" || raffleId.length === 0) {
    throw new Error("Selecciona una rifa.");
  }

  const phone = formData.get("phone");
  const participant = participantCheckoutSchema.parse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone,
    whatsapp: phone,
    dni: formData.get("dni"),
  });

  return {
    raffleId,
    ticketNumbers: parseTicketNumbers(formData.get("ticketNumbers")),
    participant,
  };
}
