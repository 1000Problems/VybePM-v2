'use client';

import { useEffect, useState } from 'react';
import ProjectCard from '@/components/ProjectCard';
import VideoCommandBar from '@/components/VideoCommandBar';
import ThemeToggle from '@/components/ThemeToggle';
import { ProjectWithCounts } from '@/lib/types';

export default function HomePage() {
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
    <div className="min-h-screen bg-[var(--bg-primary)] p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">VybePM</h1>
          <ThemeToggle />
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-6">Orquestación de tareas — 1000Problems</p>

        {/* Video Command Bar */}
        <VideoCommandBar />

        {/* Project Grid */}
        <h2 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-3">Proyectos</h2>

        {loading ? (
          <div className="text-[var(--text-secondary)] text-sm">Cargando proyectos...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
