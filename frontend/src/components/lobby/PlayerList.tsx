'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, X } from 'lucide-react';
import type { Player } from '@/types';
import { formatMoney } from '@/lib/currency';
import Badge from '../ui/Badge';
import Image from 'next/image';

interface PlayerListProps {
  players: Player[];
  hostId: string;
  currentPlayerId: string | null;
  onKickPlayer?: (playerId: string) => void;
  isHostUser: boolean;
}

export default function PlayerList({
  players,
  hostId,
  currentPlayerId,
  onKickPlayer,
  isHostUser,
}: PlayerListProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold tracking-widest text-cyan-400 uppercase font-orbitron">
        Players in Lobby ({players.length})
      </h3>

      <div className="grid gap-3 max-h-[450px] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {players.map((player) => {
            const isSelf = player.id === currentPlayerId;
            const isPlayerHost = player.isHost || player.id === hostId;

            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`flex items-center justify-between p-3.5 border rounded-2xl transition-all duration-300 ${
                  isSelf
                    ? 'bg-purple-500/10 border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                    : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                }`}
              >
                {/* Player details */}
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-xl bg-[#151522] overflow-hidden border border-white/10 flex items-center justify-center p-1">
                      {/* Using HTML img tag directly to prevent layout shifting/nextjs image loader setup issues */}
                      <img
                        src={player.avatar || `https://api.dicebear.com/7.x/personas/svg?seed=${player.nickname}`}
                        alt={player.nickname}
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                    </div>
                    {/* Connection indicator */}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0a0a0f] ${
                        player.isConnected ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">
                        {player.nickname}
                      </span>
                      {isSelf && (
                        <span className="text-[10px] uppercase font-bold text-purple-400 font-orbitron">
                          (You)
                        </span>
                      )}
                      {isPlayerHost && (
                        <Crown className="w-4 h-4 text-amber-400 fill-amber-400/20 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                      )}
                    </div>
                    <p className="text-[10px] font-semibold text-gray-500 font-orbitron uppercase tracking-wider mt-0.5">
                      Bal: {formatMoney(player.money)}
                    </p>
                  </div>
                </div>

                {/* Badges / actions */}
                <div className="flex items-center gap-3">
                  {player.isReady ? (
                    <Badge variant="success" size="sm">
                      Ready
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm">
                      Waiting
                    </Badge>
                  )}

                  {/* Kick action */}
                  {isHostUser && !isPlayerHost && onKickPlayer && (
                    <button
                      onClick={() => onKickPlayer(player.id)}
                      className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-400 transition-colors cursor-pointer"
                      title="Kick player"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
