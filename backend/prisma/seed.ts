import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear transactions and budgets first to avoid foreign key constraints when removing old categories
  await prisma.transaction.deleteMany({});
  await prisma.budget.deleteMany({});

  // Delete all old system default categories
  await prisma.category.deleteMany({
    where: {
      userId: null
    }
  });

  // Create default categories (userId is null for system defaults)
  const defaultCategories = [
    { name: '💼 Renda e Salário', type: 'INCOME', color: '#ff682c' },
    { name: '🏠 Moradia', type: 'EXPENSE', color: '#202020' },
    { name: '🛒 Alimentação e Mercado', type: 'EXPENSE', color: '#ff682c' },
    { name: '🍔 Lanches e Restaurantes', type: 'EXPENSE', color: '#816729' },
    { name: '🚗 Transporte', type: 'EXPENSE', color: '#828282' },
    { name: '💊 Saúde e Bem-estar', type: 'EXPENSE', color: '#4d4d4d' },
    { name: '🎬 Lazer e Lanches', type: 'EXPENSE', color: '#816729' },
    { name: '🛍️ Compras', type: 'EXPENSE', color: '#202020' },
  ];

  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: { id: `default-${cat.name.toLowerCase()}` }, // Note: id isn't guaranteed unique unless handled or we check by name/userId
      update: {},
      create: {
        id: `default-${cat.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '-')}`,
        name: cat.name,
        type: cat.type,
        color: cat.color,
        userId: null,
      },
    }).catch(async () => {
      // If upsert fails due to id, check by name
      const existing = await prisma.category.findFirst({ where: { name: cat.name, userId: null } });
      if (!existing) {
        await prisma.category.create({
          data: {
            name: cat.name,
            type: cat.type,
            color: cat.color,
            userId: null,
          }
        });
      }
    });
  }

  // Create a demo user for testing & portfolio evaluation
  const demoEmail = 'demo@finora.com';
  const hashedPassword = await bcrypt.hash('password123', 10);

  const demoUser = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      name: 'Alexandre Ventriloc',
      passwordHash: hashedPassword,
    },
  });

  // Create default account for demo user
  const demoAccount = await prisma.account.create({
    data: {
      userId: demoUser.id,
      name: 'Conta Principal',
      type: 'CHECKING',
      balance: 14850.00,
    },
  });

  // Fetch created categories
  const categories = await prisma.category.findMany({ where: { userId: null } });
  const salaryCat = categories.find(c => c.name.includes('Renda e Salário')) || categories[0];
  const foodCat = categories.find(c => c.name.includes('Alimentação e Mercado')) || categories[2];
  const housingCat = categories.find(c => c.name.includes('Moradia')) || categories[1];

  // Create sample transactions
  await prisma.transaction.createMany({
    data: [
      {
        userId: demoUser.id,
        accountId: demoAccount.id,
        categoryId: salaryCat.id,
        amount: 12500.00,
        type: 'INCOME',
        description: 'Salário Mensal',
        date: new Date(new Date().setDate(1)),
        notes: 'Pagamento referente ao mês atual',
      },
      {
        userId: demoUser.id,
        accountId: demoAccount.id,
        categoryId: foodCat.id,
        amount: 450.00,
        type: 'EXPENSE',
        description: 'Supermercado Mensal',
        date: new Date(new Date().setDate(3)),
        notes: 'Feira e mantimentos',
      },
      {
        userId: demoUser.id,
        accountId: demoAccount.id,
        categoryId: housingCat.id,
        amount: 3200.00,
        type: 'EXPENSE',
        description: 'Aluguel do Apartamento',
        date: new Date(new Date().setDate(5)),
        notes: 'Referente ao mês vigente',
      },
    ],
  });

  // Create sample budget
  await prisma.budget.create({
    data: {
      userId: demoUser.id,
      categoryId: foodCat.id,
      amount: 1500.00,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    },
  }).catch(() => {});

  // Create sample goal
  await prisma.financialGoal.create({
    data: {
      userId: demoUser.id,
      name: 'Reserva de Emergência',
      targetAmount: 30000.00,
      currentAmount: 14850.00,
      deadline: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    },
  });

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
