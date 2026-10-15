import "server-only";

import { Role, type PreferredLanguage } from "@prisma/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type CurrentUser = {
  id: string;
  username: string;
  email: string | null;
  firstName: string;
  lastName: string;
  preferredLanguage: PreferredLanguage;
  role: Role;
};

export class AuthorizationError extends Error {
  constructor() {
    super("Forbidden");
    this.name = "AuthorizationError";
  }
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user.id) {
    return null;
  }

  return prisma.user.findFirst({
    where: { id: session.user.id, active: true },
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      preferredLanguage: true,
      role: true,
    },
  });
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(role: Role): Promise<CurrentUser> {
  const user = await requireUser();

  if (user.role !== role) {
    throw new AuthorizationError();
  }

  return user;
}

export async function requireAnyRole(roles: readonly Role[]): Promise<CurrentUser> {
  const user = await requireUser();

  if (!roles.includes(user.role)) {
    throw new AuthorizationError();
  }

  return user;
}
