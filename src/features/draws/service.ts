import { createHash, randomBytes } from "node:crypto";

import {
  DrawStatus,
  Prisma,
  RaffleStatus,
  TicketHistoryEvent,
  TicketStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

const algorithm = "sha256-seed-snapshot-v1";

function hashJson(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function rankTicket(seed: string, ticketId: string, position: number) {
  return createHash("sha256").update(`${seed}:${position}:${ticketId}`).digest("hex");
}

export async function listDrawableRaffles() {
  return prisma.raffle.findMany({
    where: {
      deletedAt: null,
      status: { in: [RaffleStatus.CLOSED, RaffleStatus.DRAWN] },
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          prizes: true,
          tickets: true,
          winners: true,
        },
      },
    },
  });
}

export async function listAdminDraws() {
  return prisma.draw.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      raffle: {
        select: {
          name: true,
          slug: true,
        },
      },
      winners: {
        orderBy: { position: "asc" },
        include: {
          prize: { select: { name: true } },
          participant: { select: { firstName: true, lastName: true } },
        },
      },
    },
    take: 50,
  });
}

export async function executeDraw(raffleId: string) {
  return prisma.$transaction(
    async (tx) => {
      const raffle = await tx.raffle.findUniqueOrThrow({
        where: { id: raffleId },
        include: {
          prizes: {
            where: { active: true, deletedAt: null },
            orderBy: { position: "asc" },
          },
        },
      });

      if (raffle.status !== RaffleStatus.CLOSED) {
        throw new Error("Solo una rifa cerrada puede sortearse.");
      }

      if (raffle.prizes.length === 0) {
        throw new Error("La rifa no tiene premios activos.");
      }

      const existingCompleted = await tx.draw.findFirst({
        where: { raffleId, status: DrawStatus.COMPLETED },
        select: { id: true },
      });

      if (existingCompleted) {
        throw new Error("Esta rifa ya tiene un sorteo completado.");
      }

      await tx.raffle.update({
        where: { id: raffle.id },
        data: { status: RaffleStatus.DRAWING },
      });

      const eligibleTickets = await tx.ticket.findMany({
        where: {
          raffleId,
          status: TicketStatus.PAID,
        },
        orderBy: { number: "asc" },
      });

      if (eligibleTickets.length === 0) {
        throw new Error("No hay tickets pagados para sortear.");
      }

      const seed = randomBytes(32).toString("hex");
      const seedCommitment = createHash("sha256").update(seed).digest("hex");
      const snapshot = eligibleTickets.map((ticket) => ({
        ticketId: ticket.id,
        number: ticket.number,
        label: ticket.label,
        participantId: ticket.participantId,
        orderId: ticket.currentOrderId,
      }));
      const snapshotHash = hashJson(snapshot);
      const now = new Date();

      const draw = await tx.draw.create({
        data: {
          raffleId,
          status: DrawStatus.RUNNING,
          algorithm,
          seedCommitment,
          seed,
          snapshotHash,
          eligibleTicketCount: eligibleTickets.length,
          startedAt: now,
          metadata: {
            prizeCount: raffle.prizes.length,
          },
        },
      });

      await tx.drawEligibleTicket.createMany({
        data: eligibleTickets.map((ticket) => ({
          drawId: draw.id,
          raffleId,
          ticketId: ticket.id,
          participantId: ticket.participantId,
          orderId: ticket.currentOrderId,
          number: ticket.number,
          label: ticket.label,
          snapshotStatus: ticket.status,
        })),
      });

      const selectedTicketIds = new Set<string>();
      const selectedParticipantIds = new Set<string>();
      const winners = [];

      for (const prize of raffle.prizes) {
        const candidate = eligibleTickets
          .filter((ticket) => {
            if (!raffle.allowMultipleWinsPerTicket && selectedTicketIds.has(ticket.id)) {
              return false;
            }

            if (
              !raffle.allowMultipleWinsPerParticipant &&
              ticket.participantId &&
              selectedParticipantIds.has(ticket.participantId)
            ) {
              return false;
            }

            return true;
          })
          .sort((left, right) =>
            rankTicket(seed, left.id, prize.position).localeCompare(
              rankTicket(seed, right.id, prize.position),
            ),
          )[0];

        if (!candidate) {
          break;
        }

        selectedTicketIds.add(candidate.id);
        if (candidate.participantId) {
          selectedParticipantIds.add(candidate.participantId);
        }

        winners.push({
          raffleId,
          drawId: draw.id,
          prizeId: prize.id,
          ticketId: candidate.id,
          participantId: candidate.participantId,
          position: prize.position,
          number: candidate.number,
          label: candidate.label,
          publishedAt: now,
        });
      }

      if (winners.length === 0) {
        throw new Error("No se pudo seleccionar ningun ganador.");
      }

      await tx.winner.createMany({ data: winners });
      await tx.ticket.updateMany({
        where: { id: { in: winners.map((winner) => winner.ticketId) } },
        data: { status: TicketStatus.WINNER },
      });
      await tx.ticketHistory.createMany({
        data: winners.map((winner) => ({
          ticketId: winner.ticketId,
          raffleId,
          fromStatus: TicketStatus.PAID,
          toStatus: TicketStatus.WINNER,
          event: TicketHistoryEvent.WINNER_ASSIGNED,
          participantId: winner.participantId,
          reason: `Ganador premio posicion ${winner.position}`,
          metadata: {
            drawId: draw.id,
            algorithm,
            snapshotHash,
          },
        })),
      });
      await tx.draw.update({
        where: { id: draw.id },
        data: {
          status: DrawStatus.COMPLETED,
          completedAt: now,
          metadata: {
            prizeCount: raffle.prizes.length,
            winnerCount: winners.length,
          },
        },
      });
      await tx.raffle.update({
        where: { id: raffle.id },
        data: { status: RaffleStatus.DRAWN },
      });
      await tx.auditLog.create({
        data: {
          raffleId,
          action: "draw.completed",
          entityType: "Draw",
          entityId: draw.id,
          metadata: {
            algorithm,
            seedCommitment,
            snapshotHash,
            eligibleTicketCount: eligibleTickets.length,
            winnerCount: winners.length,
          },
        },
      });

      return draw;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}
