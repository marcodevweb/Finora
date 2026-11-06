import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock } = vi.hoisted(() => ({ prismaMock: {
  transaction: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  account: { findFirst: vi.fn(), update: vi.fn() },
  category: { findFirst: vi.fn() },
  $transaction: vi.fn(),
} }));

vi.mock('../src/config/prisma', () => ({ default: prismaMock }));

import { updateTransaction } from '../src/controllers/transactionController';
import { AuthRequest, authenticateToken } from '../src/middlewares/auth';
import { parseAmount, parseDate } from '../src/utils/validation';
import { csvCell } from '../src/controllers/exportController';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../src/config/security';

const responseMock = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('security and input validation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects non-numeric, infinite, zero, and excessively large amounts', () => {
    expect(parseAmount('12.35')).toBe(12.35);
    expect(parseAmount('12abc')).toBeNull();
    expect(parseAmount('Infinity')).toBeNull();
    expect(parseAmount(0)).toBeNull();
    expect(parseAmount(1_000_000_000_001)).toBeNull();
  });

  it('does not update a transaction to another user account', async () => {
    prismaMock.transaction.findFirst.mockResolvedValue({
      id: 'tx-owned', userId: 'user-a', accountId: 'account-a', categoryId: 'category-a',
      amount: 10, type: 'EXPENSE', description: 'Market', date: new Date(), notes: null,
    });
    prismaMock.account.findFirst
      .mockResolvedValueOnce({ id: 'account-a', userId: 'user-a' })
      .mockResolvedValueOnce(null);

    const req = {
      user: { userId: 'user-a', email: 'a@example.com' },
      params: { id: 'tx-owned' },
      body: { accountId: 'account-b' },
    } as unknown as AuthRequest;
    const res = responseMock();

    await updateTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(prismaMock.account.update).not.toHaveBeenCalled();
  });

  it('accepts the HttpOnly session cookie and rejects a Bearer-only token', () => {
    const token = jwt.sign({ userId: 'user-a', email: 'a@example.com' }, JWT_SECRET);
    const next = vi.fn();
    const res = responseMock();
    const cookieReq = { headers: { cookie: `theme=dark; finora_session=${token}` } } as AuthRequest;
    authenticateToken(cookieReq, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(cookieReq.user?.userId).toBe('user-a');

    const deniedRes = responseMock();
    authenticateToken({ headers: { authorization: `Bearer ${token}` } } as AuthRequest, deniedRes, vi.fn());
    expect(deniedRes.status).toHaveBeenCalledWith(401);
  });

  it('neutralizes spreadsheet formula payloads in exported cells', () => {
    expect(csvCell('=HYPERLINK("https://bad.invalid")')).toBe('"\'=HYPERLINK(""https://bad.invalid"")"');
    expect(csvCell('Conta normal')).toBe('"Conta normal"');
  });

  it('validates calendar dates and includes the full end date in filters', () => {
    expect(parseDate('2026-02-30')).toBeNull();
    expect(parseDate('2026-11-05', true)?.toISOString()).toBe('2026-11-05T23:59:59.999Z');
  });
});
