'use client';

import Link from 'next/link';
import { ProjectWithCounts } from '@/lib/types';
import { useI18n } from '@/lib/i18n';

export default function ProjectCard({ project }: { project: ProjectWithCounts }) {
  const { t } = useI18n();
  const accent = project.color || '#4dabf7';

  return (
    <Link href={`/projects/${project.name}`} className="block group">
      <div
        className="relative rounded-xl border border-[var(--border)] overflow-hidden cursor-pointer"
        style={{
          background: `linear-gradient(145deg, var(--bg-secondary) 0%, var(--bg-elevated) 100%)`,
          transition: 'border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.transform = 'translateY(-3px)';
          el.style.boxShadow = `0 8px 32px -8px ${accent}40, 0 2px 8px -2px rgba(0,0,0,0.4)`;
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.transform = 'translateY(0)';
          el.style.boxShadow = 'none';
        }}
      >
        {/* Accent gradient header area */}
        <div
          className="relative px-5 pt-5 pb-4"
          style={{
            background: `linear-gradient(135deg, ${accent}1a 0%, ${accent}06 50%, transparent 100%)`,
          }}
        >
          {/* Top accent line */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: `linear-gradient(90deg, ${accent}cc, ${accent}20, transparent)` }}
          />

          {/* Decorative corner orb */}
          <div
            className="absolute top-0 right-0 w-24 h-24 rounded-bl-full pointer-events-none"
            style={{ background: `radial-gradient(circle at top right, ${accent}12, transparent 70%)` }}
          />

          <h3
            className="text-[var(--text-primary)] text-[17px] leading-snug break-words relative"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '-0.02em' }}
          >
            {project.display_name}
          </h3>

          {project.description && (
            <p className="text-[var(--text-secondary)] text-xs mt-1.5 line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          )}
        </div>

        {/* Card body */}
        <div className="px-5 pb-4">
          {/* Tech stack badges */}
          {project.tech_stack && project.tech_stack.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {project.tech_stack.map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-0.5 text-[11px] font-medium rounded-md text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                  style={{ background: 'var(--bg-primary)' }}
                >
                  {tech}
                </span>
              ))}
            </div>
          )}

          {/* Footer: task counts + deploy link */}
          <div className="flex items-center justify-between text-xs mt-1">
            <div className="flex items-center gap-3 text-[var(--text-secondary)]">
              {project.in_progress_count > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-blue)' }} />
                  {project.in_progress_count} {t('project.inProgress')}
                </span>
              )}
              {project.pending_count > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
                  {project.pending_count} {project.pending_count !== 1 ? t('project.pendingPlural') : t('project.pending')}
                </span>
              )}
              {project.pending_count === 0 && project.in_progress_count === 0 && (
                <span className="text-[var(--text-muted)]">{project.total_count} {t('project.total')}</span>
              )}
            </div>

            {project.deploy_url && (
              <a
                href={project.deploy_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-0.5 font-medium transition-opacity opacity-60 hover:opacity-100"
                style={{ color: accent }}
              >
                ↗ live
              </a>
            )}
          </div>
        </div>

        {/* Hover glow border overlay */}
        <div
          className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100"
          style={{
            boxShadow: `inset 0 0 0 1px ${accent}55`,
            transition: 'opacity 0.15s ease',
          }}
        />
      </div>
    </Link>
  );
}
