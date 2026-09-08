import { Prisma, TicketStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export type ParticipantSearchInput = {
  query?: string;
  minTickets?: number;
};

function parseParticipantQuery(query: string | undefined): Prisma.ParticipantWhereInput {
  const trimmed = query?.trim();

  if (!trimmed) {
    return {};
  }

  return {
    OR: [
      { firstName: { contains: trimmed, mode: "insensitive" } },
      { lastName: { contains: trimmed, mode: "insensitive" } },
      { email: { contains: trimmed, mode: "insensitive" } },
      { phone: { contains: trimmed, mode: "insensitive" } },
      { whatsapp: { contains: trimmed, mode: "insensitive" } },
    ],
  };
}

export async function listAdminParticipants(input: ParticipantSearchInput = {}) {
  const participants = await prisma.participant.findMany({
    where: {
      deletedAt: null,
      ...parseParticipantQuery(input.query),
    },
    orderBy: [{ createdAt: "desc" }],
    include: {
      _count: {
        select: {
          orders: true,
          tickets: true,
          payments: true,
        },
      },
    },
    take: 300,
  });

  const minTickets = input.minTickets;

  if (typeof minTickets === "number" && minTickets > 0) {
    return participants.filter((participant) => participant._count.tickets >= minTickets);
  }

  return participants;
}

export async function deleteParticipantFromAdminForm(formData: FormData) {
  const participantIds = [
    ...formData
      .getAll("participantIds")
      .filter((value): value is string => typeof value === "string" && value.length > 0),
    ...formData
      .getAll("participantId")
      .filter((value): value is string => typeof value === "string" && value.length > 0),
  ];
  const uniqueParticipantIds = Array.from(new Set(participantIds));
  const confirmed = formData.get("confirmDelete") === "on";

  if (uniqueParticipantIds.length === 0) {
    throw new Error("Selecciona al menos un participante.");
  }

  if (!confirmed) {
    throw new Error("Marca la confirmacion para eliminar el participante.");
  }

  const results = [];

  for (const participantId of uniqueParticipantIds) {
    const result = await prisma.$transaction(
      async (tx) => {
        const participant = await tx.participant.findUniqueOrThrow({
          where: { id: participantId },
          include: {
            eligibleTickets: { select: { id: true } },
            orders: {
              select: {
                id: true,
                items: { select: { ticketId: true } },
                payments: { select: { id: true, receiptAssetId: true } },
              },
            },
            payments: { select: { id: true, receiptAssetId: true } },
            tickets: { select: { id: true, label: true, status: true } },
            winners: { select: { id: true } },
          },
        });

        if (participant.winners.length > 0 || participant.eligibleTickets.length > 0) {
          throw new Error("No se puede eliminar una persona que ya participa en un sorteo o gano.");
        }

        const blockedWinnerTicket = participant.tickets.find(
          (ticket) => ticket.status === TicketStatus.WINNER,
        );
        if (blockedWinnerTicket) {
          throw new Error(
            `No se puede eliminar porque el numero ${blockedWinnerTicket.label} gano.`,
          );
        }

        const orderIds = participant.orders.map((order) => order.id);
        const orderTicketIds = participant.orders.flatMap((order) =>
          order.items.map((item) => item.ticketId),
        );
        const paymentIds = Array.from(
          new Set([
            ...participant.payments.map((payment) => payment.id),
            ...participant.orders.flatMap((order) => order.payments.map((payment) => payment.id)),
          ]),
        );
        const receiptAssetIds = Array.from(
          new Set(
            [
              ...participant.payments.map((payment) => payment.receiptAssetId),
              ...participant.orders.flatMap((order) =>
                order.payments.map((payment) => payment.receiptAssetId),
              ),
            ].filter(Boolean),
          ),
        ) as string[];
        const participantTicketIds = participant.tickets.map((ticket) => ticket.id);
        const ticketIds = Array.from(new Set([...participantTicketIds, ...orderTicketIds]));

        if (ticketIds.length > 0) {
          await tx.ticket.updateMany({
            where: {
              id: { in: ticketIds },
              status: { not: TicketStatus.WINNER },
            },
            data: {
              status: TicketStatus.AVAILABLE,
              reservedUntil: null,
              participantId: null,
              currentOrderId: null,
              currentPaymentId: null,
              cancellationReason: null,
            },
          });
        }

        await tx.ticketHistory.deleteMany({
          where: {
            OR: [
              { participantId: participant.id },
              ...(orderIds.length > 0 ? [{ orderId: { in: orderIds } }] : []),
              ...(paymentIds.length > 0 ? [{ paymentId: { in: paymentIds } }] : []),
            ],
          },
        });
        await tx.auditLog.deleteMany({ where: { participantId: participant.id } });

        if (orderIds.length > 0) {
          await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
        }
        if (paymentIds.length > 0) {
          await tx.payment.deleteMany({ where: { id: { in: paymentIds } } });
        }
        if (orderIds.length > 0) {
          await tx.order.deleteMany({ where: { id: { in: orderIds } } });
        }

        if (receiptAssetIds.length > 0) {
          await tx.mediaAsset.deleteMany({
            where: {
              id: { in: receiptAssetIds },
              paymentReceipts: { none: {} },
            },
          });
        }

        await tx.participant.delete({ where: { id: participant.id } });

        return {
          participantId: participant.id,
          releasedTickets: ticketIds.length,
          cancelledOrders: orderIds.length,
          deletedPayments: paymentIds.length,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    results.push(result);
  }

  return {
    deletedParticipants: results.length,
    releasedTickets: results.reduce((total, result) => total + result.releasedTickets, 0),
    cancelledOrders: results.reduce((total, result) => total + result.cancelledOrders, 0),
    deletedPayments: results.reduce((total, result) => total + result.deletedPayments, 0),
  };
}
