'use client';

import React, { useEffect, useRef } from 'react';
import type { Bid } from '@/types';
import { formatTime } from '@/lib/utils';
import { formatMoney } from '@/lib/currency';
import { motion, AnimatePresence } from 'framer-motion';

interface BidHistoryProps {
  bids: Bid[];
  currentCardId: string | null;
}

export default function BidHistory({ bids, currentCardId }: BidHistoryProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [bids]);

  return (
    <div className="flex flex-col h-[280px] bg-white/[0.01] border border-white/[0.05] rounded-3xl p-5">
      <h3 className="text-xs font-bold tracking-widest text-cyan-400 uppercase font-orbitron mb-3">
        Bid Stream
      </h3>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-2 pr-1 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {bids.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 font-semibold text-xs uppercase tracking-wider font-orbitron">
              Waiting for first bid...
            </div>
          ) : (
            bids.map((bid, index) => {
              const isLatest = index === bids.length - 1;

              return (
                <motion.div
                  key={bid.id || `${bid.amount}-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isLatest
                      ? 'bg-purple-500/10 border-purple-500/30 shadow-[0_0_10px_rgba(139,92,246,0.1)]'
                      : 'bg-white/[0.01] border-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isLatest ? 'bg-purple-400 animate-pulse' : 'bg-gray-600'
                      }`}
                    />
                    <span className="text-xs font-semibold text-gray-200">
                      {bid.playerName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-bold text-gray-500 font-orbitron uppercase">
                      {formatTime(bid.timestamp)}
                    </span>
                    <span className="text-sm font-orbitron font-extrabold text-white">
                      {formatMoney(bid.amount)}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
