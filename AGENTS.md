# RescueSync agent guide

## Start here

Use `package.json` and `bun.lock` for exact dependency versions and available scripts.
Use Bun for dependency installation and project commands; preserve the locked install and the configured Webpack build.
Before changing a database schema, configuring cloud credentials, or deploying to Preview or Production, read [the operations runbook](docs/operations.md).
For offline behavior, authorization boundaries, or the Phase 2 roadmap, read the corresponding sections of [README.md](README.md).

## Stack and code boundaries

RescueSync is a single Next.js App Router application with React and TypeScript, hosted on Vercel.
The UI uses Tailwind CSS, shadcn/Radix primitives, Lucide icons, Public Sans, and next-themes.
PostgreSQL is hosted on Neon, accessed through Drizzle ORM and `@neondatabase/serverless`.
Zod validates the sync boundary; Dexie persists the browser outbox in IndexedDB.
Bun runs tests with fake-indexeddb; ESLint, TypeScript, and Prettier provide static checks.

| Area                                    | Responsibility                                                       |
| --------------------------------------- | -------------------------------------------------------------------- |
| `src/app/`                              | Routes, layouts, server rendering, and the HTTP sync boundary        |
| `src/features/`                         | Check-in queue, sync coordination, personnel UI, and sample records  |
| `src/components/`                       | Shared layout, presentation, and UI primitives                       |
| `src/db/`                               | Server-only connection, schema definitions, and generated migrations |
| `src/lib/validations/` and `src/types/` | Payload validation and domain vocabulary                             |
| `public/sw.js` and `public/offline.*`   | Service worker and independent offline check-in shell                |

Keep pages and layouts as Server Components by default; use client boundaries for browser APIs and interactivity.
Keep validation, delivery logic, and database access outside presentation components.

## Product invariants

- Phase 1 always runs in Demo Mode, including with a working database connection.
- Demo identities are presentation data; `POST /api/sync` returns `unavailable` and performs no database writes.
- Keep saved reports pending until a valid acknowledgement matches the stable operation ID and includes a server receipt timestamp.
- Preserve the `rescuesync-demo-v1` IndexedDB namespace and keep demo reports isolated from future authenticated production data.
- Keep the service worker limited to static assets and the generic offline shell; incident pages, personnel records, RSC responses, and API responses stay outside Cache Storage.
- When implementing real persistence, establish session-bound identity and organization, incident, membership, and assignment authorization before enabling real reads or mutations.

## Working conventions

- Keep credentials server-side, in ignored local env files or sensitive hosting variables, and out of command arguments, logs, commits, and `NEXT_PUBLIC_` variables.
- Preserve existing user edits and report whether release changes are committed and pushed.
- Use plain dashes, put each full sentence on its own line in long Markdown, and omit agent co-author trailers from commits.
- Leave `CHANGELOG.md` and files marked auto-generated to their owning tools.
- Prefer quality, simplicity, robustness, scalability, and long-term maintainability when making technical decisions.

## Completion

For application changes, run `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build`, and `bun run format:check`.
For documentation-only changes, check formatting, relative links, and command examples without mutating cloud resources.
Database and deployment work is complete only when the runbook's checks pass for the intended environments.
Report the changed behavior, verification results, deployment URL when applicable, and remaining limitations.
