# EGS Gafsa Attendance

### Attendance Management · Web & Mobile

An application for managing staff attendance and training sessions, with a web interface for administration and a companion mobile app for coaches.

## Main Workflows

- Coaches sign in and view their assigned sessions.
- Coaches submit attendance through the mobile app.
- Administrators manage operations through the web application.

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| Web application | Next.js, React, TypeScript |
| Mobile application | React Native, Expo |
| Database | PostgreSQL |
| Database access | Prisma |
| Authentication | Better Auth |

## Development

### Requirements

- Node.js 24
- npm
- PostgreSQL

### Environment

Copy `.env.example` to `.env` and configure your local environment:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/egs_gafsa_dev?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@localhost:5432/egs_gafsa_dev?schema=public"
BETTER_AUTH_SECRET="GENERATE_A_RANDOM_SECRET_OF_AT_LEAST_32_CHARACTERS"
BETTER_AUTH_URL="http://localhost:3000"
```

Generate an authentication secret:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Never commit `.env`.

### Install and Initialize

Run these commands individually, stopping if a command fails:

```bash
npm ci
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
npm run dev
```

The seed contains fake development accounts and data. It is idempotent for the development database.

### Verification

```bash
npx prisma validate
npx tsc --noEmit
npm run lint
npm test
npm run build
```

## Coach Mobile App

The Expo React Native application lives in `mobile/` and uses the same Next.js backend.

Coaches sign in with their staff credentials, view assigned sessions, and submit attendance. Administration uses the web application.

See [mobile setup instructions](mobile/README.md) for configuration and device-specific API URLs.

## Production

### Environment Variables

```text
DATABASE_URL
DIRECT_URL
BETTER_AUTH_SECRET
BETTER_AUTH_URL
```

- `DATABASE_URL`: Application runtime database connection, which may use a pooler.
- `DIRECT_URL`: Direct database connection for Prisma migrations and administrative commands. If omitted, Prisma CLI falls back to `DATABASE_URL`.
- `BETTER_AUTH_SECRET`: A unique, high-entropy production secret.
- `BETTER_AUTH_URL`: The public HTTPS application origin.

Use a dedicated production PostgreSQL account.

### Deployment Sequence

Run each command only after the previous command succeeds:

```bash
npm ci
npx prisma migrate deploy
npx prisma generate
npm run build
npm start
```

Use `prisma migrate deploy` in production. Never run `prisma migrate dev` against a production database.

Prisma CLI resolves `DIRECT_URL ?? DATABASE_URL`, while the application runtime uses `DATABASE_URL`.

Do not run `prisma db seed` automatically in production. The seed is development-only and refuses production execution unless an explicit emergency override is supplied. Create production users and club data through controlled operational procedures.

### Operational Requirements

- Serve traffic over HTTPS so Better Auth can use secure production cookies.
- Store environment values in the deployment platform's secret manager.
- Back up PostgreSQL before migrations and on a regular schedule.
- Test database restoration procedures.
- Review `npm audit` findings during dependency upgrades without forcing incompatible framework downgrades.
- Run migrations once per deployment before starting new application instances.
