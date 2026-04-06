# TASK: Build Executor API (Phase 4) — PRIORITY 1

## Why this is urgent

The entire automation pipeline is blocked on this. VybeGo skill, scheduled reviewer, daily report task digest, and voice task creation all depend on these endpoints. Everything else flows once this ships.

## What to build

Implement the 4 executor endpoints from CLAUDE.md Step 6:

### 1. GET /api/executor/next
Already built and working. No changes needed.

### 2. PATCH /api/executor/tasks/[id]/pickup
Atomic task pickup with SELECT FOR UPDATE. Sets status to `in_progress`, records `started_at` and executor identity. Returns 409 if already claimed.

### 3. PATCH /api/executor/tasks/[id]/complete
Sets task to `review` status with notes and optional attachment IDs. Records `completed_at`.

### 4. POST /api/executor/tasks
Create a new task via API (used by Cowork to queue work for Code). Required fields: project_slug, title, task_type, assignee. Optional: description, priority.

### 5. GET /api/digest
Already built and working. No changes needed.

## Reference

Full spec with request/response shapes and curl test commands is in TASK-executor-api-and-seed.md (if it still exists) and CLAUDE.md Step 6.

## Done when

- [ ] PATCH pickup returns 200 with task data, 409 if already claimed
- [ ] PATCH complete transitions task to review with notes
- [ ] POST creates a task and returns 201
- [ ] All endpoints require X-API-Key auth
- [ ] All endpoints validate input and return 400 on bad data
