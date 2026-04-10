# TASK: Design Foundation — Typography, Color System, Atmosphere

> Replace VybePM's generic GitHub-clone styling with a distinctive design identity: new font pairing, new color system, and background atmosphere.

## Context

VybePM currently uses the system font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial`) and GitHub's exact dark color palette (#0e1117, #161b22, #30363d). This looks like every AI-generated dashboard. The frontend-design skill mandates bold aesthetic choices — distinctive typography, cohesive color with personality, and visual atmosphere. This task establishes the design foundation that TASK-2 and TASK-3 build on.

**Read `~/1000Problems/Skills/shared-frontend-design-SKILL.md` before starting.** It defines the aesthetic rules this redesign must follow.

## Requirements

1. **Replace the font stack** with a distinctive Google Fonts pairing. Import a characterful display font for headings (h1, h2, project names) and a refined body font for everything else. NO Inter, Roboto, Arial, Space Grotesk, or system fonts. The pairing must feel like a real product, not a template.

2. **Redesign the color system** in `globals.css`. Keep the CSS variable pattern (`--bg-primary`, `--bg-secondary`, etc.) but replace the values. The new palette must have a clear identity — dominant dark base with sharp accent colors. Keep the light theme variant working but with the same personality. Each project's accent color (stored in DB) should still work against the new backgrounds.

3. **Add background atmosphere** — the body and main containers should have visual depth. Use at least one of: subtle gradient mesh, noise texture overlay, or geometric pattern. No flat solid `#0e1117` backgrounds. The effect should be subtle enough for a productivity tool but present enough to feel intentional.

4. **Update `layout.tsx`** — add Google Fonts `<link>` tags in `<head>`, apply the display font to headings and the body font to the root. Remove the system font stack from `globals.css`.

5. **Update the scrollbar and selection styling** in `globals.css` to match the new palette. Scrollbar thumb, track, and `::selection` highlight should all use the new color system.

## Implementation Notes

### Files to modify:
- `src/app/globals.css` — color variables, font declarations, background atmosphere, scrollbar/selection
- `src/app/layout.tsx` — Google Fonts import in `<head>`, font-family on `<body>` or `<html>`

### Font import pattern:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link href="https://fonts.googleapis.com/css2?family=DisplayFont:wght@600;700&family=BodyFont:wght@400;500;600&display=swap" rel="stylesheet" />
```

### Background atmosphere example (noise texture):
```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,..."); /* inline SVG noise */
  pointer-events: none;
}
```

### Color guidance:
- Avoid purple-on-white (cliché AI aesthetic)
- The accent colors per project (#58a6ff, #3fb950, #d29922, etc.) are stored in the DB and rendered dynamically — make sure they pop against the new backgrounds
- The `[data-theme="light"]` variant must also feel designed, not just an inversion

### What the skill says:
> "Dominant colors with sharp accents outperform timid, evenly-distributed palettes."
> "Create atmosphere and depth rather than defaulting to solid colors."

## Do Not Change

- `src/lib/types.ts` — TaskStatus enum and STATUS_TRANSITIONS map
- `src/lib/auth.ts` — authentication logic
- `src/lib/db.ts` — database connection
- `src/app/api/` — all API routes (entire directory)
- `src/middleware.ts` — auth middleware
- `src/components/TaskGrid.tsx` — layout/logic (TASK-2 handles visual changes)
- `src/components/ProjectCard.tsx` — layout/logic (TASK-2 handles visual changes)
- Database schema — no changes
- The CSS variable NAMES (`--bg-primary`, `--bg-secondary`, etc.) — keep the same names so all components automatically pick up the new values. Only change the VALUES.

## Acceptance Criteria

- [ ] `npm run build` passes with zero errors
- [ ] No system fonts remain anywhere in the codebase (`grep -r "apple-system\|BlinkMacSystemFont\|Segoe UI" src/`)
- [ ] Google Fonts load correctly (check Network tab — font files should appear)
- [ ] Display font is visibly different from body font
- [ ] Both dark and light themes render correctly with the new palette
- [ ] Background has visible atmosphere/texture (not flat solid color)
- [ ] Project accent colors (#58a6ff, #3fb950, etc.) are legible against new backgrounds
- [ ] `git diff` shows changes ONLY in `globals.css` and `layout.tsx`

## Verification

1. Run `npm run build` — zero errors
2. Run `npm run dev` and visually inspect both dark and light themes
3. Run `git diff --name-only` — only `src/app/globals.css` and `src/app/layout.tsx` should appear
4. Confirm no system fonts remain: `grep -rn "apple-system\|BlinkMacSystemFont\|Segoe UI\|Helvetica, Arial" src/`
5. Open browser DevTools → Network → filter by Font — Google Font files should be loading
