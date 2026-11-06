import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middlewares/auth';
import { isTransactionType, parseDate } from '../utils/validation';

export const csvCell = (value: unknown) => {
  let text = String(value ?? '');
  if (/^[\s\u0000-\u001f]*[=+@\-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export const exportTransactionsCSV = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { type, categoryId, startDate, endDate } = req.query;

    const from = startDate === undefined ? null : parseDate(String(startDate));
    const to = endDate === undefined ? null : parseDate(String(endDate), true);
    if ((type !== undefined && !isTransactionType(type)) || (startDate !== undefined && !from) ||
        (endDate !== undefined && !to) || (from && to && from > to)) {
      return res.status(400).json({ error: 'Filtros de exportação inválidos.' });
    }

    const where: any = {
      userId,
      account: { is: { userId } },
      category: { is: { OR: [{ userId: null }, { userId }] } },
    };
    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;
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

    let csv = '\uFEFFData;Descrição;Tipo;Categoria;Conta;Valor (R$);Observações\r\n';
    for (const t of transactions) {
      const dateStr = new Date(t.date).toLocaleDateString('pt-BR');
      const typeStr = t.type === 'INCOME' ? 'Receita' : 'Despesa';
      const amount = Number(t.amount).toFixed(2);
      csv += [dateStr, t.description, typeStr, t.category.name, t.account.name, amount, t.notes || '']
        .map(csvCell).join(';') + '\r\n';
    }

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment(`finora-transacoes-${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ error: 'Internal server error during CSV export' });
  }
};
