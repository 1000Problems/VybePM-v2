# VybePM — Build Instructions

Step-by-step implementation guide. Read CLAUDE.md first for architecture, constraints, and protected areas.

## Environment Setup

Confirm these env vars are available in `.env.local`:
- `DATABASE_URL` — Neon PostgreSQL connection string (shared instance)
- `VYBEPM_API_KEY` — any secure random string
- `VYBEPM_PASSWORD` — shared password for web UI access
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` — from Google Cloud Console
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` — from downloaded JSON key
- `GOOGLE_DRIVE_FOLDER_ID` — ID of the shared VybePM folder in Drive

Note: Google Drive setup can be deferred to Step 4. Steps 0-3 only need DATABASE_URL, VYBEPM_API_KEY, and VYBEPM_PASSWORD.

## Step 0: Scaffold Next.js Project

1. Run `npx create-next-app@latest . --typescript --tailwind --eslint --app --import-alias "@/*" --use-npm`
2. Verify it builds: `npm run build`

## Step 1: Database & Auth (Phase 1)

1. Install `@neondatabase/serverless`
2. Create `src/lib/db.ts` — Neon connection helper with parameterized query wrapper
3. Create `src/lib/auth.ts` — password cookie validation + API key validation middleware. Password check sets HTTP-only cookie for 30 days. API key check via `X-API-Key` header. Either one grants access.
4. Create `src/lib/types.ts` — TypeScript interfaces for Project, Task, Attachment
5. Create `migrations/001_init.sql` with the full schema from SPEC.md. All tables prefixed with `vybepm_`.
6. Create login page at `/login` — single password input, POST to `/api/auth/login`, redirect to `/` on success
7. Add middleware that checks for valid session cookie or API key on all routes except `/login` and `/api/auth/login`

## Step 2: Projects & Tasks API (Phase 1 continued)

1. Build all project API routes from SPEC.md:
   - GET /api/projects (list with task counts)
   - GET /api/projects/[slug] (single project)
   - POST /api/projects (create)
   - PATCH /api/projects/[slug] (update)
2. Build all task API routes:
   - GET /api/projects/[slug]/tasks (list with filters: status, assignee)
   - POST /api/projects/[slug]/tasks (create)
   - PATCH /api/tasks/[id] (update — enforce state machine transitions)
   - DELETE /api/tasks/[id] (hard delete for pending only, reject otherwise)
   - PATCH /api/tasks/[id]/reorder (update sort_order)
3. Seed data: create a seed script with entries for all 6 projects:
   - ytcombinator: "YouTube keyword research dashboard", ["Next.js", "TypeScript", "Neon"], "1000Problems/ytcombinator", color "#58a6ff"
   - KitchenInventory: "AI-powered kitchen inventory with voice input", ["Swift", "SwiftUI", "SwiftData"], "1000Problems/KitchenInventory", color "#3fb950"
   - voiceq-api: "Voice-activated task queue API", ["Next.js", "TypeScript", "Neon"], "1000Problems/voiceq-api", color "#d29922"
   - GitMCP: "Local MCP server for native git access", ["Node.js", "TypeScript", "MCP"], "1000Problems/GitMCP", color "#f0883e"
   - VybePM: "Task orchestration hub", ["Next.js", "TypeScript", "Neon"], "1000Problems/VybePM-v2", color "#a371f7"
   - RubberJoints-iOS: "RubberJoints iOS client", ["Swift", "iOS"], "1000Problems/RubberJoints-iOS", color "#f85149"
4. Test every endpoint

## Step 3: UI (Phase 1 continued)

1. Build the home page (`/`) — project grid with cards per SPEC.md
2. Build the project view (`/projects/[slug]`) — task sheet grid
3. Task grid must support:
   - Inline editing (click cell to edit title, dropdowns for type/status/assignee)
   - New task row at bottom (always visible, start typing to create)
   - Status colors as defined in SPEC.md
   - Completed tasks section at bottom (collapsed by default)
4. Task detail expansion (click row to expand inline or slide-in panel)
5. Mobile: task grid becomes card layout on screens < 768px

## Step 4: Google Drive Integration (Phase 2)

1. Install `googleapis` package
2. Create `src/lib/drive.ts`:
   - Initialize Google Drive client with service account credentials from env vars
   - `createUploadSession(fileName, mimeType, parentFolderId)` → returns resumable upload URL + file ID
   - `getFileMetadata(fileId)` → returns URL, thumbnail URL, name, size
   - `deleteFile(fileId)` → removes file from Drive
3. Build upload API routes:
   - POST /api/upload/request — validates file name + MIME type, creates Drive upload session, returns signed URL
   - POST /api/upload/complete — takes file ID, fetches metadata from Drive, returns full file info
4. Build attachment API routes:
   - POST /api/tasks/[id]/attachments — links a Drive file ID to a task
   - DELETE /api/attachments/[id] — removes attachment record, optionally deletes from Drive
5. Build `FileUpload.tsx` component:
   - Drag-and-drop zone
   - Clipboard paste handler (Cmd+V)
   - Calls /api/upload/request, uploads to Drive URL, calls /api/upload/complete, then links to task
   - Shows upload progress bar
6. Add attachment thumbnails to task rows
7. Add lightbox for full-size image viewing

## Step 5: Studio & Quick Add (Phase 3)

1. Build video studio page (`/projects/[slug]/studio`):
   - Request form: prompt textarea, style dropdown, duration selector, reference image upload
   - Submit creates a task of type `animation` with assignee `cowork`
   - Gallery of completed animation tasks below the form
2. Build quick add page (`/quick`):
   - Minimal form: project dropdown (pre-filled if `?project=` param), title, type, file upload
   - Designed for mobile home screen bookmark
3. Task reordering via drag and drop
4. Completed tasks collapsible section

## Step 6: Executor API (Phase 4)

1. GET /api/executor/next — returns next pending task assigned to calling executor
2. PATCH /api/executor/tasks/[id]/pickup — atomic pickup with SELECT FOR UPDATE
3. PATCH /api/executor/tasks/[id]/complete — set to review, include notes + attachment Drive file IDs
4. GET /api/digest?since=YYYY-MM-DD — task changes since date, grouped by project

## Testing

- Test every API endpoint
- Verify state machine rejects invalid transitions
- Verify file upload creates Drive file and returns correct metadata
- Verify SQL injection is prevented (try `'; DROP TABLE vybepm_tasks; --` in inputs)
- Verify password gate blocks unauthenticated access
- Verify mobile layout at 375px width
- Verify large file upload works (test with a 50MB+ file if possible)
