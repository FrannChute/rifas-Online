import { prisma } from "@/lib/db";

export async function listAdminParticipants() {
  return prisma.participant.findMany({
    where: { deletedAt: null },
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
    take: 100,
  });
}
