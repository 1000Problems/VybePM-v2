import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { hasValidApiKey } from '@/lib/auth';
import { Assignee } from '@/lib/types';

type ExecutorType = 'cowork' | 'claude-code';
const VALID_EXECUTORS: ExecutorType[] = ['cowork', 'claude-code'];

interface TaskWithProject {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  task_type: string;
  priority: number;
  status: string;
  assignee: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  project_slug: string;
  project_name: string;
}

function validateExecutor(request: NextRequest): ExecutorType | NextResponse {
  const executor = request.headers.get('X-Executor');
  if (!executor || !VALID_EXECUTORS.includes(executor as ExecutorType)) {
    return NextResponse.json(
      { error: `X-Executor header must be one of: ${VALID_EXECUTORS.join(', ')}` },
      { status: 400 }
    );
  }
  return executor as ExecutorType;
}

// GET /api/executor/next — returns next pending task for the executor's assignee
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!hasValidApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const executorResult = validateExecutor(request);
  if (executorResult instanceof NextResponse) return executorResult;
  const executor: ExecutorType = executorResult;

  const { searchParams } = new URL(request.url);
  const projectSlug = searchParams.get('project');

  // Validate project slug if provided
  if (projectSlug !== null && (typeof projectSlug !== 'string' || projectSlug.length === 0 || projectSlug.length > 100)) {
    return NextResponse.json({ error: 'Invalid project slug' }, { status: 400 });
  }

  const assignee: Assignee = executor;

  let rows: TaskWithProject[];

  if (projectSlug) {
    rows = await sql`
      SELECT
        t.*,
        p.name AS project_slug,
        p.display_name AS project_name
      FROM vybepm_tasks t
      JOIN vybepm_projects p ON p.id = t.project_id
      WHERE t.status = 'pending'
        AND t.assignee = ${assignee}
        AND p.name = ${projectSlug}
      ORDER BY t.priority ASC, t.sort_order ASC, t.created_at ASC
      LIMIT 1
    ` as TaskWithProject[];
  } else {
    rows = await sql`
      SELECT
        t.*,
        p.name AS project_slug,
        p.display_name AS project_name
      FROM vybepm_tasks t
      JOIN vybepm_projects p ON p.id = t.project_id
      WHERE t.status = 'pending'
        AND t.assignee = ${assignee}
      ORDER BY t.priority ASC, t.sort_order ASC, t.created_at ASC
      LIMIT 1
    ` as TaskWithProject[];
  }

  if (rows.length === 0) {
    return new NextResponse(null, { status: 204 });
  }

  return NextResponse.json(rows[0]);
}
