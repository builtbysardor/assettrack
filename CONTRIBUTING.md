# Contributing to AssetTrack

Thank you for your interest in contributing. This document covers how to set up your development environment, the branch and commit conventions we follow, and what we expect in a pull request.

---

## Development Environment Setup

### Requirements

- Node.js >= 20
- pnpm >= 10
- PostgreSQL 15+ (local or Neon free tier)

### Steps

```bash
# 1. Fork the repository on GitHub, then clone your fork
git clone https://github.com/<your-username>/assettrack.git
cd assettrack

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local — set DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL at minimum

# 4. Set up the database
pnpm prisma generate
pnpm prisma db push
pnpm prisma:seed

# 5. Start the dev server
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Useful dev commands

```bash
pnpm typecheck       # TypeScript — must pass with zero errors
pnpm lint            # ESLint — must pass with zero warnings on changed files
pnpm test            # Vitest test suite
pnpm test:watch      # Vitest in watch mode
pnpm prisma:studio   # Visual DB browser
```

---

## Branch Naming

Create your branch from `main`. Use one of these prefixes:

| Prefix | Use for |
|---|---|
| `feature/*` | New features or enhancements |
| `fix/*` | Bug fixes |
| `chore/*` | Dependency updates, config, tooling |
| `docs/*` | Documentation only |
| `test/*` | Adding or fixing tests |
| `refactor/*` | Code restructuring without behaviour change |

Examples:

```
feature/employee-csv-import
fix/warranty-expiry-null-crash
chore/upgrade-prisma-5.23
docs/deployment-guide
```

---

## Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

[optional body]

[optional footer: BREAKING CHANGE, closes #issue]
```

### Types

| Type | When to use |
|---|---|
| `feat` | A new feature visible to users |
| `fix` | A bug fix |
| `chore` | Build process, dependencies, tooling |
| `docs` | Documentation changes only |
| `test` | Adding or updating tests |
| `refactor` | Code change that is not a fix or feature |
| `perf` | Performance improvement |
| `style` | Formatting, whitespace — no logic change |

### Examples

```
feat(employees): add CSV import for bulk onboarding
fix(assets): correct warranty expiry sort order
chore: upgrade Prisma to 5.23.0
docs: add Vercel deployment guide
test(middleware): cover rate-limit window reset
refactor(lib/auth): extract role-check helper
```

Keep the summary line under 72 characters. Use the body to explain *why*, not *what*.

---

## Pull Request Checklist

Before opening a PR, confirm all of the following:

- [ ] `pnpm typecheck` passes with zero errors
- [ ] `pnpm lint` passes with zero warnings on changed files
- [ ] `pnpm test` passes — all existing tests green
- [ ] New behaviour is covered by tests where practical
- [ ] `.env.example` updated if new environment variables are introduced
- [ ] Prisma schema changes are accompanied by a migration or `db push` note
- [ ] No secrets, `.env.local`, or build artefacts are committed
- [ ] PR description explains what changed and why

### PR description template

```
## What
Short description of the change.

## Why
The motivation or problem being solved.

## How
Key implementation decisions, if non-obvious.

## Testing
How you verified the change works.

## Related issues
Closes #<issue-number>
```

---

## Reporting Issues

Use GitHub Issues. Please include:

- A clear, descriptive title
- Steps to reproduce
- Expected vs actual behaviour
- Environment details (Node version, OS, browser if relevant)
- Any relevant logs or screenshots

For security vulnerabilities, **do not open a public issue**. See [SECURITY.md](SECURITY.md) for responsible disclosure instructions.

---

## Code Style

- TypeScript strict mode — no `any` without justification
- Zod schemas live in `lib/validators.ts` and are shared between client and server
- API route handlers validate all input before touching Prisma
- Use the `writeAudit()` helper in `lib/audit.ts` for every mutating operation
- Tailwind classes go through the `cn()` utility from `lib/utils.ts`
