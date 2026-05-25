'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRoom } from '@/hooks/useRoom';
import PlayerList from '@/components/lobby/PlayerList';
import RoomSettingsView from '@/components/lobby/RoomSettings';
import WaitingAnimation from '@/components/lobby/WaitingAnimation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { copyToClipboard, setStoredRoomCode } from '@/lib/utils';
import ConnectionIndicator from '@/components/ui/ConnectionIndicator';
import { ArrowLeftIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import { useSocket } from '@/hooks/useSocket';

export default function RoomLobby() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const {
    room,
    playerId,
    currentPlayer,
    isHost,
    toasts,
    removeToast,
    addToast,
    toggleReady,
    kickPlayer,
    startGame,
    leaveRoom,
    connectionStatus,
    isConnected,
    isLoading,
  } = useRoom(code);

  const { on } = useSocket();

  // Listen for game start event to redirect
  useEffect(() => {
    if (room?.status === 'playing') {
      router.push(`/auction/${code}`);
    }
  }, [room?.status, router, code]);

  useEffect(() => {
    const cleanup = on('game:started', () => {
      router.push(`/auction/${code}`);
    });
    return () => cleanup();
  }, [on, router, code]);

  const handleCopyCode = async () => {
    const success = await copyToClipboard(code);
    if (success) {
      addToast('Room code copied to clipboard!', 'success');
    }
  };

  const handleLeave = () => {
    leaveRoom(code);
    router.push('/');
  };

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#07070c] px-4 text-center gap-4">
        <ConnectionIndicator status={connectionStatus} />
        <div className="w-12 h-12 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <p className="font-orbitron font-bold uppercase tracking-wider text-sm text-gray-400">
          {!isConnected
            ? 'Connecting to server…'
            : isLoading
            ? 'Syncing Room Data…'
            : 'Waiting for room data…'}
        </p>
      </div>
    );
  }

  const allReady = room.players.filter(p => !p.isHost).every(p => p.isReady);
  const canStart = room.players.length >= 2; // host + 1 player

  return (
    <div className="relative flex flex-col min-h-screen bg-[#07070c]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-white/[0.05]">
        <button
          onClick={handleLeave}
          className="flex items-center gap-2 text-xs font-bold uppercase font-orbitron text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Leave Arena
        </button>

        <h1 className="text-xl font-orbitron font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
          AUCTION ARENA
        </h1>
        <ConnectionIndicator status={connectionStatus} />
      </header>

      {/* Main Grid */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Lobby status & list */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6">
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-orbitron block">
                Arena Room Code
              </span>
              <div className="flex items-center gap-3.5 mt-1.5">
                <span className="text-3xl font-orbitron font-black tracking-widest text-white">
                  {code}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-colors"
                  title="Copy Code"
                >
                  <ClipboardIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 border-t md:border-t-0 border-white/[0.05] pt-4 md:pt-0">
              {isHost ? (
                <Button
                  onClick={() => startGame(code)}
                  variant="primary"
                  glow={canStart}
                  disabled={!canStart}
                  className="px-8 py-3.5 rounded-xl font-orbitron tracking-wider text-sm"
                >
                  Start Auction Arena
                </Button>
              ) : (
                <Button
                  onClick={() => toggleReady(code, !currentPlayer?.isReady)}
                  variant={currentPlayer?.isReady ? 'success' : 'primary'}
                  className="px-8 py-3.5 rounded-xl font-orbitron tracking-wider text-sm"
                >
                  {currentPlayer?.isReady ? 'Ready!' : 'Mark Ready'}
                </Button>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <PlayerList
              players={room.players}
              hostId={room.hostId}
              currentPlayerId={playerId}
              onKickPlayer={(pid) => kickPlayer(code, pid)}
              isHostUser={isHost}
            />
          </Card>
        </div>

        {/* Right Column: Settings & state */}
        <div className="space-y-6">
          <RoomSettingsView settings={room.settings} />
          
          <Card className="p-6">
            <WaitingAnimation />
          </Card>
        </div>
      </main>

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => removeToast(t.id)}
            className={`cursor-pointer px-4.5 py-3 rounded-2xl border text-xs font-bold font-orbitron tracking-wider shadow-lg flex items-center justify-between min-w-[280px] backdrop-blur-md transition-all duration-300 ${
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
