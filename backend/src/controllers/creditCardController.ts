import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middlewares/auth';
import { cleanText, parseAmount } from '../utils/validation';

export const getCreditCards = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const cards = await prisma.creditCard.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(cards);
  } catch (error) {
    console.error('Get credit cards error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createCreditCard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, limit, closingDay, dueDay, color } = req.body;

    const cleanName = cleanText(name, 100);
    const numericLimit = parseAmount(limit);
    const closing = Number(closingDay);
    const due = Number(dueDay);
    if (!cleanName || !numericLimit || !Number.isInteger(closing) || closing < 1 || closing > 31 ||
        !Number.isInteger(due) || due < 1 || due > 31 ||
        (color !== undefined && (typeof color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(color)))) {
      return res.status(400).json({ error: 'Confira nome, limite, vencimento e fechamento do cartão.' });
    }

    const card = await prisma.creditCard.create({
      data: {
        userId,
        name: cleanName,
        limit: numericLimit,
        closingDay: closing,
        dueDay: due,
        color: color || '#ff682c'
      }
    });

    res.status(201).json(card);
  } catch (error) {
    console.error('Create credit card error:', error);
    res.status(500).json({ error: 'Erro ao criar cartão de crédito.' });
  }
};

export const deleteCreditCard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const card = await prisma.creditCard.findFirst({ where: { id, userId } });
    if (!card) {
      return res.status(404).json({ error: 'Cartão não encontrado.' });
    }

    await prisma.creditCard.delete({ where: { id } });
    res.json({ message: 'Cartão excluído com sucesso.' });
  } catch (error) {
    console.error('Delete credit card error:', error);
    res.status(500).json({ error: 'Erro ao excluir cartão.' });
  }
};
