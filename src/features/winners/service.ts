import { prisma } from "@/lib/db";

export async function getPublicRaffleWinnerInfo(slug: string) {
  return prisma.raffle.findFirst({
    where: {
      slug,
      deletedAt: null,
    },
    select: {
      name: true,
      slug: true,
      drawScheduledAt: true,
    },
  });
}

export async function listPublicWinners() {
  return prisma.winner.findMany({
    where: {
      publishedAt: { not: null },
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    include: {
      raffle: {
        select: {
          name: true,
          slug: true,
        },
      },
      prize: {
        select: {
          name: true,
          position: true,
        },
      },
      participant: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

export async function listPublicWinnersByRaffleSlug(slug: string) {
  return prisma.winner.findMany({
    where: {
      publishedAt: { not: null },
      raffle: {
        slug,
        deletedAt: null,
      },
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    include: {
      raffle: {
        select: {
          name: true,
          slug: true,
        },
      },
      prize: {
        select: {
          name: true,
          position: true,
        },
      },
      participant: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}
