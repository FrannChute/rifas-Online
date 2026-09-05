import { Prisma } from "@/generated/prisma/client";
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
      OR: [{ number: Number(trimmed) }, { label: { equals: trimmed } }],
    };
  }

  return {
    label: { contains: trimmed, mode: "insensitive" },
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
        participant: { select: { firstName: true, lastName: true, email: true } },
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
