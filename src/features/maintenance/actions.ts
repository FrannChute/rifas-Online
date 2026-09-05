"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/features/auth/service";

import { clearBolivarSales, repairBolivarPrizeImages } from "./service";

function revalidateBolivarPaths() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/participants");
  revalidatePath("/admin/tickets");
  revalidatePath("/admin/raffles");
  revalidatePath("/raffles/gran-rifa-solidaria-u17-de-bolivar");
}

export async function repairBolivarPrizeImagesAction() {
  await requireAdmin();
  await repairBolivarPrizeImages();
  revalidateBolivarPaths();
}

export async function clearBolivarSalesAction() {
  await requireAdmin();
  await clearBolivarSales();
  revalidateBolivarPaths();
}
