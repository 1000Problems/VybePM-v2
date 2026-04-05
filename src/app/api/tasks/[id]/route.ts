import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Task, TaskStatus, VALID_TASK_TYPES, VALID_STATUSES, VALID_ASSIGNEES, STATUS_TRANSITIONS, TaskType, Assignee } from '@/lib/types';

// PATCH /api/tasks/[id] — update task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const taskId = Number(id);
  if (!Number.isInteger(taskId) || taskId < 1) {
    return NextResponse.json({ error: 'Invalid task id' }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Get current task
  const existing = await sql`SELECT * FROM vybepm_tasks WHERE id = ${taskId}`;
  if (existing.length === 0) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
  const currentTask = existing[0] as Task;

  // Validate fields
  if (body.title !== undefined && (typeof body.title !== 'string' || (body.title as string).length > 500 || (body.title as string).length === 0)) {
    return NextResponse.json({ error: 'title must be a non-empty string (max 500 chars)' }, { status: 400 });
  }
  if (body.description !== undefined && body.description !== null && typeof body.description !== 'string') {
    return NextResponse.json({ error: 'description must be a string or null' }, { status: 400 });
  }
  if (body.task_type !== undefined && !VALID_TASK_TYPES.includes(body.task_type as TaskType)) {
    return NextResponse.json({ error: `task_type must be one of: ${VALID_TASK_TYPES.join(', ')}` }, { status: 400 });
  }
  if (body.priority !== undefined) {
    const p = Number(body.priority);
    if (!Number.isInteger(p) || p < 1 || p > 4) {
      return NextResponse.json({ error: 'priority must be 1-4' }, { status: 400 });
    }
  }
  if (body.assignee !== undefined && !VALID_ASSIGNEES.includes(body.assignee as Assignee)) {
    return NextResponse.json({ error: `assignee must be one of: ${VALID_ASSIGNEES.join(', ')}` }, { status: 400 });
  }

  // Enforce state machine for status changes
  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status as TaskStatus)) {
      return NextResponse.json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
    }
    const currentStatus = currentTask.status as TaskStatus;
    const newStatus = body.status as TaskStatus;
    const allowed = STATUS_TRANSITIONS[currentStatus];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        { error: `Cannot transition from '${currentStatus}' to '${newStatus}'. Allowed: ${allowed.join(', ') || 'none'}` },
        { status: 400 }
      );
    }
  }

  // Build dynamic update
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  const allowedFields = ['title', 'description', 'task_type', 'priority', 'status', 'assignee'];
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = $${paramIndex}`);
      values.push(body[field]);
      paramIndex++;
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  // Set timestamps based on status change
  if (body.status === 'in_progress' && !currentTask.started_at) {
    updates.push(`started_at = NOW()`);
  }
  if (body.status === 'done') {
    updates.push(`completed_at = NOW()`);
  }
  updates.push(`updated_at = NOW()`);

  values.push(taskId);
  const query = `UPDATE vybepm_tasks SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  const rows = await sql.query(query, values);

  return NextResponse.json(rows[0] as Task);
}

// DELETE /api/tasks/[id] — hard delete for pending only
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const taskId = Number(id);
  if (!Number.isInteger(taskId) || taskId < 1) {
    return NextResponse.json({ error: 'Invalid task id' }, { status: 400 });
  }

  const existing = await sql`SELECT status FROM vybepm_tasks WHERE id = ${taskId}`;
  if (existing.length === 0) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
  if (existing[0].status !== 'pending') {
    return NextResponse.json({ error: 'Only pending tasks can be deleted' }, { status: 400 });
  }

  await sql`DELETE FROM vybepm_tasks WHERE id = ${taskId}`;
  return NextResponse.json({ success: true });
}
