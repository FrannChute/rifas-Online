import { randomBytes } from "node:crypto";

import {
  OrderStatus,
  PaymentMethodType,
  PaymentProvider,
  PaymentStatus,
  Prisma,
  RaffleStatus,
  TicketHistoryEvent,
  TicketStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

import {
  parseManualCashSaleForm,
  parseReservationForm,
  type ParticipantCheckoutInput,
} from "./schemas";

type TransactionClient = Prisma.TransactionClient;

function createPublicCode() {
  return `ORD-${randomBytes(5).toString("hex").toUpperCase()}`;
}

async function createUniquePublicCode(tx: TransactionClient) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const publicCode = createPublicCode();
    const existing = await tx.order.findUnique({
      where: { publicCode },
      select: { id: true },
    });

    if (!existing) {
      return publicCode;
    }
  }

  throw new Error("No se pudo generar un codigo de orden unico.");
}

async function getOrCreateParticipant(tx: TransactionClient, input: ParticipantCheckoutInput) {
  const existing = await tx.participant.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    return tx.participant.update({
      where: { id: existing.id },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone ?? null,
        whatsapp: input.whatsapp ?? null,
        dni: input.dni ?? null,
        deletedAt: null,
      },
    });
  }

  return tx.participant.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone ?? null,
      whatsapp: input.whatsapp ?? null,
      dni: input.dni ?? null,
    },
  });
}

export async function releaseExpiredReservations(tx: TransactionClient, raffleId?: string) {
  const now = new Date();
  const expiredTickets = await tx.ticket.findMany({
    where: {
      ...(raffleId ? { raffleId } : {}),
      status: TicketStatus.RESERVED,
      reservedUntil: { lt: now },
    },
    select: {
      id: true,
      raffleId: true,
      status: true,
      participantId: true,
      currentOrderId: true,
      currentPaymentId: true,
    },
  });

  if (expiredTickets.length === 0) {
    return { releasedTickets: 0, expiredOrders: 0 };
  }

  const ticketIds = expiredTickets.map((ticket) => ticket.id);
  const orderIds = Array.from(
    new Set(
      expiredTickets
        .map((ticket) => ticket.currentOrderId)
        .filter((orderId): orderId is string => Boolean(orderId)),
    ),
  );

  await tx.ticket.updateMany({
    where: { id: { in: ticketIds }, status: TicketStatus.RESERVED },
    data: {
      status: TicketStatus.AVAILABLE,
      reservedUntil: null,
      participantId: null,
      currentOrderId: null,
      currentPaymentId: null,
    },
  });

  if (orderIds.length > 0) {
    await tx.order.updateMany({
      where: {
        id: { in: orderIds },
        status: OrderStatus.RESERVED,
      },
      data: {
        status: OrderStatus.EXPIRED,
        cancelledAt: now,
      },
    });

    await tx.payment.updateMany({
      where: {
        orderId: { in: orderIds },
        status: { in: [PaymentStatus.PENDING, PaymentStatus.MANUAL_REVIEW] },
      },
      data: { status: PaymentStatus.EXPIRED },
    });
  }

  await tx.ticketHistory.createMany({
    data: expiredTickets.map((ticket) => ({
      ticketId: ticket.id,
      raffleId: ticket.raffleId,
      fromStatus: ticket.status,
      toStatus: TicketStatus.AVAILABLE,
      event: TicketHistoryEvent.RESERVATION_EXPIRED,
      participantId: ticket.participantId,
      orderId: ticket.currentOrderId,
      paymentId: ticket.currentPaymentId,
      reason: "Reserva expirada automaticamente",
    })),
  });

  return { releasedTickets: expiredTickets.length, expiredOrders: orderIds.length };
}

