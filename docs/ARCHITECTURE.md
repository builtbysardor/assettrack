# Architecture

This document describes the project structure, data flow, and key design decisions behind AssetTrack.

---

## Project Structure

```
assettrack/
├── app/                          # Next.js App Router root
│   ├── (auth)/                   # Route group — unauthenticated shell
│   │   └── login/                # Login page
│   ├── (dashboard)/              # Route group — authenticated shell
│   │   ├── layout.tsx            # Sidebar + main content frame
│   │   ├── dashboard/            # Overview: stats cards, charts
│   │   ├── assets/               # Asset list, detail drawer, CRUD
│   │   ├── categories/           # Category management
│   │   ├── locations/            # Location management
│   │   ├── employees/            # Employee directory
│   │   ├── departments/          # Department management
│   │   ├── onboarding/           # Onboarding task management
│   │   ├── offboarding/          # Offboarding task management
│   │   ├── hr/                   # HR overview dashboard
│   │   └── audit/                # Audit log viewer
│   ├── api/                      # JSON REST API route handlers
│   │   ├── auth/[...nextauth]/   # NextAuth handler
│   │   ├── assets/               # GET, POST, PATCH, DELETE + CSV export
│   │   ├── categories/           # GET, POST, PATCH, DELETE
│   │   ├── locations/            # GET, POST, PATCH, DELETE
│   │   ├── employees/            # GET, POST, PATCH, DELETE
│   │   ├── departments/          # GET, POST, PATCH, DELETE
│   │   ├── onboarding/           # Task CRUD + status transitions
│   │   ├── offboarding/          # Task CRUD + status transitions
│   │   ├── dashboard/            # Aggregated summary stats
│   │   └── audit/                # Audit log reader
│   └── layout.tsx                # Root layout: fonts, providers, toaster
│
├── components/
│   ├── ui/                       # Design system primitives (Button, Input, …)
│   ├── layout/                   # Sidebar, TopBar
│   ├── charts/                   # Recharts wrappers (BarChart, DonutChart)
│   ├── assets/                   # AssetTable, AssetForm, AssetDetailDrawer
│   ├── employees/                # EmployeeTable, EmployeeForm
│   ├── hr/                       # HR-specific composite components
│   └── providers.tsx             # React context providers (SessionProvider, …)
│
├── lib/
│   ├── auth.ts                   # NextAuth v5 configuration
│   ├── db.ts                     # Prisma client singleton
│   ├── audit.ts                  # writeAudit() helper
│   ├── email.ts                  # Nodemailer wrapper (simulation-aware)
│   ├── ldap.ts                   # ldapjs wrapper (simulation-aware)
│   ├── onboarding.ts             # Onboarding/offboarding task orchestration
│   ├── validators.ts             # Zod schemas shared between client and server
│   └── utils.ts                  # cn(), formatCurrency(), formatDate()
│
├── prisma/
│   ├── schema.prisma             # Database schema (single source of truth)
│   └── seed.ts                   # Idempotent data seeder
│
├── tests/
│   ├── middleware.test.ts        # Middleware unit tests
│   ├── lib/                      # Unit tests for lib/* helpers
│   └── setup.ts                  # Vitest global setup
│
├── styles/
│   └── globals.css               # CSS custom properties and design tokens
│
├── middleware.ts                 # Edge middleware: rate limit + auth + RBAC
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── docker-compose.yml            # Local PostgreSQL service
```

---

## Data Flow

