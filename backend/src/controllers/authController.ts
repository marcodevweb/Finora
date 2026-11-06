import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { JWT_SECRET } from '../config/security';

const SESSION_COOKIE = 'finora_session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const setSessionCookie = (res: Response, token: string) => {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
};

const defaultCategories = [
  { id: 'default-renda-e-salario', name: '💼 Renda e Salário', type: 'INCOME', color: '#ff682c' },
  { id: 'default-moradia', name: '🏠 Moradia', type: 'EXPENSE', color: '#202020' },
  { id: 'default-alimentacao-e-mercado', name: '🛒 Alimentação e Mercado', type: 'EXPENSE', color: '#ff682c' },
  { id: 'default-lanches-e-restaurantes', name: '🍔 Lanches e Restaurantes', type: 'EXPENSE', color: '#816729' },
  { id: 'default-transporte', name: '🚗 Transporte', type: 'EXPENSE', color: '#828282' },
  { id: 'default-saude-e-bem-estar', name: '💊 Saúde e Bem-estar', type: 'EXPENSE', color: '#4d4d4d' },
  { id: 'default-lazer-e-lanches', name: '🎬 Lazer e Lanches', type: 'EXPENSE', color: '#816729' },
  { id: 'default-compras', name: '🛍️ Compras', type: 'EXPENSE', color: '#202020' },
];

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const displayName = typeof name === 'string' && name.trim()
      ? name.trim()
      : normalizedEmail.split('@')[0].replace(/[._-]+/g, ' ');

    if (normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Informe um e-mail válido.' });
    }

    if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ error: 'A senha precisa ter entre 8 e 72 bytes.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado. Faça login.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          name: displayName || 'Pessoa usuária',
          accounts: {
            create: {
              name: 'Conta Principal',
              type: 'CHECKING',
              balance: 0,
            },
          },
        },
        include: { accounts: true },
      });

      // Provide usable categories for a new account without loading demo data.
      for (const cat of defaultCategories) {
        await tx.category.upsert({
          where: { id: cat.id },
          update: {},
          create: cat,
        });
      }

      return createdUser;
    });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    setSessionCookie(res, token);
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        accounts: user.accounts
      }
    });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'Este e-mail já está cadastrado. Faça login.' });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedEmail || typeof password !== 'string' || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { accounts: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    setSessionCookie(res, token);
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        accounts: user.accounts
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  res.status(204).end();
};

export const getMe = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { accounts: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        accounts: user.accounts
      }
    });
  } catch (error: any) {
    console.error('GetMe error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
