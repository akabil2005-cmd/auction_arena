'use client';

import React from 'react';
import type { RoomSettings } from '@/types';
import { formatMoney } from '@/lib/currency';
import Card from '../ui/Card';

interface RoomSettingsProps {
  settings: RoomSettings;
}

export default function RoomSettingsView({ settings }: RoomSettingsProps) {
  return (
    <Card className="space-y-4 bg-white/[0.01]">
      <h3 className="text-xs font-bold tracking-widest text-cyan-400 uppercase font-orbitron">
        Arena Settings
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Starting Money */}
        <div className="bg-[#12121e]/50 border border-white/[0.04] p-3.5 rounded-xl">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-orbitron">
            Starting Balance
          </p>
          <p className="text-lg font-orbitron font-extrabold text-white mt-1">
            {formatMoney(settings.startingMoney)}
          </p>
        </div>

        {/* Timer Duration */}
        <div className="bg-[#12121e]/50 border border-white/[0.04] p-3.5 rounded-xl">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-orbitron">
            Bidding Timer
          </p>
          <p className="text-lg font-orbitron font-extrabold text-white mt-1">
            {settings.timerDuration}s
          </p>
        </div>

        {/* Max Players */}
        <div className="bg-[#12121e]/50 border border-white/[0.04] p-3.5 rounded-xl">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-orbitron">
            Capacity Limit
          </p>
          <p className="text-lg font-orbitron font-extrabold text-white mt-1">
            {settings.maxPlayers} Players
          </p>
        </div>

        {/* Total Cards */}
        <div className="bg-[#12121e]/50 border border-white/[0.04] p-3.5 rounded-xl">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-orbitron">
            Auction Inventory
          </p>
          <p className="text-lg font-orbitron font-extrabold text-white mt-1">
            {settings.numberOfCards} Cards
          </p>
        </div>
      </div>
    </Card>
  );
}
