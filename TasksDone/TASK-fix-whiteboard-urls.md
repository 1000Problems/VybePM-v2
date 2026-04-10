# TASK: Fix All Whiteboard URLs

> Update whiteboard_url for all projects to point to `http://localhost:5555/{slug}`, and fix the Whiteboard project's own URL.

## Context

The initial migration set whiteboard_url values using the project slug, which is correct for most projects. But the Whiteboard project itself was set to `http://localhost:5555/_shared` — it should be `http://localhost:5555`. Also need to verify all active projects have the correct URL format.

## Requirements

1. Create a single migration that ensures every active project has the correct whiteboard_url:

```sql
-- Fix all active projects to use consistent format
UPDATE vybepm_projects
SET whiteboard_url = 'http://localhost:5555/' || name
WHERE is_active = true AND name != 'Whiteboard';

-- Fix Whiteboard project itself
UPDATE vybepm_projects
SET whiteboard_url = 'http://localhost:5555'
WHERE name = 'Whiteboard';
```

## Implementation Notes

- Migration file: next sequential number in `migrations/` directory.
- Single file, two UPDATE statements. No schema changes.
- This is idempotent — safe to run multiple times.

## Do Not Change

- Everything except the new migration file.

## Acceptance Criteria

- [ ] Migration runs without error
- [ ] Every active project has `whiteboard_url = 'http://localhost:5555/{name}'`
- [ ] Whiteboard project has `whiteboard_url = 'http://localhost:5555'`
- [ ] Clicking Whiteboard link on any VybePM project page opens the correct URL

## Verification

1. Run the migration
2. `SELECT name, whiteboard_url FROM vybepm_projects WHERE is_active = true` — verify all URLs
3. Open VybePM, check AnimationStudio's Whiteboard link → should go to `localhost:5555/AnimationStudio`
