import {
  Prisma,
  PaymentMethodType,
  RaffleStatus,
  TicketHistoryEvent,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

import { buildTicketRows, chunkRows } from "../tickets/ticket-numbering";
import { parseRaffleForm, type RaffleFormInput } from "./schemas";
import { assertRaffleTransition } from "./status";

type TransactionClient = Prisma.TransactionClient;

const ticketChunkSize = 2_000;
const historyChunkSize = 2_000;

export async function getAdminDashboardStats() {
  const [raffles, openRaffles, orders, payments, ticketStats] = await Promise.all([
    prisma.raffle.count({ where: { deletedAt: null } }),
    prisma.raffle.count({ where: { deletedAt: null, status: RaffleStatus.OPEN } }),
    prisma.order.count(),
    prisma.payment.count({ where: { status: { in: ["PENDING", "MANUAL_REVIEW"] } } }),
    prisma.ticket.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  return {
    raffles,
    openRaffles,
    orders,
    pendingPayments: payments,
    ticketsByStatus: Object.fromEntries(ticketStats.map((row) => [row.status, row._count._all])),
  };
}

export async function getPlatformSettings() {
  return prisma.platformSettings.findUnique({
    where: { id: "default" },
    include: {
      logoAsset: true,
      faviconAsset: true,
    },
  });
}

export async function listAdminRaffles() {
  const raffles = await prisma.raffle.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          orders: true,
          prizes: true,
          tickets: true,
        },
      },
    },
  });

  if (raffles.length === 0) {
    return [];
  }

  const ticketStats = await prisma.ticket.groupBy({
    by: ["raffleId", "status"],
    where: { raffleId: { in: raffles.map((raffle) => raffle.id) } },
    _count: { _all: true },
  });

  return raffles.map((raffle) => ({
    ...raffle,
    ticketStats: Object.fromEntries(
      ticketStats
        .filter((row) => row.raffleId === raffle.id)
        .map((row) => [row.status, row._count._all]),
    ),
  }));
}

export async function listPublicRaffles() {
  const raffles = await prisma.raffle.findMany({
    where: {
      deletedAt: null,
      status: { in: [RaffleStatus.PUBLISHED, RaffleStatus.OPEN] },
    },
    orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
    include: {
      prizes: {
        where: {
          active: true,
          deletedAt: null,
        },
        orderBy: { position: "asc" },
        take: 3,
      },
      _count: {
        select: {
          prizes: true,
          tickets: true,
        },
      },
    },
  });

  if (raffles.length === 0) {
    return [];
  }

  const ticketStats = await prisma.ticket.groupBy({
    by: ["raffleId", "status"],
    where: { raffleId: { in: raffles.map((raffle) => raffle.id) } },
    _count: { _all: true },
  });

  return raffles.map((raffle) => ({
    ...raffle,
    ticketStats: Object.fromEntries(
      ticketStats
        .filter((row) => row.raffleId === raffle.id)
        .map((row) => [row.status, row._count._all]),
    ),
  }));
}

export async function getRaffleForEdit(id: string) {
  return prisma.raffle.findUnique({
    where: { id },
    include: {
      paymentMethods: {
        where: { deletedAt: null },
        orderBy: { sortOrder: "asc" },
      },
      _count: {
        select: {
          orders: true,
          prizes: true,
          tickets: true,
        },
      },
    },
  });
}

