import { Dumbbell, Gift, Hotel, Scissors, Shirt, Sparkles, Utensils } from "lucide-react";

function PrizeFallbackIcon({ name }: { name: string }) {
  const normalized = name.toLowerCase();
  const className = "mx-auto size-9 drop-shadow-sm";

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
};

export function PrizeImage({ name, position }: PrizeImageProps) {
  return (
    <div className="relative flex size-full items-center justify-center overflow-hidden bg-gradient-to-br from-blue-800 via-blue-600 to-orange-400 text-white">
      <span className="absolute -right-5 -top-7 size-24 rounded-full border-[14px] border-white/15" />
      <span className="absolute -bottom-7 -left-6 size-24 rounded-full border-[10px] border-orange-100/20" />
      <div className="relative z-10 px-2 text-center">
        <PrizeFallbackIcon name={name} />
        <span className="mt-1 block text-xs font-black uppercase tracking-normal">
          Premio {position}
        </span>
      </div>
    </div>
  );
}
