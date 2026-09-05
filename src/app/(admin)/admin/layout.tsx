import Link from "next/link";
import {
  ArrowLeft,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  Settings,
  Ticket,
  Trophy,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { logoutAdminAction } from "@/features/auth/actions";
import { requireAdmin } from "@/features/auth/service";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/raffles", label: "Rifas", icon: Ticket },
  { href: "/admin/tickets", label: "Tickets", icon: ClipboardList },
  { href: "/admin/orders", label: "Ordenes", icon: ClipboardList },
  { href: "/admin/payments", label: "Pagos", icon: CircleDollarSign },
  { href: "/admin/draws", label: "Sorteos", icon: Trophy },
  { href: "/admin/participants", label: "Participantes", icon: Users },
  { href: "/admin/settings", label: "Ajustes", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <main className="min-h-screen club-shell text-foreground">
      <header className="relative z-10 border-b border-white/15 club-panel shadow-lg">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="club-logo-mark bg-white" aria-hidden="true">
                CSB
              </span>
              <div>
                <p className="text-sm font-medium text-blue-100">Administracion</p>
                <h1 className="text-2xl font-semibold">Panel operativo</h1>
              </div>
            </div>
            <Button
              asChild
              className="border-white/25 bg-white/10 text-white hover:bg-white/20 lg:hidden"
              size="sm"
              variant="outline"
            >
              <Link href="/">
                <ArrowLeft aria-hidden="true" />
                Inicio
              </Link>
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <nav className="flex flex-wrap gap-2">
              {adminLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Button
                    asChild
                    className="text-white hover:bg-white/15 hover:text-white"
                    key={item.href}
                    size="sm"
                    variant="ghost"
                  >
                    <Link href={item.href}>
                      <Icon aria-hidden="true" />
                      {item.label}
                    </Link>
                  </Button>
                );
              })}
            </nav>
            <div className="hidden rounded-md border border-white/15 bg-white/10 px-3 py-2 text-xs text-blue-50 xl:block">
              {admin.email}
            </div>
            <form action={logoutAdminAction}>
              <Button
                className="border-white/25 bg-white/10 text-white hover:bg-white/20"
                size="sm"
                type="submit"
                variant="outline"
              >
                Salir
              </Button>
            </form>
            <Button
              asChild
              className="hidden border-white/25 bg-white/10 text-white hover:bg-white/20 lg:inline-flex"
              size="sm"
              variant="outline"
            >
              <Link href="/">
                <ArrowLeft aria-hidden="true" />
                Inicio
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <div className="relative z-10">{children}</div>
    </main>
  );
}
