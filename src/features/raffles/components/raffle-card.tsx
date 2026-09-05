import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Ticket } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatMoney } from "@/lib/format";

type RaffleCardProps = {
  raffle: {
    slug: string;
    name: string;
    description: string;
    imageUrl: string | null;
    status: string;
    price: unknown;
    currency: string;
    closesAt: Date | string | null;
    _count: {
      tickets: number;
      prizes: number;
    };
    ticketStats: Record<string, number>;
  };
};

export function RaffleCard({ raffle }: RaffleCardProps) {
  const available = raffle.ticketStats.AVAILABLE ?? 0;
  const paid = (raffle.ticketStats.PAID ?? 0) + (raffle.ticketStats.WINNER ?? 0);

  return (
    <article className="club-card overflow-hidden rounded-lg border bg-card transition-transform duration-200 hover:-translate-y-0.5">
      {raffle.imageUrl ? (
        <div className="relative aspect-[16/9] bg-muted">
          <Image
            alt=""
            className="object-cover"
            fill
            unoptimized
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            src={raffle.imageUrl}
          />
        </div>
      ) : null}
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={raffle.status === "OPEN" ? "secondary" : "outline"}>
            {raffle.status}
          </Badge>
          <Badge className="border-orange-200 bg-orange-50 text-orange-800" variant="outline">
            {formatMoney(String(raffle.price), raffle.currency)}
          </Badge>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{raffle.name}</h2>
          <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
            {raffle.description}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="court-chip rounded-md px-3 py-2">
            <dt className="flex items-center gap-1 text-muted-foreground">
              <Ticket aria-hidden="true" className="size-3.5" />
              Disponibles
            </dt>
            <dd className="mt-1 font-semibold">{available}</dd>
          </div>
          <div className="court-chip rounded-md px-3 py-2">
            <dt className="text-muted-foreground">Vendidos</dt>
            <dd className="mt-1 font-semibold">{paid}</dd>
          </div>
          <div className="court-chip rounded-md px-3 py-2">
            <dt className="text-muted-foreground">Premios</dt>
            <dd className="mt-1 font-semibold">{raffle._count.prizes}</dd>
          </div>
          <div className="court-chip rounded-md px-3 py-2">
            <dt className="text-muted-foreground">Numeros</dt>
            <dd className="mt-1 font-semibold">{raffle._count.tickets}</dd>
          </div>
        </dl>
        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays aria-hidden="true" className="size-3.5" />
            {formatDateTime(raffle.closesAt)}
          </span>
          <Button asChild size="sm">
            <Link href={`/raffles/${raffle.slug}`}>
              Ver numeros
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
