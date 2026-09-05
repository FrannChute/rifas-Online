import type { RaffleStatus } from "@/generated/prisma/client";

const allowedTransitions = {
  DRAFT: ["PUBLISHED", "OPEN", "ARCHIVED"],
  PUBLISHED: ["OPEN", "ARCHIVED"],
  OPEN: ["PAUSED", "CLOSED", "ARCHIVED"],
  PAUSED: ["OPEN", "CLOSED", "ARCHIVED"],
  CLOSED: ["ARCHIVED"],
  DRAWING: [],
  DRAWN: ["ARCHIVED"],
  ARCHIVED: [],
} satisfies Record<RaffleStatus, RaffleStatus[]>;

export function getAllowedRaffleTransitions(status: RaffleStatus) {
  return allowedTransitions[status];
}

export function assertRaffleTransition(from: RaffleStatus, to: RaffleStatus) {
  const transitions: readonly RaffleStatus[] = allowedTransitions[from];

  if (!transitions.includes(to)) {
    throw new Error(`Transicion de rifa invalida: ${from} -> ${to}`);
  }
}
