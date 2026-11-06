import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middlewares/auth';
import { parseAmount } from '../utils/validation';

export const getBudgets = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { month, year } = req.query;

    const currentMonth = month ? Number(month) : new Date().getMonth() + 1;
    const currentYear = year ? Number(year) : new Date().getFullYear();
    if (!Number.isInteger(currentMonth) || currentMonth < 1 || currentMonth > 12 ||
        !Number.isInteger(currentYear) || currentYear < 2000 || currentYear > 2200) {
      return res.status(400).json({ error: 'Mês ou ano inválido.' });
    }

    const budgets = await prisma.budget.findMany({
      where: {
        userId,
        category: { is: { OR: [{ userId: null }, { userId }] } },
        month: currentMonth,
        year: currentYear
      },
      include: {
        category: true
      }
    });

    // Calculate actual spending for each budget category in this month
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        account: { is: { userId } },
        category: { is: { OR: [{ userId: null }, { userId }] } },
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const budgetsWithSpent = budgets.map(budget => {
      const spent = transactions
        .filter(t => t.categoryId === budget.categoryId)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const limit = Number(budget.amount);
      const percentage = limit > 0 ? (spent / limit) * 100 : 0;

      return {
        ...budget,
        spent,
        percentage: Number(percentage.toFixed(2))
      };
    });

    res.json(budgetsWithSpent);
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const upsertBudget = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { categoryId, amount, month, year } = req.body;

    const budgetAmount = parseAmount(amount);
    const numericMonth = Number(month);
    const numericYear = Number(year);
    if (typeof categoryId !== 'string' || !budgetAmount || !Number.isInteger(numericMonth) ||
        numericMonth < 1 || numericMonth > 12 || !Number.isInteger(numericYear) ||
        numericYear < 2000 || numericYear > 2200) {
      return res.status(400).json({ error: 'Confira categoria, valor, mês e ano do orçamento.' });
    }

    const category = await prisma.category.findFirst({
      where: { id: categoryId, type: 'EXPENSE', OR: [{ userId: null }, { userId }] },
    });
    if (!category) return res.status(400).json({ error: 'Selecione uma categoria de despesa válida.' });

    const budget = await prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId,
          categoryId,
          month: numericMonth,
          year: numericYear
        }
      },
      update: {
        amount: budgetAmount
      },
      create: {
        userId,
        categoryId,
        amount: budgetAmount,
        month: numericMonth,
        year: numericYear
      },
      include: {
        category: true
      }
    });

    res.json(budget);
  } catch (error) {
    console.error('Upsert budget error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteBudget = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const budget = await prisma.budget.findFirst({ where: { id, userId } });
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    await prisma.budget.delete({ where: { id } });
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
