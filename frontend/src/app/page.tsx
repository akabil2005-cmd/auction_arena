'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Hero from '@/components/landing/Hero';
import CreateRoomModal from '@/components/landing/CreateRoomModal';
import JoinRoomModal from '@/components/landing/JoinRoomModal';
import { useRoom } from '@/hooks/useRoom';
import type { RoomSettings } from '@/types';

export default function Home() {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  const {
    room,
    createRoom,
    joinRoom,
    isLoading,
    toasts,
    removeToast,
  } = useRoom();

  // Redirect to room lobby once joined/created
  useEffect(() => {
    if (room && room.code) {
      router.push(`/room/${room.code}`);
    }
  }, [room, router]);

  const handleCreateRoom = (settings: RoomSettings, nickname: string) => {
    createRoom(settings, nickname);
  };

  const handleJoinRoom = (code: string, nickname: string) => {
    joinRoom(code, nickname);
  };

  return (
    <div className="relative flex flex-col flex-1 min-h-screen bg-[#07070c] overflow-hidden">
      
      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Main hero page content */}
      <main className="flex-1 flex flex-col justify-center max-w-7xl mx-auto w-full px-6 py-12 md:py-24">
        <Hero
          onCreateRoomClick={() => setIsCreateOpen(true)}
          onJoinRoomClick={() => setIsJoinOpen(true)}
        />
      </main>

      {/* Modal overlays */}
      <CreateRoomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateRoom}
        isLoading={isLoading}
      />

      <JoinRoomModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onSubmit={handleJoinRoom}
        isLoading={isLoading}
      />

      {/* Toast Alert Feed */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => removeToast(t.id)}
            className={`cursor-pointer px-4.5 py-3 rounded-2xl border text-xs font-bold font-orbitron tracking-wider shadow-lg flex items-center justify-between min-w-[280px] backdrop-blur-md transition-all duration-300 animate-slide-in ${
              t.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : t.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : t.type === 'warning'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
            }`}
          >
            <span>{t.message}</span>
            <span className="text-[10px] text-gray-500 ml-4 font-normal">Close</span>
          </div>
        ))}
      </div>
    </div>
  );
}

