<div align="center">

# AssetTrack

**IT asset management and HR onboarding/offboarding in a single, self-hostable web app.**

![Build](https://img.shields.io/github/actions/workflow/status/your-org/assettrack/ci.yml?branch=main&label=build)
![License](https://img.shields.io/badge/license-MIT-green)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

<br/>

![AssetTrack Demo](docs/screenshots/demo_animation.svg)

<br/>

</div>

---

## 📸 Screenshots

<div align="center">
  <img src="docs/screenshots/02_dashboard.png" alt="Dashboard" width="48%" style="border-radius:8px;margin:4px;">
  <img src="docs/screenshots/03_assets.png" alt="Assets" width="48%" style="border-radius:8px;margin:4px;">
  <img src="docs/screenshots/04_employees.png" alt="Employees" width="48%" style="border-radius:8px;margin:4px;">
  <img src="docs/screenshots/05_onboarding.png" alt="Onboarding" width="48%" style="border-radius:8px;margin:4px;">
  <img src="docs/screenshots/06_audit.png" alt="Audit Log" width="48%" style="border-radius:8px;margin:4px;">
  <img src="docs/screenshots/01_login.png" alt="Login" width="48%" style="border-radius:8px;margin:4px;">
</div>

---

## Features

| Asset Management | HR & People |
|---|---|
| Track hardware/software by tag, serial, location | Employee lifecycle: onboarding → active → offboarding |
| Asset categories with custom icons and colors | Onboarding and offboarding task checklists |
| Assign assets directly to employees | LDAP/Active Directory account provisioning (or simulation) |
| Warranty expiry tracking and alerts | Welcome email automation via SMTP |
| Purchase cost records per asset | Department and reporting-line management |
| Filter and search by status, category, location | Employee directory with status badges and avatar |
| Dashboard charts and summary statistics | Audit trail per employee and per asset |
| Full audit log for every create/update/delete | Manager hierarchy via self-referential relation |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, Server Components) |
| Language | TypeScript 5 (strict mode) |
| ORM | Prisma 5 |
| Database | PostgreSQL (Neon recommended for cloud) |
| Auth | NextAuth v5 (JWT sessions, Prisma adapter) |
| Styling | Tailwind CSS 3 + Radix UI primitives |
| Charts | Recharts 2 |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table v8 |
| Email | Nodemailer (SMTP) |
| LDAP | ldapjs (optional, simulation mode by default) |
| Testing | Vitest + Testing Library |
| Animations | Framer Motion |

---

## Quick Start

### Prerequisites

- Node.js >= 20
- pnpm >= 10 (`npm install -g pnpm`)
- PostgreSQL 15+ (local or [Neon](https://neon.tech) free tier)

### 1. Clone and install

```bash
git clone https://github.com/your-org/assettrack.git
cd assettrack
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Open `.env.local` and set at minimum:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/assettrack"
AUTH_SECRET="<run: openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"
```

See the [Environment Variables](#environment-variables) table for the full list.

### 3. Set up the database

```bash
pnpm prisma generate   # generates the Prisma client
pnpm prisma db push    # creates tables (no migration history needed)
pnpm prisma:seed       # seeds admin user and sample data
```

### 4. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with the default admin credentials below.

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `AUTH_SECRET` | NextAuth secret, min 32 chars (`openssl rand -base64 32`) | Yes |
| `NEXTAUTH_URL` | Canonical app URL (e.g. `https://app.example.com`) | Yes |
| `LDAP_ENABLED` | Enable real LDAP integration (`true`/`false`, default `false`) | No |
| `LDAP_URL` | LDAP server URL (e.g. `ldap://dc.company.com:389`) | No |
| `LDAP_BIND_DN` | Service account distinguished name for LDAP bind | No |
| `LDAP_BIND_PASSWORD` | Service account password | No |
| `LDAP_BASE_DN` | Base DN for user objects | No |
| `EMAIL_ENABLED` | Enable real email sending (`true`/`false`, default `false`) | No |
| `SMTP_HOST` | SMTP server hostname | No |
| `SMTP_PORT` | SMTP port (`587` for STARTTLS, `465` for SSL) | No |
| `SMTP_USER` | SMTP login username | No |
| `SMTP_PASS` | SMTP login password | No |
| `EMAIL_FROM` | Display name and address for outgoing mail | No |

When `LDAP_ENABLED=false` or `EMAIL_ENABLED=false`, the respective operations are logged to the console rather than executed — useful for development and demos.

---

## Architecture Overview

```
Browser
  └── Next.js Middleware  (middleware.ts)
        ├── Rate limiter  — 60 req/min per IP on all /api/* routes
        ├── Auth gate     — redirects unauthenticated requests to /login
        └── RBAC check    — VIEWER role blocked from HR routes
              └── App Router  (app/)
                    ├── Server Components  — SSR pages
                    ├── Client Components  — interactive UI
                    └── API Routes  (app/api/*)
                          └── Prisma Client  (lib/db.ts)
                                └── PostgreSQL
```

Sessions are JWT-based (no database session table). See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full project structure and design decisions.

---

## RBAC Roles

| Role | Assets | Employees / HR | Assign Assets | Admin Settings |
|---|---|---|---|---|
| `ADMIN` | Full CRUD | Full CRUD | Yes | Yes |
| `HR` | Read | Full CRUD | Yes | No |
| `MANAGER` | Read | Read | Yes | No |
| `VIEWER` | Read | No access | No | No |

Roles are enforced at both the middleware layer (route-level) and within individual API route handlers.

---

## Default Credentials

| Field | Value |
|---|---|
| Email | `admin@assettrack.io` |
| Password | `admin2000` |

**Change these immediately in any non-development environment.**

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Generate Prisma client and build for production |
| `pnpm start` | Start production server |
| `pnpm typecheck` | TypeScript check (zero errors expected) |
| `pnpm lint` | ESLint check |
| `pnpm test` | Run test suite (Vitest) |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm prisma:generate` | Regenerate Prisma client after schema changes |
| `pnpm prisma:migrate` | Apply pending migrations (dev only) |
| `pnpm prisma:seed` | Seed sample data (idempotent) |
| `pnpm prisma:studio` | Open Prisma Studio GUI |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch naming conventions, commit message format, and the PR checklist.

---

## Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for Vercel and Neon PostgreSQL deployment instructions.

---

## License

[MIT](LICENSE)
