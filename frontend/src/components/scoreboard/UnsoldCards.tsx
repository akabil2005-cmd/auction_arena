'use client';

import React from 'react';
import type { AuctionCard } from '@/types';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { getCategoryColors } from '@/lib/utils';
import { formatMoney } from '@/lib/currency';

interface UnsoldCardsProps {
  cards: AuctionCard[];
}

export default function UnsoldCards({ cards }: UnsoldCardsProps) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto mt-12">
      <h3 className="text-xs font-bold tracking-widest text-red-400 uppercase font-orbitron">
        Unsold Cards Inventory ({cards.length})
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const categoryColors = getCategoryColors(c.category);

          return (
            <Card
              key={c.id}
              className="bg-red-500/[0.02] border-red-500/10 flex flex-col justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-950/20 overflow-hidden border border-red-900/20 p-0.5 flex items-center justify-center">
                  <img
                    src={c.image || `https://api.dicebear.com/7.x/personas/svg?seed=${c.name}`}
                    alt={c.name}
                    className="w-full h-full object-contain grayscale"
                  />
                </div>

                <div>
                  <span className="font-bold text-xs text-gray-400 block truncate max-w-[120px]">
                    {c.name}
                  </span>
                  <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider font-orbitron mt-0.5 block">
                    Category: {c.category}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 bg-red-950/20 px-2 py-1.5 rounded-lg border border-red-900/10">
                <span className="text-[8px] text-red-400 uppercase font-orbitron font-bold">
                  UNSOLD
                </span>
                <span className="text-xs font-orbitron font-extrabold text-gray-400">
                  {formatMoney(c.basePrice)}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
