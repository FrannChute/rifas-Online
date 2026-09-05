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
const seedSampleSales = process.env.SEED_SAMPLE_SALES === "true";

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

const raffleSlug = "gran-rifa-solidaria-u17-de-bolivar";
const ticketPrice = "3000.00";
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

const bolivarPrizes = [
  {
    position: 1,
    name: "1 noche de estadia en Complejo San Pio",
    description: "Escapada de descanso en Icho Cruz, ideal para disfrutar en temporada baja.",
  },
  {
    position: 2,
    name: "Pase por 1 mes en Cinesis Medicl Gym",
    description: "Un mes de entrenamiento para moverse, sumar energia y mantenerse activo.",
  },
  {
    position: 3,
    name: "2 cortes masculinos en Sotelo Barber Shop + 2 cajas de alfajores",
    description: "Dos cortes de barberia y dos cajas dulces para compartir despues.",
  },
  {
    position: 4,
    name: "1 corte masculino en Sotelo Barber Shop + 1 caja de alfajores",
    description: "Un combo de barberia con una caja de alfajores para darse un gusto.",
  },
  {
    position: 5,
    name: "1 corte masculino en Sotelo Barber Shop + 1 caja de alfajores",
    description: "Corte masculino y alfajores, una combinacion simple y rendidora.",
  },
  {
    position: 6,
    name: "Mantel de mesa de tusor + agarraderas de horno",
    description: "Set practico para vestir la mesa y sumar utilidad en la cocina.",
  },
  {
    position: 7,
    name: "1 botella de Casalta + 1 champagne",
    description: "Bebidas para brindar y acompanar una celebracion especial.",
  },
  {
    position: 8,
    name: "1 botella de Casalta + 1 champagne",
    description: "Otro premio de brindis para compartir en familia o con amigos.",
  },
  {
    position: 9,
    name: "1 turno de 1 1/2 h de padel en Olibert + 1 caja de alfajores",
    description: "Un turno de padel para jugar y una caja dulce para el cierre.",
  },
  {
    position: 10,
    name: "1 turno de 1 1/2 h de padel en Olibert + 1 caja de alfajores",
    description: "Padel con amigos y alfajores como premio extra.",
  },
  {
    position: 11,
    name: "1 turno de 1 1/2 h de padel en Olibert + 1 caja de alfajores",
    description: "Un nuevo turno de padel para seguir sumando juego.",
  },
  {
    position: 12,
    name: "Rodillera de basquet Nike",
    description: "Proteccion deportiva para entrenar y jugar al basquet con mas seguridad.",
  },
  {
    position: 13,
    name: "Merienda para 2 personas en Aqui Bar La Terminal",
    description: "Merienda para dos, pensada para compartir una salida tranquila.",
  },
  {
    position: 14,
    name: "Voucher de descuento Urquiza VCP",
    description: "Beneficio de descuento para usar en una compra local.",
  },
  {
    position: 15,
    name: "Productos de limpieza Distribuidora CRISBET",
    description: "Combo de limpieza con Skip, Vivere y producto para ceramica o piso.",
  },
  {
    position: 16,
    name: "Hornitos + esencia aromatizante",
    description: "Detalle aromatico para perfumar espacios y sumar calidez al hogar.",
  },
  {
    position: 17,
    name: "MANTEL KOA.DECOHOME",
    description: "Mantel decorativo para renovar la mesa con un toque prolijo.",
  },
  {
    position: 18,
    name: "1 bolsa de papa + 2 maples de huevos + 1 aceite de oliva",
    description: "Canasta basica con papas, huevos y aceite de oliva.",
  },
  {
    position: 19,
    name: "1 bolsa de papa + 2 maples de huevos + 1 aceite de oliva",
    description: "Otro combo de alimentos utiles para la cocina diaria.",
  },
  {
    position: 20,
    name: "Kit crema antiage Farmacia Sassarolli",
    description: "Kit de cuidado personal orientado a rutina facial antiage.",
  },
  {
    position: 21,
    name: "Premio 21",
    description: "Premio adicional de la lista oficial de la rifa.",
  },
  {
    position: 22,
    name: "Caja de golosinas y chocolates",
    description: "Caja dulce con golosinas y chocolates para disfrutar o compartir.",
  },
] as const;

