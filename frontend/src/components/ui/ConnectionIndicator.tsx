'use client';

import type { ConnectionStatus } from '@/types';
import { cn } from '@/lib/utils';

interface ConnectionIndicatorProps {
  status: ConnectionStatus;
  className?: string;
}

export default function ConnectionIndicator({ status, className }: ConnectionIndicatorProps) {
  const label =
    status === 'connected'
      ? 'Live'
      : status === 'reconnecting'
      ? 'Reconnecting…'
      : 'Offline';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest font-orbitron backdrop-blur-md',
        status === 'connected' &&
          'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
        status === 'reconnecting' &&
          'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse',
        status === 'disconnected' &&
          'bg-red-500/10 border-red-500/30 text-red-400',
        className
      )}
      role="status"
    >
      <span
        className={cn(
          'w-2 h-2 rounded-full',
          status === 'connected' && 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
          status === 'reconnecting' && 'bg-amber-400',
          status === 'disconnected' && 'bg-red-400'
        )}
      />
      {label}
    </div>
  );
}
