# TASK: Add Whiteboard URL to VybePM Projects

> Add a `whiteboard_url` column to the projects table and display it as a link on each project page, so Angel can jump from any VybePM project directly to its Whiteboard visual designs.

## Context

The new Whiteboard project (localhost:5555) is a visual design notebook organized by project. Each 1000Problems project gets its own section at `http://localhost:5555/{project-slug}`. VybePM needs a link on each project page so Angel can navigate from task management to visual designs in one click. This also requires registering the Whiteboard project itself in VybePM and seeding whiteboard_url for all existing projects.

## Requirements

1. Add a `whiteboard_url` column (nullable VARCHAR(500)) to the `vybepm_projects` table via a new migration file.

2. Update the project API to include `whiteboard_url` in responses and accept it in PATCH requests:
   - `GET /api/projects` — include `whiteboard_url` in the returned project objects.
   - `GET /api/projects/[slug]` — include `whiteboard_url`.
   - `PATCH /api/projects/[slug]` — accept `whiteboard_url` as an optional field.

3. Update the Project TypeScript interface in `src/lib/types.ts` to include `whiteboard_url: string | null`.

4. Display the Whiteboard link on the project detail page (`/projects/[slug]`). Place it in the project header area, near the existing `deploy_url` and `github_repo` links. Use a distinct icon or label ("Whiteboard") so it's visually differentiated from Deploy and GitHub links.

5. Create a seed migration that sets `whiteboard_url` for all existing active projects:
   - `ytcombinator` → `http://localhost:5555/ytcombinator`
   - `VybePM` → `http://localhost:5555/VybePM`
   - `AnimationStudio` → `http://localhost:5555/AnimationStudio`
   - `GitMCP` → `http://localhost:5555/GitMCP`
   - `RubberJoints-iOS` → `http://localhost:5555/RubberJoints-iOS`
   - `KitchenInventory` → `http://localhost:5555/KitchenInventory`
   - `Vybe` → `http://localhost:5555/Vybe`

6. Insert a new project row for Whiteboard itself:
   - `name`: `Whiteboard`
   - `display_name`: `Whiteboard`
   - `description`: `Visual design notebook for the 1000Problems portfolio`
   - `tech_stack`: `{"Vite", "React", "TypeScript", "Express", "Tailwind"}`
   - `github_repo`: `1000Problems/Whiteboard`
   - `deploy_url`: `http://localhost:5555`
   - `color`: Pick a color not already used by other projects (check the seed data in BUILD.md — used colors are #58a6ff, #3fb950, #d29922, #f0883e, #a371f7, #f85149). Use `#79c0ff` (light blue).
   - `whiteboard_url`: `http://localhost:5555/_shared`
   - `is_active`: `true`

## Implementation Notes

- **Migration file**: Create `migrations/004_whiteboard_url.sql` (or next sequential number — check the migrations/ directory for the latest). The migration should be a single `ALTER TABLE` + `UPDATE` statements. Additive only — no drops, no renames.

```sql
-- Add whiteboard_url column
ALTER TABLE vybepm_projects ADD COLUMN IF NOT EXISTS whiteboard_url VARCHAR(500);

-- Seed whiteboard URLs for existing projects
UPDATE vybepm_projects SET whiteboard_url = 'http://localhost:5555/' || name WHERE is_active = true AND name != 'voiceq-api';

-- Insert Whiteboard project
INSERT INTO vybepm_projects (name, display_name, description, tech_stack, github_repo, deploy_url, color, whiteboard_url, is_active)
VALUES ('Whiteboard', 'Whiteboard', 'Visual design notebook for the 1000Problems portfolio',
        '{"Vite", "React", "TypeScript", "Express", "Tailwind"}',
        '1000Problems/Whiteboard', 'http://localhost:5555', '#79c0ff',
        'http://localhost:5555/_shared', true)
ON CONFLICT (name) DO NOTHING;
```

- **Types update**: In `src/lib/types.ts`, add `whiteboard_url` to the Project interface. It's `string | null` since the column is nullable.

- **API update**: The project list and detail endpoints already SELECT * or select specific columns from `vybepm_projects`. Add `whiteboard_url` to whichever column list is used. For PATCH, validate that `whiteboard_url` is a string if provided, max 500 chars.

- **UI link**: On the project detail page header, there should already be links for `deploy_url` and `github_repo`. Add `whiteboard_url` in the same pattern. Use a canvas/palette icon or simply the text "Whiteboard". Only render the link if `whiteboard_url` is not null. Style it consistently with the existing header links.

- **No special routing**: The link is just an `<a href>` with `target="_blank"`. The Whiteboard app handles its own routing.

## Do Not Change

- `src/app/api/executor/` — entire executor API. Not relevant to this task.
- `src/lib/auth.ts` — authentication logic.
- `src/lib/db.ts` — database connection helper.
- `src/lib/types.ts` TaskStatus enum and STATUS_TRANSITIONS map — only add the `whiteboard_url` field to the Project interface, do NOT touch task types or state machine.
- Database schema — additive changes only. Do NOT drop or rename any existing columns or tables.
- Any existing migration files — create a new one, never modify existing.
- `src/app/api/projects/[slug]/tasks/` — task endpoints are untouched by this task.

## Acceptance Criteria

- [ ] `npm run build` passes with zero errors
- [ ] New migration file exists and runs without errors against the database
- [ ] `GET /api/projects` returns `whiteboard_url` for each project
- [ ] `GET /api/projects/ytcombinator` returns `whiteboard_url: "http://localhost:5555/ytcombinator"`
- [ ] `PATCH /api/projects/ytcombinator` with `{ "whiteboard_url": "..." }` updates the value
- [ ] Project detail page shows a "Whiteboard" link in the header when `whiteboard_url` is set
- [ ] Whiteboard link does not render for projects with null `whiteboard_url`
- [ ] New "Whiteboard" project appears in the project grid with color #79c0ff
- [ ] `git diff` shows changes ONLY in: migration file, `src/lib/types.ts` (Project interface), project API routes, project detail page component

## Verification

1. Run `npm run build` — zero TypeScript errors.
2. Run the migration against the database.
3. Hit `GET /api/projects` — verify all active projects have `whiteboard_url` values.
4. Open the project detail page for any project — verify the Whiteboard link appears.
5. Open the project grid — verify the Whiteboard project card appears.
6. Check `git diff` — only files listed above should be modified.
