'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TimerProps {
  timeRemaining: number;
  totalTime: number;
  timerEndsAt?: number;
  timerGeneration?: number;
  className?: string;
}

export default function Timer({
  timeRemaining,
  totalTime,
  timerEndsAt,
  timerGeneration,
  className,
}: TimerProps) {
  const [displayTime, setDisplayTime] = useState(timeRemaining);

  useEffect(() => {
    setDisplayTime(timeRemaining);
  }, [timeRemaining, timerGeneration]);

  useEffect(() => {
    if (!timerEndsAt) return;

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000));
      setDisplayTime(remaining);
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [timerEndsAt, timerGeneration]);

  const percentage = totalTime > 0 ? (displayTime / totalTime) * 100 : 0;

  let color = 'stroke-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]';
  let textColor = 'text-emerald-400';

  if (displayTime <= 5) {
    color = 'stroke-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse';
    textColor = 'text-red-500 font-bold';
  } else if (displayTime <= 10) {
    color = 'stroke-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]';
    textColor = 'text-amber-400';
  }

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('relative flex items-center justify-center w-24 h-24', className)}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          className="stroke-white/5 fill-transparent"
          strokeWidth="8"
        />
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          className={cn('fill-transparent transition-all duration-500 ease-linear', color)}
          strokeWidth="8"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            'text-2xl font-orbitron font-bold tracking-tighter leading-none tabular-nums',
            textColor
          )}
        >
          {displayTime}
        </span>
        <span className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase mt-0.5">
          Secs
        </span>
      </div>
    </div>
  );
}
