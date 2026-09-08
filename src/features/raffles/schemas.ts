import { z } from "zod";

const optionalString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

const optionalUrl = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  },
  z
    .string()
    .refine((value) => value.startsWith("/") || z.string().url().safeParse(value).success, {
      message: "Ingresa una URL completa o una ruta interna como /prizes/imagen.svg.",
    })
    .optional(),
);

const optionalDate = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const hasTimeZone = /(?:z|[+-]\d{2}:\d{2})$/i.test(trimmed);
  if (hasTimeZone) {
    return new Date(trimmed);
  }

  const argentinaDateTime = trimmed.length === 16 ? `${trimmed}:00-03:00` : `${trimmed}-03:00`;
  return new Date(argentinaDateTime);
}, z.date().optional());

const checkbox = z.preprocess(
  (value) => value === "on" || value === "true" || value === true,
  z.boolean(),
);

export const raffleFormSchema = z
  .object({
    name: z.string().trim().min(3).max(160),
    slug: optionalString,
    description: z.string().trim().min(10).max(10_000),
    imageUrl: optionalUrl,
    price: z.coerce.number().finite().min(0),
    currency: z
      .string()
      .trim()
      .length(3)
      .transform((value) => value.toUpperCase()),
    startNumber: z.coerce.number().int().min(0),
    endNumber: z.coerce.number().int().min(0),
    numberPadding: z.coerce.number().int().min(0).max(12),
    startsAt: optionalDate,
    closesAt: optionalDate,
    drawScheduledAt: optionalDate,
    reservationDurationMinutes: z.coerce.number().int().min(1).max(10_080),
    allowGuestPurchase: checkbox.default(false),
    allowAccountPurchase: checkbox.default(false),
    allowMultipleWinsPerTicket: checkbox.default(false),
    allowMultipleWinsPerParticipant: checkbox.default(false),
    winnerRules: optionalString,
    terms: optionalString,
    contactEmail: optionalString.pipe(z.string().email().optional()),
    contactPhone: optionalString,
    contactWhatsapp: optionalString,
    paymentBankTransfer: checkbox.default(false),
    paymentCash: checkbox.default(false),
    paymentMercadoPago: checkbox.default(false),
    bankName: optionalString,
    bankAccountHolder: optionalString,
    bankAlias: optionalString,
    bankCbu: optionalString,
    bankCvu: optionalString,
    bankInstructions: optionalString,
  })
  .superRefine((data, ctx) => {
    if (data.endNumber < data.startNumber) {
      ctx.addIssue({
        code: "custom",
        message: "El numero final debe ser mayor o igual al inicial.",
        path: ["endNumber"],
      });
    }

    if (!data.allowGuestPurchase && !data.allowAccountPurchase) {
      ctx.addIssue({
        code: "custom",
        message: "Debe habilitar al menos una modalidad de compra.",
        path: ["allowGuestPurchase"],
      });
    }

    if (!data.paymentBankTransfer && !data.paymentCash && !data.paymentMercadoPago) {
      ctx.addIssue({
        code: "custom",
        message: "Debe habilitar al menos un metodo de pago.",
        path: ["paymentBankTransfer"],
      });
    }

    if (data.startsAt && data.closesAt && data.closesAt <= data.startsAt) {
      ctx.addIssue({
        code: "custom",
        message: "La fecha de cierre debe ser posterior al inicio.",
        path: ["closesAt"],
      });
    }
  });

export type RaffleFormInput = z.infer<typeof raffleFormSchema>;

export function formDataToObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export function parseRaffleForm(formData: FormData) {
  return raffleFormSchema.parse(formDataToObject(formData));
}
