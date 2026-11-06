import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middlewares/auth';
import { cleanText } from '../utils/validation';

export const getAccounts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const accounts = await prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });
    res.json(accounts);
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, type, balance } = req.body;

    const cleanName = cleanText(name, 100);
    const accountTypes = ['CHECKING', 'SAVINGS', 'INVESTMENT', 'CREDIT_CARD'];
    const initialBalance = balance === undefined
      ? 0
      : (typeof balance === 'number' || typeof balance === 'string') ? Number(balance) : Number.NaN;
    if (!cleanName || typeof type !== 'string' || !accountTypes.includes(type) ||
        !Number.isFinite(initialBalance) || Math.abs(initialBalance) > 1_000_000_000_000) {
      return res.status(400).json({ error: 'Confira o nome, tipo e saldo inicial da conta.' });
    }

    const account = await prisma.account.create({
      data: {
        userId,
        name: cleanName,
        type,
        balance: Math.round((initialBalance + Number.EPSILON) * 100) / 100
      }
    });

    res.status(201).json(account);
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
