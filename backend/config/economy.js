/** IPL-style auction economy — amounts in INR (whole rupees) */
const LAKH = 100_000;
const CRORE = 10 * LAKH * 100; // 10_000_000

const QUICK_BID_INCREMENTS = [
  25 * LAKH, // ₹25L
  50 * LAKH, // ₹50L
  2 * CRORE, // ₹2cr
  5 * CRORE, // ₹5cr
];

const DEFAULT_STARTING_MONEY = 75 * CRORE;
const MIN_STARTING_MONEY = 50 * CRORE;
const MAX_STARTING_MONEY = 100 * CRORE;

const MIN_BASE_PRICE = 10 * LAKH;
const MAX_BASE_PRICE = 2 * CRORE;

function getDefaultIncrement(currentBid) {
  if (currentBid < 1 * CRORE) return 10 * LAKH;
  if (currentBid < 5 * CRORE) return 25 * LAKH;
  if (currentBid < 10 * CRORE) return 50 * LAKH;
  return 1 * CRORE;
}

function getAllowedIncrements(currentBid) {
  const def = getDefaultIncrement(currentBid);
  const set = new Set([def, ...QUICK_BID_INCREMENTS]);
  return Array.from(set).sort((a, b) => a - b);
}

function validateBidIncrement(increment, currentBid) {
  if (!Number.isFinite(increment) || increment <= 0) return false;
  return getAllowedIncrements(currentBid).includes(increment);
}

function computeNextBid(currentBid, increment) {
  return currentBid + increment;
}

module.exports = {
  LAKH,
  CRORE,
  QUICK_BID_INCREMENTS,
  DEFAULT_STARTING_MONEY,
  MIN_STARTING_MONEY,
  MAX_STARTING_MONEY,
  MIN_BASE_PRICE,
  MAX_BASE_PRICE,
  getDefaultIncrement,
  getAllowedIncrements,
  validateBidIncrement,
  computeNextBid,
};
