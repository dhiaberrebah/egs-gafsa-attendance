import "server-only";

import { Role } from "@prisma/client";
import { notFound } from "next/navigation";
import { requireUser, type CurrentUser } from "@/lib/auth/index";

export const administrationRoles = [Role.SUPER_ADMIN, Role.ADMINISTRATION] as const;

export function canManageUsers(user: Pick<CurrentUser, "role">) {
  return administrationRoles.includes(user.role as (typeof administrationRoles)[number]);
}

export async function requireAdministration() {
  const user = await requireUser();
  if (!canManageUsers(user)) notFound();
  return user;
}
