"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/features/auth/service";

import { deleteParticipantFromAdminForm } from "./service";

export async function deleteParticipantFromAdminAction(formData: FormData) {
  await requireAdmin();
  await deleteParticipantFromAdminForm(formData);

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/participants");
  revalidatePath("/admin/tickets");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/payments");
}
