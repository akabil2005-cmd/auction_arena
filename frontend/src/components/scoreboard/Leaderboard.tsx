'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { PlayerResult } from '@/types';
import { formatMoney } from '@/lib/currency';
import Badge from '../ui/Badge';

interface LeaderboardProps {
  results: PlayerResult[];
}

export default function Leaderboard({ results }: LeaderboardProps) {
  // Extract top 3 for podium
  const podiumPlayers = [...results].slice(0, 3);
  
  // Arrange top 3 as: 2nd place, 1st place, 3rd place for podium display
  const podiumOrder = [];
  if (podiumPlayers[1]) podiumOrder.push(podiumPlayers[1]); // 2nd
  if (podiumPlayers[0]) podiumOrder.push(podiumPlayers[0]); // 1st
  if (podiumPlayers[2]) podiumOrder.push(podiumPlayers[2]); // 3rd

  const restPlayers = [...results].slice(3);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  } as const;

  return (
    <div className="space-y-12">
      {/* Podium display */}
      <div className="flex items-end justify-center gap-4 md:gap-8 pt-8 max-w-2xl mx-auto min-h-[220px]">
        {podiumOrder.map((res) => {
          const isFirst = res.rank === 1;
          const isSecond = res.rank === 2;
          const isThird = res.rank === 3;

          let heightClass = 'h-32 bg-slate-800/40 border-slate-700/50';
          let trophyColor = 'text-slate-400';
          let ringGlow = '';

          if (isFirst) {
            heightClass = 'h-44 bg-amber-500/10 border-amber-500/40';
            trophyColor = 'text-yellow-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]';
            ringGlow = 'shadow-[0_0_30px_rgba(245,158,11,0.15)] border-amber-500/30';
          } else if (isSecond) {
            heightClass = 'h-36 bg-cyan-500/10 border-cyan-500/30';
            trophyColor = 'text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]';
            ringGlow = 'border-cyan-500/20';
          } else if (isThird) {
            heightClass = 'h-28 bg-orange-500/10 border-orange-500/30';
            trophyColor = 'text-orange-400 drop-shadow-[0_0_10px_rgba(249,115,22,0.4)]';
            ringGlow = 'border-orange-500/20';
          }

          return (
            <motion.div
              key={res.player.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 60, delay: res.rank * 0.1 }}
              className="flex flex-col items-center flex-1 max-w-[150px]"
            >
              {/* Avatar and Nickname */}
              <div className="relative mb-2.5">
                <div className={`w-14 h-14 rounded-2xl bg-[#12121e] border-2 p-1 flex items-center justify-center ${ringGlow}`}>
                  <img
                    src={res.player.avatar || `https://api.dicebear.com/7.x/personas/svg?seed=${res.player.nickname}`}
                    alt={res.player.nickname}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className={`text-xl font-bold font-orbitron ${trophyColor}`}>
                    {isFirst ? '👑' : isSecond ? '🥈' : '🥉'}
                  </span>
                </div>
              </div>
              
              <span className="font-orbitron font-extrabold text-sm text-white text-center truncate max-w-full block">
                {res.player.nickname}
              </span>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-orbitron mt-0.5">
                {res.cardsOwned} Cards
              </span>

              {/* Pedestal */}
              <div className={`w-full rounded-t-2xl border-t border-x flex flex-col items-center justify-center mt-3 ${heightClass}`}>
                <span className="text-4xl font-orbitron font-black text-white/10">
                  {res.rank}
                </span>
                <span className="text-[10px] font-orbitron font-extrabold text-white/50 tracking-wider uppercase mt-1">
                  {formatMoney(res.totalSpent)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Complete Rankings list */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-3 max-w-3xl mx-auto"
      >
        <h3 className="text-xs font-bold tracking-widest text-cyan-400 uppercase font-orbitron">
          Official Leaderboard Rankings
        </h3>

        <div className="space-y-2.5">
          {results.map((res) => (
            <motion.div
              key={res.player.id}
              variants={itemVariants}
              className="flex items-center justify-between p-4 bg-white/[0.01] border border-white/[0.04] rounded-2xl"
            >
              <div className="flex items-center gap-4">
                <span className="w-6 text-center font-orbitron font-extrabold text-sm text-gray-500">
                  #{res.rank}
                </span>
                
                <div className="w-10 h-10 rounded-xl bg-[#12121e] border border-white/5 p-0.5 flex items-center justify-center">
                  <img
                    src={res.player.avatar || `https://api.dicebear.com/7.x/personas/svg?seed=${res.player.nickname}`}
                    alt={res.player.nickname}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div>
                  <span className="font-semibold text-white block">
                    {res.player.nickname}
                  </span>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-orbitron block mt-0.5">
                    Wallet Left: {formatMoney(res.remainingMoney)}
                  </span>
                </div>
              </div>

              <div className="text-right flex items-center gap-6">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                    Spent
                  </span>
                  <span className="text-sm font-orbitron font-bold text-amber-400">
                    {formatMoney(res.totalSpent)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                    Owned
                  </span>
                  <span className="text-sm font-orbitron font-extrabold text-white">
                    {res.cardsOwned} Cards
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
