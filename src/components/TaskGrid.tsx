'use client';

import { useState, useCallback } from 'react';
import { Task, TaskStatus, TaskType, Assignee, VALID_TASK_TYPES, VALID_STATUSES, VALID_ASSIGNEES, STATUS_TRANSITIONS } from '@/lib/types';
import StatusBadge from './StatusBadge';
import TaskDetail from './TaskDetail';

const PRIORITY_COLORS: Record<number, string> = {
  1: 'bg-red-500',
  2: 'bg-orange-400',
  3: 'bg-yellow-400',
  4: 'bg-gray-400',
};

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Crítica',
  2: 'Alta',
  3: 'Media',
  4: 'Baja',
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

  const renderDropdown = (taskId: number, field: string, currentValue: string, options: readonly string[]) => {
    const allowedOptions = field === 'status'
      ? STATUS_TRANSITIONS[currentValue as TaskStatus]
      : options;

    return (
      <select
        value={currentValue}
        onChange={(e) => updateTask(taskId, { [field]: e.target.value })}
        className="bg-transparent text-[#e6edf3] text-xs border-none outline-none cursor-pointer appearance-none"
      >
        <option value={currentValue} className="bg-[#161b22]">{currentValue}</option>
        {(allowedOptions as string[])
          .filter((o) => o !== currentValue)
          .map((opt) => (
            <option key={opt} value={opt} className="bg-[#161b22]">
              {opt}
            </option>
          ))}
      </select>
    );
  };

  const renderTaskRow = (task: Task, isDone: boolean) => (
    <div key={task.id}>
      <div
        className={`grid grid-cols-[28px_1fr_90px_100px_90px_80px] gap-2 items-center px-3 py-2 border-b border-[#30363d] hover:bg-[#161b22] text-sm cursor-pointer ${isDone ? 'opacity-50' : ''}`}
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
              className="w-full bg-[#0e1117] text-[#e6edf3] px-1 py-0.5 border border-[#58a6ff] rounded text-sm outline-none"
            />
          ) : (
            <span
              className="text-[#e6edf3] hover:text-white truncate block"
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
        <div className="text-[#484f58] text-xs">
          {new Date(task.updated_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
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
    <div key={task.id} className={`bg-[#161b22] border border-[#30363d] rounded-lg p-3 ${isDone ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-2 mb-2">
        <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${PRIORITY_COLORS[task.priority]}`} />
        <span className="text-[#e6edf3] text-sm font-medium flex-1">{task.title}</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge status={task.status} />
        <span className="text-[#8b949e] text-xs">{task.task_type}</span>
        <span className="text-[#484f58] text-xs ml-auto">{task.assignee}</span>
      </div>
      <button
        onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
        className="text-xs text-[#58a6ff] mt-2 hover:underline"
      >
        {expandedTaskId === task.id ? 'Cerrar' : 'Detalles'}
      </button>
      {expandedTaskId === task.id && (
        <TaskDetail task={task} onUpdate={onTasksChange} onClose={() => setExpandedTaskId(null)} />
      )}
    </div>
  );

  return (
    <div>
      {/* Desktop table header */}
      <div className="hidden md:grid grid-cols-[28px_1fr_90px_100px_90px_80px] gap-2 px-3 py-2 text-xs text-[#8b949e] border-b border-[#30363d] uppercase tracking-wide font-medium">
        <div />
        <div>Título</div>
        <div>Tipo</div>
        <div>Estado</div>
        <div>Asignado</div>
        <div>Actualizado</div>
      </div>

      {/* Desktop rows */}
      <div className="hidden md:block">
        {activeTasks.map((t) => renderTaskRow(t, false))}

        {/* New task row */}
        <div className="grid grid-cols-[28px_1fr_90px_100px_90px_80px] gap-2 items-center px-3 py-2 border-b border-[#30363d]">
          <div />
          <input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') createTask(); }}
            placeholder="Nueva tarea..."
            className="w-full bg-transparent text-[#e6edf3] placeholder-[#484f58] text-sm outline-none"
          />
          <div />
          <div />
          <div />
          {newTaskTitle.trim() && (
            <button onClick={createTask} disabled={creating} className="text-xs text-[#58a6ff] hover:underline">
              {creating ? '...' : 'Agregar'}
            </button>
          )}
        </div>

        {/* Completed section */}
        {completedTasks.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 px-3 py-2 text-xs text-[#8b949e] hover:text-[#e6edf3] w-full"
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
        <div className="bg-[#161b22] border border-[#30363d] border-dashed rounded-lg p-3">
          <input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') createTask(); }}
            placeholder="Nueva tarea..."
            className="w-full bg-transparent text-[#e6edf3] placeholder-[#484f58] text-sm outline-none"
          />
          {newTaskTitle.trim() && (
            <button onClick={createTask} disabled={creating} className="mt-2 text-xs text-[#58a6ff] hover:underline">
              {creating ? 'Agregando...' : 'Agregar tarea'}
            </button>
          )}
        </div>

        {completedTasks.length > 0 && (
          <div>
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 py-2 text-xs text-[#8b949e] hover:text-[#e6edf3]"
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
