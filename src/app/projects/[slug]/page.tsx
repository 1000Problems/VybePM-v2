'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { Project, Task } from '@/lib/types';
import { useI18n } from '@/lib/i18n';
import TaskGrid from '@/components/TaskGrid';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageToggle from '@/components/LanguageToggle';

export default function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { t } = useI18n();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [projRes, tasksRes] = await Promise.all([
      fetch(`/api/projects/${slug}`),
      fetch(`/api/projects/${slug}/tasks`),
    ]);
    if (projRes.ok) setProject(await projRes.json());
    if (tasksRes.ok) setTasks(await tasksRes.json());
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return <div className="min-h-screen bg-[var(--bg-primary)] p-6 text-[var(--text-secondary)]">{t('loading')}</div>;
  }

  if (!project) {
    return <div className="min-h-screen bg-[var(--bg-primary)] p-6 text-[var(--text-secondary)]">{t('project.notFound')}</div>;
  }

  const accent = project.color || '#4dabf7';

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="relative border-b border-[var(--border)] overflow-hidden">
        {/* Accent wash background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${accent}12 0%, ${accent}04 40%, transparent 70%)`,
          }}
        />
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, ${accent}dd, ${accent}30, transparent)` }}
        />

        <div className="relative max-w-6xl mx-auto px-6 py-5">
          {/* Nav row */}
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 10L4 6l4-4" />
              </svg>
              {t('nav.back')}
            </Link>

            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>

          {/* Project identity */}
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <h1
                className="text-[28px] md:text-[36px] leading-none text-[var(--text-primary)] tracking-tight"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)' }}
              >
                {project.display_name}
              </h1>

              {project.description && (
                <p className="text-[var(--text-secondary)] text-sm mt-2 max-w-2xl leading-relaxed">
                  {project.description}
                </p>
              )}

              {/* Tech stack + links row */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {project.tech_stack && project.tech_stack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2.5 py-0.5 text-[11px] font-medium rounded-md text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                    style={{ background: 'var(--bg-secondary)' }}
                  >
                    {tech}
                  </span>
                ))}

                {project.github_repo && (
                  <a
                    href={`https://github.com/${project.github_repo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                    </svg>
                    {project.github_repo}
                  </a>
                )}

                {project.deploy_url && (
                  <a
                    href={project.deploy_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium transition-opacity opacity-80 hover:opacity-100"
                    style={{ color: accent }}
                  >
                    ↗ {t('project.viewLive')}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Task grid */}
      <div className="max-w-6xl mx-auto px-6 py-5">
        <TaskGrid projectSlug={slug} tasks={tasks} onTasksChange={fetchData} />
      </div>
    </div>
  );
}
