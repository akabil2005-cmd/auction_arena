'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';
import type { AuctionState, GameResults, AuctionTimerState } from '@/types';
import { getDefaultIncrement, snapBidAmount } from '@/lib/economy';
import { setStoredGameResults, getStoredGameResults } from '@/lib/utils';
import { preloadActressImage } from '@/lib/actressImages';

const initialAuctionState: AuctionState = {
  currentCard: null,
  currentBid: 0,
  highestBidderId: null,
  highestBidderName: null,
  bids: [],
  timeRemaining: 0,
  isActive: false,
  currentRound: 0,
  totalRounds: 0,
  passedPlayers: [],
  soldCards: [],
  unsoldCards: [],
};

function applyTimerToState(
  prev: AuctionState,
  timer: Partial<AuctionTimerState>
): AuctionState {
  return {
    ...prev,
    timeRemaining: timer.timeRemaining ?? prev.timeRemaining,
    timerEndsAt: timer.timerEndsAt ?? prev.timerEndsAt,
    timerGeneration: timer.timerGeneration ?? prev.timerGeneration,
  };
}

export function useAuction(roomCode: string, playerId: string | null) {
  const { emit, emitWithAck, on, isConnected, connectionStatus } = useSocket();
  const [auctionState, setAuctionState] = useState<AuctionState>(initialAuctionState);
  const [gameResults, setGameResults] = useState<GameResults | null>(() =>
    roomCode ? getStoredGameResults<GameResults>(roomCode) : null
  );
  const [isCardRevealing, setIsCardRevealing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [bidAmount, setBidAmount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(true);
  const [isBidding, setIsBidding] = useState(false);
  const hasSyncedRef = useRef(false);

  const applyGameResults = useCallback(
    (results: GameResults) => {
      setGameResults(results);
      if (roomCode) setStoredGameResults(roomCode, results);
    },
    [roomCode]
  );

  const applyFullAuction = useCallback((auction: AuctionState) => {
    setAuctionState(auction);
    if (auction.currentCard) {
      preloadActressImage(auction.currentCard.image);
      const base = auction.currentBid || auction.currentCard.basePrice;
      setBidAmount(
        snapBidAmount(base + getDefaultIncrement(base), base, Number.MAX_SAFE_INTEGER)
      );
    }
    setIsSyncing(false);
  }, []);

  const requestSync = useCallback(async () => {
    if (!roomCode || !isConnected) return;
    setIsSyncing(true);
    try {
      const res = (await emitWithAck('auction:sync', { code: roomCode })) as {
        success?: boolean;
        auction?: AuctionState | null;
        results?: GameResults | null;
      };
      if (res?.results) applyGameResults(res.results);
      if (res?.auction) applyFullAuction(res.auction);
      else setIsSyncing(false);
    } catch {
      setIsSyncing(false);
    }
  }, [roomCode, isConnected, emitWithAck, applyFullAuction, applyGameResults]);

  useEffect(() => {
    if (isConnected && roomCode && !hasSyncedRef.current) {
      hasSyncedRef.current = true;
      requestSync();
    }
  }, [isConnected, roomCode, requestSync]);

  useEffect(() => {
    if (connectionStatus === 'connected' && roomCode) {
      requestSync();
    }
  }, [connectionStatus, roomCode, requestSync]);

  useEffect(() => {
    const cleanups: (() => void)[] = [];

    cleanups.push(on('game:started', ({ auction }) => applyFullAuction(auction)));

    cleanups.push(
      on('room:rejoined', ({ auction, timer }) => {
        if (auction) applyFullAuction(auction);
        else if (timer) {
          setAuctionState((prev) => applyTimerToState(prev, timer));
        }
      })
    );

    cleanups.push(
      on('auction:sync', ({ auction, results }) => {
        if (results) applyGameResults(results);
        if (auction) applyFullAuction(auction);
      })
    );

    cleanups.push(
      on('auction:new-card', ({ card, round, totalRounds, timer }) => {
        setIsCardRevealing(true);
        preloadActressImage(card.image);
        const base = card.basePrice;
        setAuctionState((prev) => {
          const next: AuctionState = {
            ...prev,
            currentCard: card,
            currentBid: base,
            highestBidderId: null,
            highestBidderName: null,
            bids: [],
            isActive: true,
            isPaused: false,
            currentRound: round,
            totalRounds,
            passedPlayers: [],
          };
          return timer ? applyTimerToState(next, timer) : next;
        });
        setBidAmount(snapBidAmount(base + getDefaultIncrement(base), base, Number.MAX_SAFE_INTEGER));
        setTimeout(() => setIsCardRevealing(false), 800);
      })
    );

    cleanups.push(
      on('auction:bid-placed', ({ bid, currentBid, highestBidderId, highestBidderName, timeRemaining, timerEndsAt, timerGeneration }) => {
        setAuctionState((prev) =>
          applyTimerToState(
            {
              ...prev,
              bids: [...prev.bids, bid],
              currentBid,
              highestBidderId,
              highestBidderName,
            },
            { timeRemaining: timeRemaining ?? prev.timeRemaining, timerEndsAt, timerGeneration }
          )
        );
        setBidAmount(
          snapBidAmount(
            currentBid + getDefaultIncrement(currentBid),
            currentBid,
            Number.MAX_SAFE_INTEGER
          )
        );
      })
    );

    cleanups.push(
      on('auction:player-passed', ({ playerId: pid }) => {
        setAuctionState((prev) => ({
          ...prev,
          passedPlayers: prev.passedPlayers.includes(pid)
            ? prev.passedPlayers
            : [...prev.passedPlayers, pid],
        }));
      })
    );

    cleanups.push(on('auction:timer-update', (timer) => {
      setAuctionState((prev) => applyTimerToState(prev, timer));
    }));

    cleanups.push(
      on('auction:paused', () => {
        setAuctionState((prev) => ({ ...prev, isActive: false, isPaused: true }));
      })
    );

    cleanups.push(
      on('auction:resumed', ({ timer }) => {
        setAuctionState((prev) =>
          applyTimerToState({ ...prev, isActive: true, isPaused: false }, timer)
        );
      })
    );

    cleanups.push(
      on('auction:card-sold', ({ soldCard }) => {
        setAuctionState((prev) => ({
          ...prev,
          isActive: false,
          soldCards: [...prev.soldCards, soldCard],
        }));
        if (soldCard.buyerId === playerId) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
      })
    );

    cleanups.push(
      on('auction:card-unsold', ({ card }) => {
        setAuctionState((prev) => ({
          ...prev,
          isActive: false,
          unsoldCards: [...prev.unsoldCards, card],
        }));
      })
    );

    cleanups.push(on('auction:update', ({ auction }) => applyFullAuction(auction)));

    cleanups.push(
      on('game:ended', ({ results }) => {
        if (results) applyGameResults(results);
      })
    );

    return () => cleanups.forEach((c) => c());
  }, [on, playerId, applyFullAuction, applyGameResults]);

  const placeBid = useCallback(
    async (amount: number) => {
      if (!roomCode || isBidding) return;
      setIsBidding(true);
      try {
        const res = (await emitWithAck('auction:bid', { code: roomCode, amount })) as {
          success?: boolean;
          message?: string;
        };
        if (!res?.success) await requestSync();
      } finally {
        setIsBidding(false);
      }
    },
    [emitWithAck, roomCode, isBidding, requestSync]
  );

  const pass = useCallback(async () => {
    if (!roomCode) return;
    await emitWithAck('auction:pass', { code: roomCode });
  }, [emitWithAck, roomCode]);

  const hostAction = useCallback(
    async (event: 'auction:host-end' | 'auction:host-skip' | 'auction:host-pause' | 'auction:host-resume') => {
      if (!roomCode) return;
      return emitWithAck(event, { code: roomCode });
    },
    [emitWithAck, roomCode]
  );

  const hasPassed = playerId ? auctionState.passedPlayers.includes(playerId) : false;
  const isHighestBidder = playerId ? auctionState.highestBidderId === playerId : false;

  return {
    auctionState,
    gameResults,
    isCardRevealing,
    showConfetti,
    bidAmount,
    setBidAmount,
    placeBid,
    pass,
    hostAction,
    hasPassed,
    isHighestBidder,
    isSyncing,
    isBidding,
    requestSync,
    connectionStatus,
  };
}
