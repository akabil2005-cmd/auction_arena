/** Mirrors backend/config/economy.js — amounts in INR (whole rupees) */
export const LAKH = 100_000;
export const CRORE = 10_000_000;

export const QUICK_BID_INCREMENTS = [
  25 * LAKH,
  50 * LAKH,
  2 * CRORE,
  5 * CRORE,
] as const;

export const DEFAULT_STARTING_MONEY = 75 * CRORE;
export const MIN_STARTING_MONEY = 50 * CRORE;
export const MAX_STARTING_MONEY = 100 * CRORE;

export function getDefaultIncrement(currentBid: number): number {
  if (currentBid < 1 * CRORE) return 10 * LAKH;
  if (currentBid < 5 * CRORE) return 25 * LAKH;
  if (currentBid < 10 * CRORE) return 50 * LAKH;
  return 1 * CRORE;
}

export function getAllowedIncrements(currentBid: number): number[] {
  const def = getDefaultIncrement(currentBid);
  return Array.from(new Set([def, ...QUICK_BID_INCREMENTS])).sort((a, b) => a - b);
}

export function snapBidAmount(
  targetAmount: number,
  currentBid: number,
  playerMoney: number
): number {
  const minBid = currentBid + getDefaultIncrement(currentBid);
  let best = minBid;

  for (const inc of getAllowedIncrements(currentBid)) {
    const candidate = currentBid + inc;
    if (candidate <= playerMoney) {
      if (candidate <= targetAmount) best = Math.max(best, candidate);
      if (candidate >= targetAmount) return candidate;
    }
  }

  return Math.min(best, playerMoney);
}

export function isValidBidAmount(
  bidAmount: number,
  currentBid: number,
  playerMoney: number
): boolean {
  if (bidAmount <= currentBid || bidAmount > playerMoney) return false;
  const increment = bidAmount - currentBid;
  return getAllowedIncrements(currentBid).includes(increment);
}
