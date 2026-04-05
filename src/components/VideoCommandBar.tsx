'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { Task } from '@/lib/types';
import { useI18n } from '@/lib/i18n';

interface VideoRequest {
  id: number | string; // string for optimistic (temp) IDs
  title: string;
  status: 'pending' | 'in_progress' | 'review' | 'checked_in' | 'deployed' | 'done';
  error?: boolean;
  attachmentUrl?: string;
}

export default function VideoCommandBar() {
  const { t } = useI18n();
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
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
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
          <span className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] shrink-0">
            <span className="w-2 h-2 rounded-full bg-gray-500" />
            {t('video.queued')}
          </span>
        );
      case 'in_progress':
        return (
          <span className="flex items-center gap-1.5 text-xs text-blue-400 shrink-0">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            {t('video.processing')}
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
                {t('video.view')}
              </a>
            ) : (
              t('video.view')
            )}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4 mb-6">
      <h2 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-3">
        {t('video.title')}
      </h2>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t('video.placeholder')}
          className="flex-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[#e040fb] transition-colors"
        />
        <button
          type="submit"
          disabled={!prompt.trim() || sending}
          className="px-4 py-2 bg-[#e040fb] text-white text-sm font-medium rounded-md hover:bg-[#c030db] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {t('video.submit')}
        </button>
      </form>

      {/* Feed */}
      {loading ? (
        <p className="text-xs text-[var(--text-muted)]">{t('loading')}</p>
      ) : requests.length > 0 ? (
        <div className="space-y-1">
          {requests.map((req) => (
            <div
              key={req.id}
              className="flex items-start justify-between gap-3 py-1.5 px-2 rounded hover:bg-[var(--bg-primary)]/50 text-sm"
            >
              <span className="text-[var(--text-primary)] flex-1 min-w-0 line-clamp-3">{req.title}</span>
              <div className="pt-0.5 shrink-0">{renderStatus(req)}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
