'use client';

import { useState } from 'react';
import { Task, VALID_TASK_TYPES, VALID_STATUSES, VALID_ASSIGNEES, STATUS_TRANSITIONS, TaskStatus, TaskType, Assignee } from '@/lib/types';
import StatusBadge from './StatusBadge';

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Crítica',
  2: 'Alta',
  3: 'Media',
  4: 'Baja',
};

interface TaskDetailProps {
  task: Task;
  onUpdate: () => void;
  onClose: () => void;
}

export default function TaskDetail({ task, onUpdate, onClose }: TaskDetailProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [editingDesc, setEditingDesc] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const updateField = async (updates: Record<string, unknown>) => {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) onUpdate();
  };

  const deleteTask = async () => {
    setDeleting(true);
    const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
    if (res.ok) {
      onClose();
      onUpdate();
    } else {
      const data = await res.json();
      alert(data.error || 'Error al eliminar');
    }
    setDeleting(false);
  };

  const allowedStatuses = STATUS_TRANSITIONS[task.status as TaskStatus];

  return (
    <div className="bg-[#0e1117] border-x border-b border-[#30363d] p-4">
      {/* Title */}
      <div className="mb-3">
        {editingTitle ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => { updateField({ title }); setEditingTitle(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { updateField({ title }); setEditingTitle(false); } }}
            className="w-full text-lg font-semibold bg-transparent text-[#e6edf3] border-b border-[#58a6ff] outline-none pb-1"
          />
        ) : (
          <h3
            className="text-lg font-semibold text-[#e6edf3] cursor-pointer hover:text-white"
            onClick={() => setEditingTitle(true)}
          >
            {task.title}
          </h3>
        )}
      </div>

      {/* Metadata row */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        <div>
          <span className="text-[#8b949e] mr-2">Estado:</span>
          <StatusBadge status={task.status} />
          {allowedStatuses.length > 0 && (
            <select
              onChange={(e) => updateField({ status: e.target.value })}
              className="ml-2 bg-[#161b22] text-[#e6edf3] text-xs border border-[#30363d] rounded px-1 py-0.5"
              defaultValue=""
            >
              <option value="" disabled>Mover a...</option>
              {allowedStatuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <span className="text-[#8b949e] mr-2">Tipo:</span>
          <select
            value={task.task_type}
            onChange={(e) => updateField({ task_type: e.target.value as TaskType })}
            className="bg-[#161b22] text-[#e6edf3] text-xs border border-[#30363d] rounded px-1 py-0.5"
          >
            {VALID_TASK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <span className="text-[#8b949e] mr-2">Prioridad:</span>
          <select
            value={task.priority}
            onChange={(e) => updateField({ priority: Number(e.target.value) })}
            className="bg-[#161b22] text-[#e6edf3] text-xs border border-[#30363d] rounded px-1 py-0.5"
          >
            {[1, 2, 3, 4].map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
          </select>
        </div>

        <div>
          <span className="text-[#8b949e] mr-2">Asignado:</span>
          <select
            value={task.assignee}
            onChange={(e) => updateField({ assignee: e.target.value as Assignee })}
            className="bg-[#161b22] text-[#e6edf3] text-xs border border-[#30363d] rounded px-1 py-0.5"
          >
            {VALID_ASSIGNEES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* Description */}
      <div className="mb-4">
        <span className="text-[#8b949e] text-xs uppercase tracking-wide">Descripción</span>
        {editingDesc ? (
          <textarea
            autoFocus
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => { updateField({ description: description || null }); setEditingDesc(false); }}
            rows={4}
            className="w-full mt-1 bg-[#161b22] text-[#e6edf3] border border-[#30363d] rounded p-2 text-sm outline-none focus:border-[#58a6ff] resize-y"
          />
        ) : (
          <p
            className="mt-1 text-sm text-[#8b949e] cursor-pointer hover:text-[#e6edf3] min-h-[2rem]"
            onClick={() => setEditingDesc(true)}
          >
            {task.description || 'Clic para agregar descripción...'}
          </p>
        )}
      </div>

      {/* Timestamps */}
      <div className="flex flex-wrap gap-4 text-xs text-[#484f58] mb-4">
        <span>Creado: {new Date(task.created_at).toLocaleString('es-ES')}</span>
        {task.started_at && <span>Iniciado: {new Date(task.started_at).toLocaleString('es-ES')}</span>}
        {task.completed_at && <span>Completado: {new Date(task.completed_at).toLocaleString('es-ES')}</span>}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={onClose} className="text-xs text-[#8b949e] hover:text-[#e6edf3]">
          Cerrar
        </button>
        {task.status === 'pending' && (
          <button
            onClick={deleteTask}
            disabled={deleting}
            className="text-xs text-red-400 hover:text-red-300 ml-auto"
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        )}
      </div>
    </div>
  );
}
