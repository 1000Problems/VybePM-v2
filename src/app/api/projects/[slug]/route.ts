import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Project } from '@/lib/types';

// GET /api/projects/[slug] — single project
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params;
  const rows = await sql`
    SELECT * FROM vybepm_projects WHERE name = ${slug} AND is_active = true
  `;
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  return NextResponse.json(rows[0] as Project);
}

// PATCH /api/projects/[slug] — update project
export async function PATCH(
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

  // Validate fields if provided
  if (body.display_name !== undefined && (typeof body.display_name !== 'string' || (body.display_name as string).length > 200)) {
    return NextResponse.json({ error: 'display_name must be a string (max 200 chars)' }, { status: 400 });
  }
  if (body.description !== undefined && typeof body.description !== 'string') {
    return NextResponse.json({ error: 'description must be a string' }, { status: 400 });
  }
  if (body.color !== undefined && (typeof body.color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(body.color as string))) {
    return NextResponse.json({ error: 'color must be a hex color (#RRGGBB)' }, { status: 400 });
  }
  if (body.tech_stack !== undefined && !Array.isArray(body.tech_stack)) {
    return NextResponse.json({ error: 'tech_stack must be an array' }, { status: 400 });
  }

  // Build dynamic update
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  const allowedFields = ['display_name', 'description', 'tech_stack', 'github_repo', 'deploy_url', 'color', 'sort_order', 'is_active'];

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

  updates.push(`updated_at = NOW()`);
  values.push(slug);

  const query = `UPDATE vybepm_projects SET ${updates.join(', ')} WHERE name = $${paramIndex} RETURNING *`;
  const rows = await sql.query(query, values);

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  return NextResponse.json(rows[0] as Project);
}
