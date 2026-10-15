import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  AttendanceStatus,
  CategoryCode,
  MembershipType,
  PreferredLanguage,
  PrismaClient,
  Role,
  SessionStatus,
  SessionType,
} from "@prisma/client";
import { argon2id, hash } from "argon2";

const connectionString = process.env.DATABASE_URL;
const productionSeedOverride = process.env.ALLOW_DEVELOPMENT_SEED === "I_UNDERSTAND_THIS_LOADS_FAKE_DATA";

if (process.env.NODE_ENV === "production" && !productionSeedOverride) {
  throw new Error("Development seed is disabled in production.");
}

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const categories = [
  { code: CategoryCode.ECOLE_B, nameFr: "École B", nameAr: "المدرسة ب", displayOrder: 1 },
  { code: CategoryCode.ECOLE_A, nameFr: "École A", nameAr: "المدرسة أ", displayOrder: 2 },
  { code: CategoryCode.MINIME_B, nameFr: "Minime B", nameAr: "الأداني ب", displayOrder: 3 },
  { code: CategoryCode.MINIME_A, nameFr: "Minime A", nameAr: "الأداني أ", displayOrder: 4 },
  { code: CategoryCode.CADET_B, nameFr: "Cadets B", nameAr: "الأصاغر ب", displayOrder: 5 },
  { code: CategoryCode.CADET_A, nameFr: "Cadets A", nameAr: "الأصاغر أ", displayOrder: 6 },
  { code: CategoryCode.JUNIOR, nameFr: "Junior", nameAr: "الأواسط", displayOrder: 7 },
  {
    code: CategoryCode.ESPOIR_SENIOR_B,
    nameFr: "Espoir / Senior B",
    nameAr: "الآمال / الأكابر ب",
    displayOrder: 8,
  },
];

const staffUsers = [
  { username: "dev.superadmin", firstName: "Super", lastName: "Admin Test", role: Role.SUPER_ADMIN },
  { username: "dev.admin01", firstName: "Administration", lastName: "Test 01", role: Role.ADMINISTRATION },
  { username: "dev.admin02", firstName: "Administration", lastName: "Test 02", role: Role.ADMINISTRATION },
  { username: "dev.coach.cadetsa", firstName: "Coach", lastName: "Cadets A Test", role: Role.COACH },
  { username: "dev.coach.minimea", firstName: "Coach", lastName: "Minime A Test", role: Role.COACH },
  {
    username: "dev.dirigeant.cadetsa",
    firstName: "Dirigeant",
    lastName: "Cadets A Test",
    role: Role.DIRIGEANT,
  },
];

const playerUsers = [
  ...Array.from({ length: 10 }, (_, index) => ({
    username: `dev.player.cadetsa${String(index + 1).padStart(2, "0")}`,
    firstName: "Joueur",
    lastName: `Cadets A Test ${String(index + 1).padStart(2, "0")}`,
    role: Role.PLAYER,
    categoryCode: CategoryCode.CADET_A,
  })),
  ...Array.from({ length: 5 }, (_, index) => ({
    username: `dev.player.minimea${String(index + 1).padStart(2, "0")}`,
    firstName: "Joueur",
    lastName: `Minime A Test ${String(index + 1).padStart(2, "0")}`,
    role: Role.PLAYER,
    categoryCode: CategoryCode.MINIME_A,
  })),
];

