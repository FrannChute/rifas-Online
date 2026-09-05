import { prisma } from "@/lib/db";

import { parsePrizeForm } from "./schemas";

export async function listAdminPrizes(raffleId: string) {
  const raffle = await prisma.raffle.findUnique({
    where: { id: raffleId },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: {
          prizes: true,
        },
      },
    },
  });

  if (!raffle) {
    return null;
  }

  const prizes = await prisma.prize.findMany({
    where: { raffleId },
    orderBy: [{ deletedAt: "asc" }, { position: "asc" }, { createdAt: "asc" }],
  });

  return { raffle, prizes };
}

export async function createPrize(raffleId: string, formData: FormData) {
  const input = parsePrizeForm(formData);

  return prisma.$transaction(async (tx) => {
    const prize = await tx.prize.create({
      data: {
        raffleId,
        name: input.name,
        description: input.description ?? null,
        imageUrl: input.imageUrl ?? null,
        monetaryValue: input.monetaryValue?.toFixed(2) ?? null,
        position: input.position,
        active: input.active,
      },
    });

    await tx.auditLog.create({
      data: {
        raffleId,
        action: "prize.created",
        entityType: "Prize",
        entityId: prize.id,
        metadata: { position: prize.position },
      },
    });

    return prize;
  });
}

export async function updatePrize(prizeId: string, formData: FormData) {
  const input = parsePrizeForm(formData);

  return prisma.$transaction(async (tx) => {
    const prize = await tx.prize.update({
      where: { id: prizeId },
      data: {
        name: input.name,
        description: input.description ?? null,
        imageUrl: input.imageUrl ?? null,
        monetaryValue: input.monetaryValue?.toFixed(2) ?? null,
        position: input.position,
        active: input.active,
      },
    });

    await tx.auditLog.create({
      data: {
        raffleId: prize.raffleId,
        action: "prize.updated",
        entityType: "Prize",
        entityId: prize.id,
        metadata: { position: prize.position },
      },
    });

    return prize;
  });
}

export async function softDeletePrize(prizeId: string) {
  return prisma.$transaction(async (tx) => {
    const prize = await tx.prize.update({
      where: { id: prizeId },
      data: { deletedAt: new Date(), active: false },
    });

    await tx.auditLog.create({
      data: {
        raffleId: prize.raffleId,
        action: "prize.deleted",
        entityType: "Prize",
        entityId: prize.id,
      },
    });

    return prize;
  });
}

export async function restorePrize(prizeId: string) {
  return prisma.$transaction(async (tx) => {
    const prize = await tx.prize.update({
      where: { id: prizeId },
      data: { deletedAt: null, active: true },
    });

    await tx.auditLog.create({
      data: {
        raffleId: prize.raffleId,
        action: "prize.restored",
        entityType: "Prize",
        entityId: prize.id,
      },
    });

    return prize;
  });
}
