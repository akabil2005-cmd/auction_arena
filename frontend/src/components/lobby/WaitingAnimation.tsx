'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function WaitingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      {/* Pulse indicators */}
      <div className="relative flex items-center justify-center w-16 h-16">
        <motion.div
          animate={{
            scale: [1, 2.2, 1],
            opacity: [0.6, 0, 0.6],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute w-8 h-8 rounded-full bg-purple-500/20"
        />
        <motion.div
          animate={{
            scale: [1, 1.8, 1],
            opacity: [0.8, 0, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
          className="absolute w-8 h-8 rounded-full bg-cyan-500/20"
        />
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 shadow-[0_0_15px_rgba(139,92,246,0.5)] z-10" />
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold tracking-widest uppercase font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
          Waiting for Players
        </p>
        <p className="text-xs text-gray-500 font-semibold mt-1">
          Lobby status updates automatically
        </p>
      </div>
    </div>
  );
}
