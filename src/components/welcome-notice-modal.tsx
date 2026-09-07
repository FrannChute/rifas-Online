"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { HeartHandshake, X } from "lucide-react";

import { Button } from "@/components/ui/button";

export function WelcomeNoticeModal() {
  const [open, setOpen] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);

  function close() {
    setOpen(false);
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <button
          aria-label="Cerrar aviso"
          className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-slate-900 shadow"
          onClick={close}
          type="button"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
        <div className="relative h-56 bg-gradient-to-br from-blue-800 via-blue-600 to-orange-500">
          {!imageFailed ? (
            <img
              alt=""
              className="size-full object-cover"
              onError={() => setImageFailed(true)}
              src="/team/bolivar-u17-finalistas.jpg"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-white">
              <HeartHandshake aria-hidden="true" className="size-20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 text-white">
            <p className="text-sm font-bold uppercase tracking-normal">Aviso rapido</p>
            <h2 className="mt-1 text-3xl font-black leading-tight">Pagina hecha por Fran</h2>
          </div>
        </div>
        <div className="space-y-4 p-5">
          <p className="text-base leading-7 text-slate-700">
            Esta pagina fue creada por Francisco Nieto para ayudar a los chicos de la U17. Si ves
            algun detalle raro, no te preocupes: la compra queda registrada y el administrador puede
            revisarla desde el panel.
          </p>
          <Button className="shiny-action h-12 w-full text-base" onClick={close} type="button">
            Entendido, quiero colaborar
          </Button>
        </div>
      </div>
    </div>
  );
}
