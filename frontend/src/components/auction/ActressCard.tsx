'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AuctionCard } from '@/types';
import { getCategoryColors } from '@/lib/utils';
import { formatMoney } from '@/lib/currency';
import { preloadActressImage } from '@/lib/actressImages';
import Badge from '../ui/Badge';
import ActressImage from '../ui/ActressImage';

interface ActressCardProps {
  card: AuctionCard | null;
  currentBid: number;
  highestBidderName: string | null;
  isRevealing: boolean;
  status: 'active' | 'paused' | 'card-sold' | 'card-unsold' | 'finished' | string;
}

export default function ActressCard({
  card,
  currentBid,
  highestBidderName,
  isRevealing,
  status,
}: ActressCardProps) {
  useEffect(() => {
    if (card?.image) preloadActressImage(card.image);
  }, [card?.id, card?.image]);

  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center h-[min(420px,55vh)] bg-white/[0.02] border border-white/[0.05] rounded-3xl p-8 text-center backdrop-blur-sm">
        <div className="w-16 h-16 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent animate-spin mb-4" />
        <p className="text-gray-400 font-orbitron font-bold uppercase tracking-wider text-sm">
          Preparing Next Star...
        </p>
      </div>
    );
  }

  const categoryColors = getCategoryColors(card.category);
  const isSold = status === 'card-sold';
  const isUnsold = status === 'card-unsold';

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={card.id}
          initial={{ opacity: 0, scale: 0.92, rotateY: 90 }}
          animate={{ opacity: isRevealing ? 0.6 : 1, scale: 1, rotateY: 0 }}
          exit={{ opacity: 0, scale: 0.92, rotateY: -90 }}
          transition={{ duration: 0.55, type: 'spring', stiffness: 80 }}
          className={`relative overflow-hidden bg-gradient-to-b from-[#161626]/90 to-[#0e0e1a]/95 border-2 rounded-3xl shadow-2xl p-4 sm:p-6 h-[min(420px,55vh)] flex flex-col justify-between backdrop-blur-md ${categoryColors.border} ${categoryColors.glow}`}
        >
          <div className="flex items-center justify-between z-10 gap-2">
            <Badge
              variant={
                card.category === 'Platinum'
                  ? 'primary'
                  : card.category === 'Gold'
                  ? 'warning'
                  : card.category === 'Silver'
                  ? 'info'
                  : 'gray'
              }
            >
              {card.category}
            </Badge>
            <div className="text-right">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-orbitron block">
                Base Price
              </span>
              <span className="text-sm font-extrabold font-orbitron text-amber-400">
                {formatMoney(card.basePrice)}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center my-2 sm:my-4 relative flex-1 min-h-0">
            <div
              className={`relative w-28 h-36 sm:w-36 sm:h-44 rounded-2xl bg-[#08080d]/80 overflow-hidden border shadow-lg ${categoryColors.border}`}
            >
              <ActressImage
                src={card.image}
                alt={card.name}
                priority
                sizes="(max-width: 640px) 180px, 220px"
              />

              <AnimatePresence>
                {isSold && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 bg-emerald-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-2 z-10"
                  >
                    <span className="text-xs uppercase font-orbitron font-extrabold tracking-widest text-emerald-400 bg-emerald-900/50 px-2 py-0.5 rounded border border-emerald-500/30">
                      SOLD
                    </span>
                    <span className="text-white font-bold text-sm mt-1.5 truncate max-w-full">
                      {highestBidderName}
                    </span>
                    <span className="text-emerald-400 font-orbitron font-extrabold text-xs mt-0.5">
                      {formatMoney(currentBid)}
                    </span>
                  </motion.div>
                )}
                {isUnsold && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 bg-red-950/80 backdrop-blur-sm flex items-center justify-center text-center p-2 z-10"
                  >
                    <span className="text-xs uppercase font-orbitron font-extrabold tracking-widest text-red-400 bg-red-900/50 px-2.5 py-1 rounded border border-red-500/30">
                      UNSOLD
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <h2 className="text-xl sm:text-2xl font-orbitron font-extrabold text-white text-center mt-3 sm:mt-4 tracking-wide px-2">
              {card.name}
            </h2>
            <p className="text-xs text-gray-500 font-semibold font-orbitron uppercase tracking-wider mt-1 text-center px-2">
              {card.description || 'South Indian Cinema'}
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.04] p-3 sm:p-4 rounded-2xl flex items-center justify-between mt-auto gap-2">
            <div className="min-w-0">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                Highest Bidder
              </span>
              <span className="text-sm font-semibold text-white truncate block">
                {highestBidderName || 'No Bids'}
              </span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                Current Bid
              </span>
              <motion.span
                key={currentBid}
                initial={{ scale: 1.15, color: '#f472b6' }}
                animate={{ scale: 1, color: '#ffffff' }}
                className="text-lg sm:text-xl font-orbitron font-extrabold text-white block"
              >
                {formatMoney(currentBid)}
              </motion.span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
