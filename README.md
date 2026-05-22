# AssetTrack — IT Asset Management System

A production-grade, full-stack IT Asset Management web application built for professional use. Track hardware assets, manage categories and locations, monitor warranty expiries, and maintain a full audit trail — all in a polished dark-themed interface.

## Screenshots

| Dashboard | Assets List | Asset Detail |
|-----------|-------------|--------------|
| ![dashboard](docs/dashboard.png) | ![assets](docs/assets.png) | ![detail](docs/detail.png) |

## Features

- **Asset tracking** — Full lifecycle management with status tracking (Active, Inactive, Maintenance, Retired, Missing)
- **Smart search** — Real-time debounced search across name, tag, serial number, and assignee
- **Category & Location management** — Organize assets with colored categories and structured locations
- **Audit trail** — Every create/update/delete is logged with the user, timestamp, and field-level diff
- **Warranty monitoring** — Dashboard highlights expiring warranties; table rows flag expired ones in red
- **CSV export** — Export filtered asset lists to CSV with one click
- **QR-ready tags** — Auto-generated `AST-0001` style tags for every asset
- **Role-based access** — ADMIN / MANAGER / VIEWER roles enforced on every API endpoint
- **JWT auth** — Secure session via NextAuth v5 with HTTP-only cookies

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router, Server Components, Server Actions) |
| Language | TypeScript strict mode |
| Database | PostgreSQL via Prisma ORM |
| Auth | NextAuth v5 (Auth.js) — Credentials + JWT |
| Styling | Tailwind CSS with custom design tokens |
| UI Primitives | Radix UI (Dialog, Select, Dropdown, Tooltip, Popover) |
| Charts | Recharts |
| Icons | Lucide React |
| Animation | Framer Motion |
| Forms | React Hook Form + Zod |
| Notifications | Sonner |
| Table | TanStack Table v8 |
| Dates | date-fns |

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Docker (for PostgreSQL)

### 1. Clone and install

```bash
cd assettrack
pnpm install
```

### 2. Start the database

```bash
docker compose up -d
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env if needed (defaults work with docker-compose)
```

### 4. Run migrations and seed

```bash
pnpm prisma:generate   # Generate Prisma client
pnpm prisma:migrate    # Run migrations (creates tables)
pnpm prisma:seed       # Seed with sample data
```

### 5. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Default Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@assettrack.io | admin123 | ADMIN |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://assettrack:assettrack_dev@localhost:5432/assettrack` |
| `AUTH_SECRET` | NextAuth secret (min 32 chars) | — |
| `NEXTAUTH_URL` | App URL | `http://localhost:3000` |

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm typecheck` | TypeScript check (zero errors expected) |
| `pnpm lint` | ESLint check |
| `pnpm prisma:generate` | Regenerate Prisma client after schema changes |
| `pnpm prisma:migrate` | Apply pending migrations |
| `pnpm prisma:seed` | Seed sample data (idempotent) |
| `pnpm prisma:studio` | Open Prisma Studio GUI |

## Project Structure

```
assettrack/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (dashboard)/           # Protected dashboard shell
│   │   ├── layout.tsx         # Sidebar + main content frame
│   │   ├── dashboard/         # Overview with charts + stats
│   │   ├── assets/            # Asset list, CRUD, detail drawer
│   │   ├── categories/        # Category management
│   │   └── locations/         # Location management
│   ├── api/                   # Route handlers
│   │   ├── auth/[...nextauth] # NextAuth handler
│   │   ├── assets/            # GET, POST, PATCH, DELETE, export CSV
│   │   ├── categories/        # GET, POST, PATCH, DELETE
│   │   ├── locations/         # GET, POST, PATCH, DELETE
│   │   ├── dashboard/summary  # Aggregated stats
│   │   └── audit/             # Audit log reader
│   └── layout.tsx             # Root layout (fonts, providers, toaster)
├── components/
│   ├── ui/                    # Design system primitives
│   ├── layout/                # Sidebar, TopBar
│   ├── charts/                # BarChart, DonutChart wrappers
│   ├── assets/                # AssetTable, AssetForm, AssetDetailDrawer
│   ├── categories/            # CategoryForm
│   └── locations/             # LocationForm
├── lib/
│   ├── auth.ts                # NextAuth config
│   ├── db.ts                  # Prisma singleton
│   ├── validators.ts          # Zod schemas (shared client/server)
│   ├── audit.ts               # writeAudit() helper
│   └── utils.ts               # cn(), formatCurrency(), formatDate()
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Sample data seeder
├── styles/
│   └── globals.css            # CSS variables + design tokens
├── middleware.ts              # Auth route protection
└── docker-compose.yml         # PostgreSQL service
```

## Roles & Permissions

| Action | VIEWER | MANAGER | ADMIN |
|--------|--------|---------|-------|
| Read assets/categories/locations | ✅ | ✅ | ✅ |
| Create/update assets | ❌ | ✅ | ✅ |
| Create/update categories/locations | ❌ | ✅ | ✅ |
| Delete any record | ❌ | ❌ | ✅ |

## Design System

The UI uses a deep charcoal canvas with emerald-teal brand colors (not lime, not bootstrap blue):

- **Canvas**: `#0B0F0E` base → `#111816` surface → `#161F1C` elevated
- **Brand**: `#10B981` primary, `#059669` pressed, `#047857` deep accent
- **Typography**: Inter (UI) + JetBrains Mono (asset tags, numbers)
- **Motion**: 150–200ms purposeful transitions, count-up stat animations, staggered table rows

---

Built with Next.js · PostgreSQL · Prisma · NextAuth · Tailwind CSS
