'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRoom } from '@/hooks/useRoom';
import { useAuction } from '@/hooks/useAuction';
import ActressCard from '@/components/auction/ActressCard';
import BidPanel from '@/components/auction/BidPanel';
import BidHistory from '@/components/auction/BidHistory';
import PlayerMoney from '@/components/auction/PlayerMoney';
import ChatPanel from '@/components/auction/ChatPanel';
import Timer from '@/components/ui/Timer';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import ConnectionIndicator from '@/components/ui/ConnectionIndicator';
import HostControls from '@/components/auction/HostControls';
import confetti from 'canvas-confetti';
import { setStoredRoomCode } from '@/lib/utils';
import { formatMoney } from '@/lib/currency';

export default function AuctionRoom() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  useEffect(() => {
    setStoredRoomCode(code);
  }, [code]);

  const {
    room,
    playerId,
    currentPlayer,
    isHost,
    chatMessages,
    toasts,
    removeToast,
    sendChatMessage,
    connectionStatus,
  } = useRoom(code);

  const {
    auctionState,
    gameResults,
    isCardRevealing,
    showConfetti,
    bidAmount,
    setBidAmount,
    placeBid,
    pass,
    hasPassed,
    isHighestBidder,
    isSyncing,
    isBidding,
    hostAction,
    connectionStatus: auctionConnectionStatus,
  } = useAuction(code, playerId);

  const liveStatus = auctionConnectionStatus || connectionStatus;

  useEffect(() => {
    if (showConfetti) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [showConfetti]);

  useEffect(() => {
    if (room?.status === 'waiting') {
      router.replace(`/room/${code}`);
      return;
    }
    if (room?.status === 'finished' || gameResults) {
      router.push(`/scoreboard/${code}`);
    }
  }, [room?.status, gameResults, router, code]);

  const isLoading =
    !room || (isSyncing && !auctionState.currentCard && auctionState.currentRound === 0);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#07070c] px-4 text-center gap-4">
        <ConnectionIndicator status={liveStatus} />
        <div className="w-12 h-12 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <p className="font-orbitron font-bold uppercase tracking-wider text-sm text-gray-400">
          {liveStatus === 'reconnecting'
            ? 'Reconnecting to auction…'
            : 'Syncing auction state…'}
        </p>
      </div>
    );
  }

  const { currentCard, currentRound, totalRounds } = auctionState;

  return (
    <div className="relative flex flex-col min-h-screen bg-[#07070c]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <header className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-3 sm:gap-4">
          <h1 className="text-base sm:text-lg font-orbitron font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            AUCTION ARENA
          </h1>
          <Badge variant="secondary" size="sm">
            {code}
          </Badge>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <ConnectionIndicator status={liveStatus} />
          <div className="text-right">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-orbitron block">
              Round
            </span>
            <span className="text-sm font-extrabold font-orbitron text-white">
              {currentRound} / {totalRounds}
            </span>
          </div>
          <div className="h-8 w-px bg-white/10 hidden sm:block" />
          <div className="text-right">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-orbitron block">
              Budget
            </span>
            <span className="text-sm font-extrabold font-orbitron text-purple-400">
              {formatMoney(currentPlayer?.money || 0)}
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-stretch">
            <div className="md:col-span-4 flex md:flex-col items-center justify-center gap-4 p-4 sm:p-6 bg-white/[0.02] border border-white/[0.04] rounded-3xl backdrop-blur-sm">
              <Timer
                timeRemaining={auctionState.timeRemaining}
                totalTime={room.settings.timerDuration}
                timerEndsAt={auctionState.timerEndsAt}
                timerGeneration={auctionState.timerGeneration}
              />
              <div className="text-center md:mt-2">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-orbitron block">
                  Status
                </span>
                <span
                  className={`text-xs font-bold uppercase tracking-widest font-orbitron block mt-1 ${
                    auctionState.isActive ? 'text-emerald-400 animate-pulse' : 'text-amber-400'
                  }`}
                >
                  {auctionState.isActive ? 'Bids Open' : 'Settling'}
                </span>
              </div>
            </div>

            <div className="md:col-span-8">
              <ActressCard
                card={currentCard}
                currentBid={auctionState.currentBid}
                highestBidderName={auctionState.highestBidderName}
                isRevealing={isCardRevealing}
                status={
                  room.status === 'finished'
                    ? 'finished'
                    : auctionState.isActive
                    ? 'active'
                    : auctionState.highestBidderId
                    ? 'card-sold'
                    : 'card-unsold'
                }
              />
            </div>
          </div>

          {isHost && (
            <HostControls
              roomCode={code}
              isPaused={!!auctionState.isPaused}
              onEnd={() => hostAction('auction:host-end')}
              onSkip={() => hostAction('auction:host-skip')}
              onPause={() => hostAction('auction:host-pause')}
              onResume={() => hostAction('auction:host-resume')}
            />
          )}

          {currentCard && (
            <BidPanel
              currentBid={auctionState.currentBid}
              bidAmount={bidAmount}
              setBidAmount={setBidAmount}
              onPlaceBid={placeBid}
              onPass={pass}
              playerMoney={currentPlayer?.money || 0}
              hasPassed={hasPassed}
              isHighestBidder={isHighestBidder}
              isBidding={isBidding}
              isPaused={!!auctionState.isPaused}
            />
          )}

          <BidHistory
            bids={auctionState.bids}
            currentCardId={currentCard ? currentCard.id : null}
          />
        </div>

        <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-6">
          <Card className="p-4 sm:p-5 flex-1 min-h-[200px]">
            <PlayerMoney
              players={room.players}
              passedPlayerIds={auctionState.passedPlayers}
              highestBidderId={auctionState.highestBidderId}
              currentPlayerId={playerId}
            />
          </Card>

          <ChatPanel
            messages={chatMessages}
            onSendMessage={(msg) => sendChatMessage(code, msg)}
            roomCode={code}
          />
        </div>
      </main>

      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-[min(100vw-2rem,320px)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => removeToast(t.id)}
            className={`cursor-pointer px-4 py-3 rounded-2xl border text-xs font-bold font-orbitron tracking-wider shadow-lg backdrop-blur-md ${
              t.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : t.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : t.type === 'warning'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
