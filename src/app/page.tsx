'use client';

import { useEffect, useState } from 'react';
import ProjectCard from '@/components/ProjectCard';
import VideoCommandBar from '@/components/VideoCommandBar';
import { ProjectWithCounts } from '@/lib/types';

export default function HomePage() {
  const [projects, setProjects] = useState<ProjectWithCounts[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/projects')
      .then((res) => res.json())
      .then((data: ProjectWithCounts[]) => {
        setProjects(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0e1117] p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-[#e6edf3] mb-1">VybePM</h1>
        <p className="text-sm text-[#8b949e] mb-6">Orquestación de tareas — 1000Problems</p>

        {/* Video Command Bar */}
        <VideoCommandBar />

        {/* Project Grid */}
        <h2 className="text-sm font-medium text-[#8b949e] uppercase tracking-wide mb-3">Proyectos</h2>

        {loading ? (
          <div className="text-[#8b949e] text-sm">Cargando proyectos...</div>
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
