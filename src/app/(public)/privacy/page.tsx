import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/site-nav";

export default function PrivacyPage() {
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
        <div className="club-card rounded-xl border bg-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <ShieldCheck aria-hidden="true" className="size-6 text-primary" />
            <h1 className="text-2xl font-semibold">Politica de privacidad</h1>
          </div>
          <div className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>
              Los datos solicitados se usan solamente para registrar la compra de numeros,
              identificar al participante y poder confirmar pagos o ganadores.
            </p>
            <p>
              No compartimos la informacion personal con terceros para publicidad. Los comprobantes
              de pago son privados y se revisan solo desde administracion.
            </p>
            <p>
              Ante cualquier consulta, comunicate con la organizacion de la rifa o con Francisco
              Nieto, creador de esta pagina.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
