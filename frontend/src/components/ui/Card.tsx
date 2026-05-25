'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses: Record<string, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

export default function Card({
  children,
  className,
  hover = false,
  glow,
  padding = 'md',
}: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.02, y: -2 } : undefined}
      className={cn(
        'relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl',
        'transition-all duration-300',
        paddingClasses[padding],
        hover && 'hover:bg-white/[0.06] hover:border-white/[0.15] cursor-pointer',
        glow && `shadow-[0_0_30px_${glow}]`,
        className
      )}
    >
      {children}
    </motion.div>
  );
}