export async function getPublicRaffleBySlug(slug: string) {
  const raffle = await prisma.raffle.findFirst({
    where: {
      slug,
      deletedAt: null,
      status: {
        in: [
          RaffleStatus.PUBLISHED,
          RaffleStatus.OPEN,
          RaffleStatus.PAUSED,
          RaffleStatus.CLOSED,
          RaffleStatus.DRAWN,
        ],
      },
    },
    include: {
      paymentMethods: {
        where: { active: true, deletedAt: null },
        orderBy: { sortOrder: "asc" },
      },
      prizes: {
        where: { active: true, deletedAt: null },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!raffle) {
    return null;
  }

  const [tickets, stats] = await Promise.all([
    prisma.ticket.findMany({
      where: { raffleId: raffle.id },
      orderBy: { number: "asc" },
      take: 1_500,
      select: {
        id: true,
        number: true,
        label: true,
        status: true,
        reservedUntil: true,
      },
    }),
    prisma.ticket.groupBy({
      by: ["status"],
      where: { raffleId: raffle.id },
      _count: { _all: true },
    }),
  ]);

  return {
    ...raffle,
    tickets,
    ticketStats: Object.fromEntries(stats.map((row) => [row.status, row._count._all])),
  };
}

export async function createRaffle(formData: FormData) {
  const input = parseRaffleForm(formData);

  return prisma.$transaction(async (tx) => {
    const slug = await ensureUniqueSlug(tx, input.slug ?? input.name);
    const raffle = await tx.raffle.create({
      data: {
        ...toRaffleData(input),
        slug,
      },
    });

    await syncPaymentMethods(tx, raffle.id, input);
    await generateTickets(tx, {
      raffleId: raffle.id,
      startNumber: raffle.startNumber,
      endNumber: raffle.endNumber,
      numberPadding: raffle.numberPadding,
    });

    await tx.auditLog.create({
      data: {
        raffleId: raffle.id,
        action: "raffle.created",
        entityType: "Raffle",
        entityId: raffle.id,
        metadata: {
          ticketCount: raffle.endNumber - raffle.startNumber + 1,
        },
      },
    });

    return raffle;
  });
}

export async function updateRaffle(id: string, formData: FormData) {
  const input = parseRaffleForm(formData);

  return prisma.$transaction(async (tx) => {
    const current = await tx.raffle.findUniqueOrThrow({
      where: { id },
      include: {
        _count: {
          select: { tickets: true },
        },
      },
    });
    const nextSlug =
      input.slug && input.slug !== current.slug
        ? await ensureUniqueSlug(tx, input.slug, id)
        : current.slug;
    const numberingChanged =
      current.startNumber !== input.startNumber ||
      current.endNumber !== input.endNumber ||
      current.numberPadding !== input.numberPadding;
    const extendingEndOnly =
      current.startNumber === input.startNumber &&
      current.numberPadding === input.numberPadding &&
      input.endNumber > current.endNumber;

    if (numberingChanged && !extendingEndOnly) {
      const lockedTickets = await tx.ticket.count({
        where: {
          raffleId: id,
          status: { not: "AVAILABLE" },
        },
      });

      if (lockedTickets > 0) {
        throw new Error(
          "No se puede cambiar la numeracion de una rifa con tickets reservados o vendidos.",
        );
      }

      await tx.ticketHistory.deleteMany({ where: { raffleId: id } });
      await tx.ticket.deleteMany({ where: { raffleId: id } });
    }

    const raffle = await tx.raffle.update({
      where: { id },
      data: {
        ...toRaffleData(input),
        slug: nextSlug,
      },
    });

    await syncPaymentMethods(tx, raffle.id, input);

    if (extendingEndOnly) {
      await generateTickets(tx, {
        raffleId: raffle.id,
        startNumber: current.endNumber + 1,
        endNumber: raffle.endNumber,
        numberPadding: raffle.numberPadding,
      });
    } else if (numberingChanged) {
      await generateTickets(tx, {
        raffleId: raffle.id,
        startNumber: raffle.startNumber,
        endNumber: raffle.endNumber,
        numberPadding: raffle.numberPadding,
      });
    }

    await tx.auditLog.create({
      data: {
        raffleId: raffle.id,
        action: "raffle.updated",
        entityType: "Raffle",
        entityId: raffle.id,
        metadata: {
          numberingChanged,
        },
      },
    });

    return raffle;
  });
}

export async function updateRaffleStatus(id: string, nextStatus: RaffleStatus) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.raffle.findUniqueOrThrow({
      where: { id },
      select: { id: true, slug: true, status: true },
    });

    assertRaffleTransition(current.status, nextStatus);

    const raffle = await tx.raffle.update({
      where: { id },
      data: { status: nextStatus },
    });

    await tx.auditLog.create({
      data: {
        raffleId: raffle.id,
        action: "raffle.status_changed",
        entityType: "Raffle",
        entityId: raffle.id,
        metadata: {
          from: current.status,
          to: nextStatus,
        },
      },
    });

    return raffle;
  });
}

async function ensureUniqueSlug(tx: TransactionClient, source: string, currentId?: string) {
  const baseSlug = slugify(source);
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await tx.raffle.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing || existing.id === currentId) {
      return slug;
    }

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

function slugify(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `rifa-${Date.now()}`;
}

