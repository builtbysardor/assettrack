# Deployment

This guide covers deploying AssetTrack to Vercel with a Neon PostgreSQL database. Both services have free tiers suitable for small teams.

---

## Neon PostgreSQL Setup

[Neon](https://neon.tech) is a serverless PostgreSQL provider with a generous free tier and instant provisioning.

### 1. Create a Neon project

1. Sign up or log in at [neon.tech](https://neon.tech).
2. Click **New Project**.
3. Choose a region close to your Vercel deployment region.
4. Note the **Connection string** shown after creation — it looks like:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### 2. Push the schema

Run the following from your local machine with the Neon `DATABASE_URL` set in `.env.local`:

```bash
pnpm prisma db push
```

This creates all tables directly from `prisma/schema.prisma` without generating a migration history, which is suitable for initial deploys.

### 3. Seed the admin user

```bash
pnpm prisma:seed
```

This creates the default admin account and sample data. Run it once after the initial schema push.

---

## Vercel Deployment

### 1. Fork and import

1. Fork the repository to your GitHub account.
2. Go to [vercel.com/new](https://vercel.com/new).
3. Click **Import Git Repository** and select your fork.
4. Vercel will auto-detect Next.js — no framework configuration is needed.

### 2. Set environment variables

In the Vercel project settings under **Environment Variables**, add the following before the first deploy:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Neon connection string |
| `AUTH_SECRET` | Output of `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your Vercel deployment URL, e.g. `https://assettrack.vercel.app` |

Optional variables (add only if you need real LDAP or email in production):

| Variable | Value |
|---|---|
| `LDAP_ENABLED` | `true` |
| `LDAP_URL` | Your LDAP server URL |
| `LDAP_BIND_DN` | Service account DN |
| `LDAP_BIND_PASSWORD` | Service account password |
| `LDAP_BASE_DN` | Base DN for users |
| `EMAIL_ENABLED` | `true` |
| `SMTP_HOST` | Your SMTP hostname |
| `SMTP_PORT` | `587` (STARTTLS) or `465` (SSL) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `EMAIL_FROM` | e.g. `AssetTrack <noreply@yourdomain.com>` |

### 3. Deploy

Click **Deploy**. Vercel will run `pnpm build` which executes `prisma generate && next build` automatically.

### 4. Post-deploy: seed the admin user

If you have not already seeded via your local machine, you can trigger the seed via the API:

```
POST https://your-app.vercel.app/api/seed
```

After seeding, **delete or disable the `/api/seed` route** to prevent re-seeding in production. The seed script is idempotent but the endpoint should not remain publicly accessible.

---

## Required Environment Variables for Production

The following variables must be set for the application to start. Missing any of them will cause a runtime error.

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Must include `?sslmode=require` for Neon |
| `AUTH_SECRET` | Minimum 32 random characters. Rotate with care — existing sessions will be invalidated |
| `NEXTAUTH_URL` | Must exactly match the canonical URL including protocol. No trailing slash |

---

## Custom Domain

1. In Vercel project settings, go to **Domains** and add your custom domain.
2. Follow the DNS instructions (CNAME or A record).
3. Update `NEXTAUTH_URL` to match the new domain.

---

## Updating

Deployments are triggered automatically on push to `main` if you connected the GitHub repository. For manual deploys:

```bash
vercel --prod
```

After a schema change, run `pnpm prisma db push` from your local machine pointing at the production `DATABASE_URL`, or add a post-deploy hook that runs it automatically.

---

## Docker (self-hosted alternative)

A `docker-compose.yml` is included for running a local PostgreSQL instance during development. For production self-hosting, you will need to build a Docker image from the Next.js output and provide your own PostgreSQL host. The `Dockerfile` is not included in this repository — contributions welcome.
