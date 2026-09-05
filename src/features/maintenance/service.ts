import {
  PaymentMethodType,
  Prisma,
  TicketHistoryEvent,
  TicketStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

const bolivarSlug = "gran-rifa-solidaria-u17-de-bolivar";

type TransactionClient = Prisma.TransactionClient;

function prizeImage(position: number) {
  return `/prizes/bolivar-${position.toString().padStart(2, "0")}.svg`;
}

async function findBolivarRaffle(tx: TransactionClient) {
  const raffle = await tx.raffle.findUnique({
    where: { slug: bolivarSlug },
    select: { id: true, name: true },
  });

  if (!raffle) {
    throw new Error("No se encontro la rifa principal de Bolivar.");
  }

  return raffle;
}

export async function repairBolivarPrizeImages() {
  return prisma.$transaction(async (tx) => {
    const raffle = await findBolivarRaffle(tx);
    const prizes = await tx.prize.findMany({
      where: { raffleId: raffle.id },
      select: { id: true, position: true },
    });

    for (const prize of prizes) {
      await tx.prize.update({
        where: { id: prize.id },
        data: {
          imageUrl: prizeImage(prize.position),
          active: true,
          deletedAt: null,
        },
      });
    }

    await tx.rafflePaymentMethod.upsert({
      where: { raffleId_type: { raffleId: raffle.id, type: PaymentMethodType.CASH } },
      update: {
        displayName: "Efectivo",
        instructions: "Paga personalmente. No necesitas subir comprobante.",
        active: true,
        sortOrder: 2,
        deletedAt: null,
      },
      create: {
        raffleId: raffle.id,
        type: PaymentMethodType.CASH,
        displayName: "Efectivo",
        instructions: "Paga personalmente. No necesitas subir comprobante.",
        active: true,
        sortOrder: 2,
      },
    });

    await tx.auditLog.create({
      data: {
        raffleId: raffle.id,
        action: "maintenance.prize_images_repaired",
        entityType: "Raffle",
        entityId: raffle.id,
        metadata: { prizes: prizes.length, cashPaymentEnabled: true },
      },
    });

    return { raffle, prizes: prizes.length };
  });
}

export async function clearBolivarSales() {
  return prisma.$transaction(
    async (tx) => {
      const raffle = await findBolivarRaffle(tx);
      const orders = await tx.order.findMany({
        where: { raffleId: raffle.id },
        select: { id: true },
      });
      const payments = await tx.payment.findMany({
        where: { raffleId: raffle.id },
        select: { id: true },
      });
      const participants = await tx.participant.findMany({
        where: {
          userId: null,
          orders: { some: { raffleId: raffle.id } },
        },
        select: { id: true },
      });

      await tx.winner.deleteMany({ where: { raffleId: raffle.id } });
      await tx.drawEligibleTicket.deleteMany({ where: { raffleId: raffle.id } });
      await tx.draw.deleteMany({ where: { raffleId: raffle.id } });
      await tx.ticketHistory.deleteMany({ where: { raffleId: raffle.id } });
      await tx.auditLog.deleteMany({ where: { raffleId: raffle.id } });
      await tx.orderItem.deleteMany({
        where: { orderId: { in: orders.map((order) => order.id) } },
      });
      await tx.payment.deleteMany({ where: { raffleId: raffle.id } });
      await tx.order.deleteMany({ where: { raffleId: raffle.id } });

      await tx.ticket.updateMany({
        where: { raffleId: raffle.id },
        data: {
          status: TicketStatus.AVAILABLE,
          reservedUntil: null,
          participantId: null,
          currentOrderId: null,
          currentPaymentId: null,
          cancellationReason: null,
        },
      });

      if (participants.length > 0) {
        await tx.participant.deleteMany({
          where: {
            id: { in: participants.map((participant) => participant.id) },
            userId: null,
            orders: { none: {} },
            payments: { none: {} },
            tickets: { none: {} },
            winners: { none: {} },
          },
        });
      }

      await tx.ticketHistory.createMany({
        data: (
          await tx.ticket.findMany({
            where: { raffleId: raffle.id },
            select: { id: true },
          })
        ).map((ticket) => ({
          ticketId: ticket.id,
          raffleId: raffle.id,
          fromStatus: null,
          toStatus: TicketStatus.AVAILABLE,
          event: TicketHistoryEvent.ADMIN_UPDATED,
          reason: "Rifa reiniciada desde mantenimiento",
        })),
      });

      await tx.auditLog.create({
        data: {
          raffleId: raffle.id,
          action: "maintenance.sales_cleared",
          entityType: "Raffle",
          entityId: raffle.id,
          metadata: {
            orders: orders.length,
            payments: payments.length,
            participants: participants.length,
          },
        },
      });

      return {
        raffle,
        orders: orders.length,
        payments: payments.length,
        participants: participants.length,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
