import type { CardCategory } from '@/types';

/**
 * Merge Tailwind class names, filtering out falsy values.
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export { formatAuctionMoney as formatMoney } from './currency';

/**
 * Generate a DiceBear avatar URL from a seed string.
 */
export function getAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`;
}

/**
 * Get category color classes.
 */
export function getCategoryColors(category: CardCategory): {
  bg: string;
  text: string;
  border: string;
  glow: string;
} {
  switch (category) {
    case 'Platinum':
      return {
        bg: 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20',
        text: 'text-cyan-300',
        border: 'border-cyan-500/50',
        glow: 'shadow-cyan-500/30',
      };
    case 'Gold':
      return {
        bg: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20',
        text: 'text-amber-300',
        border: 'border-amber-500/50',
        glow: 'shadow-amber-500/30',
      };
    case 'Silver':
      return {
        bg: 'bg-gradient-to-r from-gray-400/20 to-slate-300/20',
        text: 'text-gray-300',
        border: 'border-gray-400/50',
        glow: 'shadow-gray-400/30',
      };
    case 'Bronze':
      return {
        bg: 'bg-gradient-to-r from-orange-600/20 to-amber-700/20',
        text: 'text-orange-300',
        border: 'border-orange-600/50',
        glow: 'shadow-orange-600/30',
      };
  }
}

/**
 * Generate a unique ID.
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Format a timestamp to a readable time string.
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Copy text to clipboard.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch {
      document.body.removeChild(textArea);
      return false;
    }
  }
}

/**
 * Clamp a number between a min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Get player's stored ID from sessionStorage.
 */
export function getStoredPlayerId(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('playerId');
}

/**
 * Store player ID in sessionStorage.
 */
export function setStoredPlayerId(id: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('playerId', id);
}

/**
 * Get stored nickname from sessionStorage.
 */
export function getStoredNickname(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('nickname');
}

/**
 * Store nickname in sessionStorage.
 */
export function setStoredNickname(nickname: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('nickname', nickname);
}

export function getStoredRoomCode(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('roomCode');
}

export function setStoredRoomCode(code: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('roomCode', code.toUpperCase());
}

export function clearStoredSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('playerId');
  sessionStorage.removeItem('nickname');
  sessionStorage.removeItem('roomCode');
}

export {
  QUICK_BID_INCREMENTS,
  getDefaultIncrement,
  getAllowedIncrements,
  snapBidAmount,
  isValidBidAmount,
  DEFAULT_STARTING_MONEY,
  MIN_STARTING_MONEY,
  MAX_STARTING_MONEY,
} from './economy';

export function setStoredGameResults(code: string, results: unknown): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(`gameResults:${code.toUpperCase()}`, JSON.stringify(results));
}

export function getStoredGameResults<T>(code: string): T | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(`gameResults:${code.toUpperCase()}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
