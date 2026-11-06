export interface User {
  id: string;
  email: string;
  name: string;
  accounts: Account[];
}

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  color?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color?: string;
  userId?: string | null;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  date: string;
  notes?: string;
  category: Category;
  account: Account;
}

export interface Budget {
  id: string;
  categoryId: string;
  category: Category;
  amount: number;
  month: number;
  year: number;
  spent?: number;
  percentage?: number;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  percentage?: number;
  contributions: GoalContribution[];
}

export interface DashboardSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlySavings: number;
  categoryBreakdown: { name: string; amount: number; color: string }[];
  latestTransactions: Transaction[];
  budgetsOverview: { id: string; category: string; limit: number; spent: number; percentage: number }[];
  goalsOverview: { id: string; name: string; targetAmount: number; currentAmount: number; percentage: number }[];
  evolution: { month: string; income: number; expense: number }[];
}
