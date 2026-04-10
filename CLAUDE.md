# VybePM — Task Orchestration Hub

Central command center for the 1000Problems portfolio. Write, assign, track, and execute tasks across all projects.

## Before Implementing Any TASK

1. **Read the full TASK spec** — understand scope, acceptance criteria, and the Do Not Change section.
2. **Read BUILD.md** in this directory — it has the step-by-step implementation guide, schema DDL, API routes, and env setup.
3. **Query LightRAG** for cross-project context before touching shared patterns.
4. **Stay in scope.** Only modify files listed in the TASK spec. If something outside scope looks broken, create a VybePM task — do NOT fix it inline.
5. **Verify before committing.** Run `npm run build`, confirm zero type errors, check `git diff`.

## Architecture

- **Stack:** Next.js (App Router), TypeScript strict, Neon PostgreSQL (shared free tier, `vybepm_` prefix), Tailwind CSS, Vercel
- **Auth:** Password cookie + API key validation. No user accounts — password gate only.
- **Storage:** Google Drive via signed resumable uploads. No Vercel Blob, no local files.
- **State machine:** pending → in_progress → review → checked_in → deployed → done (defined in `src/lib/types.ts`)
- **Source of truth:** SPEC.md in this directory.

### Protected Areas (global — TASK specs may add more)

- `src/app/api/executor/` — entire executor API (pickup, complete, create, digest). Automation backbone.
- `src/lib/types.ts` — TaskStatus enum and STATUS_TRANSITIONS map. The state machine.
- `src/lib/auth.ts` — password cookie + API key validation
- `src/lib/db.ts` — Neon connection helper
- Database schema — additive changes only (new columns/tables), never drop or rename existing
- State machine transitions — if a TASK needs a new status, it must explicitly define the migration path

## Non-Negotiable Rules

- **No ORMs.** Use `sql` tagged templates with @neondatabase/serverless only.
- **No `any` types.** TypeScript strict mode. Every function, parameter, and return value typed.
- **No `exec()` or `eval()`.** Never, for any reason.
- **Validate all inputs server-side.** Every POST/PATCH checks field types, lengths, enum values. Return 400 with clear error message.
- **Enforce state machine.** Status transitions per SPEC.md. Reject invalid transitions with 400.
- **Parameterized queries only.** Never concatenate user input into SQL strings.
- **No secrets in code.** All credentials from env vars.
- **Prefix all tables with `vybepm_`** — shared Neon instance.
- **Mobile responsive.** Task grid → card layout at < 768px.

## Design Direction

- Dark theme by default, no toggle
- Color palette: dark backgrounds (#0e1117, #161b22), muted borders (#30363d), light text (#e6edf3)
- Each project gets a unique accent color (stored in DB)
- Typography: system font stack. No custom fonts.
- Dense layout — productivity tool, not marketing site.

## Git Rules

DO NOT commit or push. Build and test only. Angel reviews and handles git.

## What NOT To Do

- Do NOT create user accounts or a users table — password gate only
- Do NOT add WebSocket/real-time features — simple fetch/refetch
- Do NOT add a sidebar navigation — project grid → project view → back
- Do NOT use `dangerouslySetInnerHTML`
- Do NOT add analytics, tracking, or telemetry
- Do NOT store files in Vercel Blob or locally — all files go to Google Drive

For implementation details, see BUILD.md.
