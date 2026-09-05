"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { reserveTicketsFromForm } from "./service";

export type ReservationActionState = {
  error: string | null;
};

export async function reserveTicketsAction(formData: FormData) {
  const order = await reserveTicketsFromForm(formData);

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/raffles");
  redirect(`/checkout/${order.id}`);
}

export async function reserveTicketsWithStateAction(
  _previousState: ReservationActionState,
  formData: FormData,
): Promise<ReservationActionState> {
  let orderId: string;

  try {
    const order = await reserveTicketsFromForm(formData);
    orderId = order.id;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo reservar la seleccion.",
    };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/raffles");
  redirect(`/checkout/${orderId}`);
}
