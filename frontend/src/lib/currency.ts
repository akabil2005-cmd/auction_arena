import { CRORE, LAKH } from './economy';

/**
 * Format INR for IPL-style display: ₹25L, ₹1.5cr, ₹7.25cr
 */
export function formatAuctionMoney(amount: number): string {
  if (!Number.isFinite(amount) || amount === 0) return '₹0';

  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= CRORE) {
    const cr = abs / CRORE;
    const formatted =
      cr >= 10 ? cr.toFixed(0) : cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2).replace(/\.?0+$/, '');
    return `${sign}₹${formatted}cr`;
  }

  if (abs >= LAKH) {
    const lakhs = abs / LAKH;
    const formatted =
      lakhs >= 100 ? lakhs.toFixed(0) : lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(2).replace(/\.?0+$/, '');
    return `${sign}₹${formatted}L`;
  }

  return `${sign}₹${abs.toLocaleString('en-IN')}`;
}

/** Alias for UI components */
export const formatMoney = formatAuctionMoney;
