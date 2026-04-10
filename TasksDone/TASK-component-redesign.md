# TASK: Component Redesign — ProjectCard, Home Page, Task View

> Redesign the visual presentation of VybePM's core components to match the new design foundation from TASK-design-foundation.

## Context

TASK-design-foundation established new typography, colors, and atmosphere. This task applies that identity to the actual components — the project cards on the home page and the project/task view. The current layouts are standard grid-and-table patterns with zero spatial personality. The frontend-design skill demands unexpected layouts, asymmetry, and compositions that feel intentionally designed for this specific product.

**Prerequisites:** TASK-design-foundation must be completed first (new fonts and colors must be in place).

**Read `~/1000Problems/Skills/shared-frontend-design-SKILL.md` before starting.**

## Requirements

1. **Redesign `ProjectCard.tsx`** — the current card is a generic bordered rectangle with a thin color bar. Redesign it to have spatial personality: use the project's accent color more boldly (not just a 1px bar), add visual hierarchy between the project name and metadata, and make the tech stack badges feel integrated rather than afterthoughts. The card should have depth (shadows, layering, or border treatments beyond `1px solid`).

2. **Redesign the home page layout in `page.tsx`** — the current layout is `max-w-5xl mx-auto` centered content with a plain `h1`. Add a header area with presence — the "VybePM" title should use the display font at a confident size. The project grid should have more spatial interest than a uniform 3-column grid (consider varying card sizes, asymmetric gaps, or a featured/pinned project treatment).

3. **Redesign the project view header** in `src/app/projects/[slug]/page.tsx` — the project name, description, and back navigation should feel like a real product header, not a basic `<h1>` with breadcrumbs. Use the project's accent color as a design element (gradient, glow, or background wash — not just text color).

4. **Redesign `TaskGrid.tsx` chrome** — the table header row, the new-task input area, and the completed-tasks toggle. Keep the inline editing, dropdowns, and data flow exactly as-is. Only change the visual presentation: the header should be more than just uppercase text, the new-task area should invite input (not just a bare textarea), and the completed section should feel deliberately hidden rather than just collapsed.

5. **Update mobile card layout** — the mobile task cards and project cards should feel designed for touch. Larger tap targets, more generous spacing, and the same design personality as desktop (not just a cramped version of the same components).

## Implementation Notes

### Files to modify:
- `src/components/ProjectCard.tsx` — card visual redesign
- `src/app/page.tsx` — home page layout and header
- `src/app/projects/[slug]/page.tsx` — project view header area
- `src/components/TaskGrid.tsx` — table chrome, new-task area, completed toggle (VISUAL ONLY)
- `src/components/StatusBadge.tsx` — may need visual update to match new palette

### What NOT to change in TaskGrid:
The data flow, state management, inline editing, dropdown rendering, task creation, and deletion logic must remain identical. Only change:
- CSS classes and Tailwind utilities
- Grid column widths/gaps
- Visual presentation of the header row
- Visual presentation of the new-task input area
- Visual presentation of the completed-tasks toggle
- Visual presentation of mobile cards

### Pattern references:
- The `PRIORITY_COLORS` map in TaskGrid can be updated to match the new palette
- The `StatusBadge` component renders task status pills — update colors to match
- The `VideoCommandBar` on the home page should be visually integrated with the new header

### What the skill says:
> "Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements."
> "Every UI must feel intentionally designed for its context."

### Constraints:
- Keep i18n keys and `useI18n()` calls exactly as they are
- Keep all `onClick`, `onChange`, `onKeyDown` handlers as they are
- Keep the grid column template for desktop task rows functional (fields must align)
- Keep mobile breakpoint at `md:` (768px)

## Do Not Change

- `src/lib/types.ts` — type definitions, enums, transitions
- `src/lib/auth.ts` — authentication
- `src/lib/db.ts` — database
- `src/lib/i18n.ts` — internationalization logic and translation keys
- `src/app/api/` — all API routes
- `src/middleware.ts` — auth middleware
- `src/app/globals.css` — already redesigned in TASK-1 (don't revert it)
- `src/app/layout.tsx` — already redesigned in TASK-1
- `src/components/TaskDetail.tsx` — detail panel (separate task if needed)
- `src/components/ThemeToggle.tsx` — theme switching logic
- `src/components/LanguageToggle.tsx` — language switching logic
- Any `fetch()` calls, API URLs, or data shapes
- The state machine logic in dropdowns (STATUS_TRANSITIONS filtering)

## Acceptance Criteria

- [ ] `npm run build` passes with zero errors
- [ ] Home page project cards are visually distinct from the old GitHub-style cards
- [ ] Project accent colors are used boldly (not just a thin bar)
- [ ] Home page header area has presence and uses the display font
- [ ] Task grid header row is visually updated
- [ ] New-task input area looks inviting, not bare
- [ ] Mobile layout (< 768px) has larger tap targets and maintains design personality
- [ ] All inline editing, dropdowns, task creation, and deletion still work correctly
- [ ] Both dark and light themes render correctly
- [ ] `git diff --name-only` shows only the files listed in Implementation Notes

## Verification

1. Run `npm run build` — zero errors
2. Run `npm run dev` and check:
   - Home page at desktop width — cards, header, grid layout
   - Home page at 375px width — mobile cards
   - Project view at desktop — header, task grid, inline editing
   - Project view at 375px — mobile task cards, new task input
3. Test inline editing: double-click a task title, edit, press Enter
4. Test dropdown changes: change a task's status, type, assignee
5. Test task creation: type in the new-task area, press Enter
6. Test theme toggle: switch between dark and light
7. Run `git diff --name-only` — only listed files should appear
