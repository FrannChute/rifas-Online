"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import Link from "next/link";
import { Copy, HeartHandshake, ImageDown, Share2, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type ThankYouShareModalProps = {
  raffleName: string;
  raffleSlug: string;
  imageUrl: string | null;
};

export function ThankYouShareModal({ imageUrl, raffleName, raffleSlug }: ThankYouShareModalProps) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const heroImageUrl = imageUrl ?? "/team/bolivar-u17-equipo-1.png";
  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return `/raffles/${raffleSlug}`;
    }

    return `${window.location.origin}/raffles/${raffleSlug}`;
  }, [raffleSlug]);
  const shareText = `Hola! Estamos ayudando a la U17 de Bolivar con esta rifa solidaria. Si podes colaborar, entra al link, elegi tu numero y participa: ${shareUrl}`;

  async function copyShareText() {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <button
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-slate-900 shadow"
          onClick={() => setOpen(false)}
          type="button"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
        <div className="relative h-52 bg-gradient-to-br from-blue-700 to-orange-500">
          {!imageFailed ? (
            <img
              alt=""
              className="size-full object-cover"
              onError={() => setImageFailed(true)}
              src={heroImageUrl}
            />
          ) : (
            <div className="flex size-full items-center justify-center text-white">
              <HeartHandshake aria-hidden="true" className="size-20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 text-white">
            <p className="text-sm font-semibold uppercase tracking-normal">Gracias por apoyar</p>
            <h2 className="mt-1 text-3xl font-black leading-tight">Sumaste para la U17</h2>
          </div>
        </div>
        <div className="space-y-4 p-5">
          <p className="text-base leading-7 text-slate-700">
            Tu colaboracion ayuda a los chicos de la U17 de Bolivar y acompaña este proyecto hecho
            con esfuerzo por Fran Chute.
          </p>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="mb-2 flex items-center gap-2 font-semibold text-blue-950">
              <Share2 aria-hidden="true" className="size-5" />
              ¿Queres seguir ayudando?
            </div>
            <p className="text-sm leading-6 text-blue-900">
              Compartile esta rifa a tus familiares y amigos para que tambien puedan colaborar con
              el equipo.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
            {shareText}
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Button className="w-full" onClick={copyShareText} type="button">
              <Copy aria-hidden="true" />
              {copied ? "Mensaje copiado" : "Copiar mensaje"}
            </Button>
            <Button asChild className="w-full" variant="secondary">
              <Link href="/share">
                <ImageDown aria-hidden="true" />
                Ver banner
              </Link>
            </Button>
            <Button
              className="w-full"
              onClick={() => setOpen(false)}
              type="button"
              variant="outline"
            >
              Cerrar
            </Button>
          </div>
          <p className="text-center text-xs text-slate-500">{raffleName}</p>
        </div>
      </div>
    </div>
  );
}
