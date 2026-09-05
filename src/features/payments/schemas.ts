import { z } from "zod";

import { PaymentMethodType } from "@/generated/prisma/client";

export const rejectPaymentSchema = z.object({
  reason: z.string().trim().min(5).max(500),
});

const receiptPaymentSchema = z.object({
  method: z.enum([PaymentMethodType.BANK_TRANSFER, PaymentMethodType.MERCADO_PAGO]),
});

export function getReceiptPaymentInput(formData: FormData) {
  const input = receiptPaymentSchema.parse({
    method: formData.get("method"),
  });
  const receipt = formData.get("receipt");

  if (!(receipt instanceof File) || receipt.size === 0) {
    throw new Error("Sube un comprobante de pago.");
  }

  return {
    ...input,
    receipt,
  };
}
