# VybePM — Task Orchestration Hub for 1000Problems

## Overview

VybePM is the central command center for the 1000Problems portfolio. It replaces voiceq-api's task queue and the dead VybePM iOS scaffold with a web app purpose-built for writing, assigning, tracking, and executing tasks across all 1000Problems projects.

The core insight: tasks aren't just dev work. They include animations, design, content, deployments, reports, and anything else the CEO needs done. VybePM routes each task to the right executor (Angel, Cowork, Claude Code) and tracks it through completion.

## Core Principles

1. **Spreadsheet-speed input.** Adding a task should feel like typing in a cell, not filling out a form. No modals, no friction.
2. **Project-scoped views.** No flat list with a project dropdown. Home screen shows projects, you tap into one and see only that project's tasks.
3. **Images and files are first-class.** Every task can have files attached — screenshots, mockups, videos, reference material, generated output. All files go to Google Drive via signed URL upload. Same path for a 200KB screenshot and a 500MB video.
4. **Two users max.** Angel + one collaborator. No multi-tenant complexity. Simple password gate.
5. **Video creation is a first-class action.** Requesting a video should be as fast as sending a message — type, send, done.

## UI Language

**All user-facing UI text must be in Spanish.** This includes labels, buttons, placeholders, status text, headings, error messages, and any copy the user sees. Code (variable names, comments, API responses) stays in English. Examples:

- "Projects" → "Proyectos"
- "Tasks" → "Tareas"
- "Pending" → "Pendiente"
- "In Progress" → "En Progreso"
- "Review" → "Revisión"
- "Done" → "Completado"
- "Submit" → "Enviar"
- "New Task" → "Nueva Tarea"
- "Video Requests" → "Solicitudes de Video"
- "Describe a video..." → "Describe un video..."
- "View video" → "Ver video"
- "See all" → "Ver todo"
- "Back to projects" → "Volver a proyectos"
- "Loading..." → "Cargando..."
- "Completed" → "Completados"
- "Password" → "Contraseña"
- "Login" → "Iniciar sesión"

## Architecture

### Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Database:** Neon PostgreSQL (shared free tier instance with other 1000Problems projects)
- **ORM:** None. Raw SQL with parameterized queries via @neondatabase/serverless
- **Hosting:** Vercel (auto-deploy on push to main)
- **File Storage:** Google Drive via service account + signed resumable upload URLs
- **Styling:** Tailwind CSS 4. Component libraries are fine if they speed up the build.

### Why These Choices
- Neon: Already proven in the portfolio (ytcombinator, voiceq-api). Shared free tier to avoid managing multiple instances.
- Google Drive: 15GB free, shareable between 2 people, works for images and videos alike. Service account handles auth headlessly.
- No ORM: Raw SQL is faster to write, easier to debug, and avoids abstraction overhead for a small schema.

### File Storage Architecture

All files (images, videos, PDFs, anything) use a single upload pipeline through Google Drive:

1. **Client requests upload** → calls `POST /api/upload/request` with file name, MIME type, size
2. **VybePM backend authenticates** with Google Drive API using a service account
3. **Backend creates a resumable upload session** in a shared Drive folder (`1000Problems/VybePM/[project-slug]/`)
4. **Backend returns the signed resumable upload URL** to the client
5. **Client uploads directly to Google Drive** using the signed URL — file bytes never touch VybePM's server
6. **Client notifies VybePM** → calls `POST /api/tasks/[id]/attachments` with the Drive file ID
7. **VybePM stores the attachment record** (Drive file ID, link, name, type, size)

This means:
- No file size limits from Vercel (files bypass the serverless function entirely)
- Same flow for a 50KB screenshot and a 2GB video
- VybePM's server only handles metadata (a few hundred bytes per request)
- Both users see all files in the shared Google Drive folder
- Files are served via Google Drive's CDN

