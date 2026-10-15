import { argon2id, hash, verify } from "argon2";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username } from "better-auth/plugins";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  appName: "EGS Gafsa Attendance",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/username": { window: 60, max: 10 },
    },
  },
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    password: {
      hash: (password) => hash(password, { type: argon2id }),
      verify: ({ hash: storedHash, password }) => verify(storedHash, password),
    },
  },
  user: {
    modelName: "User",
    fields: {
      email: "authEmail",
    },
    additionalFields: {
      role: {
        type: "string",
        required: true,
        input: false,
        returned: true,
      },
      active: {
        type: "boolean",
        required: true,
        input: false,
        returned: false,
      },
      firstName: {
        type: "string",
        required: true,
        input: false,
        returned: true,
      },
      lastName: {
        type: "string",
        required: true,
        input: false,
        returned: true,
      },
      preferredLanguage: {
        type: "string",
        required: true,
        input: false,
        returned: true,
      },
    },
  },
  session: {
    modelName: "AuthSession",
  },
  account: {
    modelName: "Account",
  },
  verification: {
    modelName: "Verification",
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { active: true },
          });

          if (!user?.active) {
            throw APIError.from("FORBIDDEN", {
              message: "Account is inactive",
              code: "ACCOUNT_INACTIVE",
            });
          }
        },
      },
    },
  },
  disabledPaths: ["/sign-up/email"],
  plugins: [
    username({
      displayUsername: false,
    }),
  ],
});
