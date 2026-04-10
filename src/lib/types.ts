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

// Translation key maps — use with t() from i18n
export const STATUS_LABEL_KEYS: Record<TaskStatus, string> = {
  pending: 'status.pending',
  in_progress: 'status.in_progress',
  review: 'status.review',
  checked_in: 'status.checked_in',
  deployed: 'status.deployed',
  done: 'status.done',
};

export const TASK_TYPE_LABEL_KEYS: Record<TaskType, string> = {
  dev: 'type.dev',
  design: 'type.design',
  animation: 'type.animation',
  content: 'type.content',
  deploy: 'type.deploy',
  report: 'type.report',
  other: 'type.other',
};

export const ASSIGNEE_LABEL_KEYS: Record<Assignee, string> = {
  angel: 'assignee.angel',
  cowork: 'assignee.cowork',
  'claude-code': 'assignee.claude-code',
};

export const PRIORITY_LABEL_KEYS: Record<number, string> = {
  1: 'priority.1',
  2: 'priority.2',
  3: 'priority.3',
  4: 'priority.4',
};

// State machine: maps current status to allowed next statuses
export const STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  pending: ['in_progress'],
  in_progress: ['review', 'done'],
  review: ['in_progress', 'checked_in', 'done'],
  checked_in: ['deployed', 'done'],
  deployed: ['in_progress', 'done'],
  done: [],
};
