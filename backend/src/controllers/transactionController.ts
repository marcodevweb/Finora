import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middlewares/auth';
import { cleanText, isTransactionType, parseAmount, parseDate } from '../utils/validation';

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { type, categoryId, search, startDate, endDate, accountId } = req.query;

    const from = startDate === undefined ? null : parseDate(String(startDate));
    const to = endDate === undefined ? null : parseDate(String(endDate), true);
    if ((type !== undefined && !isTransactionType(type)) || (startDate !== undefined && !from) ||
        (endDate !== undefined && !to) || (from && to && from > to)) {
      return res.status(400).json({ error: 'Filtros de movimentação inválidos.' });
    }

    const where: any = {
      userId,
      account: { is: { userId } },
      category: { is: { OR: [{ userId: null }, { userId }] } },
    };

    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;
    if (accountId) where.accountId = accountId;

    if (search) {
      where.description = {
        contains: String(search),
        mode: 'insensitive'
      };
    }

    if (startDate || endDate) {
      where.date = {};
      if (from) where.date.gte = from;
      if (to) where.date.lte = to;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true,
        account: true
      },
      orderBy: { date: 'desc' }
    });

    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { accountId, categoryId, amount, type, description, date, notes } = req.body;

    const numericAmount = parseAmount(amount);
    const cleanDescription = cleanText(description, 200);
    const parsedDate = parseDate(date);
    if (typeof accountId !== 'string' || typeof categoryId !== 'string' || !numericAmount ||
        !isTransactionType(type) || !cleanDescription || !parsedDate ||
        (notes !== undefined && notes !== null && (typeof notes !== 'string' || notes.length > 2000))) {
      return res.status(400).json({ error: 'Confira os dados da movimentação.' });
    }

    // Verify account belongs to user
    const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
    if (!account) {
      return res.status(403).json({ error: 'Unauthorized account' });
    }

    const category = await prisma.category.findFirst({
      where: { id: categoryId, type, OR: [{ userId: null }, { userId }] },
    });
    if (!category) return res.status(400).json({ error: 'Categoria inválida para esta movimentação.' });

    // Create transaction and update account balance in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId,
          accountId,
          categoryId,
          amount: numericAmount,
          type,
          description: cleanDescription,
          date: parsedDate,
          notes: notes ?? null
        },
        include: {
          category: true,
          account: true
        }
      });

      // Update account balance
      const balanceChange = type === 'INCOME' ? numericAmount : -numericAmount;
      await tx.account.update({
        where: { id: accountId },
        data: {
          balance: {
            increment: balanceChange
          }
        }
      });

      return transaction;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { accountId, categoryId, amount, type, description, date, notes } = req.body;

    const existing = await prisma.transaction.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const oldAccount = await prisma.account.findFirst({ where: { id: existing.accountId, userId } });
    if (!oldAccount) return res.status(409).json({ error: 'Movimentação com conta inconsistente; contate o suporte.' });

    const numericAmount = amount !== undefined ? parseAmount(amount) : Number(existing.amount);
    const newType = type !== undefined ? type : existing.type;
    const targetAccountId = accountId !== undefined ? accountId : existing.accountId;
    const targetCategoryId = categoryId !== undefined ? categoryId : existing.categoryId;
    const cleanDescription = description !== undefined ? cleanText(description, 200) : existing.description;
    const parsedDate = date !== undefined ? parseDate(date) : existing.date;
    if (!numericAmount || !isTransactionType(newType) || typeof targetAccountId !== 'string' ||
        typeof targetCategoryId !== 'string' || !cleanDescription || !parsedDate ||
        (notes !== undefined && notes !== null && (typeof notes !== 'string' || notes.length > 2000))) {
      return res.status(400).json({ error: 'Confira os dados da movimentação.' });
    }

    const targetAccount = await prisma.account.findFirst({ where: { id: targetAccountId, userId } });
    if (!targetAccount) return res.status(403).json({ error: 'Conta não autorizada.' });
    const targetCategory = await prisma.category.findFirst({
      where: { id: targetCategoryId, type: newType, OR: [{ userId: null }, { userId }] },
    });
    if (!targetCategory) return res.status(400).json({ error: 'Categoria inválida para esta movimentação.' });

    const result = await prisma.$transaction(async (tx) => {
      // Revert old balance effect on old account
      const oldBalanceChange = existing.type === 'INCOME' ? -Number(existing.amount) : Number(existing.amount);
      await tx.account.update({
        where: { id: existing.accountId },
        data: { balance: { increment: oldBalanceChange } }
      });

      // Apply new balance effect on target account
      const newBalanceChange = newType === 'INCOME' ? numericAmount : -numericAmount;
      await tx.account.update({
        where: { id: targetAccountId },
        data: { balance: { increment: newBalanceChange } }
      });

      const updated = await tx.transaction.update({
        where: { id },
        data: {
          accountId: targetAccountId,
          categoryId: targetCategoryId,
          amount: numericAmount,
          type: newType,
          description: cleanDescription,
          date: parsedDate,
          notes: notes !== undefined ? notes : existing.notes
        },
        include: {
          category: true,
          account: true
        }
      });

      return updated;
    });

    res.json(result);
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const existing = await prisma.transaction.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const oldAccount = await prisma.account.findFirst({ where: { id: existing.accountId, userId } });
    if (!oldAccount) return res.status(409).json({ error: 'Movimentação com conta inconsistente; contate o suporte.' });

    await prisma.$transaction(async (tx) => {
      // Revert balance effect
      const balanceChange = existing.type === 'INCOME' ? -Number(existing.amount) : Number(existing.amount);
      await tx.account.update({
        where: { id: existing.accountId },
        data: { balance: { increment: balanceChange } }
      });

      await tx.transaction.delete({ where: { id } });
    });

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
