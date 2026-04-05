'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { Task } from '@/lib/types';

interface VideoRequest {
  id: number | string; // string for optimistic (temp) IDs
  title: string;
  status: 'pending' | 'in_progress' | 'review' | 'checked_in' | 'deployed' | 'done';
  error?: boolean;
  attachmentUrl?: string;
}

export default function VideoCommandBar() {
  const [prompt, setPrompt] = useState('');
  const [requests, setRequests] = useState<VideoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/projects/prompts/tasks?limit=10');
      if (res.ok) {
        const tasks: Task[] = await res.json();
        setRequests(tasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          attachmentUrl: undefined, // TODO: populate from attachments in Phase 2
        })));
      }
    } catch {
      // silently fail on fetch
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    const text = prompt.trim();
    if (!text || sending) return;

    // Optimistic: add to feed immediately
    const tempId = `temp-${Date.now()}`;
    const optimistic: VideoRequest = { id: tempId, title: text, status: 'pending' };
    setRequests((prev) => [optimistic, ...prev].slice(0, 10));
    setPrompt('');
    setSending(true);

    try {
      const res = await fetch('/api/projects/prompts/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: text,
          task_type: 'animation',
          assignee: 'cowork',
          priority: 2,
        }),
      });

      if (res.ok) {
        const task: Task = await res.json();
        // Replace optimistic entry with real one
        setRequests((prev) =>
          prev.map((r) => (r.id === tempId ? { id: task.id, title: task.title, status: task.status } : r))
        );
      } else {
        // Mark as error
        setRequests((prev) =>
          prev.map((r) => (r.id === tempId ? { ...r, error: true } : r))
        );
      }
    } catch {
      setRequests((prev) =>
        prev.map((r) => (r.id === tempId ? { ...r, error: true } : r))
      );
    } finally {
      setSending(false);
    }
  };

  const renderStatus = (req: VideoRequest) => {
    if (req.error) {
      return <span className="text-red-400 text-xs">Error</span>;
    }

    switch (req.status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1.5 text-xs text-[#8b949e] shrink-0">
            <span className="w-2 h-2 rounded-full bg-gray-500" />
            En cola
          </span>
        );
      case 'in_progress':
        return (
          <span className="flex items-center gap-1.5 text-xs text-blue-400 shrink-0">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Procesando...
          </span>
        );
      case 'done':
      case 'review':
      case 'checked_in':
      case 'deployed':
        return (
          <span className="flex items-center gap-1.5 text-xs text-green-400 shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {req.attachmentUrl ? (
              <a href={req.attachmentUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                Ver video
              </a>
            ) : (
              'Ver video'
            )}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-6">
      <h2 className="text-sm font-medium text-[#8b949e] uppercase tracking-wide mb-3">
        Solicitudes de Video
      </h2>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe un video..."
          className="flex-1 bg-[#0e1117] border border-[#30363d] rounded-md px-3 py-2 text-sm text-[#e6edf3] placeholder-[#484f58] outline-none focus:border-[#e040fb] transition-colors"
        />
        <button
          type="submit"
          disabled={!prompt.trim() || sending}
          className="px-4 py-2 bg-[#e040fb] text-white text-sm font-medium rounded-md hover:bg-[#c030db] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          Enviar
        </button>
      </form>

      {/* Feed */}
      {loading ? (
        <p className="text-xs text-[#484f58]">Cargando...</p>
      ) : requests.length > 0 ? (
        <div className="space-y-1">
          {requests.map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between gap-3 py-1.5 px-2 rounded hover:bg-[#0e1117]/50 text-sm"
            >
              <span className="text-[#e6edf3] truncate flex-1 min-w-0">{req.title}</span>
              {renderStatus(req)}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
