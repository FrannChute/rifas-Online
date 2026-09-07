import Link from "next/link";
import { ArrowLeft, HeartHandshake } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/site-nav";

export default function AboutPage() {
  return (
    <main className="min-h-screen club-shell text-foreground">
      <SiteNav />
      <section className="relative z-10 mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <Button asChild className="mb-5 w-fit" size="sm" variant="ghost">
          <Link href="/">
            <ArrowLeft aria-hidden="true" />
            Volver
          </Link>
        </Button>
        <div className="team-photo-soft rounded-xl border border-blue-200 p-6 text-white shadow-xl">
          <div className="mb-4 flex items-center gap-3">
            <HeartHandshake aria-hidden="true" className="size-7" />
            <h1 className="text-2xl font-semibold">Acerca de la rifa</h1>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-white/90">
            Esta pagina acompaña la rifa solidaria de Bolivar U17. La idea es que cada persona pueda
            elegir su numero, colaborar y ayudar al equipo de una forma clara y simple.
          </p>
        </div>
      </section>
    </main>
  );
}
