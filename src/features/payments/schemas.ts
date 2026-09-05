import { z } from "zod";

import { PaymentMethodType } from "@/generated/prisma/client";

export const rejectPaymentSchema = z.object({
  reason: z.string().trim().min(5).max(500),
});

const receiptPaymentSchema = z.object({
  method: z.enum([PaymentMethodType.BANK_TRANSFER, PaymentMethodType.MERCADO_PAGO]),
});

const maxReceiptBytes = 8 * 1024 * 1024;

export function getReceiptPaymentInput(formData: FormData) {
  const input = receiptPaymentSchema.parse({
    method: formData.get("method"),
  });
  const receipt = formData.get("receipt");

  if (!(receipt instanceof File) || receipt.size === 0) {
    throw new Error("Sube un comprobante de pago.");
  }

  if (!receipt.type.startsWith("image/")) {
    throw new Error("El comprobante debe ser una foto o imagen valida.");
  }

  if (receipt.size > maxReceiptBytes) {
    throw new Error("La imagen del comprobante no puede superar 8 MB.");
  }

  return {
    ...input,
    receipt,
  };
}
