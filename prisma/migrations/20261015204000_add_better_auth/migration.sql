BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "User"
        WHERE "username" IS NULL OR btrim("username") = ''
    ) THEN
        RAISE EXCEPTION 'Better Auth migration aborted: a user has a null or blank username';
    END IF;

    IF EXISTS (
        SELECT lower("username")
        FROM "User"
        GROUP BY lower("username")
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Better Auth migration aborted: case-insensitive username collision detected';
    END IF;
END $$;

ALTER TABLE "User"
ADD COLUMN "authEmail" TEXT,
ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "image" TEXT,
ADD COLUMN "name" TEXT;

CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AuthSession_token_key" ON "AuthSession"("token");
CREATE INDEX "AuthSession_userId_idx" ON "AuthSession"("userId");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE UNIQUE INDEX "Account_providerId_accountId_key" ON "Account"("providerId", "accountId");
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");

ALTER TABLE "AuthSession"
ADD CONSTRAINT "AuthSession_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Account"
ADD CONSTRAINT "Account_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE "User"
SET
    "name" = btrim(concat_ws(' ', "firstName", "lastName")),
    "authEmail" = "id" || '@auth.invalid';

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "User"
        WHERE "name" IS NULL OR btrim("name") = ''
    ) THEN
        RAISE EXCEPTION 'Better Auth migration aborted: a user has no backfilled name';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM "User"
        WHERE "authEmail" IS NULL OR "authEmail" <> ("id" || '@auth.invalid')
    ) THEN
        RAISE EXCEPTION 'Better Auth migration aborted: a user has an invalid internal auth email';
    END IF;

    IF EXISTS (
        SELECT "authEmail"
        FROM "User"
        GROUP BY "authEmail"
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Better Auth migration aborted: duplicate internal auth emails detected';
    END IF;
END $$;

INSERT INTO "Account" (
    "id",
    "accountId",
    "providerId",
    "userId",
    "password",
    "createdAt",
    "updatedAt"
)
SELECT
    'credential:' || "id",
    "id",
    'credential',
    "id",
    "passwordHash",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "User"
WHERE "passwordHash" IS NOT NULL
ON CONFLICT ("providerId", "accountId") DO NOTHING;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "User" AS u
        LEFT JOIN "Account" AS a
          ON a."userId" = u."id"
         AND a."providerId" = 'credential'
         AND a."accountId" = u."id"
        WHERE u."passwordHash" IS NOT NULL
        GROUP BY u."id"
        HAVING COUNT(a."id") <> 1
    ) THEN
        RAISE EXCEPTION 'Better Auth migration aborted: credential account count mismatch';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM "User" AS u
        JOIN "Account" AS a
          ON a."userId" = u."id"
         AND a."providerId" = 'credential'
         AND a."accountId" = u."id"
        WHERE u."passwordHash" IS NOT NULL
          AND (
              a."id" <> 'credential:' || u."id"
              OR a."password" IS DISTINCT FROM u."passwordHash"
          )
    ) THEN
        RAISE EXCEPTION 'Better Auth migration aborted: credential account backfill mismatch';
    END IF;
END $$;

ALTER TABLE "User"
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "authEmail" SET NOT NULL;

CREATE UNIQUE INDEX "User_authEmail_key" ON "User"("authEmail");

COMMIT;
