'use client';

import { TaskStatus, STATUS_LABEL_KEYS } from '@/lib/types';
import { useI18n, TranslationKey } from '@/lib/i18n';

const STATUS_COLORS: Record<TaskStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
  in_progress: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  review: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  checked_in: { bg: 'bg-green-500/20', text: 'text-green-400' },
  deployed: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  done: { bg: 'bg-gray-500/10', text: 'text-gray-500' },
};

export default function StatusBadge({ status }: { status: TaskStatus }) {
  const { t } = useI18n();
  const colors = STATUS_COLORS[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
      {t(STATUS_LABEL_KEYS[status] as TranslationKey)}
    </span>
  );
}
