# TASK: Seed all projects + build Executor & Digest API

## Priority: HIGH — blocks the entire automation pipeline

## Part 1: Run updated seed script

The seed script at `scripts/seed.ts` has been updated to include all 12 projects (was 7). It now also upserts `deploy_url` and `sort_order`.

Run it:
```bash
npx tsx scripts/seed.ts
```

Verify all 12 projects exist:
```sql
SELECT name, display_name, deploy_url FROM vybepm_projects ORDER BY sort_order;
```

Expected: ytcombinator, VybePM, Vybe, GitMCP, KitchenInventory, voiceq-api, RubberJoints-iOS, 1000Problems, Animation, AnimationStudio, popiPlayAssets, prompts.

## Part 2: Build Executor API (Phase 4 from SPEC.md)

These endpoints let Claude Code autonomously pick up and complete tasks.

### GET /api/executor/next

Returns the next pending task assigned to the calling executor.

**Auth:** `X-API-Key` header (same as all API calls)
**Executor identity:** `X-Executor` header — value must be `cowork` or `claude-code`

**Query params:**
- `project` (optional) — filter by project slug. If omitted, returns highest priority task across all projects.

**Logic:**
```sql
SELECT t.*, p.name as project_slug, p.display_name as project_name
FROM vybepm_tasks t
JOIN vybepm_projects p ON t.project_id = p.id
WHERE t.status = 'pending'
  AND t.assignee = $1  -- from X-Executor header
  AND ($2::text IS NULL OR p.name = $2)  -- optional project filter
ORDER BY t.priority ASC, t.sort_order ASC, t.created_at ASC
LIMIT 1
```

**Response:** `200 { task }` or `204` (no content) if no pending tasks.

### PATCH /api/executor/tasks/[id]/pickup

Atomically set a task to `in_progress`. Uses `SELECT FOR UPDATE` to prevent race conditions.

**Auth:** `X-API-Key` + `X-Executor`

**Logic:**
```sql
BEGIN;
SELECT * FROM vybepm_tasks WHERE id = $1 AND status = 'pending' FOR UPDATE;
-- If no row or status != pending → 409 Conflict
UPDATE vybepm_tasks 
SET status = 'in_progress', started_at = NOW(), updated_at = NOW()
WHERE id = $1 AND status = 'pending'
RETURNING *;
COMMIT;
```

**Response:** `200 { task }` or `409 { error: "Task already picked up" }`

### PATCH /api/executor/tasks/[id]/complete

Mark a task as `review` (ready for Angel to check).

**Auth:** `X-API-Key` + `X-Executor`

**Body:**
```json
{
  "notes": "Implemented the feature, added 3 tests, all passing",
  "attachment_ids": ["drive_file_id_1"]  // optional
}
```

**Logic:**
1. Verify task exists and is `in_progress`
2. Update status to `review`, set `completed_at = NOW()`
3. Store notes in description (append, don't overwrite)
4. If attachment_ids provided, link them to the task

**Response:** `200 { task }`

### POST /api/executor/tasks

Create a task programmatically (for Cowork to create tasks without the web UI).

**Auth:** `X-API-Key` + `X-Executor`

**Body:**
```json
{
  "project": "ytcombinator",
  "title": "Fix CURRENT_DATE UTC bug in analytics",
  "description": "The analytics dashboard shows -- for all metrics...",
  "task_type": "dev",
  "priority": 1,
  "assignee": "claude-code"
}
```

**Logic:** Look up project by slug, create task. Same validation as POST /api/projects/[slug]/tasks.

**Response:** `201 { task }`

## Part 3: Build Digest API

### GET /api/digest

Returns a summary of all task activity since a given date, grouped by project.

**Auth:** `X-API-Key`

**Query params:**
- `since` (required) — ISO date string (e.g., `2026-04-05`)

**Logic:**
```sql
SELECT 
  p.name as project_slug,
  p.display_name as project_name,
  t.id, t.title, t.status, t.assignee, t.task_type, t.priority,
  t.updated_at, t.started_at, t.completed_at
FROM vybepm_tasks t
JOIN vybepm_projects p ON t.project_id = p.id
WHERE t.updated_at >= $1::timestamptz
ORDER BY p.sort_order, t.updated_at DESC
```

**Response:**
```json
{
  "since": "2026-04-05T00:00:00Z",
  "projects": [
    {
      "slug": "ytcombinator",
      "name": "YTCombinator",
      "tasks": [
        { "id": 1, "title": "Fix UTC bug", "status": "deployed", "assignee": "claude-code", ... }
      ]
    }
  ],
  "summary": {
    "total_updated": 12,
    "completed": 3,
    "in_progress": 5,
    "new": 4
  }
}
```

## Files to Create

| File | Description |
|------|-------------|
| `src/app/api/executor/next/route.ts` | GET next pending task |
| `src/app/api/executor/tasks/[id]/pickup/route.ts` | PATCH atomic pickup |
| `src/app/api/executor/tasks/[id]/complete/route.ts` | PATCH complete with notes |
| `src/app/api/executor/tasks/route.ts` | POST create task programmatically |
| `src/app/api/digest/route.ts` | GET task digest since date |

## Validation

- `X-Executor` must be `cowork` or `claude-code` — reject others with 400
- `X-API-Key` must match env var — reject with 401
- Task pickup must be atomic — no two executors can pick up the same task
- Status transitions must follow the state machine
- All SQL must use parameterized queries

## Testing

After building, verify:
```bash
# Seed
npx tsx scripts/seed.ts

# Create a test task
curl -X POST https://vybepm-v2.vercel.app/api/executor/tasks \
  -H "X-API-Key: $VYBEPM_API_KEY" \
  -H "X-Executor: claude-code" \
  -H "Content-Type: application/json" \
  -d '{"project":"GitMCP","title":"Test task","task_type":"dev","priority":2,"assignee":"claude-code"}'

# Get next task
curl https://vybepm-v2.vercel.app/api/executor/next \
  -H "X-API-Key: $VYBEPM_API_KEY" \
  -H "X-Executor: claude-code"

# Pick up
curl -X PATCH https://vybepm-v2.vercel.app/api/executor/tasks/1/pickup \
  -H "X-API-Key: $VYBEPM_API_KEY" \
  -H "X-Executor: claude-code"

# Complete
curl -X PATCH https://vybepm-v2.vercel.app/api/executor/tasks/1/complete \
  -H "X-API-Key: $VYBEPM_API_KEY" \
  -H "X-Executor: claude-code" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Done — implemented and tested"}'

# Digest
curl "https://vybepm-v2.vercel.app/api/digest?since=2026-04-05" \
  -H "X-API-Key: $VYBEPM_API_KEY"
```

## Commit message

```
Add Executor API and Digest API (Phase 4)

Enables Claude Code and Cowork to programmatically pick up, execute, and
complete tasks. Atomic task pickup prevents race conditions. Digest API
powers daily portfolio reports.

- GET /api/executor/next — next pending task for executor
- PATCH /api/executor/tasks/[id]/pickup — atomic lock + status transition
- PATCH /api/executor/tasks/[id]/complete — mark review with notes
- POST /api/executor/tasks — create tasks programmatically
- GET /api/digest?since= — task activity grouped by project
- Re-seeded all 12 projects
```
