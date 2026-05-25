'use client';

import React from 'react';
import type { Player } from '@/types';
import { formatMoney } from '@/lib/currency';
import Badge from '../ui/Badge';

interface PlayerMoneyProps {
  players: Player[];
  passedPlayerIds: string[];
  highestBidderId: string | null;
  currentPlayerId: string | null;
}

export default function PlayerMoney({
  players,
  passedPlayerIds,
  highestBidderId,
  currentPlayerId,
}: PlayerMoneyProps) {
  // Sort players: highest remaining money first
  const sortedPlayers = [...players].sort((a, b) => b.money - a.money);

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold tracking-widest text-cyan-400 uppercase font-orbitron">
        Leaderboard & Balances
      </h3>

      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
        {sortedPlayers.map((player) => {
          const isPassed = passedPlayerIds.includes(player.id);
          const isHighest = player.id === highestBidderId;
          const isSelf = player.id === currentPlayerId;

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 ${
                isHighest
                  ? 'bg-emerald-500/10 border-emerald-500/35 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                  : isPassed
                  ? 'bg-black/40 border-white/[0.03] opacity-40'
                  : isSelf
                  ? 'bg-purple-500/5 border-purple-500/25'
                  : 'bg-white/[0.01] border-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-8 h-8 rounded-lg bg-[#151522] overflow-hidden border border-white/10 flex items-center justify-center p-0.5">
                    <img
                      src={player.avatar || `https://api.dicebear.com/7.x/personas/svg?seed=${player.nickname}`}
                      alt={player.nickname}
                      width={32}
                      height={32}
                    />
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0a0a0f] ${
                      player.isConnected ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-200">
                      {player.nickname}
                    </span>
                    {isSelf && (
                      <span className="text-[8px] uppercase font-bold text-purple-400 font-orbitron">
                        (You)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] font-bold text-gray-500 font-orbitron">
                      {player.cards.length} Cards
                    </span>
                    {isHighest && (
                      <span className="text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1 py-0.2 rounded font-bold uppercase tracking-wider font-orbitron">
                        Top Bid
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-orbitron font-extrabold text-white">
                  {formatMoney(player.money)}
                </span>
                {isPassed && (
                  <span className="block text-[8px] text-red-400 uppercase font-orbitron font-bold mt-0.5">
                    Passed
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
