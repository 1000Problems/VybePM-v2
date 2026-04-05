'use client';

import Link from 'next/link';
import { ProjectWithCounts } from '@/lib/types';

export default function ProjectCard({ project }: { project: ProjectWithCounts }) {
  return (
    <Link href={`/projects/${project.name}`}>
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden hover:border-[#484f58] transition-colors cursor-pointer group">
        {/* Color bar */}
        <div className="h-1" style={{ backgroundColor: project.color || '#30363d' }} />

        <div className="p-4">
          {/* Name + description */}
          <h3 className="text-[#e6edf3] font-semibold text-base group-hover:text-white transition-colors">
            {project.display_name}
          </h3>
          {project.description && (
            <p className="text-[#8b949e] text-sm mt-1 line-clamp-2">{project.description}</p>
          )}

          {/* Tech stack badges */}
          {project.tech_stack && project.tech_stack.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {project.tech_stack.map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-0.5 text-xs rounded-full bg-[#0e1117] text-[#8b949e] border border-[#30363d]"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}

          {/* Task counts */}
          <div className="flex items-center gap-4 mt-4 text-xs text-[#8b949e]">
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
            <span className="text-[#484f58]">{project.total_count} total</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
