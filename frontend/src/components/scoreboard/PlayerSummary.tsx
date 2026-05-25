'use client';

import React from 'react';
import type { PlayerResult } from '@/types';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { getCategoryColors } from '@/lib/utils';
import { formatMoney } from '@/lib/currency';

interface PlayerSummaryProps {
  results: PlayerResult[];
}

export default function PlayerSummary({ results }: PlayerSummaryProps) {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <h3 className="text-xs font-bold tracking-widest text-cyan-400 uppercase font-orbitron">
        Star Portfolios & Team Rosters
      </h3>

      <div className="space-y-6">
        {results.map((res) => {
          const hasCards = res.player.cards && res.player.cards.length > 0;

          return (
            <Card key={res.player.id} className="bg-white/[0.01] space-y-4">
              {/* Header profile info */}
              <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/[0.05] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#12121e] border border-white/10 p-0.5 flex items-center justify-center">
                    <img
                      src={res.player.avatar || `https://api.dicebear.com/7.x/personas/svg?seed=${res.player.nickname}`}
                      alt={res.player.nickname}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <span className="font-orbitron font-extrabold text-base text-white block">
                      {res.player.nickname}&apos;s Team
                    </span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-orbitron mt-0.5 block">
                      Spent: {formatMoney(res.totalSpent)} | Left: {formatMoney(res.remainingMoney)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={res.rank === 1 ? 'primary' : 'gray'} size="sm">
                    Rank #{res.rank}
                  </Badge>
                  <Badge variant="success" size="sm">
                    {res.cardsOwned} Stars Acquired
                  </Badge>
                </div>
              </div>

              {/* Roster of purchased cards */}
              {!hasCards ? (
                <div className="py-6 text-center text-xs text-gray-500 font-semibold uppercase tracking-wider font-orbitron">
                  No players acquired. Went home empty handed!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {res.player.cards.map((c) => {
                    const categoryColors = getCategoryColors(c.category);
                    
                    return (
                      <div
                        key={c.id}
                        className={`flex flex-col justify-between p-3.5 bg-gradient-to-b from-[#131320] to-[#0c0c14] border rounded-2xl shadow ${categoryColors.border}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-[#08080d]/80 overflow-hidden border p-0.5 flex items-center justify-center ${categoryColors.border}`}>
                            <img
                              src={c.image || `https://api.dicebear.com/7.x/personas/svg?seed=${c.name}`}
                              alt={c.name}
                              className="w-full h-full object-contain"
                            />
                          </div>

                          <div>
                            <span className="font-bold text-xs text-white block truncate max-w-[120px]">
                              {c.name}
                            </span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider font-orbitron mt-0.5 block">
                              Category: {c.category}
                            </span>
                          </div>
                        </div>

                        {/* Price resolved */}
                        <div className="flex items-center justify-between mt-3 bg-white/[0.02] px-2 py-1 rounded-lg border border-white/[0.04]">
                          <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider font-orbitron">
                            Base: {formatMoney(c.basePrice)}
                          </span>
                          <span className="text-xs font-orbitron font-extrabold text-amber-400">
                            {formatMoney(c.basePrice)}
                            {res.mostExpensivePurchase?.card.id === c.id ? ' (Top)' : ''}
                            {/* purchasePrice is not in type definitions of AuctionCard on frontend, we can fallback to basePrice or use a safe type cast */}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
