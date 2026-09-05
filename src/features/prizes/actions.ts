"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/features/auth/service";

import { createPrize, restorePrize, softDeletePrize, updatePrize } from "./service";

function revalidatePrizePaths(raffleId: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/raffles");
  revalidatePath(`/admin/raffles/${raffleId}/prizes`);
}

export async function createPrizeAction(raffleId: string, formData: FormData) {
  await requireAdmin();

  await createPrize(raffleId, formData);
  revalidatePrizePaths(raffleId);
}

export async function updatePrizeAction(raffleId: string, prizeId: string, formData: FormData) {
  await requireAdmin();

  await updatePrize(prizeId, formData);
  revalidatePrizePaths(raffleId);
}

export async function softDeletePrizeAction(raffleId: string, prizeId: string) {
  await requireAdmin();

  await softDeletePrize(prizeId);
  revalidatePrizePaths(raffleId);
}

export async function restorePrizeAction(raffleId: string, prizeId: string) {
  await requireAdmin();

  await restorePrize(prizeId);
  revalidatePrizePaths(raffleId);
}
