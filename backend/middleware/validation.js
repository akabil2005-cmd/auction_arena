// Rate limiting and input validation middleware

const {
  validateBidIncrement: economyValidateIncrement,
  MIN_PURSE,
  MAX_PURSE,
  DEFAULT_STARTING_MONEY,
} = require('../config/economy');
const actresses = require('../data/actresses');

const rateLimitMap = new Map();

const RATE_LIMITS = {
  'place-bid': { windowMs: 1000, maxRequests: 4 },
  'pass-card': { windowMs: 1000, maxRequests: 3 },
  'send-chat': { windowMs: 2000, maxRequests: 5 },
  'room-rejoin': { windowMs: 3000, maxRequests: 3 },
  'auction-sync': { windowMs: 2000, maxRequests: 5 },
  default: { windowMs: 500, maxRequests: 12 },
};

function checkRateLimit(socket, eventName) {
  const key = `${socket.id}:${eventName}`;
  const limit = RATE_LIMITS[eventName] || RATE_LIMITS.default;
  const now = Date.now();

  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return true;
  }

  const entry = rateLimitMap.get(key);
  if (now - entry.windowStart > limit.windowMs) {
    entry.count = 1;
    entry.windowStart = now;
    return true;
  }

  entry.count++;
  if (entry.count > limit.maxRequests) {
    return false;
  }
  return true;
}

function socketRateLimit(eventName) {
  return (socket, data, next) => {
    if (checkRateLimit(socket, eventName)) return next();
    socket.emit('room:error', { message: 'Too many requests. Please slow down.' });
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now - entry.windowStart > 60000) {
      rateLimitMap.delete(key);
    }
  }
}, 60000);

function validateRoomCode(code) {
  if (!code || typeof code !== 'string') return false;
  return /^[A-Z0-9]{6}$/.test(code.toUpperCase());
}

function validateNickname(nickname) {
  if (!nickname || typeof nickname !== 'string') return false;
  const trimmed = nickname.trim();
  return trimmed.length >= 1 && trimmed.length <= 20;
}

function validateBidIncrement(increment, currentBid = 0) {
  return economyValidateIncrement(increment, currentBid);
}

function validateRoomSettings(settings) {
  const errors = [];
  const purse = Math.round(Number(settings.initialMoney));
  if (!Number.isFinite(purse) || purse < MIN_PURSE || purse > MAX_PURSE) {
    errors.push('Starting purse must be between ₹50cr and ₹100cr');
  }
  if (settings.timerDuration < 10 || settings.timerDuration > 60) {
    errors.push('Timer duration must be between 10 and 60 seconds');
  }
  if (settings.maxPlayers < 2 || settings.maxPlayers > 8) {
    errors.push('Max players must be between 2 and 8');
  }
  const deckSize = actresses.length;
  if (settings.totalCards < deckSize || settings.totalCards > deckSize) {
    errors.push(`Auction runs all ${deckSize} actress cards`);
  }
  return errors;
}

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '').trim().substring(0, 200);
}

module.exports = {
  socketRateLimit,
  checkRateLimit,
  validateRoomCode,
  validateNickname,
  validateBidIncrement,
  validateRoomSettings,
  sanitizeString,
  DEFAULT_STARTING_MONEY,
};