async function main() {
  const credentialHash = await hash("DevOnly!2026", { type: argon2id });
  const season = await prisma.season.upsert({
    where: { name: "2026/2027" },
    update: {
      startDate: new Date("2026-07-01T00:00:00.000Z"),
      endDate: new Date("2027-06-30T00:00:00.000Z"),
      current: true,
    },
    create: {
      name: "2026/2027",
      startDate: new Date("2026-07-01T00:00:00.000Z"),
      endDate: new Date("2027-06-30T00:00:00.000Z"),
      current: true,
    },
  });

  const categoryByCode = new Map<CategoryCode, { id: string }>();
  for (const category of categories) {
    const savedCategory = await prisma.category.upsert({
      where: { code: category.code },
      update: { ...category, active: true },
      create: category,
    });
    categoryByCode.set(category.code, savedCategory);
  }

  const userByUsername = new Map<string, { id: string }>();
  for (const user of [...staffUsers, ...playerUsers]) {
    const name = `${user.firstName} ${user.lastName}`;
    const existingUser = await prisma.user.findUnique({
      where: { username: user.username },
      select: { id: true },
    });
    const userId = existingUser?.id ?? randomUUID();
    const authEmail = `${userId}@auth.invalid`;
    const savedUser = await prisma.user.upsert({
      where: { username: user.username },
      update: {
        authEmail,
        name,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        preferredLanguage: PreferredLanguage.FR,
        active: true,
      },
      create: {
        id: userId,
        username: user.username,
        authEmail,
        name,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        preferredLanguage: PreferredLanguage.FR,
      },
    });
    await prisma.account.upsert({
      where: {
        providerId_accountId: {
          providerId: "credential",
          accountId: savedUser.id,
        },
      },
      update: { password: credentialHash },
      create: {
        providerId: "credential",
        accountId: savedUser.id,
        userId: savedUser.id,
        password: credentialHash,
      },
    });
    userByUsername.set(user.username, savedUser);
  }

  const membershipStart = new Date("2026-07-01T00:00:00.000Z");
  const memberships = [
    {
      username: "dev.coach.cadetsa",
      categoryCode: CategoryCode.CADET_A,
      membershipType: MembershipType.COACH,
    },
    {
      username: "dev.coach.minimea",
      categoryCode: CategoryCode.MINIME_A,
      membershipType: MembershipType.COACH,
    },
    {
      username: "dev.dirigeant.cadetsa",
      categoryCode: CategoryCode.CADET_A,
      membershipType: MembershipType.DIRIGEANT,
    },
    ...playerUsers.map((player) => ({
      username: player.username,
      categoryCode: player.categoryCode,
      membershipType: MembershipType.PLAYER,
    })),
  ];

  for (const membership of memberships) {
    const userId = userByUsername.get(membership.username)!.id;
    const categoryId = categoryByCode.get(membership.categoryCode)!.id;
    const existing = await prisma.categoryMembership.findFirst({
      where: {
        userId,
        categoryId,
        seasonId: season.id,
        membershipType: membership.membershipType,
        startDate: membershipStart,
      },
    });

    if (existing) {
      await prisma.categoryMembership.update({
        where: { id: existing.id },
        data: { endDate: null, active: true },
      });
    } else {
      await prisma.categoryMembership.create({
        data: {
          userId,
          categoryId,
          seasonId: season.id,
          membershipType: membership.membershipType,
          startDate: membershipStart,
        },
      });
    }
  }

  const sessionInputs = [
    {
      categoryCode: CategoryCode.CADET_A,
      coachUsername: "dev.coach.cadetsa",
      startsAt: new Date("2026-10-12T17:00:00.000Z"),
      endsAt: new Date("2026-10-12T18:30:00.000Z"),
      location: "Terrain annexe - Développement",
    },
    {
      categoryCode: CategoryCode.MINIME_A,
      coachUsername: "dev.coach.minimea",
      startsAt: new Date("2026-10-13T16:00:00.000Z"),
      endsAt: new Date("2026-10-13T17:30:00.000Z"),
      location: "Terrain annexe - Développement",
    },
  ];

  for (const input of sessionInputs) {
    const categoryId = categoryByCode.get(input.categoryCode)!.id;
    const createdById = userByUsername.get(input.coachUsername)!.id;
    const existing = await prisma.session.findFirst({
      where: { categoryId, seasonId: season.id, startsAt: input.startsAt },
    });
    const session = existing
      ? await prisma.session.update({
          where: { id: existing.id },
          data: {
            endsAt: input.endsAt,
            type: SessionType.TRAINING,
            status: SessionStatus.DRAFT,
            location: input.location,
            submittedAt: null,
          },
        })
      : await prisma.session.create({
          data: {
            categoryId,
            seasonId: season.id,
            createdById,
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            type: SessionType.TRAINING,
            status: SessionStatus.DRAFT,
            location: input.location,
            submittedAt: null,
          },
        });

    const relevantPlayers = playerUsers.filter((player) => player.categoryCode === input.categoryCode).slice(0, 5);
    const statuses = [
      AttendanceStatus.PRESENT,
      AttendanceStatus.PRESENT,
      AttendanceStatus.LATE,
      AttendanceStatus.ABSENT,
      AttendanceStatus.EXCUSED,
    ];

    for (const [index, player] of relevantPlayers.entries()) {
      const userId = userByUsername.get(player.username)!.id;
      await prisma.attendanceRecord.upsert({
        where: { sessionId_userId: { sessionId: session.id, userId } },
        update: {
          status: statuses[index],
          note: index === 4 ? "Absence excusée - donnée de développement" : null,
          markedById: createdById,
          markedAt: input.endsAt,
        },
        create: {
          sessionId: session.id,
          userId,
          status: statuses[index],
          note: index === 4 ? "Absence excusée - donnée de développement" : null,
          markedById: createdById,
          markedAt: input.endsAt,
        },
      });
    }
  }

  console.log(`Seeded ${categories.length} categories, ${staffUsers.length + playerUsers.length} users, and 2 sessions.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
