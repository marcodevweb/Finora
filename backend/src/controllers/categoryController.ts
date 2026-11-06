import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middlewares/auth';
import { cleanText, isTransactionType } from '../utils/validation';

const categoryKey = (name: string, type: string) =>
  `${type}:${name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\p{Extended_Pictographic}\u200d\ufe0f]/gu, '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR')}`;

export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { userId: null },
          { userId }
        ]
      },
      orderBy: { name: 'asc' }
    });
    // Old accounts may have both a default and a personal category with the same
    // name and type. Keep the personal one when hiding duplicates so existing
    // transactions remain connected to a selectable category.
    const uniqueCategories = new Map<string, typeof categories[number]>();
    for (const category of categories) {
      const key = categoryKey(category.name, category.type);
      const current = uniqueCategories.get(key);
      if (!current || (category.userId === userId && current.userId === null)) {
        uniqueCategories.set(key, category);
      }
    }

    res.json(Array.from(uniqueCategories.values()));
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, type, color } = req.body;

    const normalizedName = cleanText(name, 60);
    if (!normalizedName || !isTransactionType(type) ||
        (color !== undefined && (typeof color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(color)))) {
      return res.status(400).json({ error: 'Informe um nome, tipo e cor válidos para a categoria.' });
    }
    const existingCategories = await prisma.category.findMany({
      where: {
        type,
        OR: [{ userId: null }, { userId }],
      },
      select: { name: true },
    });

    if (existingCategories.some((category) => categoryKey(category.name, type) === categoryKey(normalizedName, type))) {
      return res.status(409).json({ error: 'Já existe uma categoria com esse nome e tipo.' });
    }

    const category = await prisma.category.create({
      data: {
        userId,
        name: normalizedName,
        type,
        color: color || '#202020'
      }
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const category = await prisma.category.findFirst({
      where: { id, userId }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found or unauthorized' });
    }

    await prisma.category.delete({ where: { id } });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Cannot delete category with associated transactions' });
  }
};
