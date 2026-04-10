'use client';

import { useEffect, useRef, useState } from 'react';
import { TaskStatus, STATUS_LABEL_KEYS } from '@/lib/types';
import { useI18n, TranslationKey } from '@/lib/i18n';

const STATUS_STYLES: Record<TaskStatus, { bg: string; text: string; dot: string }> = {
  pending:     { bg: 'rgba(100,116,139,0.12)', text: '#8fa3b8',  dot: '#6b7d93' },
  in_progress: { bg: 'rgba(77,171,247,0.15)',  text: '#4dabf7',  dot: '#4dabf7' },
  review:      { bg: 'rgba(245,159,0,0.15)',   text: '#f59f00',  dot: '#f59f00' },
  checked_in:  { bg: 'rgba(55,194,77,0.15)',   text: '#37c24d',  dot: '#37c24d' },
  deployed:    { bg: 'rgba(34,211,238,0.15)',   text: '#22d3ee',  dot: '#22d3ee' },
  done:        { bg: 'rgba(100,116,139,0.08)', text: '#56697d',  dot: '#56697d' },
};

export default function StatusBadge({ status }: { status: TaskStatus }) {
  const { t } = useI18n();
  const style = STATUS_STYLES[status];
  const [pulsing, setPulsing] = useState(false);
  const prevStatus = useRef(status);

  useEffect(() => {
    if (prevStatus.current !== status) {
      prevStatus.current = status;
      setPulsing(true);
      const timer = setTimeout(() => setPulsing(false), 500);
      return () => clearTimeout(timer);
    }
  }, [status]);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap${pulsing ? ' status-pulse' : ''}`}
      style={{ background: style.bg, color: style.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: style.dot }} />
      {t(STATUS_LABEL_KEYS[status] as TranslationKey)}
    </span>
  );
}
