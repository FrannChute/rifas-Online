import { randomBytes } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { UserRole, UserStatus } from "@/generated/prisma/client";
import { getEnv } from "@/config/env";
import { prisma } from "@/lib/db";

import { verifyPassword } from "./password";
import { parseAdminLoginForm } from "./schemas";

export const adminSessionCookieName = "rifas_admin_session";

const sessionDays = 7;

export type LoginActionState = {
  error: string | null;
};

function getSafeNext(next: string | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/admin";
  }

  if (next.startsWith("/login")) {
    return "/admin";
  }

  return next;
}

export async function createAdminSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      sessionToken: token,
      userId,
      expires,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(adminSessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: getEnv().NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function loginAdminFromForm(formData: FormData) {
  const input = parseAdminLoginForm(formData);
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      role: true,
      status: true,
      deletedAt: true,
    },
  });

  if (
    !user ||
    user.role !== UserRole.ADMIN ||
    user.status !== UserStatus.ACTIVE ||
    user.deletedAt ||
    !verifyPassword(input.password, user.passwordHash)
  ) {
    return {
      ok: false as const,
      error: "Correo o contrasena incorrectos.",
    };
  }

  await createAdminSession(user.id);

  return {
    ok: true as const,
    next: getSafeNext(input.next),
  };
}

export async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(adminSessionCookieName)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          deletedAt: true,
        },
      },
    },
  });

  if (!session || session.expires < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { sessionToken: token } }).catch(() => undefined);
    }

    return null;
  }

  if (
    session.user.role !== UserRole.ADMIN ||
    session.user.status !== UserStatus.ACTIVE ||
    session.user.deletedAt
  ) {
    return null;
  }

  return session.user;
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/login?next=/admin");
  }

  return admin;
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(adminSessionCookieName)?.value;

  if (token) {
    await prisma.session.delete({ where: { sessionToken: token } }).catch(() => undefined);
  }

  cookieStore.delete(adminSessionCookieName);
}
