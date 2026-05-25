'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRoom } from '@/hooks/useRoom';
import { useAuction } from '@/hooks/useAuction';
import Leaderboard from '@/components/scoreboard/Leaderboard';
import PlayerSummary from '@/components/scoreboard/PlayerSummary';
import UnsoldCards from '@/components/scoreboard/UnsoldCards';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import ConnectionIndicator from '@/components/ui/ConnectionIndicator';
import { HomeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useSocket } from '@/hooks/useSocket';
import { setStoredRoomCode } from '@/lib/utils';

export default function ScoreboardPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  useEffect(() => {
    setStoredRoomCode(code);
  }, [code]);

  const {
    room,
    playerId,
    isHost,
    toasts,
    removeToast,
    connectionStatus,
  } = useRoom(code);

  const { gameResults, requestSync, connectionStatus: auctionConn } = useAuction(code, playerId);
  const { emitWithAck } = useSocket();

  useEffect(() => {
    if (room?.status === 'waiting') {
      router.replace(`/room/${code}`);
    }
  }, [room?.status, router, code]);

  useEffect(() => {
    if (!gameResults && room?.status === 'finished') {
      requestSync();
    }
  }, [gameResults, room?.status, requestSync]);

  const handleRestart = async () => {
    const res = (await emitWithAck('game:restart', { code })) as { success?: boolean };
    if (res?.success) {
      router.push(`/room/${code}`);
    }
  };

  const liveStatus = auctionConn || connectionStatus;
  const isLoading = !gameResults && room?.status !== 'waiting';

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#07070c] px-4 text-center gap-4">
        <ConnectionIndicator status={liveStatus} />
        <div className="w-12 h-12 rounded-full border-4 border-t-purple-500 border-r-transparent animate-spin" />
        <p className="font-orbitron font-bold uppercase tracking-wider text-sm text-gray-400">
          Compiling final auction results…
        </p>
      </div>
    );
  }

  if (!gameResults) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#07070c] px-4 text-center gap-4">
        <p className="font-orbitron text-gray-400">Results unavailable.</p>
        <Button onClick={() => router.push('/')}>Home</Button>
      </div>
    );
  }

  const mvp = gameResults.playerResults[0];

  return (
    <div className="relative flex flex-col min-h-screen bg-[#07070c] pb-16">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <header className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-orbitron font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            AUCTION SCOREBOARD
          </h1>
          <Badge variant="success" size="sm">
            Complete
          </Badge>
          <ConnectionIndicator status={liveStatus} />
        </div>

        <div className="flex gap-3">
          {isHost ? (
            <Button
              onClick={handleRestart}
              variant="primary"
              glow
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-orbitron text-xs uppercase"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Restart Arena
            </Button>
          ) : (
            <span className="text-xs text-gray-500 font-orbitron uppercase self-center">
              Waiting for host
            </span>
          )}
          <Button
            onClick={() => router.push('/')}
            variant="ghost"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-orbitron text-xs uppercase"
          >
            <HomeIcon className="w-4 h-4" />
            Home
          </Button>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-5xl font-orbitron font-extrabold text-white tracking-wider">
            AUCTION CONCLUDED
          </h2>
          <p className="text-sm text-gray-400 font-orbitron uppercase tracking-widest">
            Room {code} · {gameResults.totalRounds} rounds
          </p>
        </div>

        {mvp && (
          <Card className="p-6 bg-gradient-to-r from-amber-500/10 to-purple-500/10 border-amber-500/30 text-center">
            <p className="text-[10px] font-orbitron uppercase tracking-widest text-amber-400 mb-2">
              MVP — Most Valuable Player
            </p>
            <p className="text-2xl font-orbitron font-extrabold text-white">{mvp.player.nickname}</p>
            <p className="text-sm text-gray-400 mt-1">
              {mvp.cardsOwned} stars acquired · Score {mvp.score.toLocaleString('en-IN')}
            </p>
          </Card>
        )}

        <Leaderboard results={gameResults.playerResults} />
        <PlayerSummary results={gameResults.playerResults} />
        <UnsoldCards cards={gameResults.unsoldCards} />
      </main>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => removeToast(t.id)}
            className="cursor-pointer px-4 py-3 rounded-2xl border text-xs font-orbitron backdrop-blur-md"
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
