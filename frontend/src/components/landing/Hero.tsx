'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Button from '../ui/Button';

interface HeroProps {
  onCreateRoomClick: () => void;
  onJoinRoomClick: () => void;
}

export default function Hero({ onCreateRoomClick, onJoinRoomClick }: HeroProps) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[75vh] px-4 overflow-hidden text-center z-10">
      
      {/* Glow shapes */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-cyan-600/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-[250px] h-[250px] bg-pink-600/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Hero Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="max-w-4xl"
      >
        {/* Animated tag */}
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/5 text-purple-400 text-xs font-bold tracking-widest font-orbitron uppercase mb-6 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
        >
          ⚡ Realtime Multiplayer Auction
        </motion.span>

        <h1 className="text-5xl md:text-8xl font-orbitron font-extrabold tracking-tight mb-6">
          <span className="text-white">AUCTION</span>{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 drop-shadow-[0_0_30px_rgba(139,92,246,0.3)]">
            ARENA
          </span>
        </h1>

        <p className="text-gray-400 text-base md:text-xl font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
          The ultimate IPL-style realtime multiplayer actress auction game. Create custom rooms, invite friends, place strategic bids, and build your dream team of stars.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6">
          <Button
            onClick={onCreateRoomClick}
            variant="primary"
            size="xl"
            glow
            className="w-full sm:w-60 font-orbitron tracking-wider text-sm md:text-base"
          >
            Create Arena Room
          </Button>
          <Button
            onClick={onJoinRoomClick}
            variant="secondary"
            size="xl"
            glow
            className="w-full sm:w-60 font-orbitron tracking-wider text-sm md:text-base bg-gradient-to-r from-cyan-600 to-blue-600"
          >
            Join with Code
          </Button>
        </div>
      </motion.div>

      {/* Live status placeholder/visual */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 1 }}
        className="mt-16 text-gray-500 text-xs md:text-sm font-semibold tracking-wider uppercase font-orbitron flex items-center gap-2"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        Servers Online & Ready for Bids
      </motion.div>
    </div>
  );
}
