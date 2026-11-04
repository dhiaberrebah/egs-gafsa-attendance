import { argon2id, hash, verify } from "argon2";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { APIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer, username } from "better-auth/plugins";
import { Role } from "@prisma/client";
import { env } from "@/lib/env";
import { canAuthenticateRole } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

function sessionRoleGuard(isAllowed: (role: Role) => boolean) {
  return async (session: { userId: string }) => {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { active: true, role: true },
    });

    if (!user?.active || !isAllowed(user.role)) {
      throw APIError.from("FORBIDDEN", {
        message: "Account is inactive or is not allowed to sign in",
        code: user?.active ? "ROLE_CANNOT_SIGN_IN" : "ACCOUNT_INACTIVE",
      });
    }
  };
}

const commonOptions = {
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
        before: sessionRoleGuard(canAuthenticateRole),
      },
    },
  },
  disabledPaths: ["/sign-up/email"],
} satisfies BetterAuthOptions;

export const auth = betterAuth({
  ...commonOptions,
  plugins: [
    username({
      displayUsername: false,
    }),
  ],
});

export const mobileAuth = betterAuth({
  ...commonOptions,
  basePath: "/api/mobile/auth",
  databaseHooks: {
    session: {
      create: {
        before: sessionRoleGuard((role) => role === Role.COACH),
      },
    },
  },
  plugins: [
    username({
      displayUsername: false,
    }),
    bearer({ requireSignature: true }),
  ],
});
