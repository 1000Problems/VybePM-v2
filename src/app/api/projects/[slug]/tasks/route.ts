import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Task, VALID_TASK_TYPES, VALID_ASSIGNEES, TaskType, Assignee, Priority } from '@/lib/types';

// GET /api/projects/[slug]/tasks — list tasks for project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status');
  const assigneeFilter = searchParams.get('assignee');

  // Get project id
  const projects = await sql`SELECT id FROM vybepm_projects WHERE name = ${slug}`;
  if (projects.length === 0) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  const projectId = projects[0].id as number;

  let query = 'SELECT * FROM vybepm_tasks WHERE project_id = $1';
  const values: unknown[] = [projectId];
  let paramIndex = 2;

  if (statusFilter) {
    query += ` AND status = $${paramIndex}`;
    values.push(statusFilter);
    paramIndex++;
  }
  if (assigneeFilter) {
    query += ` AND assignee = $${paramIndex}`;
    values.push(assigneeFilter);
    paramIndex++;
  }

  query += ' ORDER BY priority ASC, sort_order ASC, created_at DESC';

  const limitParam = searchParams.get('limit');
  if (limitParam) {
    const limit = Number(limitParam);
    if (Number.isInteger(limit) && limit > 0 && limit <= 100) {
      query += ` LIMIT $${paramIndex}`;
      values.push(limit);
      paramIndex++;
    }
  }

  const rows = await sql.query(query, values);
  return NextResponse.json(rows as Task[]);
}

// POST /api/projects/[slug]/tasks — create task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Get project
  const projects = await sql`SELECT id FROM vybepm_projects WHERE name = ${slug}`;
  if (projects.length === 0) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  const projectId = projects[0].id as number;

  const { title, description, task_type, priority, assignee, sort_order } = body;

  if (!title || typeof title !== 'string' || title.length > 500) {
    return NextResponse.json({ error: 'title is required (string, max 500 chars)' }, { status: 400 });
  }
  if (description !== undefined && typeof description !== 'string') {
    return NextResponse.json({ error: 'description must be a string' }, { status: 400 });
  }
  if (task_type !== undefined && !VALID_TASK_TYPES.includes(task_type as TaskType)) {
    return NextResponse.json({ error: `task_type must be one of: ${VALID_TASK_TYPES.join(', ')}` }, { status: 400 });
  }
  if (priority !== undefined) {
    const p = Number(priority);
    if (!Number.isInteger(p) || p < 1 || p > 4) {
      return NextResponse.json({ error: 'priority must be 1-4' }, { status: 400 });
    }
  }
  if (assignee !== undefined && !VALID_ASSIGNEES.includes(assignee as Assignee)) {
    return NextResponse.json({ error: `assignee must be one of: ${VALID_ASSIGNEES.join(', ')}` }, { status: 400 });
  }

  const rows = await sql`
    INSERT INTO vybepm_tasks (project_id, title, description, task_type, priority, assignee, sort_order)
    VALUES (
      ${projectId},
      ${title as string},
      ${(description as string) || null},
      ${(task_type as string) || 'dev'},
      ${(priority as Priority) || 2},
      ${(assignee as string) || 'claude-code'},
      ${(sort_order as number) || 0}
    )
    RETURNING *
  `;
  return NextResponse.json(rows[0] as Task, { status: 201 });
}
