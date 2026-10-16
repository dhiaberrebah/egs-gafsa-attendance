import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { CategoryCode, PreferredLanguage, PrismaClient, Role } from "@prisma/client";
import { argon2id, hash } from "argon2";
import { z } from "zod";

if (process.env.PRODUCTION_BOOTSTRAP_CONFIRM !== "CREATE_EGS_PRODUCTION") {
  throw new Error('Production bootstrap refused. Set PRODUCTION_BOOTSTRAP_CONFIRM="CREATE_EGS_PRODUCTION" to run.');
}

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL is required.");
}

const usernameSchema = z.string().trim().toLowerCase().min(3).max(30).regex(/^[a-z0-9_.]+$/);
const bootstrapSchema = z.object({
  username: usernameSchema,
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  password: z.string().min(8).max(128),
  preferredLanguage: z.nativeEnum(PreferredLanguage),
  email: z.union([z.email(), z.literal(""), z.undefined()]).transform((value) => value || null),
});

const input = bootstrapSchema.parse({
  username: process.env.BOOTSTRAP_ADMIN_USERNAME,
  firstName: process.env.BOOTSTRAP_ADMIN_FIRST_NAME,
  lastName: process.env.BOOTSTRAP_ADMIN_LAST_NAME,
  password: process.env.BOOTSTRAP_ADMIN_PASSWORD,
  preferredLanguage: process.env.BOOTSTRAP_ADMIN_LANGUAGE,
  email: process.env.BOOTSTRAP_ADMIN_EMAIL,
});

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

async function main() {
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
  console.log(`Season "${season.name}" ready.`);

  for (const category of categories) {
    await prisma.category.upsert({
      where: { code: category.code },
      update: { ...category, active: true },
      create: category,
    });
  }
  console.log(`${categories.length} categories ready.`);

  const existing = await prisma.user.findFirst({
    where: { username: { equals: input.username, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) {
    throw new Error(`A user with this username already exists. Aborting without changes to that user.`);
  }

  const existingSuperAdmins = await prisma.user.count({ where: { role: Role.SUPER_ADMIN } });

  const id = randomUUID();
  const credentialHash = await hash(input.password, { type: argon2id });

  await prisma.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        id,
        username: input.username,
        authEmail: `${id}@auth.invalid`,
        name: `${input.firstName} ${input.lastName}`,
        firstName: input.firstName,
        lastName: input.lastName,
        role: Role.SUPER_ADMIN,
        preferredLanguage: input.preferredLanguage,
        email: input.email,
        active: true,
      },
    });
    await tx.account.create({
      data: {
        id: `credential:${id}`,
        providerId: "credential",
        accountId: id,
        userId: id,
        password: credentialHash,
      },
    });
  });

  console.log(
    `Created SUPER_ADMIN "${input.username}" (language ${input.preferredLanguage}). Existing super admins before run: ${existingSuperAdmins}.`,
  );
  console.log("Bootstrap complete. No sessions, memberships, or attendance data were created.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error instanceof Error ? error.message : error);
    await prisma.$disconnect();
    process.exit(1);
  });
