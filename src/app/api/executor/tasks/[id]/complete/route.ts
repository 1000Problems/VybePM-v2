import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Task } from '@/lib/types';

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

// PATCH /api/executor/tasks/[id]/complete — set to review, include notes
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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

  const { id } = await params;
  const taskId = Number(id);
  if (!Number.isInteger(taskId) || taskId < 1) {
    return NextResponse.json({ error: 'Invalid task id' }, { status: 400 });
  }

  // Parse body for notes
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { notes } = body;
  if (notes !== undefined && typeof notes !== 'string') {
    return NextResponse.json({ error: 'notes must be a string' }, { status: 400 });
  }

  // Verify task exists and is in_progress
  const existing = await sql`SELECT * FROM vybepm_tasks WHERE id = ${taskId}`;
  if (existing.length === 0) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const task = existing[0] as Task;
  if (task.status !== 'in_progress') {
    return NextResponse.json(
      { error: `Task must be in_progress to complete (current status: ${task.status})` },
      { status: 400 }
    );
  }

  // Build updated description with appended notes
  let updatedDescription = task.description || '';
  if (notes && typeof notes === 'string' && notes.trim().length > 0) {
    if (updatedDescription.length > 0) {
      updatedDescription += '\n\n---\n\n';
    }
    updatedDescription += `**Executor Notes:**\n${notes}`;
  }

  const rows = await sql`
    UPDATE vybepm_tasks
    SET status = 'review',
        completed_at = NOW(),
        updated_at = NOW(),
        description = ${updatedDescription || null}
    WHERE id = ${taskId}
    RETURNING *
  `;

  return NextResponse.json(rows[0] as Task);
}
