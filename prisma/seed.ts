import "dotenv/config";
import { createHash, pbkdf2Sync, randomBytes } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";

import {
  OrderStatus,
  PaymentMethodType,
  PaymentProvider,
  PaymentStatus,
  PrismaClient,
  RaffleStatus,
  TicketHistoryEvent,
  TicketStatus,
  UserRole,
} from "../src/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;
const seedAdminEmail = process.env.SEED_ADMIN_EMAIL;
const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

if (!seedAdminEmail || !seedAdminPassword) {
  throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required.");
}

const adminEmail = seedAdminEmail;
const adminPassword = seedAdminPassword;

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const raffleSlug = "rifa-desarrollo-1500";
const ticketPrice = "2500.00";
const currency = "ARS";
const seedFirstNames = [
  "Lucia",
  "Mateo",
  "Sofia",
  "Tomas",
  "Valentina",
  "Benjamin",
  "Camila",
  "Santiago",
  "Martina",
  "Nicolas",
  "Julieta",
  "Agustin",
] as const;

function formatTicketLabel(number: number, padding: number) {
  return number.toString().padStart(padding, "0");
}

function hashSeedPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");

  return `pbkdf2_sha512$100000$${salt}$${hash}`;
}

function createPublicCode(prefix: string, value: number) {
  return `${prefix}-${value.toString().padStart(5, "0")}`;
}

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Administrador",
      role: UserRole.ADMIN,
      status: "ACTIVE",
    },
    create: {
      name: "Administrador",
      email: adminEmail,
      passwordHash: hashSeedPassword(adminPassword),
      role: UserRole.ADMIN,
    },
  });

  await prisma.platformSettings.upsert({
    where: { id: "default" },
    update: {
      platformName: "Rifas Online",
      supportEmail: "soporte@rifas.local",
      supportWhatsapp: "+5491123456789",
      bankAlias: "RIFAS.ONLINE",
      bankCbu: "0000003100010000000001",
      bankCvu: "0000007900000000000001",
      bankAccountHolder: "Rifas Online SRL",
      bankName: "Banco de Desarrollo",
      defaultReservationDurationMinutes: 10,
    },
    create: {
      id: "default",
      platformName: "Rifas Online",
      supportEmail: "soporte@rifas.local",
      supportWhatsapp: "+5491123456789",
      bankAlias: "RIFAS.ONLINE",
      bankCbu: "0000003100010000000001",
      bankCvu: "0000007900000000000001",
      bankAccountHolder: "Rifas Online SRL",
      bankName: "Banco de Desarrollo",
      defaultReservationDurationMinutes: 10,
    },
  });

  const now = new Date();
  const startsAt = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const closesAt = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);
  const drawScheduledAt = new Date(now.getTime() + 24 * 24 * 60 * 60 * 1000);

  const raffle = await prisma.raffle.upsert({
    where: { slug: raffleSlug },
    update: {
      name: "Gran Rifa Desarrollo 1500",
      description:
        "Rifa de desarrollo con 1500 numeros reales, premios variados y ventas de prueba.",
      imageUrl:
        "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1400&q=80",
      status: RaffleStatus.OPEN,
      price: ticketPrice,
      currency,
      startNumber: 1,
      endNumber: 1500,
      numberPadding: 4,
      startsAt,
      closesAt,
      drawScheduledAt,
      reservationDurationMinutes: 10,
      allowGuestPurchase: true,
      allowAccountPurchase: true,
      allowMultipleWinsPerTicket: false,
      allowMultipleWinsPerParticipant: false,
      winnerRules: "Un ticket pagado participa una vez por sorteo.",
      terms: "Seed de desarrollo. No representa una venta real.",
      contactEmail: "ventas@rifas.local",
      contactPhone: "+54 9 11 2345 6789",
      contactWhatsapp: "+54 9 11 2345 6789",
      createdById: admin.id,
    },
    create: {
      slug: raffleSlug,
      name: "Gran Rifa Desarrollo 1500",
      description:
        "Rifa de desarrollo con 1500 numeros reales, premios variados y ventas de prueba.",
      imageUrl:
        "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1400&q=80",
      status: RaffleStatus.OPEN,
      price: ticketPrice,
      currency,
      startNumber: 1,
      endNumber: 1500,
      numberPadding: 4,
      startsAt,
      closesAt,
      drawScheduledAt,
      reservationDurationMinutes: 10,
      allowGuestPurchase: true,
      allowAccountPurchase: true,
      allowMultipleWinsPerTicket: false,
      allowMultipleWinsPerParticipant: false,
      winnerRules: "Un ticket pagado participa una vez por sorteo.",
      terms: "Seed de desarrollo. No representa una venta real.",
      contactEmail: "ventas@rifas.local",
      contactPhone: "+54 9 11 2345 6789",
      contactWhatsapp: "+54 9 11 2345 6789",
      createdById: admin.id,
    },
  });

  await prisma.rafflePaymentMethod.upsert({
    where: { raffleId_type: { raffleId: raffle.id, type: PaymentMethodType.BANK_TRANSFER } },
    update: {
      displayName: "Transferencia bancaria",
      active: true,
      sortOrder: 1,
      bankName: "Banco de Desarrollo",
      accountHolder: "Rifas Online SRL",
      alias: "RIFAS.ONLINE",
      cbu: "0000003100010000000001",
      cvu: "0000007900000000000001",
      instructions: "Enviar el comprobante desde el checkout para revision manual.",
    },
    create: {
      raffleId: raffle.id,
      type: PaymentMethodType.BANK_TRANSFER,
      displayName: "Transferencia bancaria",
      active: true,
      sortOrder: 1,
      bankName: "Banco de Desarrollo",
      accountHolder: "Rifas Online SRL",
      alias: "RIFAS.ONLINE",
      cbu: "0000003100010000000001",
      cvu: "0000007900000000000001",
      instructions: "Enviar el comprobante desde el checkout para revision manual.",
    },
  });

  await prisma.rafflePaymentMethod.upsert({
    where: { raffleId_type: { raffleId: raffle.id, type: PaymentMethodType.CASH } },
    update: {
      displayName: "Efectivo",
      active: true,
      sortOrder: 2,
      instructions: "Venta manual registrada por administracion.",
    },
    create: {
      raffleId: raffle.id,
      type: PaymentMethodType.CASH,
      displayName: "Efectivo",
      active: true,
      sortOrder: 2,
      instructions: "Venta manual registrada por administracion.",
    },
  });

  await prisma.rafflePaymentMethod.upsert({
    where: { raffleId_type: { raffleId: raffle.id, type: PaymentMethodType.MERCADO_PAGO } },
    update: {
      displayName: "Mercado Pago",
      active: false,
      sortOrder: 3,
      instructions: "Pendiente de credenciales reales de Mercado Pago.",
    },
    create: {
      raffleId: raffle.id,
      type: PaymentMethodType.MERCADO_PAGO,
      displayName: "Mercado Pago",
      active: false,
      sortOrder: 3,
      instructions: "Pendiente de credenciales reales de Mercado Pago.",
    },
  });

  const ticketData = Array.from({ length: 1500 }, (_, index) => {
    const number = index + 1;

    return {
      raffleId: raffle.id,
      number,
      label: formatTicketLabel(number, 4),
      status: TicketStatus.AVAILABLE,
    };
  });

  await prisma.ticket.createMany({
    data: ticketData,
    skipDuplicates: true,
  });

  await prisma.ticket.updateMany({
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

  await prisma.prize.updateMany({
    where: { raffleId: raffle.id },
    data: {
      deletedAt: null,
      active: true,
    },
  });

  for (let position = 1; position <= 30; position += 1) {
    await prisma.prize.upsert({
      where: { raffleId_position: { raffleId: raffle.id, position } },
      update: {
        name: `Premio ${position}`,
        description: `Premio de desarrollo numero ${position}.`,
        imageUrl:
          "https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=900&q=80",
        monetaryValue: (60_000 - position * 1_000).toFixed(2),
        active: true,
        deletedAt: null,
      },
      create: {
        raffleId: raffle.id,
        name: `Premio ${position}`,
        description: `Premio de desarrollo numero ${position}.`,
        imageUrl:
          "https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=900&q=80",
        monetaryValue: (60_000 - position * 1_000).toFixed(2),
        position,
        active: true,
      },
    });
  }

  const participants = await Promise.all(
    Array.from({ length: 12 }, async (_, index) => {
      const number = index + 1;
      const firstName = seedFirstNames[index] ?? `Participante ${number}`;

      return prisma.participant.upsert({
        where: { email: `participante${number}@rifas.local` },
        update: {
          firstName,
          lastName: `Demo ${number}`,
          phone: `+541100000${number.toString().padStart(3, "0")}`,
          whatsapp: `+5491100000${number.toString().padStart(3, "0")}`,
          dni: `99000${number.toString().padStart(3, "0")}`,
          deletedAt: null,
        },
        create: {
          firstName,
          lastName: `Demo ${number}`,
          email: `participante${number}@rifas.local`,
          phone: `+541100000${number.toString().padStart(3, "0")}`,
          whatsapp: `+5491100000${number.toString().padStart(3, "0")}`,
          dni: `99000${number.toString().padStart(3, "0")}`,
        },
      });
    }),
  );

  const paidTicketNumbers = Array.from({ length: 96 }, (_, index) => index + 1);
  const pendingTicketNumbers = Array.from({ length: 24 }, (_, index) => index + 201);
  const reservedTicketNumbers = Array.from({ length: 18 }, (_, index) => index + 401);
  const cancelledTicketNumbers = Array.from({ length: 6 }, (_, index) => index + 601);

  await prisma.ticketHistory.deleteMany({
    where: { raffleId: raffle.id },
  });

  await prisma.auditLog.deleteMany({
    where: { raffleId: raffle.id },
  });

  async function upsertOrderWithTickets(input: {
    publicCode: string;
    participantIndex: number;
    ticketNumbers: number[];
    status:
      typeof OrderStatus.PAID | typeof OrderStatus.PENDING_PAYMENT | typeof OrderStatus.RESERVED;
    paymentStatus:
      | typeof PaymentStatus.APPROVED
      | typeof PaymentStatus.MANUAL_REVIEW
      | typeof PaymentStatus.PENDING;
    paymentMethod: typeof PaymentMethodType.CASH | typeof PaymentMethodType.BANK_TRANSFER;
  }) {
    const participant = participants[input.participantIndex % participants.length];
    if (!participant) {
      throw new Error("Seed participants were not created.");
    }

    const totalAmount = (input.ticketNumbers.length * Number(ticketPrice)).toFixed(2);
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

    const order = await prisma.order.upsert({
      where: { publicCode: input.publicCode },
      update: {
        raffleId: raffle.id,
        participantId: participant.id,
        status: input.status,
        currency,
        totalAmount,
        expiresAt: input.status === OrderStatus.PAID ? null : expiresAt,
        paidAt: input.status === OrderStatus.PAID ? now : null,
        cancelledAt: null,
      },
      create: {
        publicCode: input.publicCode,
        raffleId: raffle.id,
        participantId: participant.id,
        status: input.status,
        currency,
        totalAmount,
        expiresAt: input.status === OrderStatus.PAID ? null : expiresAt,
        paidAt: input.status === OrderStatus.PAID ? now : null,
      },
    });

    const payment = await prisma.payment.upsert({
      where: { externalReference: `seed-${input.publicCode}` },
      update: {
        raffleId: raffle.id,
        orderId: order.id,
        participantId: participant.id,
        provider: PaymentProvider.MANUAL,
        method: input.paymentMethod,
        status: input.paymentStatus,
        amount: totalAmount,
        currency,
        reviewedById: input.paymentStatus === PaymentStatus.APPROVED ? admin.id : null,
        reviewedAt: input.paymentStatus === PaymentStatus.APPROVED ? now : null,
        rejectionReason: null,
      },
      create: {
        raffleId: raffle.id,
        orderId: order.id,
        participantId: participant.id,
        provider: PaymentProvider.MANUAL,
        method: input.paymentMethod,
        status: input.paymentStatus,
        amount: totalAmount,
        currency,
        externalReference: `seed-${input.publicCode}`,
        reviewedById: input.paymentStatus === PaymentStatus.APPROVED ? admin.id : null,
        reviewedAt: input.paymentStatus === PaymentStatus.APPROVED ? now : null,
      },
    });

    await prisma.orderItem.deleteMany({
      where: { orderId: order.id },
    });

    for (const number of input.ticketNumbers) {
      const ticket = await prisma.ticket.findUniqueOrThrow({
        where: { raffleId_number: { raffleId: raffle.id, number } },
      });

      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          ticketId: ticket.id,
          number: ticket.number,
          label: ticket.label,
          unitPrice: ticketPrice,
          currency,
        },
      });

      const targetStatus =
        input.status === OrderStatus.PAID
          ? TicketStatus.PAID
          : input.status === OrderStatus.PENDING_PAYMENT
            ? TicketStatus.PAYMENT_PENDING
            : TicketStatus.RESERVED;

      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          status: targetStatus,
          reservedUntil: input.status === OrderStatus.RESERVED ? expiresAt : null,
          participantId: participant.id,
          currentOrderId: order.id,
          currentPaymentId: payment.id,
        },
      });

      await prisma.ticketHistory.create({
        data: {
          ticketId: ticket.id,
          raffleId: raffle.id,
          fromStatus: TicketStatus.AVAILABLE,
          toStatus: targetStatus,
          event:
            targetStatus === TicketStatus.PAID
              ? TicketHistoryEvent.PAID
              : targetStatus === TicketStatus.PAYMENT_PENDING
                ? TicketHistoryEvent.PAYMENT_PENDING
                : TicketHistoryEvent.RESERVED,
          actorUserId: admin.id,
          participantId: participant.id,
          orderId: order.id,
          paymentId: payment.id,
          reason: "Seed de desarrollo",
        },
      });
    }
  }

  for (let index = 0; index < paidTicketNumbers.length; index += 8) {
    await upsertOrderWithTickets({
      publicCode: createPublicCode("SEED-PAID", index / 8 + 1),
      participantIndex: index / 8,
      ticketNumbers: paidTicketNumbers.slice(index, index + 8),
      status: OrderStatus.PAID,
      paymentStatus: PaymentStatus.APPROVED,
      paymentMethod: index % 16 === 0 ? PaymentMethodType.CASH : PaymentMethodType.BANK_TRANSFER,
    });
  }

  for (let index = 0; index < pendingTicketNumbers.length; index += 4) {
    await upsertOrderWithTickets({
      publicCode: createPublicCode("SEED-PENDING", index / 4 + 1),
      participantIndex: index / 4,
      ticketNumbers: pendingTicketNumbers.slice(index, index + 4),
      status: OrderStatus.PENDING_PAYMENT,
      paymentStatus: PaymentStatus.MANUAL_REVIEW,
      paymentMethod: PaymentMethodType.BANK_TRANSFER,
    });
  }

  for (let index = 0; index < reservedTicketNumbers.length; index += 3) {
    await upsertOrderWithTickets({
      publicCode: createPublicCode("SEED-RESERVED", index / 3 + 1),
      participantIndex: index / 3,
      ticketNumbers: reservedTicketNumbers.slice(index, index + 3),
      status: OrderStatus.RESERVED,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: PaymentMethodType.BANK_TRANSFER,
    });
  }

  const cancelledTickets = await prisma.ticket.findMany({
    where: { raffleId: raffle.id, number: { in: cancelledTicketNumbers } },
    orderBy: { number: "asc" },
  });

  for (const ticket of cancelledTickets) {
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: TicketStatus.CANCELLED,
        cancellationReason: "Seed: anulacion administrativa de prueba",
      },
    });

    await prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        raffleId: raffle.id,
        fromStatus: TicketStatus.AVAILABLE,
        toStatus: TicketStatus.CANCELLED,
        event: TicketHistoryEvent.CANCELLED,
        actorUserId: admin.id,
        reason: "Seed: anulacion administrativa de prueba",
      },
    });
  }

  const stats = await prisma.ticket.groupBy({
    by: ["status"],
    where: { raffleId: raffle.id },
    _count: { _all: true },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      raffleId: raffle.id,
      action: "seed.completed",
      entityType: "Raffle",
      entityId: raffle.id,
      metadata: {
        checksum: createHash("sha256").update(`${raffle.id}:${now.toISOString()}`).digest("hex"),
        stats: Object.fromEntries(stats.map((row) => [row.status, row._count._all])),
      },
    },
  });

  console.log(
    JSON.stringify(
      {
        admin: admin.email,
        raffle: raffle.slug,
        tickets: 1500,
        prizes: 30,
        participants: participants.length,
        stats: Object.fromEntries(stats.map((row) => [row.status, row._count._all])),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
