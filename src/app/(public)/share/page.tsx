/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowLeft, ExternalLink, ImageDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/site-nav";

export const dynamic = "force-dynamic";

const appUrl = "https://rifas-online-2gzx.onrender.com";
const shareMessage =
  "Hola! Estamos ayudando a la U17 de Bolivar con esta rifa solidaria. Si podes colaborar, entra al link, elegi tu numero y participa: https://rifas-online-2gzx.onrender.com";

export default function SharePage() {
  return (
    <main className="min-h-screen club-shell text-foreground">
      <SiteNav />
      <section className="relative z-10 mx-auto w-full max-w-5xl space-y-5 px-4 py-8 sm:px-6">
        <Button asChild className="w-fit" size="sm" variant="ghost">
          <Link href="/">
            <ArrowLeft aria-hidden="true" />
            Volver
          </Link>
        </Button>

        <div className="team-photo-soft rounded-xl border border-blue-200 p-5 text-white shadow-xl">
          <p className="text-sm font-semibold uppercase">Banner para compartir</p>
          <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
            Rifa solidaria Bolivar U17
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-white/90">
            Descarga o comparti este banner junto con el link de la rifa para que mas personas
            puedan colaborar.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <img
            alt="Banner de la rifa solidaria Bolivar U17"
            className="w-full"
            src="/share/bolivar-u17-banner.svg"
          />
        </div>

        <div className="grid gap-4 rounded-xl border bg-card p-5 shadow-sm lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <div>
            <p className="font-semibold">Mensaje sugerido</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{shareMessage}</p>
          </div>
          <Button asChild className="h-14 px-6 text-base font-bold">
            <a download href="/share/bolivar-u17-banner.svg">
              <ImageDown aria-hidden="true" />
              Descargar banner
            </a>
          </Button>
          <Button asChild className="h-14 px-6 text-base font-bold" variant="outline">
            <a href={appUrl}>
              <ExternalLink aria-hidden="true" />
              Abrir rifa
            </a>
          </Button>
        </div>
      </section>
    </main>
  );
}
