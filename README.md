# RescueSync

An offline-first disaster response and personnel accountability application, built for the Sunway Tech Club Kiro hackathon.
Phase 1 provides a working commander workspace and a mobile responder flow with durable local check-ins.

## Run locally

Use Bun 1.4.4 or a compatible newer version, with Node.js 22 or newer available for Next.js tooling.

```sh
bun install --frozen-lockfile
bun run dev
```

Open [localhost:3000](http://localhost:3000) and choose a demo identity.
No credentials or environment variables are required to explore Phase 1.
The development and build scripts use Next.js's supported Webpack bundler because Turbopack's worker port is restricted in the development sandbox used for this scaffold.
TypeScript is pinned to the stable 6.x line because the current Next.js ESLint toolchain does not support TypeScript 7.

### Guided service setup

Run the interactive [service setup wizard](scripts/setup-rescuesync.sh) in your own terminal when you are ready to create cloud projects:

```sh
bash scripts/setup-rescuesync.sh
```

The six stages cover local checks, a Neon project and development branch, local database connections, optional Better Auth preparation, an optional Vercel project, and Production environment configuration.
The first stage lists the scope and asks you to confirm it before any setup action.
Each optional stage can be deferred, and existing saved values can be kept on reruns.
Use the same project and branch on reruns to avoid duplicate cloud resources.

The wizard opens dashboards, describes the current documented navigation, hides credential entry, validates URL shapes, and saves env files with owner-only permissions.
It does not print secret values, source env files as shell scripts, install dependencies, push code, run migrations, or call provisioning and deployment APIs.
You perform account sign-in, project creation, Vercel variable entry, and deployment confirmation in your own browser.
The application must be committed and pushed before the Vercel import stage; the current local scaffold is not automatically published.

| Stage                 | Source and output                                                                              | Destination                                                   |
| --------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 1. Confirm setup      | Prerequisites and approved scope; no captured secrets                                          | No env changes                                                |
| 2. Neon project       | Neon Console project and `development` branch                                                  | Cloud resources created by you                                |
| 3. Local database     | Connect dialog with pooling enabled, then disabled: `DATABASE_URL` and `DATABASE_URL_UNPOOLED` | `.env.local`, hidden entry                                    |
| 4. Optional auth      | Locally generated `BETTER_AUTH_SECRET` and local `BETTER_AUTH_URL`                             | `.env.local`; no hosted auth project                          |
| 5. Optional hosting   | Vercel Git import and project/app URLs                                                         | Vercel project; URLs used for this run only                   |
| 6. Hosted environment | Separate Production Neon URL, optional separate auth secret, and deployed auth origin          | `.env.vercel.local`, then manually saved to Vercel Production |

`.env.vercel.local` is an ignored preparation file that Next.js does not automatically load.
Keep it separate from `.env.local` so local development uses development credentials.
The wizard checks that Production and development use different Neon endpoints and that auth secrets differ.
It never silently rotates an existing auth secret.
In Vercel, store database credentials and auth secrets as Secret values and the auth origin as a Config value.
For Preview, use separate non-production credentials; the wizard does not wire preview authentication or branch-per-preview automation.
No GitHub Actions secrets, Neon API token, or Vercel API token is required for this dashboard workflow.
Better Auth preparation does not install or enable Better Auth, and configuring these services does not turn off Demo Mode.

The wizard was syntax-checked and its helper behavior was verified in isolation; it was not run through account setup or deployment on your behalf.
It uses the wizard skill's shared library unchanged above its `STAGES` marker.

For a production build and the service worker:

```sh
bun run build
bun run start
```

The service worker registers only in production to avoid stale caches during development.
Use HTTPS when deployed; localhost also supports service workers and geolocation.

## What works

- Entry screen and explicit demo identities: Nadia Rahman, incident commander, and Amir Hassan, field responder.
- Commander overview, incident list and details, priority alerts, sample check-in history, and personnel accountability.
- Searchable personnel directory with team and safety filters, deep links, expandable reports, and an empty state.
- Mobile responder home, read-only sample tasks, and safety check-in with an optional message and explicitly requested location or last-known coordinates.
- Light, dark, and system themes, keyboard focus styles, semantic status labels, accessible form controls, and responsive navigation.
- IndexedDB persistence, a reactive pending counter, connectivity indicators, manual retry, and foreground synchronization attempts.
- Versioned sync validation, per-operation acknowledgement handling, exponential retry delay, interrupted-operation recovery, and cross-tab queue claims.
- PWA manifest, installation icons, static asset caching, and a lightweight offline check-in shell.

All organizational records, incident details, task assignments, and displayed server confirmations are clearly labeled sample data.
The sample snapshot is 15 November 2026 at 08:40 MYT, with ten people across three teams.
Unknown means missing or outdated confirmation and is never an explicit check-in option.
Need assistance combines Needs Help and Unable to Continue while preserving the individual statuses in personnel records.

## Demo and authorization boundaries

Phase 1 always runs in Demo Mode, including when `DATABASE_URL` is configured.
Demo identities are presentation data, not authenticated sessions.
There are no custom passwords, credential endpoints, or unauthenticated database mutations.
The commander dashboard does not incorporate locally queued field reports as if they had reached command.

`POST /api/sync` validates each bounded request, then returns `unavailable` for every operation.
It never acknowledges remote persistence or writes to Neon in this phase.
The client retains each report until it receives a valid acknowledgement matching its stable operation ID and containing a server receipt timestamp.
The database primary key reserves that same ID for eventual idempotent server inserts.
Full end-to-end server deduplication requires the authenticated database service in Phase 2.

Before enabling real data, integrate Better Auth and resolve the actor from the server session.
Check organization membership, responder identity, incident organization, and active assignment on every read and mutation.
Never trust organization IDs, user IDs, or incident IDs supplied by a browser as authorization evidence.
The existing `users` table uses text identifiers and has no credentials, so Better Auth can map to or extend it alongside its own session and account tables.
No unused authentication package is installed.

## Architecture

```text
public/
  sw.js                         Static-only cache and offline navigation fallback
  offline.{html,css,js}          Standalone demo check-in shell
  icon-*.png                    Install icons
src/
  app/
    (auth)/login/               Demo identity chooser
    (dashboard)/               Shared commander layout
      dashboard/
      incidents/[incidentId]/
      personnel/
      settings/
    (responder)/responder/      Mobile layout, home, check-in, tasks
    api/sync/                   Stable versioned HTTP boundary
    layout.tsx                  Theme and foreground queue providers
    manifest.ts                 PWA metadata
    loading.tsx                 Shared loading state
    error.tsx                   Recoverable error state
    not-found.tsx               Missing-route fallback
  components/
    ui/                         shadcn/ui primitives
    layout/                     Navigation and application headers
    dashboard/                  Accountability, alerts, metrics, activity
    incidents/                  Illustrative response-area map
    shared/                     Branding, badges, theme, connection state
  features/
    incidents/demo-data.ts      Consistent, typed sample records
    personnel/                  Directory filtering and report disclosure
    check-ins/                  Local queue, form, persistence feedback
    sync/                       Foreground coordinator and server service
  db/
    schema/                     PostgreSQL tables, enums, constraints, indexes
    migrations/                 Drizzle-generated SQL and metadata
    index.ts                    Lazy server-only Neon connection
  lib/
    offline/                    Versioned Dexie store
    validations/                Zod payload and acknowledgement schemas
    utils.ts                    Class composition and explicit MYT formatting
  types/domain.ts               Shared domain vocabulary
tests/                          Validation and IndexedDB queue tests
```

Pages and layouts are Server Components by default.
Client boundaries cover browser storage, connectivity, the interactive directory, forms, themes, and navigation highlighting.
Validation and queue behavior live outside presentation components.
Database access and the sync application service are marked `server-only`.
The sync service is the future shared entry point for an authenticated Server Action and the HTTP route; there is no Server Action before a real authenticated mutation exists.

The design uses Public Sans, a restrained slate palette, a navy command sidebar, and semantic safety colors.
The map is an original illustrative SVG schematic, with no live geospatial data or third-party map dependency.
UI primitives were generated with the official shadcn CLI and use the shared local class utility.

## Offline data and delivery

The Dexie database is named `rescuesync-demo-v1` and contains one versioned `outbox` table.
Each operation includes a client UUID, operation type, payload version, organization and incident identifiers, client timestamp, status, attempts, next retry time, last attempt time, error, and optional server receipt timestamp.
The namespace is explicitly demo-only to prevent later production sessions from automatically uploading demo reports.

The lifecycle is:

```text
Saved locally -> Synchronizing -> Confirmed by server
                       |
                       +-> Waiting to sync -> retry
                       +-> Failed - action required
```

The pending counter includes every operation that is not confirmed, including failed reports requiring user action.
The foreground app attempts delivery on connection restoration, window focus, a periodic check while open, submission, and manual retry.
Network failures, malformed or missing acknowledgements, HTTP failures, and demo unavailability all retain the report with retry metadata.
Rejected operations stop automatic retry until the user explicitly retries.
An IndexedDB transaction claims operations across tabs, with a 45-second lease for interrupted requests and a 15-second network timeout.
Retries keep the original UUID and client timestamp.

The service worker caches the generic offline shell and same-origin static assets only.
It does not cache incident HTML, React Server Component responses, API responses, or personnel records in Cache Storage.
The shell contains a public demo identity and sample incident identifiers only.
On a full offline navigation it provides a small independent check-in form that writes to the same IndexedDB store using the native IndexedDB API.
Return to responder home after reconnecting to review shell submissions and run foreground retries.
The fallback intentionally offers fewer controls than the full form and does not run a second synchronization engine.

There is no guaranteed background delivery, Background Sync dependency, conflict-resolution engine, or guarantee against browser storage eviction.
Clearing site data deletes local reports.
Keep an independent emergency contact channel available.
PWA install prompts vary by browser.

### Manually verify offline behavior

1. Run a production build and start the application.
2. Visit `/responder` online and wait for the service worker to activate in browser developer tools.
3. Open `/responder/check-in`, disable the network, and save a report.
4. Confirm that the UI says Saved locally or Waiting to sync, never Confirmed by server.
5. Reload while offline and submit through the lightweight fallback form.
6. Restore connectivity and open `/responder`; both reports should appear with a matching pending count.
7. Retry synchronization and confirm that Demo Mode keeps the reports pending.

## Voice dictation and AI analysis

The check-in message field has an optional Dictate message button that uses the browser's speech recognition.
It appears only in supporting browsers such as Chrome, Edge, and Safari, needs a connection, and only fills the editable field.
Saving still goes through the normal local queue, and typing works offline as before.

The commander dashboard's Generate AI Analysis button calls `POST /api/ai/analyze`, which accepts only an incident ID.
The server selects the incident's reports, sends opaque report IDs, status, team, message, and time to Gemini without names or emails, and validates the JSON reply with Zod.
One request returns a summary, key observations, uncertainties, and advisory priorities, each citing report IDs; replies citing unknown report IDs are rejected.
Phase 1 analyzes the fictional sample reports in `demo-data.ts`, and the panel labels results as AI analysis of demo data.
Recommendations are advisory and never dispatch responders or change any record.
The route accepts same-origin browser requests only, limits each visitor to 5 requests a minute and the app to 20 model calls an hour per server instance, and reuses identical results for 5 minutes.
Without `GEMINI_API_KEY`, or when Gemini fails, the panel shows an error and the rest of the application works normally.
To analyze real reports later, add a database-backed `ReportSource` in `src/features/ai/reports.ts` and select it in `src/features/ai/service.ts` after authorization exists.

## Database and environment

`.env.example` documents the database variables and optional future authentication values:

| Variable                | Required                                 | Purpose                                                                                            |
| ----------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`          | No for demo; yes for future remote reads | Private pooled Neon connection for the application.                                                |
| `DATABASE_URL_UNPOOLED` | Recommended for migration tooling        | Direct Neon connection to the same branch; Drizzle Kit falls back to `DATABASE_URL` when absent.   |
| `BETTER_AUTH_SECRET`    | Optional Phase 2 preparation             | High-entropy server secret, generated locally by the wizard if requested; not consumed by Phase 1. |
| `BETTER_AUTH_URL`       | Optional Phase 2 preparation             | Application origin, such as `http://localhost:3000`; not consumed by Phase 1.                      |
| `GEMINI_API_KEY`        | Optional; enables AI analysis            | Server-only Google AI Studio key for the dashboard's Generate AI Analysis button.                  |
| `GEMINI_MODEL`          | Optional                                 | Overrides the default stable model, `gemini-3.8-flash`.                                            |

Copy `.env.example` to `.env.local` if you need database tooling.
Do not expose the connection string through a `NEXT_PUBLIC_` variable or commit credentials.

See the [operations runbook](docs/operations.md) for cloud targets, environment mapping, and the development-to-production migration and deployment procedure.

Run `bun run db:check` to verify the configured application connection, all table columns, the direct migration connection when configured, migration hashes, and validated constraints without reading personnel records or printing credentials.
It uses the same `getDb()` function as the application and does not change database state.
Existing process environment variables take precedence over `.env.local`, so deployment tooling can run the check against the intended branch without replacing local development credentials.

The seven foundational tables cover organizations, users, organization memberships, incidents, incident assignments, personnel check-ins, and tasks.
Foreign keys, unique membership and assignment indexes, incident-organization consistency constraints, coordinate bounds, and message-length constraints protect the schema.
The check-in table also requires an assignment and organization membership for the reporting user.
Migration SQL and snapshots were generated by Drizzle Kit and should not be edited by hand.

```sh
# Generate a migration after changing the schema
bun run db:generate

# Apply reviewed migrations to your configured Neon development branch
bun run db:migrate

# Verify application connectivity and the applied migration history
bun run db:check
```

Connecting Neon does not seed sample records or switch the UI out of Demo Mode.
Seed and remote repository wiring should be introduced together with real authorization in Phase 2.
The original, unapplied initial migration was regenerated through Drizzle after replacing three referenced composite unique indexes with table-level unique constraints.
The corrected migration was tested on an isolated Neon branch before application to development and production.
Generated migration files and snapshots must continue to be managed through Drizzle tooling.

## Development checks

```sh
bun run lint
bun run typecheck
bun run test
bun run build
bun run format:check
```

`bun run format` formats application code and documentation, excluding generated migrations and dependency artifacts.
Tests use Bun's test runner and a preloaded `fake-indexeddb` implementation.
They cover validation, coordinate pairs, message length, stable operation IDs, close/reopen persistence, missing and partial acknowledgements, network retry metadata, expired sync leases, concurrent queue claims, and permanent rejection handling.
They do not pretend that the demo service provides remote durability.

Phase 1 was verified with passing lint, strict type checking, all 12 tests, formatting checks, and a production build.
Browser checks covered light and dark desktop views, narrow mobile layouts, personnel filtering and empty states, local submission, a full reload with the server stopped, native fallback submission, and queue recovery after reconnecting.
The entry screen, dashboard, personnel directory, responder home, main check-in form, and offline shell reported no WCAG A/AA violations in the automated checks.
SVG map labels require manual contrast review, and automated audits are not a substitute for assistive-technology testing.
HTTP checks verified malformed JSON and unsupported-version rejection, the 64 KiB request limit, and explicit demo `unavailable` acknowledgements.

## Vercel

The Phase 1 demo is deployed at [rescuesync.vercel.app](https://rescuesync.vercel.app).
The Vercel project is linked to this GitHub repository.

Deploy this repository as a single Next.js project with the repository root (`./`) as the Root Directory.
The checked-in `vercel.json` selects Next.js, installs locked dependencies with `bun install --frozen-lockfile`, and builds with `bun run build`.
Keep the Output Directory at the Next.js default.
No additional backend, workspace, custom server, or static export is required.
The Phase 1 demonstration needs no environment variables on Vercel.
Local environment files and local agent metadata are excluded from CLI uploads by `.vercelignore`.

### Deploy from GitHub

1. Commit and push the application and deployment configuration to [SariKefel/kiro-hackathon](https://github.com/SariKefel/kiro-hackathon).
2. Open [Vercel's new project page](https://vercel.com/new), import that repository, and select the intended personal account or team.
3. Confirm the Next.js preset and repository root, keep the checked-in install and build commands, and leave environment variables empty for the demo.
4. Select Deploy, then open the Production URL when the deployment reports Ready.

The Git integration deploys subsequent pushes to the production branch and creates preview deployments for other branches and pull requests.

### Deploy from the CLI

With the Vercel CLI installed, run these commands from the repository root:

```sh
vercel login
vercel link
vercel deploy --prod
```

During linking, select the intended account or team and create a new Next.js project or select an existing project for this application.
The CLI uploads local source and builds it on Vercel; a local `.next` directory is not required.
When the CLI offers to connect the detected GitHub repository, accept it to enable automatic Git deployments.
Confirm the repository connection in the project's Git settings after linking.

### Verify the deployment

Open `/login`, `/dashboard`, `/personnel`, `/responder`, and `/responder/check-in` over the deployed HTTPS origin.
Check that `/manifest.webmanifest` and `/sw.js` load and that the service worker activates after visiting the responder flow.
Save a demo check-in and confirm that it remains Saved locally or Waiting to sync.
Demo Mode deliberately does not confirm server delivery, and deploying does not enable authentication or remote database persistence.

Add a private pooled `DATABASE_URL` only when preparing the database integration, and run reviewed migrations with the direct connection against the intended branch separately from the application build.
Use separate database credentials for Production and Preview when that integration is implemented.

## Phase 2

1. Integrate Better Auth, organization membership authorization, session-bound identities, and account lifecycle handling.
2. Implement an authenticated, transactional check-in service with payload-aware idempotency, assignment validation, and per-operation acknowledgements from Neon.
3. Replace demo reads with organization-scoped repositories, define freshness and clock-skew rules, and expose confirmed reports to commanders.
4. Add authorized task updates, follow-up ownership, and an auditable activity history.
5. Add browser-based regression coverage for offline navigation, multi-tab behavior, storage failures, accessibility, and supported mobile browsers.
6. Define encrypted local-data retention, logout behavior, persistent-storage requests, schema upgrades, and deployment cache-update policies before storing real personnel data offline.

## Reference documentation

The foundation follows the official [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps), [Drizzle PostgreSQL schema documentation](https://orm.drizzle.team/docs/sql-schema-declaration), and [Dexie documentation](https://dexie.org/docs/).
The setup wizard follows the official [Neon project](https://neon.com/docs/manage/projects), [branch](https://neon.com/docs/manage/branches), and [Drizzle connection](https://neon.com/docs/guides/drizzle) guides, [Better Auth installation](https://better-auth.com/docs/installation), and Vercel's [Git deployment](https://vercel.com/docs/git) and [Config and Secret variable](https://vercel.com/docs/environment-variables/sensitive-environment-variables) guides.
