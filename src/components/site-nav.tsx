import Link from "next/link";
import { LayoutDashboard, LogIn, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";

type SiteNavProps = {
  platformName?: string;
};

export function SiteNav({ platformName = "Rifas Online" }: SiteNavProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link
          className="flex items-center gap-3 text-base font-semibold tracking-normal text-foreground"
          href="/"
        >
          <span className="club-logo-mark" aria-hidden="true">
            CSB
          </span>
          <span>{platformName}</span>
        </Link>
        <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Button asChild size="sm" variant="ghost">
            <Link href="/winners">
              <Trophy aria-hidden="true" />
              <span className="hidden sm:inline">Ganadores</span>
            </Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link href="/login">
              <LogIn aria-hidden="true" />
              <span className="hidden sm:inline">Login</span>
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/admin">
              <LayoutDashboard aria-hidden="true" />
              <span className="hidden sm:inline">Panel</span>
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
