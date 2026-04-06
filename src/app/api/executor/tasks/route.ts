import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Task, VALID_TASK_TYPES, VALID_ASSIGNEES, TaskType, Assignee, Priority } from '@/lib/types';

type ExecutorType = 'cowork' | 'claude-code';
const VALID_EXECUTORS: ExecutorType[] = ['cowork', 'claude-code'];

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

// POST /api/executor/tasks — create a task
export async function POST(request: NextRequest): Promise<NextResponse> {
  const apiKey = request.headers.get('X-API-Key');
  const expectedKey = process.env.VYBEPM_API_KEY;
  if (!expectedKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }
  if (!apiKey || apiKey !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const executorResult = validateExecutor(request);
  if (executorResult instanceof NextResponse) return executorResult;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { project, title, description, task_type, priority, assignee } = body;

  // Validate required fields
  if (!project || typeof project !== 'string' || project.length > 100) {
    return NextResponse.json({ error: 'project is required (string slug, max 100 chars)' }, { status: 400 });
  }
  if (!title || typeof title !== 'string' || title.length > 500) {
    return NextResponse.json({ error: 'title is required (string, max 500 chars)' }, { status: 400 });
  }
  if (description !== undefined && typeof description !== 'string') {
    return NextResponse.json({ error: 'description must be a string' }, { status: 400 });
  }
  if (!task_type || !VALID_TASK_TYPES.includes(task_type as TaskType)) {
    return NextResponse.json({ error: `task_type is required and must be one of: ${VALID_TASK_TYPES.join(', ')}` }, { status: 400 });
  }
  if (!priority) {
    return NextResponse.json({ error: 'priority is required (1-4)' }, { status: 400 });
  }
  const p = Number(priority);
  if (!Number.isInteger(p) || p < 1 || p > 4) {
    return NextResponse.json({ error: 'priority must be 1-4' }, { status: 400 });
  }
  if (!assignee || !VALID_ASSIGNEES.includes(assignee as Assignee)) {
    return NextResponse.json({ error: `assignee is required and must be one of: ${VALID_ASSIGNEES.join(', ')}` }, { status: 400 });
  }

  // Look up project by slug (name column)
  const projects = await sql`SELECT id FROM vybepm_projects WHERE name = ${project as string}`;
  if (projects.length === 0) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  const projectId = projects[0].id as number;

  const rows = await sql`
    INSERT INTO vybepm_tasks (project_id, title, description, task_type, priority, assignee)
    VALUES (
      ${projectId},
      ${title as string},
      ${(description as string) || null},
      ${task_type as string},
      ${p as Priority},
      ${assignee as string}
    )
    RETURNING *
  `;

  return NextResponse.json(rows[0] as Task, { status: 201 });
}
