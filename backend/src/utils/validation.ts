export const parseAmount = (value: unknown, allowZero = false): number | null => {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !value.trim()) return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000_000_000) return null;
  if (!allowZero && amount <= 0) return null;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
};

export const parseDate = (value: unknown, endOfDay = false): Date | null => {
  if (value === undefined || value === null || value === '') return new Date();
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
    if (endOfDay) date.setUTCHours(23, 59, 59, 999);
    return date;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const isTransactionType = (value: unknown): value is 'INCOME' | 'EXPENSE' =>
  value === 'INCOME' || value === 'EXPENSE';

export const cleanText = (value: unknown, maxLength: number): string | null => {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text && text.length <= maxLength ? text : null;
};