function formatTicketLabel(number: number, padding: number) {
  return number.toString().padStart(padding, "0");
}

function prizeImage(position: number) {
  return `/prizes/bolivar-${position.toString().padStart(2, "0")}.svg`;
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
      platformName: "Club Sportivo Bolivar",
      supportEmail: "frann.chute1@gmail.com",
      supportWhatsapp: "+543515550000",
      bankAlias: "frann.chute",
      bankCbu: null,
      bankCvu: "0000003100014211899935",
      bankAccountHolder: "FRANCISCO NIETO GONZALEZ",
      bankName: null,
      defaultReservationDurationMinutes: 10,
    },
    create: {
      id: "default",
      platformName: "Club Sportivo Bolivar",
      supportEmail: "frann.chute1@gmail.com",
      supportWhatsapp: "+543515550000",
      bankAlias: "frann.chute",
      bankCbu: null,
      bankCvu: "0000003100014211899935",
      bankAccountHolder: "FRANCISCO NIETO GONZALEZ",
      bankName: null,
      defaultReservationDurationMinutes: 10,
    },
  });

  const now = new Date();
  const startsAt = new Date("2026-09-02T15:06:00-03:00");
  const closesAt = new Date("2026-09-14T23:59:00-03:00");
  const drawScheduledAt = new Date("2026-09-14T23:35:00-03:00");

  const raffle = await prisma.raffle.upsert({
    where: { slug: raffleSlug },
    update: {
      name: "CLUB SPORTIVO BOLIVAR",
      description:
        "Rifa solidaria para acompanar a Bolivar U17 en la semifinal argentina de formativas. Cada numero ayuda al equipo y participa por premios de comercios y colaboradores.",
      imageUrl: "/brand/bolivar-u17-rifa.png",
      status: RaffleStatus.OPEN,
      price: ticketPrice,
      currency,
      startNumber: 501,
      endNumber: 600,
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
      terms:
        "La reserva se confirma con comprobante valido o venta manual aprobada por administracion. El sorteo se realizara en la fecha publicada.",
      contactEmail: "frann.chute1@gmail.com",
      contactPhone: "+54 351 555 0000",
      contactWhatsapp: "+54 351 555 0000",
      createdById: admin.id,
    },
    create: {
      slug: raffleSlug,
      name: "CLUB SPORTIVO BOLIVAR",
      description:
        "Rifa solidaria para acompanar a Bolivar U17 en la semifinal argentina de formativas. Cada numero ayuda al equipo y participa por premios de comercios y colaboradores.",
      imageUrl: "/brand/bolivar-u17-rifa.png",
      status: RaffleStatus.OPEN,
      price: ticketPrice,
      currency,
      startNumber: 501,
      endNumber: 600,
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
      terms:
        "La reserva se confirma con comprobante valido o venta manual aprobada por administracion. El sorteo se realizara en la fecha publicada.",
      contactEmail: "frann.chute1@gmail.com",
      contactPhone: "+54 351 555 0000",
      contactWhatsapp: "+54 351 555 0000",
      createdById: admin.id,
    },
  });

  await prisma.rafflePaymentMethod.upsert({
    where: { raffleId_type: { raffleId: raffle.id, type: PaymentMethodType.BANK_TRANSFER } },
    update: {
      displayName: "Transferencia bancaria",
      active: true,
      sortOrder: 1,
      bankName: null,
      accountHolder: "FRANCISCO NIETO GONZALEZ",
      alias: "frann.chute",
      cbu: null,
      cvu: "0000003100014211899935",
      instructions:
        "Transferi el total, sube una foto del comprobante y te confirmaremos la compra.",
    },
    create: {
      raffleId: raffle.id,
      type: PaymentMethodType.BANK_TRANSFER,
      displayName: "Transferencia bancaria",
      active: true,
      sortOrder: 1,
      bankName: null,
      accountHolder: "FRANCISCO NIETO GONZALEZ",
      alias: "frann.chute",
      cbu: null,
      cvu: "0000003100014211899935",
      instructions:
        "Transferi el total, sube una foto del comprobante y te confirmaremos la compra.",
    },
  });

  await prisma.rafflePaymentMethod.upsert({
    where: { raffleId_type: { raffleId: raffle.id, type: PaymentMethodType.CASH } },
    update: {
      displayName: "Efectivo",
      active: true,
      sortOrder: 3,
      instructions: "Venta manual registrada por administracion.",
    },
    create: {
      raffleId: raffle.id,
      type: PaymentMethodType.CASH,
      displayName: "Efectivo",
      active: true,
      sortOrder: 3,
      instructions: "Venta manual registrada por administracion.",
    },
  });

  await prisma.rafflePaymentMethod.upsert({
    where: { raffleId_type: { raffleId: raffle.id, type: PaymentMethodType.MERCADO_PAGO } },
    update: {
      displayName: "Mercado Pago",
      active: true,
      sortOrder: 2,
      accountHolder: "FRANCISCO NIETO GONZALEZ",
      alias: "frann.chute",
      cbu: null,
      cvu: "0000003100014211899935",
      instructions:
        "Paga por Mercado Pago, sube una foto del comprobante y te confirmaremos la compra.",
    },
    create: {
      raffleId: raffle.id,
      type: PaymentMethodType.MERCADO_PAGO,
      displayName: "Mercado Pago",
      active: true,
      sortOrder: 2,
      accountHolder: "FRANCISCO NIETO GONZALEZ",
      alias: "frann.chute",
      cbu: null,
      cvu: "0000003100014211899935",
      instructions:
        "Paga por Mercado Pago, sube una foto del comprobante y te confirmaremos la compra.",
    },
  });

  const ticketData = Array.from({ length: 100 }, (_, index) => {
    const number = index + 501;

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
    where: {
      raffleId: raffle.id,
      position: { gt: bolivarPrizes.length },
    },
    data: {
      deletedAt: now,
      active: false,
    },
  });

  for (const prize of bolivarPrizes) {
    await prisma.prize.upsert({
      where: { raffleId_position: { raffleId: raffle.id, position: prize.position } },
      update: {
        name: prize.name,
        description: prize.description,
        imageUrl: prizeImage(prize.position),
        monetaryValue: null,
        active: true,
        deletedAt: null,
      },
      create: {
        raffleId: raffle.id,
        name: prize.name,
        description: prize.description,
        imageUrl: prizeImage(prize.position),
        monetaryValue: null,
        position: prize.position,
        active: true,
      },
    });
  }

  let seededParticipants = 0;

  if (seedSampleSales) {
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
            whatsapp: `+541100000${number.toString().padStart(3, "0")}`,
            dni: `99000${number.toString().padStart(3, "0")}`,
            deletedAt: null,
          },
          create: {
            firstName,
            lastName: `Demo ${number}`,
            email: `participante${number}@rifas.local`,
            phone: `+541100000${number.toString().padStart(3, "0")}`,
            whatsapp: `+541100000${number.toString().padStart(3, "0")}`,
            dni: `99000${number.toString().padStart(3, "0")}`,
          },
        });
      }),
    );

    const paidTicketNumbers = Array.from({ length: 8 }, (_, index) => index + 501);
    const pendingTicketNumbers = Array.from({ length: 4 }, (_, index) => index + 521);
    const reservedTicketNumbers = Array.from({ length: 3 }, (_, index) => index + 541);
    const cancelledTicketNumbers = Array.from({ length: 2 }, (_, index) => index + 561);

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

    seededParticipants = participants.length;
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
        tickets: 100,
        prizes: bolivarPrizes.length,
        participants: seededParticipants,
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
