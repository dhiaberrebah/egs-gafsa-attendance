import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1).refine((value) => value.startsWith("postgresql://") || value.startsWith("postgres://"), "must be a PostgreSQL URL"),
  DIRECT_URL: z.string().refine((value) => value.startsWith("postgresql://") || value.startsWith("postgres://"), "must be a PostgreSQL URL").optional(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
});

const result = serverEnvSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL || undefined,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
});

if (!result.success) {
  const fields = [...new Set(result.error.issues.map((issue) => issue.path.join(".") || "environment"))];
  throw new Error(`Invalid server environment configuration: ${fields.join(", ")}`);
}

export const env = result.data;
