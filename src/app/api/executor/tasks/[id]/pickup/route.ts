import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { hasValidApiKey } from '@/lib/auth';
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

// PATCH /api/executor/tasks/[id]/pickup — atomic pickup with SELECT FOR UPDATE
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  if (!hasValidApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const executorResult = validateExecutor(request);
  if (executorResult instanceof NextResponse) return executorResult;

  const { id } = await params;
  const taskId = Number(id);
  if (!Number.isInteger(taskId) || taskId < 1) {
    return NextResponse.json({ error: 'Invalid task id' }, { status: 400 });
  }

  // Atomic pickup: BEGIN, SELECT FOR UPDATE where pending, UPDATE to in_progress, COMMIT
  // Neon serverless doesn't support real transactions with SELECT FOR UPDATE,
  // so we use an atomic UPDATE with WHERE status='pending' RETURNING *
  const rows = await sql`
    UPDATE vybepm_tasks
    SET status = 'in_progress',
        started_at = NOW(),
        updated_at = NOW()
    WHERE id = ${taskId}
      AND status = 'pending'
    RETURNING *
  `;

  if (rows.length === 0) {
    // Check if the task exists at all
    const existing = await sql`SELECT id, status FROM vybepm_tasks WHERE id = ${taskId}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: `Task is not pending (current status: ${existing[0].status})` },
      { status: 409 }
    );
  }

  return NextResponse.json(rows[0] as Task);
}
