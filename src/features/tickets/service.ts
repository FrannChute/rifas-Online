import {
  OrderStatus,
  PaymentMethodType,
  PaymentStatus,
  PaymentProvider,
  Prisma,
  TicketHistoryEvent,
  TicketStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

import { ticketStatuses, type TicketStatusValue } from "./status";

export type TicketSearchInput = {
  dateFrom?: string;
  dateTo?: string;
  query?: string;
  sort?: string;
  status?: string;
  page?: number;
};

const ticketSortValues = [
  "numberAsc",
  "numberDesc",
  "purchaseNewest",
  "purchaseOldest",
  "updatedNewest",
] as const;

type TicketSortValue = (typeof ticketSortValues)[number];

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

function parseTicketSort(sort: string | undefined): TicketSortValue {
  return ticketSortValues.includes(sort as TicketSortValue)
    ? (sort as TicketSortValue)
    : "numberAsc";
}

function parseArgentinaDate(value: string | undefined, endOfDay = false) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  return new Date(`${trimmed}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}-03:00`);
}

function getTicketOrderBy(sort: TicketSortValue): Prisma.TicketOrderByWithRelationInput[] {
  if (sort === "numberDesc") {
    return [{ raffle: { createdAt: "desc" } }, { number: "desc" }];
  }

  if (sort === "purchaseNewest") {
    return [{ currentOrder: { createdAt: "desc" } }, { updatedAt: "desc" }, { number: "asc" }];
  }

  if (sort === "purchaseOldest") {
    return [{ currentOrder: { createdAt: "asc" } }, { updatedAt: "asc" }, { number: "asc" }];
  }

  if (sort === "updatedNewest") {
    return [{ updatedAt: "desc" }, { number: "asc" }];
  }

  return [{ raffle: { createdAt: "desc" } }, { number: "asc" }];
}

export async function listAdminTickets(input: TicketSearchInput) {
  const pageSize = 100;
  const page = Math.max(1, input.page ?? 1);
  const status = parseTicketStatus(input.status);
  const sort = parseTicketSort(input.sort);
  const dateFrom = parseArgentinaDate(input.dateFrom);
  const dateTo = parseArgentinaDate(input.dateTo, true);
  const orderDateFilter =
    dateFrom || dateTo
      ? {
          currentOrder: {
            is: {
              createdAt: {
                ...(dateFrom ? { gte: dateFrom } : {}),
                ...(dateTo ? { lte: dateTo } : {}),
              },
            },
          },
        }
      : {};
  const where: Prisma.TicketWhereInput = {
    ...parseTicketQuery(input.query),
    ...orderDateFilter,
    ...(status ? { status } : {}),
  };

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: getTicketOrderBy(sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        raffle: { select: { name: true, slug: true } },
        participant: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        currentOrder: { select: { publicCode: true, status: true, createdAt: true } },
        currentPayment: { select: { id: true, status: true, method: true } },
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

export async function markTicketsPaidFromAdminForm(formData: FormData) {
  const ticketIds = formData
    .getAll("ticketIds")
    .filter((value): value is string => typeof value === "string" && value.length > 0);
  const uniqueTicketIds = Array.from(new Set(ticketIds));
  const reasonValue = formData.get("reason");
  const reason =
    typeof reasonValue === "string" && reasonValue.trim().length > 0
      ? reasonValue.trim()
      : "Pago confirmado manualmente por administracion";

  if (uniqueTicketIds.length === 0) {
    throw new Error("Selecciona al menos un numero para marcar como pagado.");
  }

  return prisma.$transaction(
    async (tx) => {
      const selectedTickets = await tx.ticket.findMany({
        where: { id: { in: uniqueTicketIds } },
        include: {
          currentOrder: true,
          orderItems: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              order: {
                include: {
                  items: { include: { ticket: true } },
                  payments: { orderBy: { createdAt: "desc" }, take: 1 },
                },
              },
            },
          },
        },
      });

      if (selectedTickets.length !== uniqueTicketIds.length) {
        throw new Error("Uno o mas numeros seleccionados no existen.");
      }

      const orderIds = Array.from(
        new Set(
          selectedTickets
            .map((ticket) => ticket.currentOrder?.id ?? ticket.orderItems[0]?.order.id)
            .filter((orderId): orderId is string => Boolean(orderId)),
        ),
      );

      if (orderIds.length === 0) {
        throw new Error("Los numeros seleccionados no tienen una orden asociada.");
      }

      const orders = await tx.order.findMany({
        where: { id: { in: orderIds } },
        include: {
          items: { orderBy: { number: "asc" }, include: { ticket: true } },
          payments: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      });
      const now = new Date();
      let paidTickets = 0;

      for (const order of orders) {
        const blockedTicket = order.items.find(
          (item) =>
            item.ticket.status === TicketStatus.WINNER ||
            item.ticket.status === TicketStatus.PAID ||
            (item.ticket.currentOrderId && item.ticket.currentOrderId !== order.id),
        );

        if (blockedTicket) {
          throw new Error(
            `No se puede marcar la orden ${order.publicCode}: el numero ${blockedTicket.label} ya esta tomado por otra compra.`,
          );
        }

        const payment =
          order.payments[0] ??
          (await tx.payment.create({
            data: {
              raffleId: order.raffleId,
              orderId: order.id,
              participantId: order.participantId,
              provider: PaymentProvider.MANUAL,
              method: PaymentMethodType.CASH,
              status: PaymentStatus.APPROVED,
              amount: order.totalAmount,
              currency: order.currency,
              externalReference: `admin-paid-${order.publicCode}`,
              reviewedAt: now,
            },
          }));

        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.APPROVED,
            reviewedAt: now,
            rejectionReason: null,
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.PAID,
            paidAt: now,
            cancelledAt: null,
            expiresAt: null,
          },
        });

        const orderTicketIds = order.items.map((item) => item.ticketId);
        await tx.ticket.updateMany({
          where: {
            id: { in: orderTicketIds },
            status: {
              in: [TicketStatus.AVAILABLE, TicketStatus.RESERVED, TicketStatus.PAYMENT_PENDING],
            },
          },
          data: {
            status: TicketStatus.PAID,
            reservedUntil: null,
            participantId: order.participantId,
            currentOrderId: order.id,
            currentPaymentId: payment.id,
            cancellationReason: null,
          },
        });

        await tx.ticketHistory.createMany({
          data: order.items.map((item) => ({
            ticketId: item.ticketId,
            raffleId: order.raffleId,
            fromStatus: item.ticket.status,
            toStatus: TicketStatus.PAID,
            event: TicketHistoryEvent.PAID,
            participantId: order.participantId,
            orderId: order.id,
            paymentId: payment.id,
            reason,
          })),
        });

        await tx.auditLog.create({
          data: {
            raffleId: order.raffleId,
            participantId: order.participantId,
            action: "ticket.admin_marked_paid",
            entityType: "Order",
            entityId: order.id,
            metadata: {
              publicCode: order.publicCode,
              reason,
              ticketCount: order.items.length,
            },
          },
        });

        paidTickets += order.items.length;
      }

      return { paidTickets, paidOrders: orders.length };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
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
