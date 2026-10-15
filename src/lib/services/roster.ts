import "server-only";

import { MembershipType, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function isMembershipValidOn(startDate: Date, endDate: Date | null, targetDate: Date) {
  return startDate <= targetDate && (endDate === null || endDate >= targetDate);
}

export async function getCategoryRoster(categoryId: string, targetDate: Date, db: Prisma.TransactionClient | typeof prisma = prisma) {
  const memberships = await db.categoryMembership.findMany({
    where: {
      categoryId,
      startDate: { lte: targetDate },
      OR: [{ endDate: null }, { endDate: { gte: targetDate } }],
    },
    orderBy: [{ membershipType: "asc" }, { user: { lastName: "asc" } }, { user: { firstName: "asc" } }],
    select: {
      membershipType: true,
      user: { select: { id: true, firstName: true, lastName: true, username: true, active: true } },
    },
  });

  return {
    players: memberships.filter((item) => item.membershipType === MembershipType.PLAYER).map((item) => item.user),
    coaches: memberships.filter((item) => item.membershipType === MembershipType.COACH).map((item) => item.user),
    dirigeants: memberships.filter((item) => item.membershipType === MembershipType.DIRIGEANT).map((item) => item.user),
  };
}
