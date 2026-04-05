'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { Project, Task } from '@/lib/types';
import TaskGrid from '@/components/TaskGrid';

export default function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
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
  }, [fetchData]);

  if (loading) {
    return <div className="min-h-screen bg-[#0e1117] p-6 text-[#8b949e]">Cargando...</div>;
  }

  if (!project) {
    return <div className="min-h-screen bg-[#0e1117] p-6 text-[#8b949e]">Proyecto no encontrado</div>;
  }

  return (
    <div className="min-h-screen bg-[#0e1117]">
      {/* Header */}
      <div className="border-b border-[#30363d] px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="text-xs text-[#58a6ff] hover:underline mb-2 inline-block">
            &larr; Volver a proyectos
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: project.color || '#30363d' }} />
            <h1 className="text-xl font-bold text-[#e6edf3]">{project.display_name}</h1>
            {project.github_repo && (
              <a
                href={`https://github.com/${project.github_repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#8b949e] hover:text-[#58a6ff]"
              >
                {project.github_repo}
              </a>
            )}
          </div>

          {project.description && (
            <p className="text-sm text-[#8b949e] mt-1 ml-6">{project.description}</p>
          )}

          {project.tech_stack && project.tech_stack.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2 ml-6">
              {project.tech_stack.map((tech) => (
                <span key={tech} className="px-2 py-0.5 text-xs rounded-full bg-[#161b22] text-[#8b949e] border border-[#30363d]">
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task grid */}
      <div className="max-w-6xl mx-auto px-6 py-4">
        <TaskGrid projectSlug={slug} tasks={tasks} onTasksChange={fetchData} />
      </div>
    </div>
  );
}
