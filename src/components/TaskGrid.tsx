'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Task, TaskStatus, TaskType, Assignee, VALID_TASK_TYPES, VALID_STATUSES, VALID_ASSIGNEES, STATUS_TRANSITIONS, STATUS_LABEL_KEYS, TASK_TYPE_LABEL_KEYS, ASSIGNEE_LABEL_KEYS, PRIORITY_LABEL_KEYS } from '@/lib/types';
import { useI18n, TranslationKey } from '@/lib/i18n';
import StatusBadge from './StatusBadge';
import TaskDetail from './TaskDetail';

const PRIORITY_COLORS: Record<number, string> = {
  1: 'bg-red-500',
  2: 'bg-orange-400',
  3: 'bg-amber-400',
  4: 'bg-slate-500',
};

interface TaskGridProps {
  projectSlug: string;
  tasks: Task[];
  onTasksChange: () => void;
}

export default function TaskGrid({ projectSlug, tasks, onTasksChange }: TaskGridProps) {
  const { t, locale } = useI18n();
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [editingCell, setEditingCell] = useState<{ taskId: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [creating, setCreating] = useState(false);

  const desktopTextareaRef = useRef<HTMLTextAreaElement>(null);
  const mobileTextareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    autoResize(desktopTextareaRef.current);
    autoResize(mobileTextareaRef.current);
  }, [newTaskTitle]);

  const activeTasks = tasks.filter((t) => t.status !== 'done');
  const completedTasks = tasks
    .filter((t) => t.status === 'done')
    .sort((a, b) => {
      const aTime = a.completed_at ? new Date(a.completed_at).getTime() : 0;
      const bTime = b.completed_at ? new Date(b.completed_at).getTime() : 0;
      return bTime - aTime;
    });

  const updateTask = useCallback(async (taskId: number, updates: Record<string, unknown>) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    onTasksChange();
  }, [onTasksChange]);

  const startEdit = (taskId: number, field: string, currentValue: string) => {
    setEditingCell({ taskId, field });
    setEditValue(currentValue);
  };

  const saveEdit = async () => {
    if (!editingCell) return;
    await updateTask(editingCell.taskId, { [editingCell.field]: editValue });
    setEditingCell(null);
  };

  const deleteTask = useCallback(async (taskId: number) => {
    const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    if (res.ok) {
      onTasksChange();
    }
  }, [onTasksChange]);

  const createTask = async () => {
    if (!newTaskTitle.trim() || creating) return;
    setCreating(true);
    await fetch(`/api/projects/${projectSlug}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTaskTitle.trim() }),
    });
    setNewTaskTitle('');
    setCreating(false);
    onTasksChange();
  };

  const getLabel = (field: string, value: string): string => {
    if (field === 'status') return t(STATUS_LABEL_KEYS[value as TaskStatus] as TranslationKey);
    if (field === 'task_type') return t(TASK_TYPE_LABEL_KEYS[value as TaskType] as TranslationKey);
    if (field === 'assignee') return t(ASSIGNEE_LABEL_KEYS[value as Assignee] as TranslationKey);
    return value;
  };

  const renderDropdown = (taskId: number, field: string, currentValue: string, options: readonly string[]) => {
    const allowedOptions = field === 'status'
      ? STATUS_TRANSITIONS[currentValue as TaskStatus]
      : options;

    return (
      <select
        value={currentValue}
        onChange={(e) => updateTask(taskId, { [field]: e.target.value })}
        className="bg-transparent text-[var(--text-primary)] text-xs border-none outline-none cursor-pointer appearance-none"
      >
        <option value={currentValue} className="bg-[var(--bg-secondary)]">{getLabel(field, currentValue)}</option>
        {(allowedOptions as string[])
          .filter((o) => o !== currentValue)
          .map((opt) => (
            <option key={opt} value={opt} className="bg-[var(--bg-secondary)]">
              {getLabel(field, opt)}
            </option>
          ))}
      </select>
    );
  };

  const renderTaskRow = (task: Task, isDone: boolean, index: number = 0) => (
    <div key={task.id} className="stagger-reveal" style={{ animationDelay: `${index * 30}ms` }}>
      <div
        className={`group/row grid grid-cols-[28px_1fr_90px_100px_90px_80px_32px] gap-2 items-start px-3 py-2 border-b border-[var(--border)] hover:bg-[var(--bg-secondary)] text-sm cursor-pointer transition-colors duration-100 ${isDone ? 'opacity-50' : ''}`}
        onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
      >
        {/* Priority dot */}
        <div className="flex justify-center pt-1">
          <span className={`w-2.5 h-2.5 rounded-full ${PRIORITY_COLORS[task.priority]}`} title={t(PRIORITY_LABEL_KEYS[task.priority] as TranslationKey)} />
        </div>

        {/* Title */}
        <div className="min-w-0" onClick={(e) => e.stopPropagation()}>
          {editingCell?.taskId === task.id && editingCell.field === 'title' ? (
            <input
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingCell(null); }}
              className="w-full bg-[var(--bg-primary)] text-[var(--text-primary)] px-1 py-0.5 border border-[var(--accent-blue)] rounded text-sm outline-none"
            />
          ) : (
            <span
              className="text-[var(--text-primary)] line-clamp-2 break-words block"
              title={task.title}
              onDoubleClick={() => startEdit(task.id, 'title', task.title)}
            >
              {task.title}
            </span>
          )}
        </div>

        {/* Type */}
        <div onClick={(e) => e.stopPropagation()}>
          {renderDropdown(task.id, 'task_type', task.task_type, VALID_TASK_TYPES)}
        </div>

        {/* Status */}
        <div onClick={(e) => e.stopPropagation()}>
          {isDone ? (
            <StatusBadge status={task.status} />
          ) : (
            renderDropdown(task.id, 'status', task.status, VALID_STATUSES)
          )}
        </div>

        {/* Assignee */}
        <div onClick={(e) => e.stopPropagation()}>
          {renderDropdown(task.id, 'assignee', task.assignee, VALID_ASSIGNEES)}
        </div>

        {/* Updated / Completed */}
        <div className="text-[var(--text-muted)] text-xs" title={isDone && task.completed_at ? `Completed ${new Date(task.completed_at).toLocaleString(locale === 'es' ? 'es-ES' : 'en-US')}` : undefined}>
          {isDone && task.completed_at
            ? new Date(task.completed_at).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric' })
            : new Date(task.updated_at).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric' })}
        </div>

        {/* Delete (pending only) */}
        <div onClick={(e) => e.stopPropagation()}>
          {task.status === 'pending' && (
            <button
              onClick={() => deleteTask(task.id)}
              className="opacity-0 group-hover/row:opacity-100 text-[var(--text-muted)] hover:text-red-400 transition-opacity"
              title={t('task.delete')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Expanded detail panel — animated with CSS grid trick */}
      <div className={`task-detail-wrapper${expandedTaskId === task.id ? ' expanded' : ''}`}>
        <div>
          {expandedTaskId === task.id && (
            <TaskDetail task={task} onUpdate={onTasksChange} onClose={() => setExpandedTaskId(null)} />
          )}
        </div>
      </div>
    </div>
  );

  // Mobile card view
  const renderTaskCard = (task: Task, isDone: boolean) => (
    <div
      key={task.id}
      className={`border border-[var(--border)] rounded-xl overflow-hidden ${isDone ? 'opacity-50' : ''}`}
      style={{ background: 'var(--bg-secondary)' }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${PRIORITY_COLORS[task.priority]}`} />
          <span className="text-[var(--text-primary)] text-sm leading-snug flex-1 min-w-0 break-words" style={{ fontFamily: 'var(--font-body)' }}>
            {task.title}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={task.status} />
          <span className="text-[var(--text-secondary)] text-xs px-2 py-0.5 rounded-md border border-[var(--border-subtle)]" style={{ background: 'var(--bg-primary)' }}>
            {t(TASK_TYPE_LABEL_KEYS[task.task_type] as TranslationKey)}
          </span>
          <span className="text-[var(--text-muted)] text-xs ml-auto">
            {t(ASSIGNEE_LABEL_KEYS[task.assignee] as TranslationKey)}
          </span>
        </div>

        {isDone && task.completed_at && (
          <p className="text-[var(--text-muted)] text-xs mt-2">
            {new Date(task.completed_at).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* Action row */}
      <div className="flex items-center border-t border-[var(--border-subtle)] px-4 py-2.5 gap-3" style={{ background: 'var(--bg-elevated)' }}>
        <button
          onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
          className="text-xs text-[var(--accent-blue)] font-medium py-1"
        >
          {expandedTaskId === task.id ? t('task.close') : t('task.details')}
        </button>
        {task.status === 'pending' && (
          <button
            onClick={() => deleteTask(task.id)}
            className="text-xs text-[var(--text-muted)] hover:text-red-400 ml-auto py-1 transition-colors"
          >
            {t('task.delete')}
          </button>
        )}
      </div>

      <div className={`task-detail-wrapper${expandedTaskId === task.id ? ' expanded' : ''}`}>
        <div>
          {expandedTaskId === task.id && (
            <TaskDetail task={task} onUpdate={onTasksChange} onClose={() => setExpandedTaskId(null)} />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Desktop table header */}
      <div
        className="hidden md:grid grid-cols-[28px_1fr_90px_100px_90px_80px_32px] gap-2 px-3 py-2.5 text-[10px] text-[var(--text-muted)] border-b border-[var(--border)] uppercase tracking-[0.1em] font-semibold rounded-t-lg"
        style={{ background: 'var(--bg-elevated)' }}
      >
        <div />
        <div>{t('task.title')}</div>
        <div>{t('task.type')}</div>
        <div>{t('task.status')}</div>
        <div>{t('task.assignee')}</div>
        <div>{t('task.updated')}</div>
        <div />
      </div>

      {/* Desktop rows */}
      <div className="hidden md:block">
        {activeTasks.map((t, i) => renderTaskRow(t, false, i))}

        {/* New task row */}
        <div
          className="grid grid-cols-[28px_1fr_90px_100px_90px_80px_32px] gap-2 items-start px-3 py-2.5 border-b border-[var(--border)]"
          style={{ background: newTaskTitle.trim() ? 'var(--bg-elevated)' : 'transparent', transition: 'background 0.15s' }}
        >
          <div className="flex justify-center pt-1.5">
            <span className="text-[var(--text-muted)] text-base leading-none select-none">+</span>
          </div>
          <textarea
            ref={desktopTextareaRef}
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); createTask(); } }}
            placeholder={t('task.new')}
            rows={3}
            className="w-full bg-transparent text-[var(--text-primary)] text-sm outline-none resize-none overflow-hidden new-task-placeholder"
            style={{ fontFamily: 'var(--font-body)' }}
          />
          <div />
          <div />
          <div />
          {newTaskTitle.trim() && (
            <button
              onClick={createTask}
              disabled={creating}
              className="text-xs font-medium text-[var(--accent-blue)] hover:underline pt-1.5 transition-opacity"
            >
              {creating ? '...' : t('task.add')}
            </button>
          )}
        </div>

        {/* Completed section */}
        {completedTasks.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 w-full text-left group/completed"
            >
              <span
                className="text-[var(--text-muted)] text-[10px] transition-transform duration-200"
                style={{ transform: showCompleted ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}
              >
                ▶
              </span>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-[0.1em] font-semibold group-hover/completed:text-[var(--text-secondary)] transition-colors">
                {t('task.completed')} · {completedTasks.length}
              </span>
              <span className="flex-1 h-px bg-[var(--border-subtle)]" />
            </button>
            {showCompleted && completedTasks.map((t, i) => renderTaskRow(t, true, i))}
          </div>
        )}
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-2">
        {activeTasks.map((t) => renderTaskCard(t, false))}

        {/* New task input */}
        <div
          className="border border-dashed border-[var(--border)] rounded-xl p-4"
          style={{ background: newTaskTitle.trim() ? 'var(--bg-secondary)' : 'transparent', transition: 'background 0.15s' }}
        >
          <div className="flex items-start gap-3">
            <span className="text-[var(--text-muted)] text-lg leading-none mt-0.5 select-none">+</span>
            <textarea
              ref={mobileTextareaRef}
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); createTask(); } }}
              placeholder={t('task.new')}
              rows={3}
              className="flex-1 bg-transparent text-[var(--text-primary)] text-sm outline-none resize-none overflow-hidden new-task-placeholder"
              style={{ fontFamily: 'var(--font-body)' }}
            />
          </div>
          {newTaskTitle.trim() && (
            <button
              onClick={createTask}
              disabled={creating}
              className="mt-3 text-xs font-medium text-[var(--accent-blue)] hover:underline"
            >
              {creating ? t('task.adding') : t('task.addTask')}
            </button>
          )}
        </div>

        {completedTasks.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 py-2.5 w-full text-left group/completed"
            >
              <span
                className="text-[var(--text-muted)] text-[10px] transition-transform duration-200"
                style={{ transform: showCompleted ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}
              >
                ▶
              </span>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-[0.1em] font-semibold group-hover/completed:text-[var(--text-secondary)] transition-colors">
                {t('task.completed')} · {completedTasks.length}
              </span>
              <span className="flex-1 h-px bg-[var(--border-subtle)]" />
            </button>
            {showCompleted && (
              <div className="space-y-2">
                {completedTasks.map((t) => renderTaskCard(t, true))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
