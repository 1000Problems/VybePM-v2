# TASK: Fix Whiteboard Project's Own whiteboard_url

> Change the Whiteboard project's whiteboard_url from `http://localhost:5555/_shared` to `http://localhost:5555`.

## Context

The TASK-whiteboard-integration migration set the Whiteboard project's `whiteboard_url` to `http://localhost:5555/_shared`. This is wrong — the Whiteboard project's own whiteboard link should point to the gallery root (`http://localhost:5555`), not the `_shared` section. One-line SQL fix.

## Requirements

1. Create a migration that updates the Whiteboard project's `whiteboard_url`:

```sql
UPDATE vybepm_projects
SET whiteboard_url = 'http://localhost:5555'
WHERE name = 'Whiteboard';
```

## Implementation Notes

- Migration file: `migrations/005_fix_whiteboard_url.sql` (or next sequential number — check the directory).
- This is a single UPDATE statement. No schema changes.

## Do Not Change

- Everything except the new migration file. This is a data fix, not a code change.

## Acceptance Criteria

- [ ] Migration runs without error
- [ ] `SELECT whiteboard_url FROM vybepm_projects WHERE name = 'Whiteboard'` returns `http://localhost:5555`

## Verification

1. Run the migration
2. Query the database to confirm the URL is correct
3. Open VybePM, navigate to the Whiteboard project, click the Whiteboard link — should open `localhost:5555` (gallery root)
