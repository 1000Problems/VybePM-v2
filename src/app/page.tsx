'use client';

import { useEffect, useState } from 'react';
import ProjectCard from '@/components/ProjectCard';
import VideoCommandBar from '@/components/VideoCommandBar';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageToggle from '@/components/LanguageToggle';
import { ProjectWithCounts } from '@/lib/types';
import { useI18n } from '@/lib/i18n';

export default function HomePage() {
  const { t } = useI18n();
  const [projects, setProjects] = useState<ProjectWithCounts[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = () => {
      fetch('/api/projects')
        .then((res) => res.json())
        .then((data: ProjectWithCounts[]) => {
          setProjects(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };
    fetchProjects();
    const interval = setInterval(fetchProjects, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen px-5 py-8 md:px-10 md:py-12">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <header className="mb-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1
                className="text-[52px] md:text-[68px] leading-none text-[var(--text-primary)] tracking-tight"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
              >
                Vybe
                <span style={{ color: 'var(--accent-violet)' }}>PM</span>
              </h1>
              <p className="text-[var(--text-secondary)] text-sm mt-2">{t('nav.subtitle')}</p>
            </div>

            <div className="flex items-center gap-2 mt-2 shrink-0">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>

          {/* Divider */}
          <div
            className="mt-7 h-px"
            style={{
              background: 'linear-gradient(90deg, var(--accent-blue) 0%, var(--border) 30%, transparent 100%)',
              opacity: 0.45,
            }}
          />
        </header>

        {/* Video Command Bar */}
        <VideoCommandBar />

        {/* Projects section */}
        <section>
          <h2
            className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.14em] mb-4"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {t('nav.projects')}
          </h2>

          {loading ? (
            <div className="text-[var(--text-secondary)] text-sm">{t('loading.projects')}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project, i) => (
                <div key={project.id} className="stagger-reveal" style={{ animationDelay: `${i * 65}ms` }}>
                  <ProjectCard project={project} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
