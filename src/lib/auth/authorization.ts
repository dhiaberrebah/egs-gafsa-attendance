import "server-only";

import { MembershipType, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AuthorizationError, type CurrentUser } from "@/lib/auth/session";

const unrestrictedRoles: Role[] = [Role.SUPER_ADMIN, Role.ADMINISTRATION];

function membershipTypeFor(role: Role): MembershipType | null {
  if (role === Role.COACH) return MembershipType.COACH;
  if (role === Role.DIRIGEANT) return MembershipType.DIRIGEANT;
  return null;
}

export async function canAccessCategory(
  user: CurrentUser,
  categoryId: string,
  targetDate: Date,
): Promise<boolean> {
  if (unrestrictedRoles.includes(user.role)) return true;

  const membershipType = membershipTypeFor(user.role);
  if (!membershipType) return false;

  const membership = await prisma.categoryMembership.findFirst({
    where: {
      userId: user.id,
      categoryId,
      membershipType,
      startDate: { lte: targetDate },
      OR: [{ endDate: null }, { endDate: { gte: targetDate } }],
    },
    select: { id: true },
  });

  return membership !== null;
}

export async function requireCategoryAccess(
  user: CurrentUser,
  categoryId: string,
  targetDate: Date,
): Promise<void> {
  if (!(await canAccessCategory(user, categoryId, targetDate))) {
    throw new AuthorizationError();
  }
}

type SessionTarget =
  | { sessionId: string }
  | { categoryId: string; startsAt: Date };

async function resolveSessionTarget(target: SessionTarget) {
  if ("categoryId" in target) return target;

  return prisma.session.findUnique({
    where: { id: target.sessionId },
    select: { categoryId: true, startsAt: true },
  });
}

export async function canManageSession(user: CurrentUser, target: SessionTarget): Promise<boolean> {
  if (unrestrictedRoles.includes(user.role)) return true;
  if (user.role !== Role.COACH) return false;

  const resolved = await resolveSessionTarget(target);
  return resolved ? canAccessCategory(user, resolved.categoryId, resolved.startsAt) : false;
}

export async function canViewAttendance(user: CurrentUser, attendanceRecordId: string): Promise<boolean> {
  const record = await prisma.attendanceRecord.findUnique({
    where: { id: attendanceRecordId },
    select: {
      userId: true,
      session: { select: { categoryId: true, startsAt: true } },
    },
  });

  if (!record) return false;
  if (unrestrictedRoles.includes(user.role)) return true;
  if (user.role === Role.PLAYER) return record.userId === user.id;

  return canAccessCategory(user, record.session.categoryId, record.session.startsAt);
}

export async function canEditAttendance(user: CurrentUser, attendanceRecordId: string): Promise<boolean> {
  if (unrestrictedRoles.includes(user.role)) return true;
  if (user.role !== Role.COACH) return false;

  const record = await prisma.attendanceRecord.findUnique({
    where: { id: attendanceRecordId },
    select: { session: { select: { categoryId: true, startsAt: true } } },
  });

  return record
    ? canAccessCategory(user, record.session.categoryId, record.session.startsAt)
    : false;
}

export async function getAccessibleCategories(user: CurrentUser, targetDate: Date) {
  if (unrestrictedRoles.includes(user.role)) {
    return prisma.category.findMany({
      where: { active: true },
      orderBy: { displayOrder: "asc" },
      select: { id: true, nameFr: true, nameAr: true },
    });
  }

  const membershipType = membershipTypeFor(user.role);
  if (!membershipType) return [];

  const memberships = await prisma.categoryMembership.findMany({
    where: {
      userId: user.id,
      membershipType,
      startDate: { lte: targetDate },
      OR: [{ endDate: null }, { endDate: { gte: targetDate } }],
    },
    orderBy: { category: { displayOrder: "asc" } },
    select: { category: { select: { id: true, nameFr: true, nameAr: true } } },
  });

  return memberships.map(({ category }) => category);
}
