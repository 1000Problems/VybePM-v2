import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { hasValidApiKey } from '@/lib/auth';

interface DigestTask {
  id: number;
  title: string;
  task_type: string;
  priority: number;
  status: string;
  assignee: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  project_slug: string;
  project_name: string;
}

interface ProjectGroup {
  project_slug: string;
  project_name: string;
  tasks: DigestTask[];
}

interface DigestResponse {
  since: string;
  summary: {
    total_updated: number;
    completed: number;
    in_progress: number;
    new: number;
  };
  projects: ProjectGroup[];
}

// GET /api/digest — task changes since date, grouped by project
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!hasValidApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const since = searchParams.get('since');

  if (!since) {
    return NextResponse.json({ error: 'since query parameter is required (ISO date, e.g. 2025-01-01)' }, { status: 400 });
  }

  // Validate ISO date format
  const parsedDate = new Date(since);
  if (isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: 'since must be a valid ISO date' }, { status: 400 });
  }

  const rows = await sql`
    SELECT
      t.id,
      t.title,
      t.task_type,
      t.priority,
      t.status,
      t.assignee,
      t.updated_at,
      t.started_at,
      t.completed_at,
      t.created_at,
      p.name AS project_slug,
      p.display_name AS project_name
    FROM vybepm_tasks t
    JOIN vybepm_projects p ON p.id = t.project_id
    WHERE t.updated_at >= ${since}
    ORDER BY p.name, t.priority ASC, t.updated_at DESC
  ` as (DigestTask & { created_at: string })[];

  // Compute summary counts
  let completed = 0;
  let inProgress = 0;
  let newTasks = 0;

  for (const row of rows) {
    if (row.status === 'done' || row.status === 'review') {
      completed++;
    }
    if (row.status === 'in_progress') {
      inProgress++;
    }
    if (row.created_at >= since) {
      newTasks++;
    }
  }

  // Group by project
  const projectMap = new Map<string, ProjectGroup>();
  for (const row of rows) {
    const key = row.project_slug;
    if (!projectMap.has(key)) {
      projectMap.set(key, {
        project_slug: row.project_slug,
        project_name: row.project_name,
        tasks: [],
      });
    }
    const group = projectMap.get(key)!;
    group.tasks.push({
      id: row.id,
      title: row.title,
      task_type: row.task_type,
      priority: row.priority,
      status: row.status,
      assignee: row.assignee,
      updated_at: row.updated_at,
      started_at: row.started_at,
      completed_at: row.completed_at,
      project_slug: row.project_slug,
      project_name: row.project_name,
    });
  }

  const response: DigestResponse = {
    since,
    summary: {
      total_updated: rows.length,
      completed,
      in_progress: inProgress,
      new: newTasks,
    },
    projects: Array.from(projectMap.values()),
  };

  return NextResponse.json(response);
}
