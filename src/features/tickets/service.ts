import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  TicketHistoryEvent,
  TicketStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

import { ticketStatuses, type TicketStatusValue } from "./status";

export type TicketSearchInput = {
  query?: string;
  status?: string;
  page?: number;
};

function parseTicketQuery(query: string | undefined): Prisma.TicketWhereInput {
  const trimmed = query?.trim();

  if (!trimmed) {
    return {};
  }

  const rangeMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
  if (rangeMatch) {
    const start = Number(rangeMatch[1]);
    const end = Number(rangeMatch[2]);

    return {
      number: {
        gte: Math.min(start, end),
        lte: Math.max(start, end),
      },
    };
  }

  if (/^\d+$/.test(trimmed)) {
    return {
      OR: [
        { number: Number(trimmed) },
        { label: { equals: trimmed } },
        { participant: { is: { phone: { contains: trimmed, mode: "insensitive" } } } },
      ],
    };
  }

  return {
    OR: [
      { label: { contains: trimmed, mode: "insensitive" } },
      { participant: { is: { firstName: { contains: trimmed, mode: "insensitive" } } } },
      { participant: { is: { lastName: { contains: trimmed, mode: "insensitive" } } } },
      { participant: { is: { email: { contains: trimmed, mode: "insensitive" } } } },
      { participant: { is: { phone: { contains: trimmed, mode: "insensitive" } } } },
    ],
  };
}

function parseTicketStatus(status: string | undefined): TicketStatusValue | undefined {
  if (ticketStatuses.includes(status as TicketStatusValue)) {
    return status as TicketStatusValue;
  }

  return undefined;
}

export async function listAdminTickets(input: TicketSearchInput) {
  const pageSize = 100;
  const page = Math.max(1, input.page ?? 1);
  const status = parseTicketStatus(input.status);
  const where: Prisma.TicketWhereInput = {
    ...parseTicketQuery(input.query),
    ...(status ? { status } : {}),
  };

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: [{ raffle: { createdAt: "desc" } }, { number: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        raffle: { select: { name: true, slug: true } },
        participant: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        currentOrder: { select: { publicCode: true, status: true } },
        currentPayment: { select: { status: true, method: true } },
      },
    }),
    prisma.ticket.count({ where }),
  ]);

  return {
    tickets,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function releaseTicketsFromAdminForm(formData: FormData) {
  const ticketIds = formData
    .getAll("ticketIds")
    .filter((value): value is string => typeof value === "string" && value.length > 0);
  const uniqueTicketIds = Array.from(new Set(ticketIds));
  const reasonValue = formData.get("reason");
  const reason =
    typeof reasonValue === "string" && reasonValue.trim().length > 0
      ? reasonValue.trim()
      : "Liberado por administrador";

  if (uniqueTicketIds.length === 0) {
    throw new Error("Selecciona al menos un numero para liberar.");
  }

  return prisma.$transaction(
    async (tx) => {
      const tickets = await tx.ticket.findMany({
        where: { id: { in: uniqueTicketIds } },
        include: {
          currentOrder: { include: { items: true } },
        },
      });

      if (tickets.length !== uniqueTicketIds.length) {
        throw new Error("Uno o mas numeros seleccionados no existen.");
      }

      const blockedWinner = tickets.find((ticket) => ticket.status === TicketStatus.WINNER);
      if (blockedWinner) {
        throw new Error(`No se puede liberar el numero ganador ${blockedWinner.label}.`);
      }

      const releasableTickets = tickets.filter(
        (ticket) => ticket.status !== TicketStatus.AVAILABLE,
      );
      if (releasableTickets.length === 0) {
        throw new Error("Los numeros seleccionados ya estaban disponibles.");
      }

      const orderIds = Array.from(
        new Set(releasableTickets.map((ticket) => ticket.currentOrderId).filter(Boolean)),
      ) as string[];
      const paymentIds = Array.from(
        new Set(releasableTickets.map((ticket) => ticket.currentPaymentId).filter(Boolean)),
      ) as string[];

      await tx.orderItem.deleteMany({
        where: { ticketId: { in: releasableTickets.map((ticket) => ticket.id) } },
      });

      await tx.ticket.updateMany({
        where: { id: { in: releasableTickets.map((ticket) => ticket.id) } },
        data: {
          status: TicketStatus.AVAILABLE,
          reservedUntil: null,
          participantId: null,
          currentOrderId: null,
          currentPaymentId: null,
          cancellationReason: null,
        },
      });

      for (const orderId of orderIds) {
        const remainingItems = await tx.orderItem.findMany({
          where: { orderId },
          select: { unitPrice: true },
        });

        if (remainingItems.length === 0) {
          await tx.order.update({
            where: { id: orderId },
            data: {
              status: OrderStatus.CANCELLED,
              cancelledAt: new Date(),
              expiresAt: null,
            },
          });
        } else {
          const totalAmount = remainingItems.reduce(
            (total, item) => total.plus(item.unitPrice),
            new Prisma.Decimal(0),
          );

          await tx.order.update({
            where: { id: orderId },
            data: { totalAmount },
          });
        }
      }

      if (paymentIds.length > 0) {
        await tx.payment.updateMany({
          where: { id: { in: paymentIds } },
          data: {
            status: PaymentStatus.CANCELLED,
            rejectionReason: reason,
            reviewedAt: new Date(),
          },
        });
      }

      await tx.ticketHistory.createMany({
        data: releasableTickets.map((ticket) => ({
          ticketId: ticket.id,
          raffleId: ticket.raffleId,
          fromStatus: ticket.status,
          toStatus: TicketStatus.AVAILABLE,
          event: TicketHistoryEvent.RELEASED,
          participantId: ticket.participantId,
          orderId: ticket.currentOrderId,
          paymentId: ticket.currentPaymentId,
          reason,
        })),
      });

      await tx.auditLog.createMany({
        data: releasableTickets.map((ticket) => ({
          raffleId: ticket.raffleId,
          participantId: ticket.participantId,
          action: "ticket.admin_released",
          entityType: "Ticket",
          entityId: ticket.id,
          metadata: {
            label: ticket.label,
            fromStatus: ticket.status,
            reason,
          },
        })),
      });

      return { released: releasableTickets.length };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}

export async function getAdminTicket(ticketId: string) {
  return prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      raffle: { select: { name: true, slug: true } },
      participant: { select: { firstName: true, lastName: true, email: true } },
      currentOrder: { select: { publicCode: true, status: true } },
      currentPayment: { select: { status: true, method: true } },
      history: {
        orderBy: { createdAt: "asc" },
        include: {
          actorUser: { select: { name: true, email: true } },
          participant: { select: { firstName: true, lastName: true, email: true } },
          order: { select: { publicCode: true } },
          payment: { select: { status: true, method: true } },
        },
      },
    },
  });
}
