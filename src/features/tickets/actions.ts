"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/features/auth/service";

import { markTicketsPaidFromAdminForm, releaseTicketsFromAdminForm } from "./service";

export async function releaseTicketsFromAdminAction(formData: FormData) {
  await requireAdmin();
  await releaseTicketsFromAdminForm(formData);
  revalidatePath("/admin/tickets");
  revalidatePath("/");
}

export async function markTicketsPaidFromAdminAction(formData: FormData) {
  await requireAdmin();
  await markTicketsPaidFromAdminForm(formData);
  revalidatePath("/admin");
  revalidatePath("/admin/tickets");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/orders");
  revalidatePath("/");
}
