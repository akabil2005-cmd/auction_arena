'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glow?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<string, string> = {
  primary:
    'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white border-purple-500/50',
  secondary:
    'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white border-cyan-500/50',
  danger:
    'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white border-red-500/50',
  ghost:
    'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border-white/10',
  success:
    'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white border-emerald-500/50',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3 text-base rounded-xl',
  xl: 'px-10 py-4 text-lg rounded-2xl',
};

const glowClasses: Record<string, string> = {
  primary: 'shadow-[0_0_20px_rgba(139,92,246,0.4)]',
  secondary: 'shadow-[0_0_20px_rgba(6,182,212,0.4)]',
  danger: 'shadow-[0_0_20px_rgba(239,68,68,0.4)]',
  ghost: '',
  success: 'shadow-[0_0_20px_rgba(16,185,129,0.4)]',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  glow = false,
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const buttonContent = (
    <>
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </>
  );

  const combinedClassName = cn(
    'relative font-semibold border transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer',
    variantClasses[variant],
    sizeClasses[size],
    glow && glowClasses[variant],
    (disabled || loading) && 'opacity-50 cursor-not-allowed pointer-events-none',
    className
  );

  if (disabled || loading) {
    return (
      <button className={combinedClassName} disabled={disabled || loading} {...props}>
        {buttonContent}
      </button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={combinedClassName}
      disabled={disabled || loading}
      {...(props as any)}
    >
      {buttonContent}
    </motion.button>
  );
}