function toRaffleData(input: RaffleFormInput) {
  return {
    name: input.name,
    description: input.description,
    imageUrl: input.imageUrl ?? null,
    price: input.price.toFixed(2),
    currency: input.currency,
    startNumber: input.startNumber,
    endNumber: input.endNumber,
    numberPadding: input.numberPadding,
    startsAt: input.startsAt ?? null,
    closesAt: input.closesAt ?? null,
    drawScheduledAt: input.drawScheduledAt ?? null,
    reservationDurationMinutes: input.reservationDurationMinutes,
    allowGuestPurchase: input.allowGuestPurchase,
    allowAccountPurchase: input.allowAccountPurchase,
    allowMultipleWinsPerTicket: input.allowMultipleWinsPerTicket,
    allowMultipleWinsPerParticipant: input.allowMultipleWinsPerParticipant,
    winnerRules: input.winnerRules ?? null,
    terms: input.terms ?? null,
    contactEmail: input.contactEmail ?? null,
    contactPhone: input.contactPhone ?? null,
    contactWhatsapp: input.contactWhatsapp ?? null,
  };
}

async function syncPaymentMethods(tx: TransactionClient, raffleId: string, input: RaffleFormInput) {
  await tx.rafflePaymentMethod.upsert({
    where: { raffleId_type: { raffleId, type: PaymentMethodType.BANK_TRANSFER } },
    update: {
      active: input.paymentBankTransfer,
      displayName: "Transferencia bancaria",
      sortOrder: 1,
      bankName: input.bankName ?? null,
      accountHolder: input.bankAccountHolder ?? null,
      alias: input.bankAlias ?? null,
      cbu: input.bankCbu ?? null,
      cvu: input.bankCvu ?? null,
      instructions: input.bankInstructions ?? null,
    },
    create: {
      raffleId,
      type: PaymentMethodType.BANK_TRANSFER,
      active: input.paymentBankTransfer,
      displayName: "Transferencia bancaria",
      sortOrder: 1,
      bankName: input.bankName ?? null,
      accountHolder: input.bankAccountHolder ?? null,
      alias: input.bankAlias ?? null,
      cbu: input.bankCbu ?? null,
      cvu: input.bankCvu ?? null,
      instructions: input.bankInstructions ?? null,
    },
  });

  await tx.rafflePaymentMethod.upsert({
    where: { raffleId_type: { raffleId, type: PaymentMethodType.CASH } },
    update: {
      active: input.paymentCash,
      displayName: "Efectivo",
      sortOrder: 2,
      instructions: "Venta manual administrada desde el panel.",
    },
    create: {
      raffleId,
      type: PaymentMethodType.CASH,
      active: input.paymentCash,
      displayName: "Efectivo",
      sortOrder: 2,
      instructions: "Venta manual administrada desde el panel.",
    },
  });

  await tx.rafflePaymentMethod.upsert({
    where: { raffleId_type: { raffleId, type: PaymentMethodType.MERCADO_PAGO } },
    update: {
      active: input.paymentMercadoPago,
      displayName: "Mercado Pago",
      sortOrder: 3,
      instructions: "Pendiente de credenciales reales de Mercado Pago.",
    },
    create: {
      raffleId,
      type: PaymentMethodType.MERCADO_PAGO,
      active: input.paymentMercadoPago,
      displayName: "Mercado Pago",
      sortOrder: 3,
      instructions: "Pendiente de credenciales reales de Mercado Pago.",
    },
  });
}

async function generateTickets(
  tx: TransactionClient,
  input: Parameters<typeof buildTicketRows>[0],
) {
  const rows = buildTicketRows(input);

  for (const chunk of chunkRows(rows, ticketChunkSize)) {
    await tx.ticket.createMany({
      data: chunk,
      skipDuplicates: true,
    });
  }

  const tickets = await tx.ticket.findMany({
    where: {
      raffleId: input.raffleId,
      number: {
        gte: input.startNumber,
        lte: input.endNumber,
      },
    },
    select: {
      id: true,
      raffleId: true,
      status: true,
    },
  });

  const historyRows = tickets.map((ticket) => ({
    ticketId: ticket.id,
    raffleId: ticket.raffleId,
    toStatus: ticket.status,
    event: TicketHistoryEvent.CREATED,
    reason: "Generacion inicial de tickets",
  }));

  for (const chunk of chunkRows(historyRows, historyChunkSize)) {
    await tx.ticketHistory.createMany({
      data: chunk,
    });
  }
}
