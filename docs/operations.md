# Deployment and migration runbook

Run commands from the repository root.
Use the existing Neon project and Vercel project; resolve a mismatch in the linked targets before making cloud changes.

## Targets and environment mapping

These are the established targets, verified on 15 November 2026.
Recheck their current state before writes; cloud identities and settings can change independently of this repository.

| Service                 | Target                                                     |
| ----------------------- | ---------------------------------------------------------- |
| Neon project            | `reliefos`, project ID `orange-violet-28587155`, Singapore |
| Neon development branch | `development`, ID `br-damp-forest-a117yvnf`                |
| Neon production branch  | `production`, ID `br-green-wildflower-a1yo0bqc`            |
| Vercel                  | Project `rescuesync`, scope `24090516-7580s-projects`      |
| Public application      | <https://rescuesync.vercel.app>                            |

| Application environment | Neon branch   | Connection configuration                                               |
| ----------------------- | ------------- | ---------------------------------------------------------------------- |
| Local development       | `development` | `.env.local`: pooled `DATABASE_URL` and direct `DATABASE_URL_UNPOOLED` |
| Vercel Preview          | `development` | Sensitive pooled `DATABASE_URL`                                        |
| Vercel Production       | `production`  | Sensitive pooled `DATABASE_URL`                                        |

Preview currently shares the development branch; branch-per-preview automation is not configured.
Use a separate temporary branch when testing changes that could disrupt shared development.
Keep the direct connection in migration tooling; the deployed application needs only the pooled connection.
The `BETTER_AUTH_*` variables in `.env.example` are future preparation and do not enable authentication.

## Preflight

1. Inspect `git status --short --branch`, the diff, and `git remote -v` to identify the exact source being released and preserve existing work.
2. Read `package.json`, `vercel.json`, and `drizzle.config.ts`; install dependencies with `bun install --frozen-lockfile` if needed.
3. Verify account access and project linkage with the following read-only commands.

```sh
neon branches list --project-id orange-violet-28587155
vercel whoami
vercel project inspect rescuesync --scope 24090516-7580s-projects
vercel env ls --scope 24090516-7580s-projects
```

If the directory is unlinked, use `vercel link --project rescuesync --scope 24090516-7580s-projects` and select the existing project.
If account authentication has expired, have the user complete account sign-in and then resume with these targets.
Completion: the intended source, cloud account, project, branch, and environment-variable names are identified without printing credential values.

## Run database commands against an explicit branch

The default database commands load `.env.local` through `@next/env` and therefore target development.
`drizzle.config.ts` prefers `DATABASE_URL_UNPOOLED`, with a fallback to `DATABASE_URL`; use a direct URL for migrations even though the fallback exists.
Existing process environment variables take precedence over env files.

Define this helper and its calls in the same shell invocation, since agent terminal calls may start separate shells.
It obtains credentials from the authenticated Neon CLI, keeps them inside a subshell, and leaves local env files unchanged.
Keep shell tracing disabled while credentials are loaded or used.

```sh
with_neon_branch() (
  set -eu
  set +x
  target_branch="$1"
  shift
  DATABASE_URL_UNPOOLED="$(neon connection-string "$target_branch" \
    --project-id orange-violet-28587155 \
    --database-name neondb --role-name neondb_owner)"
  DATABASE_URL="$(neon connection-string "$target_branch" \
    --project-id orange-violet-28587155 \
    --database-name neondb --role-name neondb_owner --pooled)"
  export DATABASE_URL DATABASE_URL_UNPOOLED
  "$@"
)
```

`bun run db:check` uses the application's `getDb()` connection, selects table columns without reading records, compares every migration hash and timestamp with the repository, and checks for unvalidated constraints.
A failure must be resolved before releasing; this check requires the target to have every repository migration applied.
It does not prove record-level authorization, real check-in delivery, or that no unrelated schema drift exists.

## Schema changes

1. Change `src/db/schema/index.ts`, then run `bun run db:generate --name <descriptive_name>`.
2. Review every generated SQL statement and its journal/snapshot changes for the intended schema, locks, data effects, and compatibility with the currently deployed app.
3. Test the complete migration sequence on a temporary child of production using the helper above and the following commands.

```sh
migration_branch="migration-check-$(date -u +%Y%m%dT%H%M%SZ)"
migration_expiry="$(node -e 'console.log(new Date(Date.now() + 86400000).toISOString())')"
neon branches create --project-id orange-violet-28587155 \
  --parent production --name "$migration_branch" \
  --expires-at "$migration_expiry" --cu 0.25 --no-secrets
with_neon_branch "$migration_branch" bun run db:migrate
with_neon_branch "$migration_branch" bun run db:check
```

