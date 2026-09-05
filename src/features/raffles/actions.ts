"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { RaffleStatus } from "@/generated/prisma/client";
import { requireAdmin } from "@/features/auth/service";

import { createRaffle, updateRaffle, updateRaffleStatus } from "./service";

export async function createRaffleAction(formData: FormData) {
  await requireAdmin();

  const raffle = await createRaffle(formData);

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/raffles");
  redirect(`/admin/raffles/${raffle.id}/edit`);
}

export async function updateRaffleAction(id: string, formData: FormData) {
  await requireAdmin();

  const raffle = await updateRaffle(id, formData);

  revalidatePath("/");
  revalidatePath(`/raffles/${raffle.slug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/raffles");
  revalidatePath(`/admin/raffles/${raffle.id}/edit`);
  redirect(`/admin/raffles/${raffle.id}/edit`);
}

export async function transitionRaffleStatusAction(id: string, status: RaffleStatus) {
  await requireAdmin();

  const raffle = await updateRaffleStatus(id, status);

  revalidatePath("/");
  revalidatePath(`/raffles/${raffle.slug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/raffles");
  redirect(`/admin/raffles/${raffle.id}/edit`);
}
