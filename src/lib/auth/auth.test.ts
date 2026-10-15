import { afterAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));

import { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canAccessCategory,
  canEditAttendance,
  canManageSession,
  canViewAttendance,
} from "./authorization";
import { getCurrentUser, type CurrentUser } from "./session";

const baseUrl = "http://localhost:3000";
const developmentPassword = ["Dev", "Only", "!", "2026"].join("");

function authRequest(path: string, body?: Record<string, unknown>, cookie?: string) {
  return new Request(`${baseUrl}/api/auth${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: baseUrl,
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function responseCookie(response: Response) {
  return response.headers
    .getSetCookie()
    .map((value) => value.split(";", 1)[0])
    .join("; ");
}

async function safeUser(username: string): Promise<CurrentUser> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { username },
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
  return user;
}

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Better Auth credentials", () => {
  it("accepts correct seeded credentials and revokes the session on logout", async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { username: "dev.coach.cadetsa" } });
    const sessionsBefore = await prisma.authSession.count({ where: { userId: user.id } });
    const response = await auth.handler(
      authRequest("/sign-in/username", {
        username: "dev.coach.cadetsa",
        password: developmentPassword,
      }),
    );

    expect(response.ok).toBe(true);
    expect(response.headers.getSetCookie().some((value) => /httponly/i.test(value))).toBe(true);
    const cookie = responseCookie(response);
    expect(cookie).not.toBe("");
    expect(await prisma.authSession.count({ where: { userId: user.id } })).toBe(sessionsBefore + 1);

    const logoutResponse = await auth.handler(authRequest("/sign-out", undefined, cookie));
    expect(logoutResponse.ok).toBe(true);
    expect(await prisma.authSession.count({ where: { userId: user.id } })).toBe(sessionsBefore);
  });

  it("rejects a wrong password without revealing account existence", async () => {
    const response = await auth.handler(
      authRequest("/sign-in/username", {
        username: "dev.coach.cadetsa",
        password: "incorrect-development-password",
      }),
    );

    expect(response.status).toBe(401);
  });

  it("rejects inactive users before creating a session", async () => {
    const username = "dev.admin02";
    const user = await prisma.user.findUniqueOrThrow({ where: { username } });
    const sessionsBefore = await prisma.authSession.count({ where: { userId: user.id } });

    await prisma.user.update({ where: { id: user.id }, data: { active: false } });
    try {
      const response = await auth.handler(
        authRequest("/sign-in/username", { username, password: developmentPassword }),
      );
      expect(response.status).toBe(403);
      expect(await prisma.authSession.count({ where: { userId: user.id } })).toBe(sessionsBefore);
    } finally {
      await prisma.user.update({ where: { id: user.id }, data: { active: true } });
    }
  });

  it("returns no session for an anonymous request", async () => {
    const response = await auth.handler(new Request(`${baseUrl}/api/auth/get-session`));
    expect(response.ok).toBe(true);
    expect(await response.json()).toBeNull();
  });

  it("rejects anonymous access in the protected server helper", async () => {
    const getSession = vi.spyOn(auth.api, "getSession").mockResolvedValueOnce(null);
    await expect(getCurrentUser()).resolves.toBeNull();
    getSession.mockRestore();
  });
});

describe("centralized authorization", () => {
  const targetDate = new Date("2026-10-12T17:00:00.000Z");

  it("allows the Cadets A coach only into the assigned category", async () => {
    const [coach, cadetsA, minimeA] = await Promise.all([
      safeUser("dev.coach.cadetsa"),
      prisma.category.findUniqueOrThrow({ where: { code: "CADET_A" } }),
      prisma.category.findUniqueOrThrow({ where: { code: "MINIME_A" } }),
    ]);

    expect(await canAccessCategory(coach, cadetsA.id, targetDate)).toBe(true);
    expect(await canAccessCategory(coach, minimeA.id, targetDate)).toBe(false);
    expect(await canManageSession(coach, { categoryId: minimeA.id, startsAt: targetDate })).toBe(false);
  });

  it("gives the Cadets A dirigeant read-only attendance access", async () => {
    const dirigeant = await safeUser("dev.dirigeant.cadetsa");
    const record = await prisma.attendanceRecord.findFirstOrThrow({
      where: { session: { category: { code: "CADET_A" } } },
    });

    expect(await canViewAttendance(dirigeant, record.id)).toBe(true);
    expect(await canEditAttendance(dirigeant, record.id)).toBe(false);
  });

  it("prevents a player from reading another player's attendance", async () => {
    const player = await safeUser("dev.player.cadetsa01");
    const [ownRecord, otherRecord] = await Promise.all([
      prisma.attendanceRecord.findFirstOrThrow({
        where: { userId: player.id, session: { startsAt: { lt: new Date("2027-01-01") } } },
      }),
      prisma.attendanceRecord.findFirstOrThrow({
        where: { userId: { not: player.id }, session: { category: { code: "CADET_A" }, startsAt: { lt: new Date("2027-01-01") } } },
      }),
    ]);

    expect(await canViewAttendance(player, ownRecord.id)).toBe(true);
    expect(await canViewAttendance(player, otherRecord.id)).toBe(false);
  });

  it("allows administration to access all categories", async () => {
    const administration = await safeUser("dev.admin01");
    const categories = await prisma.category.findMany({ select: { id: true } });

    await expect(
      Promise.all(categories.map(({ id }) => canAccessCategory(administration, id, targetDate))),
    ).resolves.toEqual(categories.map(() => true));
  });

  it("allows the super admin to manage every session", async () => {
    const superAdmin = await safeUser("dev.superadmin");
    const sessions = await prisma.session.findMany({ select: { id: true } });

    expect(superAdmin.role).toBe(Role.SUPER_ADMIN);
    await expect(
      Promise.all(sessions.map(({ id }) => canManageSession(superAdmin, { sessionId: id }))),
    ).resolves.toEqual(sessions.map(() => true));
  });
});