4. Repeat the migration and verification on that test branch; completion means the second migration run is a no-op and migration hashes still match.
5. Exercise changed constraints or data transformations on the test branch, then apply the reviewed migration to development with `bun run db:migrate` and `bun run db:check` using verified development credentials.
6. Run the application checks listed in `AGENTS.md` and verify the changed flow against development or a Preview deployment.
7. Delete only the temporary branch created for this test with `neon branches delete "$migration_branch" --project-id orange-violet-28587155`; the expiry is a fallback for interrupted cleanup.

Completion: the migration works from the current production schema, repeat execution is safe, development checks pass, and the application and migration artifacts are ready together.

### Migration guardrails

The initial migration is already applied to development and production; treat it and all later applied migrations as immutable.
Use new generated migrations for subsequent changes and keep schema code, SQL, snapshots, and journal entries in the same release.
Use `db:generate` and `db:migrate` for this repository's migration history; avoid `drizzle-kit push` and ad hoc production DDL.
The three composite keys referenced by foreign keys use table-level `unique(...)` constraints so they exist when the foreign keys are created.
Preserve that ordering when changing these relationships; separately generated unique indexes previously caused the initial migration to fail.
Promote reviewed migration files and application code, leaving development rows and demo records in their original environment.
Use additive, backward-compatible schema changes before an app rollout, and remove old columns or constraints in a later release after older deployments stop depending on them.

## Production release

1. Complete the schema-change sequence above when the release includes database changes, and identify the exact application revision and migrations to release.
2. If migrations are pending, run the following in the same shell as the helper definition before promoting application code.

```sh
with_neon_branch production bun run db:migrate
with_neon_branch production bun run db:check
```

3. Verify the production schema supports both the currently deployed app and the new revision before triggering its deployment.
4. Keep the release's schema code and generated artifacts together in Git; commit and push when authorized, accounting for any automatic production deployment triggered by the push.
5. Use the existing Git integration for the intended production branch, or deploy the verified local source explicitly with the CLI.

```sh
vercel deploy --prod --scope 24090516-7580s-projects --logs
```

A CLI deployment uploads the local working tree, including eligible uncommitted files, so compare it with the intended release revision first.
For an explicit Preview deployment, use `vercel deploy --scope 24090516-7580s-projects --logs` without `--prod`.
Check the project's configured production Git branch before relying on a push to trigger a release.
The checked-in Vercel build command builds the app; migrations and `db:check` are separate operations.
Preserve the framework's default output directory and the checked-in install/build settings.

Completion: Vercel reports Ready for the intended revision, the expected domain points to it, and the verification below passes.

## Credential changes and cloud connectivity

Inspect existing environment names first and preserve credentials outside the requested target.
Use a pooled production connection for Vercel Production and the pooled development connection for Preview.
Pass a missing value to `vercel env add DATABASE_URL <production|preview> --sensitive --scope 24090516-7580s-projects` through stdin from a process holding the appropriate branch credentials.
Keep secret values out of shell arguments and tool output; replace existing values only when credential replacement is part of the task.
Redeploy the affected environment after saving a value, since existing deployments retain their environment snapshots.

When configuring or changing Neon credentials on Vercel, verify access from Vercel itself rather than relying only on a local connection check.
For a one-time verification, temporarily change the uploaded `vercel.json` build command to `bun run db:check && bun run build`, deploy to the intended environment, and require successful database-check output in the hosted build logs.
Restore the normal local build command after that deployment completes, and keep the temporary override out of the permanent release configuration.
Use the actual uploaded `vercel.json`; an alternate `--local-config` file did not override its build command in the previously verified CLI workflow.
The hosted check can use `DATABASE_URL` alone; its migration-connection fallback message is expected when no direct URL is configured on Vercel.

Completion: the correct environment has a sensitive pooled URL and a hosted database check passes without exposing credentials.

## Verify and recover

- Open `/login`, `/dashboard`, `/personnel`, `/responder`, and `/responder/check-in` on the deployed HTTPS origin and check for browser errors.
- Verify `/manifest.webmanifest` and `/sw.js` load, and confirm the production service worker activates.
- Save a demo check-in and require local persistence followed by Waiting to sync; Demo Mode keeps remote delivery unavailable even with Neon connected.
- For offline changes, follow README's manual offline verification, including an offline reload, fallback-shell submission, and queue recovery after reconnection.
- Record the deployed revision or local source state, Vercel URL, migration results for each affected Neon branch, and remaining limitations.

If a migration fails, inspect the target's actual schema and migration journal before retrying; preserve applied history and repair it with a reviewed forward migration.
For a failed app rollout, return traffic to the previous compatible deployment through Vercel's deployment controls and diagnose the new revision.
Database restore, branch reset, and destructive rollback require a deliberate recovery decision based on affected data and compatibility; they are separate from rolling back app traffic.
