"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/features/auth/service";

import { executeDraw } from "./service";

export async function executeDrawAction(formData: FormData) {
  await requireAdmin();

  const raffleId = formData.get("raffleId");

  if (typeof raffleId !== "string" || raffleId.length === 0) {
    throw new Error("Selecciona una rifa.");
  }

  await executeDraw(raffleId);

  revalidatePath("/");
  revalidatePath("/winners");
  revalidatePath("/admin");
  revalidatePath("/admin/draws");
  revalidatePath("/admin/raffles");
}
