# TASK: Allow checked_in → done transition in state machine

> Add `done` as a valid next status from `checked_in` so non-deployable projects (iOS, Skills, GitMCP) don't have to pass through `deployed`.

## Context

The reviewer skill routes non-deployable projects (iOS apps, Skills, GitMCP) directly from `checked_in` to `done`, bypassing the `deployed` step which only makes sense for web projects with a Vercel URL. The current state machine blocks this — `checked_in` only allows transitioning to `deployed`. This was caught during the April 9 review run where tasks 37, 38, and 41 had to be routed through `deployed` as a workaround.

## Requirements

1. `checked_in` must accept `done` as a valid next status in `STATUS_TRANSITIONS`.
2. All other transitions remain exactly as they are — no other changes to the state machine.
3. Build passes with zero TypeScript errors.

## Implementation Notes

One line change in `src/lib/types.ts`:

```ts
// Before
checked_in: ['deployed'],

// After
checked_in: ['deployed', 'done'],
```

No other files need to change. The API route at `src/app/api/tasks/[id]/route.ts` reads `STATUS_TRANSITIONS` dynamically — it will pick up the new transition automatically.

## Do Not Change

- `src/app/api/tasks/[id]/route.ts` — reads STATUS_TRANSITIONS dynamically, no changes needed
- `src/lib/types.ts` — modify ONLY the `checked_in` line in `STATUS_TRANSITIONS`. Do not touch the TaskStatus type, VALID_STATUSES array, or any other transitions
- Everything else in the codebase

## Acceptance Criteria

- [ ] `npm run build` passes with zero errors
- [ ] `PATCH /api/tasks/{id}` with `{"status": "done"}` on a `checked_in` task returns 200
- [ ] `PATCH /api/tasks/{id}` with `{"status": "done"}` on a `review` task still returns 400 (existing behavior preserved)
- [ ] `git diff` shows changes ONLY in `src/lib/types.ts`

## Verification

1. Run `npm run build` — must be clean
2. Run `git diff` — confirm only `src/lib/types.ts` changed, and only the `checked_in` line
3. Spot-check: grep for `STATUS_TRANSITIONS` to confirm no other file needed updating
