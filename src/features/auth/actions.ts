"use server";

import { redirect } from "next/navigation";

import { destroyAdminSession, loginAdminFromForm, type LoginActionState } from "./service";

export async function loginAdminAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const result = await loginAdminFromForm(formData);

  if (!result.ok) {
    return { error: result.error };
  }

  redirect(result.next);
}

export async function logoutAdminAction() {
  await destroyAdminSession();
  redirect("/");
}
