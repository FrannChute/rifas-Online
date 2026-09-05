import { prisma } from "@/lib/db";

import { parsePlatformSettingsForm } from "./schemas";

export async function getSettingsForAdmin() {
  return prisma.platformSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      platformName: "Rifas Online",
      primaryColor: "#0f172a",
      accentColor: "#0ea5e9",
      defaultReservationDurationMinutes: 10,
    },
  });
}

export async function updatePlatformSettings(formData: FormData) {
  const input = parsePlatformSettingsForm(formData);

  return prisma.$transaction(async (tx) => {
    const settings = await tx.platformSettings.upsert({
      where: { id: "default" },
      update: {
        platformName: input.platformName,
        primaryColor: input.primaryColor,
        accentColor: input.accentColor,
        supportEmail: input.supportEmail ?? null,
        supportWhatsapp: input.supportWhatsapp ?? null,
        bankAlias: input.bankAlias ?? null,
        bankCbu: input.bankCbu ?? null,
        bankCvu: input.bankCvu ?? null,
        bankAccountHolder: input.bankAccountHolder ?? null,
        bankName: input.bankName ?? null,
        terms: input.terms ?? null,
        privacyPolicy: input.privacyPolicy ?? null,
        defaultReservationDurationMinutes: input.defaultReservationDurationMinutes,
      },
      create: {
        id: "default",
        platformName: input.platformName,
        primaryColor: input.primaryColor,
        accentColor: input.accentColor,
        supportEmail: input.supportEmail ?? null,
        supportWhatsapp: input.supportWhatsapp ?? null,
        bankAlias: input.bankAlias ?? null,
        bankCbu: input.bankCbu ?? null,
        bankCvu: input.bankCvu ?? null,
        bankAccountHolder: input.bankAccountHolder ?? null,
        bankName: input.bankName ?? null,
        terms: input.terms ?? null,
        privacyPolicy: input.privacyPolicy ?? null,
        defaultReservationDurationMinutes: input.defaultReservationDurationMinutes,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "platform_settings.updated",
        entityType: "PlatformSettings",
        entityId: settings.id,
      },
    });

    return settings;
  });
}
