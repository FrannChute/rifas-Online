import { z } from "zod";

const optionalString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

export const platformSettingsSchema = z.object({
  platformName: z.string().trim().min(2).max(120),
  primaryColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/),
  accentColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/),
  supportEmail: optionalString.pipe(z.string().email().optional()),
  supportWhatsapp: optionalString,
  bankAlias: optionalString,
  bankCbu: optionalString,
  bankCvu: optionalString,
  bankAccountHolder: optionalString,
  bankName: optionalString,
  terms: optionalString,
  privacyPolicy: optionalString,
  defaultReservationDurationMinutes: z.coerce.number().int().min(1).max(10_080),
});

export type PlatformSettingsInput = z.infer<typeof platformSettingsSchema>;

export function parsePlatformSettingsForm(formData: FormData) {
  return platformSettingsSchema.parse(Object.fromEntries(formData.entries()));
}
