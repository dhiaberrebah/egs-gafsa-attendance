import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL is required.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const [users, accounts, authSessions, seasons, categories, memberships, sessions, attendance, auditLogs] =
    await Promise.all([
      prisma.user.count(),
      prisma.account.count(),
      prisma.authSession.count(),
      prisma.season.count(),
      prisma.category.count(),
      prisma.categoryMembership.count(),
      prisma.session.count(),
      prisma.attendanceRecord.count(),
      prisma.attendanceAuditLog.count(),
    ]);

  console.log("Production table counts:");
  console.log(`  User:                ${users}`);
  console.log(`  Account:             ${accounts}`);
  console.log(`  AuthSession:         ${authSessions}`);
  console.log(`  Season:              ${seasons}`);
  console.log(`  Category:            ${categories}`);
  console.log(`  CategoryMembership:  ${memberships}`);
  console.log(`  Session:             ${sessions}`);
  console.log(`  AttendanceRecord:    ${attendance}`);
  console.log(`  AttendanceAuditLog:  ${auditLogs}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error instanceof Error ? error.message : error);
    await prisma.$disconnect();
    process.exit(1);
  });
