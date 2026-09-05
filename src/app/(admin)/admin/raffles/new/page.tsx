import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RaffleForm } from "@/features/raffles/components/raffle-form";
import { createRaffleAction } from "@/features/raffles/actions";

export default function NewRafflePage() {
  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Nueva rifa</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Al guardar se crea la rifa y se generan sus tickets en PostgreSQL.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/admin/raffles">
            <ArrowLeft aria-hidden="true" />
            Rifas
          </Link>
        </Button>
      </div>
      <RaffleForm action={createRaffleAction} submitLabel="Crear rifa" />
    </section>
  );
}
