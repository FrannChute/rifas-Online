import { Archive, CirclePause, CirclePlay, Eye, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RaffleStatus } from "@/generated/prisma/client";

import { transitionRaffleStatusAction } from "../actions";
import { getAllowedRaffleTransitions } from "../status";

const transitionMeta = {
  [RaffleStatus.PUBLISHED]: { label: "Publicar", icon: Eye },
  [RaffleStatus.OPEN]: { label: "Abrir", icon: CirclePlay },
  [RaffleStatus.PAUSED]: { label: "Pausar", icon: CirclePause },
  [RaffleStatus.CLOSED]: { label: "Cerrar", icon: Lock },
  [RaffleStatus.ARCHIVED]: { label: "Archivar", icon: Archive },
  [RaffleStatus.DRAFT]: { label: "Borrador", icon: Eye },
  [RaffleStatus.DRAWING]: { label: "Sorteando", icon: CirclePlay },
  [RaffleStatus.DRAWN]: { label: "Sorteada", icon: Eye },
} satisfies Record<RaffleStatus, { label: string; icon: typeof Eye }>;

type StatusActionsProps = {
  raffleId: string;
  status: RaffleStatus;
};

export function StatusActions({ raffleId, status }: StatusActionsProps) {
  const transitions = getAllowedRaffleTransitions(status);

  if (transitions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {transitions.map((nextStatus) => {
        const meta = transitionMeta[nextStatus];
        const Icon = meta.icon;
        const action = transitionRaffleStatusAction.bind(null, raffleId, nextStatus);

        return (
          <form key={nextStatus} action={action}>
            <Button
              type="submit"
              variant={nextStatus === RaffleStatus.ARCHIVED ? "outline" : "secondary"}
              size="sm"
            >
              <Icon aria-hidden="true" />
              {meta.label}
            </Button>
          </form>
        );
      })}
    </div>
  );
}
