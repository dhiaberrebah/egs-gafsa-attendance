import "server-only";

import { Role, type PreferredLanguage } from "@prisma/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, mobileAuth } from "@/lib/auth";
import { canAuthenticateRole } from "@/lib/domain";
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

async function getLoginUser(userId: string | undefined): Promise<CurrentUser | null> {
  if (!userId) return null;
  const user = await prisma.user.findFirst({
    where: { id: userId, active: true },
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
  return user && canAuthenticateRole(user.role) ? user : null;
}

export async function getCurrentUserFromHeaders(requestHeaders: Headers): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session?.user.id) {
    return null;
  }
  return getLoginUser(session.user.id);
}

export async function getMobileUserFromHeaders(requestHeaders: Headers): Promise<CurrentUser | null> {
  const session = await mobileAuth.api.getSession({ headers: requestHeaders });
  if (!session?.user.id) return null;
  return getLoginUser(session.user.id);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  return getCurrentUserFromHeaders(await headers());
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
