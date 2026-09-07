"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";

type PrizeImageProps = {
  name: string;
  position: number;
  src: string | null;
};

export function PrizeImage({ name, position, src }: PrizeImageProps) {
  const [primaryFailed, setPrimaryFailed] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);
  const fallbackSrc = `/prizes/bolivar-${position.toString().padStart(2, "0")}.svg`;
  const imageSrc = src && !primaryFailed ? src : fallbackSrc;

  if (!fallbackFailed) {
    return (
      <img
        alt={name}
        className="size-full object-cover"
        loading="lazy"
        onError={() => {
          if (imageSrc === fallbackSrc) {
            setFallbackFailed(true);
          } else {
            setPrimaryFailed(true);
          }
        }}
        src={imageSrc}
      />
    );
  }

  return (
    <div className="relative flex size-full items-center justify-center overflow-hidden bg-gradient-to-br from-blue-800 via-blue-600 to-orange-400 text-white">
      <span className="absolute -right-5 -top-7 size-24 rounded-full border-[14px] border-white/15" />
      <span className="absolute -bottom-7 -left-6 size-24 rounded-full border-[10px] border-orange-100/20" />
      <div className="relative z-10 px-2 text-center">
        <span className="mt-1 block text-xs font-black uppercase tracking-normal">
          Premio {position}
        </span>
      </div>
    </div>
  );
}