```
Browser (React Client Components)
  │
  │  HTTP requests (fetch, forms)
  ▼
Next.js Edge Middleware  (middleware.ts)
  ├── [1] Rate limiter
  │     60 requests / 60 s per IP
  │     Applied to all /api/* except /api/health
  │     Returns 429 + Retry-After header when exceeded
  │
  ├── [2] Authentication gate
  │     Reads JWT from session cookie via NextAuth
  │     Unauthenticated page requests → redirect to /login
  │     Unauthenticated API requests  → 401 JSON response
  │
  └── [3] RBAC enforcement
        VIEWER role → 403 / redirect on HR routes
        (/employees, /onboarding, /offboarding, /departments, /hr)
  │
  ▼
App Router
  ├── Server Components  — fetch data directly via Prisma, render HTML
  │
  └── API Route Handlers  (app/api/*)
        ├── Re-validate session (getServerSession)
        ├── Parse + validate request body with Zod
        ├── Execute Prisma queries
        ├── Write audit log via writeAudit()
        └── Return JSON response
  │
  ▼
Prisma Client  (lib/db.ts — singleton)
  │
  ▼
PostgreSQL
```

### Side-effect services

Mutations that trigger side effects follow this pattern:

```
API Route Handler
  ├── Prisma (persist data)
  ├── lib/ldap.ts   — create/revoke LDAP account (real or simulated)
  └── lib/email.ts  — send welcome/offboarding email (real or simulated)
```

Both `ldap.ts` and `email.ts` check their respective `LDAP_ENABLED` / `EMAIL_ENABLED` environment flags. When disabled, operations are logged to stdout — no external calls are made. This keeps the development loop self-contained.

---

## Data Model Summary

| Model | Purpose |
|---|---|
| `User` | Application users (authentication, audit attribution) |
| `Asset` | Physical/software asset records |
| `Category` | Asset classification with icon and colour |
| `Location` | Physical location (building / floor / room) |
| `Employee` | Staff records with LDAP and lifecycle fields |
| `Department` | Organisational units |
| `OnboardingTask` | Per-employee onboarding checklist items |
| `OffboardingTask` | Per-employee offboarding checklist items |
| `AuditLog` | Immutable change history (entity, action, diff, actor) |

Assets and employees are linked via the `assignedToEmployeeId` foreign key on `Asset`, enabling bidirectional queries: all assets assigned to an employee, and which employee holds a given asset.

---

## Key Design Decisions

### App Router and Server Components

Pages that are primarily read-heavy (asset list, employee directory, audit log) are implemented as Server Components. Data is fetched directly via the Prisma singleton without an intermediate API call. This eliminates a client-server round-trip and removes the need to expose large list endpoints publicly.

Interactive panels (forms, drawers, modals) are Client Components that call the JSON API routes via `fetch`.

### Prisma for type-safe database access

All database access goes through Prisma. The schema (`prisma/schema.prisma`) is the single source of truth for the data model. Generated TypeScript types flow through to API handlers and Server Components, making it impossible to return an undeclared field or mistype a query parameter.

### JWT sessions (no database session table)

NextAuth v5 is configured for JWT-mode sessions. The signed JWT is stored in an HTTP-only cookie. There is no `Session` table in the schema. This keeps the database schema simpler and avoids session-cleanup jobs. The trade-off is that sessions cannot be force-invalidated server-side (short token expiry mitigates this).

### LDAP simulation mode

The LDAP integration (`lib/ldap.ts`) wraps all directory operations behind an `LDAP_ENABLED` flag. When `false`, every operation returns a simulated success and logs what it would have done. This means the full onboarding/offboarding workflow can be exercised — including task status transitions — without an LDAP server, which is important for open-source users and CI pipelines.

### Rate limiting in middleware

The in-memory rate limiter in `middleware.ts` runs at the Edge before any authentication or business logic. This limits the blast radius of unauthenticated brute-force or enumeration attacks. The map is process-local; for multi-instance deployments, replace it with a Redis-backed counter (e.g. Upstash `@upstash/ratelimit`).

### Audit log design

`writeAudit()` in `lib/audit.ts` records every mutating operation with the entity name, entity ID, action string, a JSON diff of changed fields, and the acting user ID. The `AuditLog` table is append-only by convention (no update or delete routes are exposed). Indexes on `(entity, entityId)`, `userId`, and `createdAt` keep the audit viewer fast even at large row counts.
