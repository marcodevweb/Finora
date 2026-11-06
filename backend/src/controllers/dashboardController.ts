import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middlewares/auth';

export const getDashboardSummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    // Get accounts for total balance
    const accounts = await prisma.account.findMany({ where: { userId } });
    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

    // Get transactions for this month
    const monthTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        account: { is: { userId } },
        category: { is: { OR: [{ userId: null }, { userId }] } },
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      include: {
        category: true,
        account: true
      },
      orderBy: { date: 'desc' }
    });

    const monthlyIncome = monthTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const monthlyExpense = monthTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const monthlySavings = monthlyIncome - monthlyExpense;

    // Category breakdown for expenses this month
    const categoryMap: { [key: string]: { name: string; amount: number; color: string } } = {};
    monthTransactions
      .filter(t => t.type === 'EXPENSE')
      .forEach(t => {
        const catName = t.category.name;
        const color = t.category.color || '#202020';
        if (!categoryMap[catName]) {
          categoryMap[catName] = { name: catName, amount: 0, color };
        }
        categoryMap[catName].amount += Number(t.amount);
      });

    const categoryBreakdown = Object.values(categoryMap);

    // Latest 5 transactions
    const latestTransactions = monthTransactions.slice(0, 5);

    // Budgets overview
    const budgets = await prisma.budget.findMany({
      where: {
        userId,
        month: currentMonth + 1,
        year: currentYear,
        category: { is: { OR: [{ userId: null }, { userId }] } },
      },
      include: { category: true }
    });

    const budgetsOverview = budgets.map(b => {
      const spent = monthTransactions
        .filter(t => t.categoryId === b.categoryId && t.type === 'EXPENSE')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const limit = Number(b.amount);
      const percentage = limit > 0 ? (spent / limit) * 100 : 0;
      return {
        id: b.id,
        category: b.category.name,
        limit,
        spent,
        percentage: Number(percentage.toFixed(2))
      };
    });

    // Goals overview
    const goals = await prisma.financialGoal.findMany({ where: { userId } });
    const goalsOverview = goals.map(g => ({
      id: g.id,
      name: g.name,
      targetAmount: Number(g.targetAmount),
      currentAmount: Number(g.currentAmount),
      percentage: Number(((Number(g.currentAmount) / Number(g.targetAmount)) * 100).toFixed(2))
    }));

    // 6-month financial evolution (income vs expense)
    const evolution = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0, 23, 59, 59);

      const txs = await prisma.transaction.findMany({
        where: {
          userId,
          account: { is: { userId } },
          category: { is: { OR: [{ userId: null }, { userId }] } },
          date: { gte: start, lte: end }
        }
      });

      const income = txs.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
      const expense = txs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);

      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      evolution.push({
        month: monthNames[m],
        income,
        expense
      });
    }

    res.json({
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      monthlySavings,
      categoryBreakdown,
      latestTransactions,
      budgetsOverview,
      goalsOverview,
      evolution
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
