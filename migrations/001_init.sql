-- VybePM schema — all tables prefixed with vybepm_ (shared Neon instance)

CREATE TABLE IF NOT EXISTS vybepm_projects (
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

CREATE TABLE IF NOT EXISTS vybepm_tasks (
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

CREATE INDEX IF NOT EXISTS idx_vybepm_tasks_project ON vybepm_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_vybepm_tasks_status ON vybepm_tasks(status);
CREATE INDEX IF NOT EXISTS idx_vybepm_tasks_assignee ON vybepm_tasks(assignee);

CREATE TABLE IF NOT EXISTS vybepm_attachments (
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

CREATE INDEX IF NOT EXISTS idx_vybepm_attachments_task ON vybepm_attachments(task_id);
