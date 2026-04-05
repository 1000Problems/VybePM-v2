import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// PATCH /api/tasks/[id]/reorder — update sort_order
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const taskId = Number(id);
  if (!Number.isInteger(taskId) || taskId < 1) {
    return NextResponse.json({ error: 'Invalid task id' }, { status: 400 });
  }

  let body: { sort_order?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const sortOrder = Number(body.sort_order);
  if (!Number.isInteger(sortOrder)) {
    return NextResponse.json({ error: 'sort_order must be an integer' }, { status: 400 });
  }

  const rows = await sql`
    UPDATE vybepm_tasks SET sort_order = ${sortOrder}, updated_at = NOW()
    WHERE id = ${taskId}
    RETURNING *
  `;
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}
