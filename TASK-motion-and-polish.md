# TASK: Motion & Polish — Animations, Transitions, Micro-interactions

> Add motion design to VybePM — page load reveals, hover depth, expand/collapse animations, and interaction feedback that makes the UI feel alive.

## Context

TASK-design-foundation established the visual identity (fonts, colors, atmosphere). TASK-component-redesign applied it to components. This final task adds motion — the element that transforms a static redesign into something that feels crafted. The frontend-design skill emphasizes high-impact orchestrated moments over scattered micro-interactions.

**Prerequisites:** TASK-design-foundation and TASK-component-redesign must both be completed first.

**Read `~/1000Problems/Skills/shared-frontend-design-SKILL.md` before starting.**

## Requirements

1. **Page load staggered reveals** — when the home page loads, project cards should animate in with a staggered delay (each card slightly after the previous). Use CSS `@keyframes` + `animation-delay` — no JS animation libraries needed. The animation should be subtle (fade-up or slide-up, 200-400ms duration, 50-80ms stagger per card). Apply the same pattern to task rows when a project view loads.

2. **Hover depth on project cards** — cards should respond to hover with a sense of physical depth. Combine `transform: translateY(-2px)` with a shadow increase and a subtle border glow using the project's accent color. The transition should be smooth (150-200ms ease-out). On mobile, skip hover effects entirely.

3. **Task row expand/collapse animation** — when clicking a task row to show `TaskDetail`, the panel should animate open (height transition or slide-down). When closing, it should animate closed. Currently it just appears/disappears with no transition. Use CSS `max-height` transition or `grid-template-rows: 0fr → 1fr` pattern.

4. **Status change feedback** — when a task's status changes via dropdown, add a brief visual pulse or flash on the status badge to confirm the change registered. A subtle background flash (200ms) on the changed cell is enough. This gives users confidence their click worked without needing a toast notification.

5. **Polish pass** — add `transition` to all interactive elements that currently snap between states: the theme toggle, the completed-tasks chevron rotation, the delete button opacity, and dropdown focus states. Every state change in the UI should have a smooth transition (100-200ms). Also add a custom `::placeholder` style for the new-task textarea that uses the display font at a lighter weight.

## Implementation Notes

### Files to modify:
- `src/app/globals.css` — add `@keyframes` definitions for stagger reveals and status pulse
- `src/components/ProjectCard.tsx` — add hover depth transitions, stagger animation class
- `src/app/page.tsx` — apply stagger delay to each card via `style={{ animationDelay }}`
- `src/components/TaskGrid.tsx` — task row stagger, expand/collapse animation, status pulse, transition polish
- `src/components/TaskDetail.tsx` — animate open/close (wrapper element)
- `src/components/StatusBadge.tsx` — pulse animation on change

### Stagger pattern example:
```css
/* In globals.css */
@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stagger-reveal {
  opacity: 0;
  animation: fadeSlideUp 0.35s ease-out forwards;
}
```

```tsx
{/* In page.tsx */}
{projects.map((project, i) => (
  <div key={project.id} className="stagger-reveal" style={{ animationDelay: `${i * 60}ms` }}>
    <ProjectCard project={project} />
  </div>
))}
```

### Expand/collapse pattern (CSS grid):
```css
.task-detail-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.25s ease-out;
}
.task-detail-wrapper.expanded {
  grid-template-rows: 1fr;
}
.task-detail-wrapper > div {
  overflow: hidden;
}
```

### What the skill says:
> "One well-orchestrated page load with staggered reveals creates more delight than scattered micro-interactions."
> "Use scroll-triggering and hover states that surprise."

### Constraints:
- CSS-only animations preferred — no `framer-motion` or animation libraries
- All animations must respect `prefers-reduced-motion: reduce` — add a media query that disables animations for users who prefer reduced motion
- Keep all existing click handlers, state management, and data flow untouched
- Animations should be subtle for a productivity tool — this is not a marketing site

## Do Not Change

- `src/lib/types.ts` — type definitions
- `src/lib/auth.ts` — authentication
- `src/lib/db.ts` — database
- `src/lib/i18n.ts` — internationalization
- `src/app/api/` — all API routes
- `src/middleware.ts` — auth middleware
- `src/app/layout.tsx` — layout structure
- `src/components/ThemeToggle.tsx` — logic (can add transition CSS)
- `src/components/LanguageToggle.tsx` — logic
- `src/components/VideoCommandBar.tsx` — command bar logic
- Any `fetch()` calls, API URLs, or data handling logic
- The inline editing, dropdown rendering, and task CRUD logic in TaskGrid

## Acceptance Criteria

- [ ] `npm run build` passes with zero errors
- [ ] Home page project cards animate in with visible stagger on page load
- [ ] Project cards have hover depth effect on desktop (shadow + translate)
- [ ] Task detail panel animates open and closed (not instant appear/disappear)
- [ ] Status dropdown change triggers a brief visual pulse on the badge
- [ ] All interactive elements have smooth transitions (no snapping between states)
- [ ] `prefers-reduced-motion: reduce` disables all animations
- [ ] Mobile: hover effects are not applied (no sticky hover on touch)
- [ ] Both dark and light themes look correct with animations
- [ ] `git diff --name-only` shows only the files listed in Implementation Notes

## Verification

1. Run `npm run build` — zero errors
2. Run `npm run dev` and check:
   - Hard refresh home page — cards should stagger in
   - Hover over a project card — should lift with shadow/glow
   - Click a task row — detail panel should animate open
   - Click again — should animate closed
   - Change a task status via dropdown — badge should pulse briefly
   - Toggle theme — transition should be smooth
3. Test reduced motion:
   - In Chrome DevTools → Rendering → check "Emulate CSS media feature prefers-reduced-motion"
   - Refresh — no animations should play
4. Test mobile (375px):
   - No hover effects visible
   - Stagger animations still play on load
5. Run `git diff --name-only` — only listed files should appear
