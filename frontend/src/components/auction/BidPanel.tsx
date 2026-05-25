'use client';

import React from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { formatMoney } from '@/lib/currency';
import {
  QUICK_BID_INCREMENTS,
  getDefaultIncrement,
  snapBidAmount,
  isValidBidAmount,
} from '@/lib/economy';

interface BidPanelProps {
  currentBid: number;
  bidAmount: number;
  setBidAmount: (amount: number) => void;
  onPlaceBid: (amount: number) => void;
  onPass: () => void;
  playerMoney: number;
  hasPassed: boolean;
  isHighestBidder: boolean;
  isBidding?: boolean;
  isPaused?: boolean;
}

export default function BidPanel({
  currentBid,
  bidAmount,
  setBidAmount,
  onPlaceBid,
  onPass,
  playerMoney,
  hasPassed,
  isHighestBidder,
  isBidding = false,
  isPaused = false,
}: BidPanelProps) {
  const defaultInc = getDefaultIncrement(currentBid);

  const handleQuickBid = (inc: number) => {
    const next = snapBidAmount(currentBid + inc, currentBid, playerMoney);
    setBidAmount(next);
  };

  const handleApplyDefault = () => {
    setBidAmount(snapBidAmount(currentBid + defaultInc, currentBid, playerMoney));
  };

  const isBidValid = isValidBidAmount(bidAmount, currentBid, playerMoney);
  const disabled = hasPassed || isHighestBidder || isBidding || isPaused;

  return (
    <Card className="bg-white/[0.01] space-y-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full space-y-1">
          <label className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase font-orbitron">
            Your Bid (IPL Purse)
          </label>
          <div className="relative flex items-center bg-[#12121e] border border-white/10 rounded-xl px-4 py-2">
            <span className="text-lg font-bold font-orbitron text-purple-400 mr-2 shrink-0">
              {formatMoney(bidAmount)}
            </span>
            <button
              type="button"
              onClick={handleApplyDefault}
              disabled={disabled}
              className="ml-auto text-[10px] font-orbitron font-bold uppercase tracking-wider text-cyan-400/90 hover:text-cyan-300 disabled:opacity-40"
            >
              +{formatMoney(defaultInc)} default
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto shrink-0 self-end">
          {QUICK_BID_INCREMENTS.map((inc) => {
            const next = currentBid + inc;
            const canAfford = next <= playerMoney;
            return (
              <button
                key={inc}
                type="button"
                onClick={() => handleQuickBid(inc)}
                disabled={disabled || !canAfford}
                className="py-3 px-3 rounded-xl bg-white/5 border border-white/[0.06] hover:bg-purple-500/10 hover:border-purple-500/30 text-white font-orbitron font-bold text-xs sm:text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                +{formatMoney(inc)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-4 pt-1">
        <Button
          onClick={onPass}
          variant="danger"
          disabled={disabled}
          className="flex-1 py-3.5 rounded-xl font-orbitron tracking-wider text-sm"
        >
          {hasPassed ? 'Passed' : 'Pass'}
        </Button>

        <Button
          onClick={() => onPlaceBid(bidAmount)}
          variant={isHighestBidder ? 'success' : 'primary'}
          glow={isBidValid && !disabled}
          disabled={!isBidValid || disabled}
          className="flex-[2] py-3.5 rounded-xl font-orbitron tracking-wider text-sm"
        >
          {isPaused
            ? 'Auction Paused'
            : isBidding
            ? 'Placing Bid…'
            : isHighestBidder
            ? 'Highest Bidder'
            : hasPassed
            ? 'Passed Round'
            : bidAmount > playerMoney
            ? 'Insufficient Purse'
            : !isBidValid
            ? 'Use quick bid buttons'
            : `Bid ${formatMoney(bidAmount)}`}
        </Button>
      </div>
    </Card>
  );
}
