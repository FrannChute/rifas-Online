"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/features/auth/service";

import { releaseTicketsFromAdminForm } from "./service";

export async function releaseTicketsFromAdminAction(formData: FormData) {
  await requireAdmin();
  await releaseTicketsFromAdminForm(formData);
  revalidatePath("/admin/tickets");
  revalidatePath("/");
}
