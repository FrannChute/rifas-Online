"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { Dumbbell, Gift, Hotel, Scissors, Shirt, Sparkles, Utensils } from "lucide-react";

function PrizeFallbackIcon({ name }: { name: string }) {
  const normalized = name.toLowerCase();
  const className = "mx-auto size-8";

  if (normalized.includes("estadia") || normalized.includes("complejo")) {
    return <Hotel aria-hidden="true" className={className} />;
  }

  if (normalized.includes("gym")) {
    return <Dumbbell aria-hidden="true" className={className} />;
  }

  if (normalized.includes("corte") || normalized.includes("barber")) {
    return <Scissors aria-hidden="true" className={className} />;
  }

  if (normalized.includes("mantel") || normalized.includes("limpieza")) {
    return <Shirt aria-hidden="true" className={className} />;
  }

  if (
    normalized.includes("merienda") ||
    normalized.includes("papa") ||
    normalized.includes("alfajor") ||
    normalized.includes("golosina") ||
    normalized.includes("chocolate") ||
    normalized.includes("aceite")
  ) {
    return <Utensils aria-hidden="true" className={className} />;
  }

  if (
    normalized.includes("crema") ||
    normalized.includes("antigue") ||
    normalized.includes("hornito")
  ) {
    return <Sparkles aria-hidden="true" className={className} />;
  }

  return <Gift aria-hidden="true" className={className} />;
}

type PrizeImageProps = {
  name: string;
  position: number;
  src: string | null;
};

export function PrizeImage({ name, position, src }: PrizeImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex size-full items-center justify-center bg-gradient-to-br from-blue-700 via-blue-500 to-orange-400 text-white">
        <div className="text-center">
          <PrizeFallbackIcon name={name} />
          <span className="mt-1 block text-xs font-bold">Premio {position}</span>
        </div>
      </div>
    );
  }

  return (
    <img
      alt={name}
      className="size-full object-contain"
      loading="lazy"
      onError={() => setFailed(true)}
      src={src}
    />
  );
}
