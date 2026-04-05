'use client';

import { useState, useCallback } from 'react';
import { Task, TaskStatus, TaskType, Assignee, VALID_TASK_TYPES, VALID_STATUSES, VALID_ASSIGNEES, STATUS_TRANSITIONS, STATUS_LABELS, TASK_TYPE_LABELS, ASSIGNEE_LABELS, PRIORITY_LABELS } from '@/lib/types';
import StatusBadge from './StatusBadge';
import TaskDetail from './TaskDetail';

const PRIORITY_COLORS: Record<number, string> = {
  1: 'bg-red-500',
  2: 'bg-orange-400',
  3: 'bg-yellow-400',
  4: 'bg-gray-400',
};

interface TaskGridProps {
  projectSlug: string;
  tasks: Task[];
  onTasksChange: () => void;
}

export default function TaskGrid({ projectSlug, tasks, onTasksChange }: TaskGridProps) {
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [editingCell, setEditingCell] = useState<{ taskId: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [creating, setCreating] = useState(false);

  const activeTasks = tasks.filter((t) => t.status !== 'done');
  const completedTasks = tasks.filter((t) => t.status === 'done');

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
    if (field === 'status') return STATUS_LABELS[value as TaskStatus] || value;
    if (field === 'task_type') return TASK_TYPE_LABELS[value as TaskType] || value;
    if (field === 'assignee') return ASSIGNEE_LABELS[value as Assignee] || value;
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

  const renderTaskRow = (task: Task, isDone: boolean) => (
    <div key={task.id}>
      <div
        className={`group/row grid grid-cols-[28px_1fr_90px_100px_90px_80px_32px] gap-2 items-center px-3 py-2 border-b border-[var(--border)] hover:bg-[var(--bg-secondary)] text-sm cursor-pointer ${isDone ? 'opacity-50' : ''}`}
        onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
      >
        {/* Priority dot */}
        <div className="flex justify-center">
          <span className={`w-2.5 h-2.5 rounded-full ${PRIORITY_COLORS[task.priority]}`} title={PRIORITY_LABELS[task.priority]} />
        </div>

        {/* Title */}
        <div onClick={(e) => e.stopPropagation()}>
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
              className="text-[var(--text-primary)] hover:text-white truncate block"
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

        {/* Updated */}
        <div className="text-[var(--text-muted)] text-xs">
          {new Date(task.updated_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
        </div>

        {/* Delete (pending only) */}
        <div onClick={(e) => e.stopPropagation()}>
          {task.status === 'pending' && (
            <button
              onClick={() => deleteTask(task.id)}
              className="opacity-0 group-hover/row:opacity-100 text-[var(--text-muted)] hover:text-red-400 transition-opacity"
              title="Eliminar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Expanded detail panel */}
      {expandedTaskId === task.id && (
        <TaskDetail task={task} onUpdate={onTasksChange} onClose={() => setExpandedTaskId(null)} />
      )}
    </div>
  );

  // Mobile card view
  const renderTaskCard = (task: Task, isDone: boolean) => (
    <div key={task.id} className={`bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-3 ${isDone ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-2 mb-2">
        <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${PRIORITY_COLORS[task.priority]}`} />
        <span className="text-[var(--text-primary)] text-sm font-medium flex-1">{task.title}</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge status={task.status} />
        <span className="text-[var(--text-secondary)] text-xs">{TASK_TYPE_LABELS[task.task_type]}</span>
        <span className="text-[var(--text-muted)] text-xs ml-auto">{ASSIGNEE_LABELS[task.assignee]}</span>
      </div>
      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
          className="text-xs text-[var(--accent-blue)] hover:underline"
        >
          {expandedTaskId === task.id ? 'Cerrar' : 'Detalles'}
        </button>
        {task.status === 'pending' && (
          <button
            onClick={() => deleteTask(task.id)}
            className="text-xs text-[var(--text-muted)] hover:text-red-400 ml-auto"
          >
            Eliminar
          </button>
        )}
      </div>
      {expandedTaskId === task.id && (
        <TaskDetail task={task} onUpdate={onTasksChange} onClose={() => setExpandedTaskId(null)} />
      )}
    </div>
  );

  return (
    <div>
      {/* Desktop table header */}
      <div className="hidden md:grid grid-cols-[28px_1fr_90px_100px_90px_80px_32px] gap-2 px-3 py-2 text-xs text-[var(--text-secondary)] border-b border-[var(--border)] uppercase tracking-wide font-medium">
        <div />
        <div>Título</div>
        <div>Tipo</div>
        <div>Estado</div>
        <div>Asignado</div>
        <div>Actualizado</div>
        <div />
      </div>

      {/* Desktop rows */}
      <div className="hidden md:block">
        {activeTasks.map((t) => renderTaskRow(t, false))}

        {/* New task row */}
        <div className="grid grid-cols-[28px_1fr_90px_100px_90px_80px_32px] gap-2 items-center px-3 py-2 border-b border-[var(--border)]">
          <div />
          <input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') createTask(); }}
            placeholder="Nueva tarea..."
            className="w-full bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm outline-none"
          />
          <div />
          <div />
          <div />
          {newTaskTitle.trim() && (
            <button onClick={createTask} disabled={creating} className="text-xs text-[var(--accent-blue)] hover:underline">
              {creating ? '...' : 'Agregar'}
            </button>
          )}
        </div>

        {/* Completed section */}
        {completedTasks.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] w-full"
            >
              <span className="transition-transform" style={{ transform: showCompleted ? 'rotate(90deg)' : 'rotate(0)' }}>
                &#9654;
              </span>
              Completados ({completedTasks.length})
            </button>
            {showCompleted && completedTasks.map((t) => renderTaskRow(t, true))}
          </div>
        )}
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-2">
        {activeTasks.map((t) => renderTaskCard(t, false))}

        {/* New task input */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] border-dashed rounded-lg p-3">
          <input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') createTask(); }}
            placeholder="Nueva tarea..."
            className="w-full bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm outline-none"
          />
          {newTaskTitle.trim() && (
            <button onClick={createTask} disabled={creating} className="mt-2 text-xs text-[var(--accent-blue)] hover:underline">
              {creating ? 'Agregando...' : 'Agregar tarea'}
            </button>
          )}
        </div>

        {completedTasks.length > 0 && (
          <div>
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <span style={{ transform: showCompleted ? 'rotate(90deg)' : 'rotate(0)' }}>&#9654;</span>
              Completados ({completedTasks.length})
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
