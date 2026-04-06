# Task: Add "View Live" link to project task view

## Goal

When a task completes and Angel opens the project page to verify the fix, there should be a visible link to the project's live Vercel URL right in the header — next to the GitHub repo link.

## What exists today

- `Project` type in `src/lib/types.ts` already has `deploy_url: string | null`
- `POST /api/projects` already accepts and stores `deploy_url`
- `GET /api/projects` and `GET /api/projects/[slug]` already return `deploy_url`
- The project page header (`src/app/projects/[slug]/page.tsx`) renders `github_repo` as a link but **does not render `deploy_url`**
- The `ProjectCard` component (`src/components/ProjectCard.tsx`) also does not render `deploy_url`

## Part 1 — Populate `deploy_url` for all web projects

Run a one-time SQL migration or seed script to set `deploy_url` on existing projects:

```sql
UPDATE vybepm_projects SET deploy_url = 'https://ytcombinator.vercel.app' WHERE name = 'ytcombinator';
UPDATE vybepm_projects SET deploy_url = 'https://vybepm-v2.vercel.app' WHERE name = 'vybepm-v2';
UPDATE vybepm_projects SET deploy_url = 'https://1000problems-next.vercel.app' WHERE name = '1000problems';
UPDATE vybepm_projects SET deploy_url = 'https://gstack-review.vercel.app' WHERE name = 'gstack-review';
UPDATE vybepm_projects SET deploy_url = 'https://rubber-joints.vercel.app' WHERE name = 'rubber-joints';
UPDATE vybepm_projects SET deploy_url = 'https://voiceq-api.vercel.app' WHERE name = 'voiceq-api';
```

Put this in `scripts/populate-deploy-urls.sql` and run it against the database. If the project `name` values don't match exactly, adjust accordingly — query `SELECT name FROM vybepm_projects` first to confirm slugs.

## Part 2 — Add "View Live" link in project page header

In `src/app/projects/[slug]/page.tsx`, right after the `github_repo` link, add a `deploy_url` link:

```tsx
{project.deploy_url && (
  <a
    href={project.deploy_url}
    target="_blank"
    rel="noopener noreferrer"
    className="text-xs text-[var(--accent-blue)] hover:underline flex items-center gap-1"
  >
    ↗ View Live
  </a>
)}
```

Place it in the same flex row as the project name and GitHub link. It should sit to the right of the GitHub link.

## Part 3 — Add "View Live" link in ProjectCard (home page)

In `src/components/ProjectCard.tsx`, add a small live link indicator. Since the entire card is already wrapped in a `<Link>`, use an `onClick` with `e.stopPropagation()` to prevent navigation conflict:

```tsx
{project.deploy_url && (
  <a
    href={project.deploy_url}
    target="_blank"
    rel="noopener noreferrer"
    onClick={(e) => e.stopPropagation()}
    className="text-xs text-[var(--accent-blue)] hover:underline"
  >
    ↗ Live
  </a>
)}
```

Put this next to the project name in the card header.

## Part 4 — i18n (optional but preferred)

Add translation keys for the link text:

```ts
// In lib/i18n.tsx
'project.viewLive': 'View Live',    // en
'project.viewLive': 'Ver en vivo',  // es
```

## Acceptance criteria

- Every web-based project in VybePM has its `deploy_url` populated
- Project task page shows a clickable "View Live" link in the header when `deploy_url` is set
- Project card on the home page shows a small "Live" link when `deploy_url` is set
- Links open in a new tab
- Projects without `deploy_url` show no link (no broken UI)
- No hardcoded URLs in the frontend — all URLs come from the `deploy_url` column

## Files to touch

- `scripts/populate-deploy-urls.sql` (new)
- `src/app/projects/[slug]/page.tsx`
- `src/components/ProjectCard.tsx`
- `src/lib/i18n.tsx`
