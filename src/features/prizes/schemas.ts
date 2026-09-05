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

const optionalMoney = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.coerce.number().finite().min(0).optional());

export const prizeFormSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: optionalString,
  imageUrl: optionalUrl,
  monetaryValue: optionalMoney,
  position: z.coerce.number().int().min(1),
  active: z.preprocess((value) => value === "on" || value === true, z.boolean()).default(false),
});

export type PrizeFormInput = z.infer<typeof prizeFormSchema>;

export function parsePrizeForm(formData: FormData) {
  return prizeFormSchema.parse(Object.fromEntries(formData.entries()));
}
