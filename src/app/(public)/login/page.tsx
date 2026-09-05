import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/site-nav";
import { loginAdminAction } from "@/features/auth/actions";
import { AdminLoginForm } from "@/features/auth/components/admin-login-form";
import { getCurrentAdmin } from "@/features/auth/service";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const admin = await getCurrentAdmin();

  if (admin) {
    redirect(params.next ?? "/admin");
  }

  return (
    <main className="min-h-screen club-shell text-foreground">
      <SiteNav />
      <section className="relative z-10 mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-12 sm:px-6">
        <Button asChild className="w-fit" size="sm" variant="ghost">
          <Link href="/">
            <ArrowLeft aria-hidden="true" />
            Inicio
          </Link>
        </Button>
        <div className="club-card overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="club-panel flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-blue-100">Club Sportivo Bolivar</p>
              <h1 className="text-2xl font-semibold">Acceso al panel</h1>
            </div>
            <span className="basketball-mark" aria-hidden="true" />
          </div>
          <div className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                <LockKeyhole aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h2 className="text-xl font-semibold">Ingreso administrativo</h2>
                <p className="text-sm text-muted-foreground">
                  Solo administradores pueden entrar al panel.
                </p>
              </div>
            </div>
            <AdminLoginForm action={loginAdminAction} next={params.next} />
          </div>
        </div>
      </section>
    </main>
  );
}
