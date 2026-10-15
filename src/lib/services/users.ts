import "server-only";

import { randomUUID } from "node:crypto";
import { argon2id, hash } from "argon2";
import { MembershipType, PreferredLanguage, Prisma, Role } from "@prisma/client";
import { z } from "zod";
import type { CurrentUser } from "@/lib/auth/session";
import { AuthorizationError } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/admin/access";
import { prisma } from "@/lib/prisma";

const usernameSchema = z.string().trim().toLowerCase().min(3).max(30).regex(/^[a-z0-9_.]+$/);
const optionalText = z.union([z.string().trim().min(1), z.literal("")]).transform((value) => value || null);
const optionalDate = z.union([z.iso.date(), z.literal("")]).transform((value) => value ? new Date(`${value}T00:00:00.000Z`) : null);

export const createUserSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  username: usernameSchema,
  role: z.nativeEnum(Role),
  preferredLanguage: z.nativeEnum(PreferredLanguage),
  email: z.union([z.email(), z.literal("")]).transform((value) => value || null),
  phone: optionalText,
  dateOfBirth: optionalDate,
  licenseNumber: optionalText,
  password: z.string().min(8).max(128),
});

export const updateUserSchema = createUserSchema.omit({ password: true }).extend({
  id: z.string().min(1),
  active: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export type UserFilters = { query?: string; role?: Role; categoryId?: string; active?: boolean };

function assertRoleAssignment(actor: CurrentUser, role: Role) {
  if (!canManageUsers(actor)) throw new AuthorizationError();
  if (actor.role !== Role.SUPER_ADMIN && ([Role.SUPER_ADMIN, Role.ADMINISTRATION] as Role[]).includes(role)) {
    throw new AuthorizationError();
  }
}

export async function listUsers(actor: CurrentUser, filters: UserFilters = {}) {
  if (!canManageUsers(actor)) throw new AuthorizationError();
  const now = new Date();
  return prisma.user.findMany({
    where: {
      ...(filters.query ? { OR: [
        { firstName: { contains: filters.query, mode: "insensitive" } },
        { lastName: { contains: filters.query, mode: "insensitive" } },
        { username: { contains: filters.query, mode: "insensitive" } },
      ] } : {}),
      ...(filters.role ? { role: filters.role } : {}),
      ...(filters.active !== undefined ? { active: filters.active } : {}),
      ...(filters.categoryId ? { categoryMemberships: { some: {
        categoryId: filters.categoryId,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      } } } : {}),
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: {
      id: true, username: true, firstName: true, lastName: true, role: true, active: true,
      categoryMemberships: {
        where: { startDate: { lte: now }, OR: [{ endDate: null }, { endDate: { gte: now } }] },
        select: { category: { select: { id: true, nameFr: true, nameAr: true } } },
      },
    },
  });
}

export async function getUserProfile(actor: CurrentUser, id: string) {
  if (!canManageUsers(actor)) throw new AuthorizationError();
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true, email: true, firstName: true, lastName: true, role: true, active: true, phone: true, dateOfBirth: true, licenseNumber: true, preferredLanguage: true },
  });
}

export async function createUser(actor: CurrentUser, input: unknown) {
  const data = createUserSchema.parse(input);
  assertRoleAssignment(actor, data.role);
  const duplicate = await prisma.user.findUnique({ where: { username: data.username }, select: { id: true } });
  if (duplicate) throw new Error("DUPLICATE_USER");
  const id = randomUUID();
  const credentialHash = await hash(data.password, { type: argon2id });

  try {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          id,
          username: data.username,
          authEmail: `${id}@auth.invalid`,
          name: `${data.firstName} ${data.lastName}`,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          preferredLanguage: data.preferredLanguage,
          email: data.email,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth,
          licenseNumber: data.licenseNumber,
        },
        select: { id: true, username: true },
      });
      await tx.account.create({
        data: { id: `credential:${id}`, providerId: "credential", accountId: id, userId: id, password: credentialHash },
      });
      return user;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("DUPLICATE_USER");
    }
    throw error;
  }
}

export async function updateUser(actor: CurrentUser, input: unknown) {
  const data = updateUserSchema.parse(input);
  const target = await prisma.user.findUnique({ where: { id: data.id }, select: { role: true } });
  if (!target) throw new Error("USER_NOT_FOUND");
  if (actor.role !== Role.SUPER_ADMIN && [target.role, data.role].some((role) => ([Role.SUPER_ADMIN, Role.ADMINISTRATION] as Role[]).includes(role))) {
    throw new AuthorizationError();
  }
  assertRoleAssignment(actor, data.role);

  return prisma.user.update({
    where: { id: data.id },
    data: {
      username: data.username,
      name: `${data.firstName} ${data.lastName}`,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      preferredLanguage: data.preferredLanguage,
      email: data.email,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth,
      licenseNumber: data.licenseNumber,
      active: data.active,
    },
    select: { id: true },
  });
}

export const membershipTypeForRole: Partial<Record<Role, MembershipType>> = {
  PLAYER: MembershipType.PLAYER,
  COACH: MembershipType.COACH,
  DIRIGEANT: MembershipType.DIRIGEANT,
};
