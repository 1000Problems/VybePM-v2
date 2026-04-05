export type TaskType = 'dev' | 'design' | 'animation' | 'content' | 'deploy' | 'report' | 'other';
export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'checked_in' | 'deployed' | 'done';
export type Assignee = 'angel' | 'cowork' | 'claude-code';
export type Priority = 1 | 2 | 3 | 4;

export interface Project {
  id: number;
  name: string;
  display_name: string;
  description: string | null;
  tech_stack: string[];
  github_repo: string | null;
  deploy_url: string | null;
  color: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithCounts extends Project {
  pending_count: number;
  in_progress_count: number;
  total_count: number;
}

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  task_type: TaskType;
  priority: Priority;
  status: TaskStatus;
  assignee: Assignee;
  sort_order: number;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface Attachment {
  id: number;
  task_id: number;
  drive_file_id: string;
  url: string;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  thumbnail_url: string | null;
  caption: string | null;
  created_by: string;
  created_at: string;
}

export const VALID_TASK_TYPES: TaskType[] = ['dev', 'design', 'animation', 'content', 'deploy', 'report', 'other'];
export const VALID_STATUSES: TaskStatus[] = ['pending', 'in_progress', 'review', 'checked_in', 'deployed', 'done'];
export const VALID_ASSIGNEES: Assignee[] = ['angel', 'cowork', 'claude-code'];

// Spanish display labels
export const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En Progreso',
  review: 'Revisión',
  checked_in: 'Registrado',
  deployed: 'Desplegado',
  done: 'Completado',
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  dev: 'Desarrollo',
  design: 'Diseño',
  animation: 'Animación',
  content: 'Contenido',
  deploy: 'Despliegue',
  report: 'Reporte',
  other: 'Otro',
};

export const ASSIGNEE_LABELS: Record<Assignee, string> = {
  angel: 'Angel',
  cowork: 'Cowork',
  'claude-code': 'Claude Code',
};

export const PRIORITY_LABELS: Record<number, string> = {
  1: 'Crítica',
  2: 'Alta',
  3: 'Media',
  4: 'Baja',
};

// State machine: maps current status to allowed next statuses
export const STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  pending: ['in_progress'],
  in_progress: ['review', 'done'],
  review: ['in_progress', 'checked_in', 'done'],
  checked_in: ['deployed'],
  deployed: ['in_progress', 'done'],
  done: [],
};
