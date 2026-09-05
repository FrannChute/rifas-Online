"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/features/auth/service";

import { createManualCashSaleFromForm } from "./service";

export async function createManualCashSaleAction(formData: FormData) {
  await requireAdmin();

  const order = await createManualCashSaleFromForm(formData);

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/tickets");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/raffles");
  redirect(`/checkout/${order.id}`);
}
