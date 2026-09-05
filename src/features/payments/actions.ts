"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/features/auth/service";

import { approvePayment, rejectPayment } from "./service";

export async function approvePaymentAction(paymentId: string) {
  await requireAdmin();

  await approvePayment(paymentId);

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/raffles");
}

export async function rejectPaymentAction(paymentId: string, formData: FormData) {
  await requireAdmin();

  await rejectPayment(paymentId, formData);

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/raffles");
}
