import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { ProjectWithCounts } from '@/lib/types';

// GET /api/projects — list all active projects with task counts
export async function GET(): Promise<NextResponse> {
  const rows = await sql`
    SELECT
      p.*,
      COALESCE(SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END), 0)::int AS pending_count,
      COALESCE(SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END), 0)::int AS in_progress_count,
      COALESCE(COUNT(t.id), 0)::int AS total_count
    FROM vybepm_projects p
    LEFT JOIN vybepm_tasks t ON t.project_id = p.id
    WHERE p.is_active = true AND p.name != 'prompts'
    GROUP BY p.id
    ORDER BY p.sort_order, p.name
  `;
  return NextResponse.json(rows as ProjectWithCounts[]);
}

// POST /api/projects — create project
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { name, display_name, description, tech_stack, github_repo, deploy_url, color, sort_order } = body;

  if (!name || typeof name !== 'string' || name.length > 100) {
    return NextResponse.json({ error: 'name is required (string, max 100 chars)' }, { status: 400 });
  }
  if (!display_name || typeof display_name !== 'string' || display_name.length > 200) {
    return NextResponse.json({ error: 'display_name is required (string, max 200 chars)' }, { status: 400 });
  }
  if (description !== undefined && typeof description !== 'string') {
    return NextResponse.json({ error: 'description must be a string' }, { status: 400 });
  }
  if (tech_stack !== undefined && !Array.isArray(tech_stack)) {
    return NextResponse.json({ error: 'tech_stack must be an array' }, { status: 400 });
  }
  if (color !== undefined && (typeof color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(color))) {
    return NextResponse.json({ error: 'color must be a hex color (#RRGGBB)' }, { status: 400 });
  }

  const rows = await sql`
    INSERT INTO vybepm_projects (name, display_name, description, tech_stack, github_repo, deploy_url, color, sort_order)
    VALUES (
      ${name as string},
      ${display_name as string},
      ${(description as string) || null},
      ${(tech_stack as string[]) || null},
      ${(github_repo as string) || null},
      ${(deploy_url as string) || null},
      ${(color as string) || null},
      ${(sort_order as number) || 0}
    )
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
}