### Google Drive Service Account Setup
1. Create a service account in Google Cloud Console (free)
2. Enable the Google Drive API
3. Download the JSON key file
4. Create a shared folder `1000Problems/VybePM` in Angel's Google Drive
5. Share that folder with the service account's email address (gives it write access)
6. Share the same folder with the other collaborator
7. Add the service account credentials to VybePM's environment variables

## Data Model

All tables prefixed with `vybepm_` — shared Neon instance.

### vybepm_projects
```sql
CREATE TABLE vybepm_projects (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    display_name    VARCHAR(200) NOT NULL,
    description     TEXT,
    tech_stack      TEXT[],
    github_repo     VARCHAR(200),
    deploy_url      VARCHAR(500),
    color           VARCHAR(7),
    sort_order      INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

**Seed data must include a pseudo-project for video requests:**
```sql
INSERT INTO vybepm_projects (name, display_name, description, color, sort_order)
VALUES ('prompts', 'Prompts', 'Video generation requests', '#e040fb', 0);
```

This "Prompts" project is the bucket for all video requests created via the Video Command Bar. It does NOT appear in the project grid on the home page — it's hidden from the normal project list. Tasks are created against it, but the UI for viewing them is the Video Command Bar feed, not a project view.

### vybepm_tasks
```sql
CREATE TABLE vybepm_tasks (
    id              SERIAL PRIMARY KEY,
    project_id      INTEGER NOT NULL REFERENCES vybepm_projects(id),
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    task_type       VARCHAR(30) NOT NULL DEFAULT 'dev'
                    CHECK (task_type IN ('dev', 'design', 'animation', 'content', 'deploy', 'report', 'other')),
    priority        INTEGER NOT NULL DEFAULT 2
                    CHECK (priority BETWEEN 1 AND 4),
    status          VARCHAR(30) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'in_progress', 'review', 'checked_in', 'deployed', 'done')),
    assignee        VARCHAR(30) DEFAULT 'angel'
                    CHECK (assignee IN ('angel', 'cowork', 'claude-code')),
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_vybepm_tasks_project ON vybepm_tasks(project_id);
CREATE INDEX idx_vybepm_tasks_status ON vybepm_tasks(status);
CREATE INDEX idx_vybepm_tasks_assignee ON vybepm_tasks(assignee);
```

### vybepm_attachments
```sql
CREATE TABLE vybepm_attachments (
    id              SERIAL PRIMARY KEY,
    task_id         INTEGER NOT NULL REFERENCES vybepm_tasks(id) ON DELETE CASCADE,
    drive_file_id   VARCHAR(200) NOT NULL,
    url             VARCHAR(2000) NOT NULL,
    file_name       VARCHAR(500),
    file_type       VARCHAR(50),
    file_size       BIGINT,
    thumbnail_url   VARCHAR(2000),
    caption         TEXT,
    created_by      VARCHAR(30) DEFAULT 'angel',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vybepm_attachments_task ON vybepm_attachments(task_id);
```

## Status State Machine

```
pending → in_progress       (executor picks up task)
in_progress → review        (work done, ready for Angel to check)
review → checked_in         (approved, pushed to git)
checked_in → deployed       (live on Vercel/production)
deployed → done             (verified, archived)

-- Backward transitions (rejection/rework):
review → in_progress        (needs changes)
deployed → in_progress      (production issue found)

-- Skip transitions (for non-dev tasks):
in_progress → done          (no deploy needed — e.g., animation, report)
review → done               (approved, no deploy step)
```

## Pages & UI

**All UI text in Spanish.** See "UI Language" section above for translations.

### 1. Home Page (`/`)

The home page has two sections stacked vertically:

#### Top Section: Video Command Bar ("Solicitudes de Video")

A full-width text input with a send button on the right. Visually elevated with a slightly different background from the project grid below. This is the first thing you see.

- **Input placeholder:** "Describe un video..." (muted gray)
- **Send button:** arrow icon or "Enviar"
- **Behavior:** Type a prompt, hit Enter or click send. Input clears immediately. User can start typing next prompt right away.
- **What happens on send:** POST to `/api/projects/prompts/tasks` with `{ title: "<prompt text>", task_type: "animation", assignee: "cowork", priority: 2 }`

Below the input, a compact feed shows the last 5-10 video requests:

```
"Intro cinemática de 30s con logo flotando"          ● Procesando...
"Animación explainer para kitchen inventory"          ✓ Ver video
"Clip social — demo de keywords ytcombinator"         ● En cola
```

Three visual states:
- **Pendiente (queued):** gray dot + "En cola"
- **En Progreso (rendering):** blue animated dot + "Procesando..."
- **Completado (done):** green checkmark + "Ver video" link (opens Google Drive file)

Each row shows: prompt text (truncated if long), status indicator, and link when complete.

A "Ver todo" link at the bottom expands to full history or navigates to a dedicated page if the list gets long.

**Optimistic UI:** When user hits send, the new request appears in the feed immediately as "En cola" before the API responds. If the API fails, show an error state on that row.

**The "Prompts" pseudo-project does NOT appear in the project grid below.** Filter it out when querying projects for the grid. The Video Command Bar is its only UI.

#### Bottom Section: Project Grid ("Proyectos")

Grid of project cards (excluding the "Prompts" pseudo-project). Each card shows:
- Project color bar (left edge)
- Project name + short description
- Tech stack badges
- Task counts: pendiente | en progreso | total
- Last activity

Click a card → navigate to `/projects/[slug]`

**Layout:** Responsive grid, 2-3 columns on desktop, 1 on mobile. No sidebar.

### 2. Project View — Task Sheet (`/projects/[slug]`)

Top bar: project name, tech badges, GitHub link, deploy link, "Volver a proyectos" breadcrumb.

Main area: **task grid** that behaves like a spreadsheet.
- Rows = tasks, sorted by priority then sort_order
- Columns: Prioridad (color dot), Título (editable inline), Tipo (dropdown), Estado (dropdown with color), Asignado (dropdown), Adjuntos (thumbnail count), Actualizado
- Click a row to expand it into a detail panel (slides in from right or expands inline)
- New task: empty row at the bottom, always visible. Click and start typing. Tab through columns.
- Drag to reorder rows (updates sort_order)

**Attachment interaction:**
- Drag-and-drop a file anywhere on a task row → triggers signed URL upload to Drive
- Paste from clipboard (Cmd+V while a task is focused) → same flow
- Click attachment thumbnails → lightbox view (images) or Drive link (videos/other)

**Status colors:**
- pendiente: gray
- en_progreso: blue
- revisión: yellow
- registrado: green
- desplegado: purple
- completado: muted/dim (visually de-emphasized)

**Completed tasks:** Tasks with status `done` collapse into a "Completados" section at the bottom. Expandable, default collapsed.

### 3. Task Detail (inline expand or `/projects/[slug]/tasks/[id]`)

Full task view with:
- Título (large, editable)
- Descripción (markdown, editable)
- All metadata (tipo, prioridad, estado, asignado)
- Galería de adjuntos (full-size images, video embeds or Drive links)
- Registro de actividad (status changes with timestamps)
- Notas field (for executor to write what was done)

### 4. Quick Add (`/quick?project=[slug]`)

Minimal page optimized for mobile bookmarks. Just:
- Proyecto (pre-filled from URL param, or dropdown if not specified)
- Título input
- Tipo selector
- File drop zone
- Enviar button

Bookmark this on your phone home screen for fast task entry on the go.

## API Endpoints

### Projects
```
GET    /api/projects                    — List all active projects with task counts
GET    /api/projects/[slug]             — Single project with full details
POST   /api/projects                    — Create project
PATCH  /api/projects/[slug]             — Update project
```

Note: GET /api/projects should accept an optional `?exclude=prompts` query param (or always exclude the Prompts pseudo-project from the default listing, and accept `?include_hidden=true` to include it). The home page project grid always excludes Prompts.

### Tasks
```
GET    /api/projects/[slug]/tasks       — List tasks for project (filter by status, assignee)
POST   /api/projects/[slug]/tasks       — Create task
PATCH  /api/tasks/[id]                  — Update task (title, description, status, priority, assignee)
DELETE /api/tasks/[id]                  — Delete task (hard delete for pending only)
PATCH  /api/tasks/[id]/reorder          — Update sort_order
```

### File Upload (Google Drive signed URL flow)
```
POST   /api/upload/request              — Request a signed upload URL
  Body: { "file_name": "screenshot.png", "mime_type": "image/png", "file_size": 204800 }
  Returns: { "upload_url": "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&...", "file_id": "abc123" }

POST   /api/upload/complete             — Confirm upload completed, get file metadata
  Body: { "file_id": "abc123" }
  Returns: { "file_id": "abc123", "url": "https://drive.google.com/file/d/abc123/view", "thumbnail_url": "...", "file_name": "screenshot.png", "file_size": 204800 }
```

### Attachments
```
POST   /api/tasks/[id]/attachments      — Link a Drive file to a task
  Body: { "drive_file_id": "abc123", "caption": "Bug screenshot" }
DELETE /api/attachments/[id]            — Remove attachment record (optionally delete from Drive too)
```

### Executor API (for Cowork/MCP integration)
```
GET    /api/executor/next               — Get next pending task assigned to caller
PATCH  /api/executor/tasks/[id]/pickup  — Atomically set to in_progress (SELECT FOR UPDATE)
PATCH  /api/executor/tasks/[id]/complete — Set to review with notes and optional attachment Drive file IDs
```

### Digest API (for daily reports)
```
GET    /api/digest?since=2026-04-04     — Summary of all task changes since date, grouped by project
```

## Auth

Simple password gate for 2 users:
- **Web UI:** Single shared password stored as `VYBEPM_PASSWORD` env var. On first visit, user sees a password input. Correct password sets an HTTP-only cookie that lasts 30 days. No accounts, no signup, no user table.
- **API:** `X-API-Key` header matching `VYBEPM_API_KEY` env var. Required for all API calls.
- **Executor API:** Same API key, identifies caller via `X-Executor` header (`cowork` or `claude-code`).
- **Password bypass for API calls:** API key auth and password cookie auth are both valid — having either one grants access. The cookie is for the browser UI, the API key is for programmatic access.

## MCP Integration

VybePM exposes an API that Cowork (via a future MCP tool or direct HTTP) can call to:
1. Poll for tasks assigned to `cowork`
2. Pick up a task (atomic status transition to `in_progress`)
3. Upload files to Drive via the signed URL flow
4. Report completion with notes and attachment Drive file IDs
5. Query digest for daily reports

This replaces the current git-log-scraping approach for daily reports with structured task data.

## Environment Variables
```
DATABASE_URL=postgresql://...@neon.tech/neondb?sslmode=require     # shared Neon instance
VYBEPM_API_KEY=[generated-api-key]
VYBEPM_PASSWORD=[shared-password-for-web-ui]
GOOGLE_SERVICE_ACCOUNT_EMAIL=[service-account@project.iam.gserviceaccount.com]
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=[-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----]
GOOGLE_DRIVE_FOLDER_ID=[id-of-shared-1000Problems-VybePM-folder]
```

## Project Structure
```
src/
  app/
    page.tsx                          -- Home: Video Command Bar + project grid
    login/
      page.tsx                        -- Password gate ("Iniciar sesión")
    projects/
      [slug]/
        page.tsx                      -- Project view: task sheet
    quick/
      page.tsx                        -- Quick add (mobile bookmark)
    api/
      projects/
        route.ts                      -- GET, POST projects
        [slug]/
          route.ts                    -- GET, PATCH project
          tasks/
            route.ts                  -- GET, POST tasks
      tasks/
        [id]/
          route.ts                    -- PATCH, DELETE task
          reorder/
            route.ts                  -- PATCH reorder
          attachments/
            route.ts                  -- POST link, GET list
      attachments/
        [id]/
          route.ts                    -- DELETE attachment
      upload/
        request/
          route.ts                    -- POST: get signed Drive upload URL
        complete/
          route.ts                    -- POST: confirm upload, get metadata
      executor/
        next/
          route.ts                    -- GET next task for executor
        tasks/
          [id]/
            pickup/
              route.ts                -- PATCH atomic pickup
            complete/
              route.ts                -- PATCH complete with notes
      digest/
        route.ts                      -- GET task changes since date
  lib/
    db.ts                             -- Neon connection + query helpers
    auth.ts                           -- Password cookie + API key validation
    types.ts                          -- Shared TypeScript types
    drive.ts                          -- Google Drive service account client + signed URL generation
  components/
    VideoCommandBar.tsx               -- Prompt input + recent requests feed
    VideoRequestRow.tsx               -- Single row in the video feed
    ProjectCard.tsx
    TaskGrid.tsx
    TaskRow.tsx
    TaskDetail.tsx
    AttachmentGallery.tsx
    FileUpload.tsx                    -- Unified upload component (signed URL flow)
    StatusBadge.tsx
    InlineEdit.tsx
    QuickAdd.tsx
    PasswordGate.tsx
```

## Non-Negotiable Rules

1. **No ORMs.** Raw SQL with parameterized queries only.
2. **No `any` types.** TypeScript strict mode. Every function typed.
3. **No `exec()` or `eval()`.** Ever.
4. **Validate all inputs.** Every POST/PATCH validates all fields server-side.
5. **State machine enforcement.** Status transitions must be validated — no jumping from `pending` to `done`.
6. **File upload validation.** Check MIME type and sanitize file names before creating Drive upload session. Reject executable file types.
7. **SQL injection prevention.** Always use parameterized queries. Never interpolate user input into SQL strings.
8. **No secrets in code.** All credentials via environment variables. Google service account key NEVER committed.
9. **Responsive.** Must work on mobile. Task grid collapses to card view on screens < 768px.
10. **One upload path.** All files go through the same signed URL → Google Drive pipeline. No special cases for different file sizes.
11. **All UI text in Spanish.** Labels, buttons, placeholders, status text, headings, errors — everything user-facing. Code stays in English.

## Build Priority

### Phase 1: Core (MVP) — DONE
1. Database schema + migrations
2. Password gate (login page + cookie middleware)
3. Projects API + seed data (all 6 1000Problems projects + "Prompts" pseudo-project)
4. Tasks API (CRUD + status transitions)
5. Home page with project grid
6. Project view with task grid (inline editing, status changes)
7. New task creation (inline at bottom of grid)

### Phase 1.5: Video Command Bar + Spanish UI
8. Add "Prompts" pseudo-project to seed data (hidden from project grid)
9. Build VideoCommandBar component — text input + send + recent requests feed
10. Add VideoCommandBar to home page above the project grid
11. Convert all UI text to Spanish (labels, buttons, placeholders, status text, errors)
12. Exclude "Prompts" from project grid query

### Phase 2: File Upload
13. Google Drive service account integration (`lib/drive.ts`)
14. Signed URL upload flow (`/api/upload/request` + `/api/upload/complete`)
15. Attachments API (link Drive files to tasks)
16. Drag-and-drop + paste upload on task rows
17. Attachment thumbnails and lightbox

### Phase 3: Mobile & Polish
18. Quick add page (`/quick`)
19. Mobile responsive layout
20. Task reordering (drag and drop)
21. Completed tasks section (collapsible)

### Phase 4: Executor Integration
22. Executor API endpoints
23. Task pickup with atomic locking
24. Completion reporting with notes + attachments
25. Digest API for daily reports

## Deployment

- GitHub repo: `1000Problems/VybePM-v2`
- Vercel project: `vybepm-v2` (auto-deploy on push to main)
- Domain: vybe.1000problems.com (update DNS from old app)
- Neon database: shared free tier instance (prefix tables with `vybepm_`)
- Google Drive: shared folder `1000Problems/VybePM` with service account + collaborator access
