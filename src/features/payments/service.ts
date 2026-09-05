import {
  MediaAssetType,
  MediaVisibility,
  OrderStatus,
  PaymentMethodType,
  PaymentProvider,
  PaymentStatus,
  Prisma,
  TicketHistoryEvent,
  TicketStatus,
} from "@/generated/prisma/client";
import { releaseExpiredReservations } from "@/features/orders/service";
import { savePrivateUpload } from "@/features/storage/service";
import { prisma } from "@/lib/db";

import { getReceiptPaymentInput, rejectPaymentSchema } from "./schemas";

type TransactionClient = Prisma.TransactionClient;

export async function submitBankTransferPayment(orderId: string, formData: FormData) {
  const input = getReceiptPaymentInput(formData);
  const receipt = input.receipt;
  const saved = await savePrivateUpload(receipt, "receipts");

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        raffle: {
          include: {
            paymentMethods: {
              where: {
                active: true,
                deletedAt: null,
              },
            },
          },
        },
        items: {
          include: {
            ticket: true,
          },
        },
      },
    });

    await releaseExpiredReservations(tx, order.raffleId);

    if (order.status !== OrderStatus.RESERVED && order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new Error("La orden no acepta carga de comprobante en este estado.");
    }

    if (order.expiresAt && order.expiresAt < new Date()) {
      throw new Error("La reserva expiro. Vuelve a seleccionar los numeros.");
    }

    const selectedMethod = order.raffle.paymentMethods.find(
      (method) => method.type === input.method,
    );

    if (!selectedMethod) {
      throw new Error("El metodo de pago seleccionado no esta activo para esta rifa.");
    }

    const receiptAsset = await tx.mediaAsset.create({
      data: {
        raffleId: order.raffleId,
        type: MediaAssetType.RECEIPT,
        storageKey: saved.storageKey,
        originalName: saved.originalName,
        mimeType: saved.mimeType,
        sizeBytes: saved.sizeBytes,
        visibility: MediaVisibility.PRIVATE,
      },
    });

    const externalReferencePrefix =
      input.method === PaymentMethodType.MERCADO_PAGO ? "mp-proof" : "bank";
    const paymentLabel =
      input.method === PaymentMethodType.MERCADO_PAGO ? "Mercado Pago" : "transferencia";

    const payment = await tx.payment.upsert({
      where: { externalReference: `${externalReferencePrefix}-${order.publicCode}` },
      update: {
        method: input.method,
        status: PaymentStatus.MANUAL_REVIEW,
        receiptAssetId: receiptAsset.id,
        amount: order.totalAmount,
        currency: order.currency,
        rejectionReason: null,
      },
      create: {
        raffleId: order.raffleId,
        orderId: order.id,
        participantId: order.participantId,
        provider: PaymentProvider.MANUAL,
        method: input.method,
        status: PaymentStatus.MANUAL_REVIEW,
        amount: order.totalAmount,
        currency: order.currency,
        externalReference: `${externalReferencePrefix}-${order.publicCode}`,
        receiptAssetId: receiptAsset.id,
      },
    });

    await tx.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PENDING_PAYMENT },
    });

    await tx.ticket.updateMany({
      where: {
        id: { in: order.items.map((item) => item.ticketId) },
        currentOrderId: order.id,
        status: TicketStatus.RESERVED,
      },
      data: {
        status: TicketStatus.PAYMENT_PENDING,
        currentPaymentId: payment.id,
        reservedUntil: null,
      },
    });

    await tx.ticketHistory.createMany({
      data: order.items.map((item) => ({
        ticketId: item.ticketId,
        raffleId: order.raffleId,
        fromStatus: item.ticket.status,
        toStatus: TicketStatus.PAYMENT_PENDING,
        event: TicketHistoryEvent.PAYMENT_PENDING,
        participantId: order.participantId,
        orderId: order.id,
        paymentId: payment.id,
        reason: `Comprobante de ${paymentLabel} cargado`,
      })),
    });

    await tx.auditLog.create({
      data: {
        raffleId: order.raffleId,
        participantId: order.participantId,
        action: "payment.receipt_uploaded",
        entityType: "Payment",
        entityId: payment.id,
        metadata: {
          order: order.publicCode,
          receiptAssetId: receiptAsset.id,
          method: input.method,
        },
      },
    });

    return payment;
  });
}

