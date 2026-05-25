'use client';

import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import type { RoomSettings } from '@/types';
import { formatMoney } from '@/lib/currency';
import {
  DEFAULT_STARTING_MONEY,
  MIN_STARTING_MONEY,
  MAX_STARTING_MONEY,
} from '@/lib/economy';

const DECK_SIZE = 42;

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (settings: RoomSettings, nickname: string) => void;
  isLoading: boolean;
}

export default function CreateRoomModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: CreateRoomModalProps) {
  const [nickname, setNickname] = useState('');
  const [startingMoney, setStartingMoney] = useState(DEFAULT_STARTING_MONEY);
  const [timerDuration, setTimerDuration] = useState(30);
  const [maxPlayers, setMaxPlayers] = useState(6);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    onSubmit(
      {
        startingMoney,
        timerDuration,
        maxPlayers,
        numberOfCards: DECK_SIZE,
      },
      nickname.trim()
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Auction Room" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider font-semibold font-orbitron text-cyan-400">
            Host Nickname
          </label>
          <input
            type="text"
            required
            maxLength={20}
            placeholder="Enter nickname..."
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full bg-[#151522] border border-white/10 focus:border-purple-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 font-semibold focus:outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs uppercase tracking-wider font-semibold font-orbitron">
            <span className="text-cyan-400">Team Purse</span>
            <span className="text-purple-400 font-bold">{formatMoney(startingMoney)}</span>
          </div>
          <input
            type="range"
            min={MIN_STARTING_MONEY}
            max={MAX_STARTING_MONEY}
            step={5_000_000}
            value={startingMoney}
            onChange={(e) => setStartingMoney(Number(e.target.value))}
            className="w-full h-1 bg-[#151522] rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <div className="flex justify-between text-[10px] text-gray-500 font-bold font-orbitron">
            <span>{formatMoney(MIN_STARTING_MONEY)}</span>
            <span>{formatMoney(MAX_STARTING_MONEY)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs uppercase tracking-wider font-semibold font-orbitron">
            <span className="text-cyan-400">Bid Timer</span>
            <span className="text-purple-400 font-bold">{timerDuration}s</span>
          </div>
          <input
            type="range"
            min={10}
            max={60}
            step={5}
            value={timerDuration}
            onChange={(e) => setTimerDuration(Number(e.target.value))}
            className="w-full h-1 bg-[#151522] rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-wider font-semibold font-orbitron text-cyan-400">
              Max Players
            </label>
            <select
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              className="w-full bg-[#151522] border border-white/10 rounded-xl px-4 py-3 text-white font-semibold"
            >
              {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                <option key={num} value={num}>
                  {num} Players
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-wider font-semibold font-orbitron text-cyan-400">
              Auction Deck
            </label>
            <div className="w-full bg-[#151522] border border-white/10 rounded-xl px-4 py-3 text-white font-orbitron font-bold text-sm">
              All {DECK_SIZE} Stars
            </div>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          glow
          loading={isLoading}
          disabled={!nickname.trim()}
          className="w-full py-4 rounded-xl font-orbitron tracking-wider text-sm"
        >
          Initialize Arena
        </Button>
      </form>
    </Modal>
  );
}
