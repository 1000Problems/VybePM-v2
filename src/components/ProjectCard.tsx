'use client';

import Link from 'next/link';
import { ProjectWithCounts } from '@/lib/types';

export default function ProjectCard({ project }: { project: ProjectWithCounts }) {
  return (
    <Link href={`/projects/${project.name}`}>
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg overflow-hidden hover:border-[var(--text-muted)] transition-colors cursor-pointer group">
        {/* Color bar */}
        <div className="h-1" style={{ backgroundColor: project.color || 'var(--border)' }} />

        <div className="p-4">
          {/* Name + description */}
          <h3 className="text-[var(--text-primary)] font-semibold text-base transition-colors">
            {project.display_name}
          </h3>
          {project.description && (
            <p className="text-[var(--text-secondary)] text-sm mt-1 line-clamp-2">{project.description}</p>
          )}

          {/* Tech stack badges */}
          {project.tech_stack && project.tech_stack.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {project.tech_stack.map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-0.5 text-xs rounded-full bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border)]"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}

          {/* Task counts */}
          <div className="flex items-center gap-4 mt-4 text-xs text-[var(--text-secondary)]">
            {project.pending_count > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                {project.pending_count} pendiente{project.pending_count !== 1 ? 's' : ''}
              </span>
            )}
            {project.in_progress_count > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                {project.in_progress_count} en progreso
              </span>
            )}
            <span className="text-[var(--text-muted)]">{project.total_count} total</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