export async function reserveTicketsFromForm(formData: FormData) {
  const input = parseReservationForm(formData);

  return prisma.$transaction(
    async (tx) => {
      await releaseExpiredReservations(tx, input.raffleId);

      const raffle = await tx.raffle.findFirst({
        where: {
          id: input.raffleId,
          deletedAt: null,
        },
      });

      if (!raffle || raffle.status !== RaffleStatus.OPEN) {
        throw new Error("La rifa no esta abierta para compras.");
      }

      const tickets = await tx.ticket.findMany({
        where: {
          id: { in: input.ticketIds },
          raffleId: raffle.id,
        },
        orderBy: { number: "asc" },
      });

      if (tickets.length !== input.ticketIds.length) {
        throw new Error("Uno o mas numeros no pertenecen a esta rifa.");
      }

      const participant = await getOrCreateParticipant(tx, input.participant);
      const publicCode = await createUniquePublicCode(tx);
      const expiresAt = new Date(Date.now() + raffle.reservationDurationMinutes * 60_000);
      const totalAmount = (Number(raffle.price) * tickets.length).toFixed(2);

      const order = await tx.order.create({
        data: {
          publicCode,
          raffleId: raffle.id,
          participantId: participant.id,
          status: OrderStatus.RESERVED,
          currency: raffle.currency,
          totalAmount,
          expiresAt,
        },
      });

      const locked = await tx.ticket.updateMany({
        where: {
          id: { in: tickets.map((ticket) => ticket.id) },
          raffleId: raffle.id,
          status: TicketStatus.AVAILABLE,
        },
        data: {
          status: TicketStatus.RESERVED,
          reservedUntil: expiresAt,
          participantId: participant.id,
          currentOrderId: order.id,
        },
      });

      if (locked.count !== tickets.length) {
        throw new Error("Alguno de los numeros seleccionados ya fue reservado o vendido.");
      }

      await tx.orderItem.createMany({
        data: tickets.map((ticket) => ({
          orderId: order.id,
          ticketId: ticket.id,
          number: ticket.number,
          label: ticket.label,
          unitPrice: raffle.price,
          currency: raffle.currency,
        })),
      });

      await tx.ticketHistory.createMany({
        data: tickets.map((ticket) => ({
          ticketId: ticket.id,
          raffleId: raffle.id,
          fromStatus: TicketStatus.AVAILABLE,
          toStatus: TicketStatus.RESERVED,
          event: TicketHistoryEvent.RESERVED,
          participantId: participant.id,
          orderId: order.id,
          reason: "Reserva publica",
        })),
      });

      await tx.auditLog.create({
        data: {
          raffleId: raffle.id,
          participantId: participant.id,
          action: "order.reserved",
          entityType: "Order",
          entityId: order.id,
          metadata: {
            ticketCount: tickets.length,
            publicCode: order.publicCode,
          },
        },
      });

      return order;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}

export async function getCheckoutOrder(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      participant: true,
      items: {
        orderBy: { number: "asc" },
        include: {
          ticket: true,
        },
      },
      payments: {
        orderBy: { createdAt: "desc" },
        include: {
          receiptAsset: true,
        },
      },
      raffle: {
        include: {
          paymentMethods: {
            where: { active: true, deletedAt: null },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });
}

export async function listAdminOrders() {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      raffle: {
        select: {
          name: true,
          slug: true,
        },
      },
      participant: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      items: {
        orderBy: { number: "asc" },
        select: {
          id: true,
          label: true,
          number: true,
        },
      },
      payments: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          method: true,
        },
      },
    },
    take: 100,
  });
}

export async function listManualSaleRaffles() {
  return prisma.raffle.findMany({
    where: {
      deletedAt: null,
      status: { in: [RaffleStatus.OPEN, RaffleStatus.PAUSED, RaffleStatus.CLOSED] },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      status: true,
      price: true,
      currency: true,
    },
  });
}

export async function createManualCashSaleFromForm(formData: FormData) {
  const input = parseManualCashSaleForm(formData);

  return prisma.$transaction(
    async (tx) => {
      await releaseExpiredReservations(tx, input.raffleId);

      const raffle = await tx.raffle.findFirstOrThrow({
        where: {
          id: input.raffleId,
          deletedAt: null,
        },
      });
      const tickets = await tx.ticket.findMany({
        where: {
          raffleId: raffle.id,
          number: { in: input.ticketNumbers },
        },
        orderBy: { number: "asc" },
      });

      if (tickets.length !== input.ticketNumbers.length) {
        throw new Error("Uno o mas numeros no existen para esta rifa.");
      }

      const participant = await getOrCreateParticipant(tx, input.participant);
      const publicCode = await createUniquePublicCode(tx);
      const totalAmount = (Number(raffle.price) * tickets.length).toFixed(2);
      const now = new Date();

      const order = await tx.order.create({
        data: {
          publicCode,
          raffleId: raffle.id,
          participantId: participant.id,
          status: OrderStatus.PAID,
          currency: raffle.currency,
          totalAmount,
          paidAt: now,
        },
      });

      const payment = await tx.payment.create({
        data: {
          raffleId: raffle.id,
          orderId: order.id,
          participantId: participant.id,
          provider: PaymentProvider.MANUAL,
          method: PaymentMethodType.CASH,
          status: PaymentStatus.APPROVED,
          amount: totalAmount,
          currency: raffle.currency,
          externalReference: `cash-${order.publicCode}`,
          reviewedAt: now,
        },
      });

      const locked = await tx.ticket.updateMany({
        where: {
          id: { in: tickets.map((ticket) => ticket.id) },
          raffleId: raffle.id,
          status: TicketStatus.AVAILABLE,
        },
        data: {
          status: TicketStatus.PAID,
          reservedUntil: null,
          participantId: participant.id,
          currentOrderId: order.id,
          currentPaymentId: payment.id,
        },
      });

      if (locked.count !== tickets.length) {
        throw new Error("Alguno de los numeros ya esta reservado o vendido.");
      }

      await tx.orderItem.createMany({
        data: tickets.map((ticket) => ({
          orderId: order.id,
          ticketId: ticket.id,
          number: ticket.number,
          label: ticket.label,
          unitPrice: raffle.price,
          currency: raffle.currency,
        })),
      });

      await tx.ticketHistory.createMany({
        data: tickets.map((ticket) => ({
          ticketId: ticket.id,
          raffleId: raffle.id,
          fromStatus: TicketStatus.AVAILABLE,
          toStatus: TicketStatus.PAID,
          event: TicketHistoryEvent.PAID,
          participantId: participant.id,
          orderId: order.id,
          paymentId: payment.id,
          reason: "Venta manual en efectivo",
        })),
      });

      await tx.auditLog.create({
        data: {
          raffleId: raffle.id,
          participantId: participant.id,
          action: "manual_cash_sale.created",
          entityType: "Order",
          entityId: order.id,
          metadata: {
            ticketCount: tickets.length,
            publicCode: order.publicCode,
          },
        },
      });

      return order;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}
