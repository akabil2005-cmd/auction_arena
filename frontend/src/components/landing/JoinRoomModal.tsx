'use client';

import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (code: string, nickname: string) => void;
  isLoading: boolean;
}

export default function JoinRoomModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: JoinRoomModalProps) {
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !nickname.trim()) return;
    onSubmit(code.trim().toUpperCase(), nickname.trim());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join Auction Arena" size="sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Room Code */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider font-semibold font-orbitron text-cyan-400">
            Room Code
          </label>
          <input
            type="text"
            required
            maxLength={6}
            placeholder="ENTER 6-DIGIT CODE"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="w-full bg-[#151522] border border-white/10 focus:border-purple-500 focus:shadow-[0_0_15px_rgba(139,92,246,0.2)] rounded-xl px-4 py-4 text-center text-white placeholder-gray-600 font-orbitron font-bold text-2xl tracking-widest uppercase focus:outline-none transition-all"
          />
        </div>

        {/* Nickname */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider font-semibold font-orbitron text-cyan-400">
            Your Nickname
          </label>
          <input
            type="text"
            required
            maxLength={20}
            placeholder="Enter nickname..."
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full bg-[#151522] border border-white/10 focus:border-purple-500 focus:shadow-[0_0_15px_rgba(139,92,246,0.2)] rounded-xl px-4 py-3 text-white placeholder-gray-500 font-semibold focus:outline-none transition-all"
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          variant="secondary"
          glow
          loading={isLoading}
          disabled={!code.trim() || !nickname.trim() || code.length !== 6}
          className="w-full py-4 rounded-xl font-orbitron tracking-wider text-sm bg-gradient-to-r from-cyan-600 to-blue-600 mt-2"
        >
          Join Arena
        </Button>
      </form>
    </Modal>
  );
}
