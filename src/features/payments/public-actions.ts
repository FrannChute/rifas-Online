"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { submitBankTransferPayment } from "./service";

export type PaymentReceiptActionState = {
  error: string | null;
};

export async function submitBankTransferPaymentAction(orderId: string, formData: FormData) {
  await submitBankTransferPayment(orderId, formData);

  revalidatePath(`/checkout/${orderId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  redirect(`/checkout/${orderId}`);
}

export async function submitPaymentReceiptWithStateAction(
  orderId: string,
  _previousState: PaymentReceiptActionState,
  formData: FormData,
): Promise<PaymentReceiptActionState> {
  try {
    await submitBankTransferPayment(orderId, formData);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo cargar el comprobante.",
    };
  }

  revalidatePath(`/checkout/${orderId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  redirect(`/checkout/${orderId}`);
}