export async function listAdminPayments() {
  return prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      raffle: { select: { name: true, slug: true } },
      order: { select: { publicCode: true, status: true } },
      participant: { select: { firstName: true, lastName: true, email: true } },
      receiptAsset: true,
    },
    take: 100,
  });
}

async function settlePayment(
  tx: TransactionClient,
  paymentId: string,
  status: PaymentStatus,
  reason?: string,
) {
  const payment = await tx.payment.findUniqueOrThrow({
    where: { id: paymentId },
    include: {
      order: {
        include: {
          items: {
            include: {
              ticket: true,
            },
          },
        },
      },
    },
  });

  if (!payment.order) {
    throw new Error("El pago no tiene orden asociada.");
  }

  if (status === PaymentStatus.APPROVED) {
    const now = new Date();

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status,
        reviewedAt: now,
        rejectionReason: null,
      },
    });

    await tx.order.update({
      where: { id: payment.order.id },
      data: {
        status: OrderStatus.PAID,
        paidAt: now,
        expiresAt: null,
      },
    });

    await tx.ticket.updateMany({
      where: {
        id: { in: payment.order.items.map((item) => item.ticketId) },
        currentOrderId: payment.order.id,
      },
      data: {
        status: TicketStatus.PAID,
        currentPaymentId: payment.id,
        reservedUntil: null,
      },
    });

    await tx.ticketHistory.createMany({
      data: payment.order.items.map((item) => ({
        ticketId: item.ticketId,
        raffleId: payment.raffleId,
        fromStatus: item.ticket.status,
        toStatus: TicketStatus.PAID,
        event: TicketHistoryEvent.PAID,
        participantId: payment.participantId,
        orderId: payment.orderId,
        paymentId: payment.id,
        reason: "Pago aprobado por administracion",
      })),
    });
  } else {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status,
        reviewedAt: new Date(),
        rejectionReason: reason ?? null,
      },
    });

    await tx.order.update({
      where: { id: payment.order.id },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
        expiresAt: null,
      },
    });

    await tx.ticket.updateMany({
      where: {
        id: { in: payment.order.items.map((item) => item.ticketId) },
        currentOrderId: payment.order.id,
      },
      data: {
        status: TicketStatus.AVAILABLE,
        reservedUntil: null,
        participantId: null,
        currentOrderId: null,
        currentPaymentId: null,
      },
    });

    await tx.ticketHistory.createMany({
      data: payment.order.items.map((item) => ({
        ticketId: item.ticketId,
        raffleId: payment.raffleId,
        fromStatus: item.ticket.status,
        toStatus: TicketStatus.AVAILABLE,
        event: TicketHistoryEvent.RELEASED,
        participantId: payment.participantId,
        orderId: payment.orderId,
        paymentId: payment.id,
        reason: reason ?? "Pago rechazado por administracion",
      })),
    });
  }

  await tx.auditLog.create({
    data: {
      raffleId: payment.raffleId,
      participantId: payment.participantId,
      action: status === PaymentStatus.APPROVED ? "payment.approved" : "payment.rejected",
      entityType: "Payment",
      entityId: payment.id,
      metadata: {
        orderId: payment.orderId,
        reason: reason ?? null,
      },
    },
  });
}

export async function approvePayment(paymentId: string) {
  return prisma.$transaction((tx) => settlePayment(tx, paymentId, PaymentStatus.APPROVED), {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  });
}

export async function rejectPayment(paymentId: string, formData: FormData) {
  const input = rejectPaymentSchema.parse({
    reason: formData.get("reason"),
  });

  return prisma.$transaction(
    (tx) => settlePayment(tx, paymentId, PaymentStatus.REJECTED, input.reason),
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}
