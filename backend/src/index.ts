import 'dotenv/config';
import express from 'express';
import { errorHandler } from './middlewares/errorHandler';

import authRoutes from './routes/authRoutes';
import accountRoutes from './routes/accountRoutes';
import categoryRoutes from './routes/categoryRoutes';
import transactionRoutes from './routes/transactionRoutes';
import budgetRoutes from './routes/budgetRoutes';
import goalRoutes from './routes/goalRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import exportRoutes from './routes/exportRoutes';
import creditCardRoutes from './routes/creditCardRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
app.use(express.json({ limit: '32kb' }));
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/credit-cards', creditCardRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Finora Backend running on port ${PORT}`);
  });
}

export default app;
