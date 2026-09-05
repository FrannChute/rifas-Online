"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/features/auth/service";

import { updatePlatformSettings } from "./service";

export async function updatePlatformSettingsAction(formData: FormData) {
  await requireAdmin();

  await updatePlatformSettings(formData);

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
}
