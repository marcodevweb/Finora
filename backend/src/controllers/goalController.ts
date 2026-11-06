import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middlewares/auth';
import { cleanText, parseAmount, parseDate } from '../utils/validation';

export const getGoals = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const goals = await prisma.financialGoal.findMany({
      where: { userId },
      include: {
        contributions: {
          orderBy: { date: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const goalsWithProgress = goals.map(goal => {
      const target = Number(goal.targetAmount);
      const current = Number(goal.currentAmount);
      const percentage = target > 0 ? (current / target) * 100 : 0;
      return {
        ...goal,
        percentage: Number(percentage.toFixed(2))
      };
    });

    res.json(goalsWithProgress);
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createGoal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, targetAmount, currentAmount, deadline } = req.body;

    const cleanName = cleanText(name, 100);
    const target = parseAmount(targetAmount);
    const current = currentAmount === undefined ? 0 : parseAmount(currentAmount, true);
    const parsedDeadline = deadline ? parseDate(deadline) : null;
    if (!cleanName || !target || current === null || (deadline && !parsedDeadline)) {
      return res.status(400).json({ error: 'Informe um nome e valores válidos para a meta.' });
    }

    const goal = await prisma.financialGoal.create({
      data: {
        userId,
        name: cleanName,
        targetAmount: target,
        currentAmount: current,
        deadline: parsedDeadline
      },
      include: { contributions: true }
    });

    res.status(201).json(goal);
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addContribution = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params; // goal id
    const { amount, notes, date } = req.body;

    const numericAmount = parseAmount(amount);
    const parsedDate = parseDate(date);
    if (!numericAmount || !parsedDate || (notes !== undefined && notes !== null && (typeof notes !== 'string' || notes.length > 2000))) {
      return res.status(400).json({ error: 'Informe um valor e uma data válidos para o aporte.' });
    }

    const goal = await prisma.financialGoal.findFirst({ where: { id, userId } });
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const contribution = await tx.goalContribution.create({
        data: {
          goalId: id,
          amount: numericAmount,
          notes: notes ?? null,
          date: parsedDate
        }
      });

      const updatedGoal = await tx.financialGoal.update({
        where: { id },
        data: {
          currentAmount: {
            increment: numericAmount
          }
        },
        include: { contributions: true }
      });

      return updatedGoal;
    });

    res.json(result);
  } catch (error) {
    console.error('Add contribution error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteGoal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const goal = await prisma.financialGoal.findFirst({ where: { id, userId } });
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    await prisma.financialGoal.delete({ where: { id } });
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
