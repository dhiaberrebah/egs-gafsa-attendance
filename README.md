# EGS Gafsa Attendance

Attendance management for EGS Gafsa staff, built with Next.js 16, PostgreSQL, Prisma 7, Better Auth, and TypeScript.

## Development

### Requirements

- Node.js 24
- npm
- PostgreSQL

### Environment

Copy `.env.example` to `.env` and set local values:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/egs_gafsa_dev?schema=public"
BETTER_AUTH_SECRET="GENERATE_A_RANDOM_SECRET_OF_AT_LEAST_32_CHARACTERS"
BETTER_AUTH_URL="http://localhost:3000"
```

Generate a local auth secret with Node.js:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Never commit `.env`.

### Install and initialize

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

## Production

Required server environment variables:

```text
DATABASE_URL
BETTER_AUTH_SECRET
BETTER_AUTH_URL
```

`BETTER_AUTH_URL` must use the public HTTPS application origin. Use a unique, high-entropy production secret and a dedicated production PostgreSQL account.

### Deployment sequence

```bash
npm ci
npx prisma migrate deploy
npx prisma generate
npm run build
npm start
```

Use `prisma migrate deploy` in production. Never use `prisma migrate dev` against a production database.

Do not run `prisma db seed` automatically in production. The seed is development-only and refuses production execution unless an explicit emergency override is supplied. Production users and club data must be created through controlled operational procedures.

### Operational requirements

- Terminate traffic over HTTPS so Better Auth can use secure production cookies.
- Keep environment values in the deployment platform's secret manager.
- Back up PostgreSQL before migrations and on a regular schedule.
- Test restore procedures, not only backup creation.
- Review `npm audit` findings during dependency upgrades without forcing incompatible framework downgrades.
- Run migrations once per deployment before starting new application instances.
