import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { DashboardSummary } from '../types';
import { TrendingUp, TrendingDown, Plus, ArrowRight, PieChart } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isDark } = useTheme();

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      setSummary(res.data);
    } catch (err) {
      console.error(err);
      setError('Não foi possível carregar seu resumo financeiro.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[60vh] transition-colors duration-300 ${isDark ? 'bg-[#121212] text-[#f5f5f5]' : ''}`}>
        <p className="font-polysans text-lg text-[#828282]">Carregando seu resumo...</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className={`p-8 rounded-2xl text-center transition-colors duration-300 ${isDark ? 'bg-[#1a1a1a] text-[#f5f5f5] border border-[#2a2a2a]' : 'bg-white border border-[#e8e8e8]'}`}>
        <p className="text-[#ff682c] font-inter">{error || 'Erro inesperado.'}</p>
        <button onClick={fetchDashboard} className="mt-4 px-6 py-2 bg-[#ff682c] text-white font-polysans rounded-xl">
          Tentar novamente
        </button>
      </div>
    );
  }

  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date());
  const savingsLabel = summary.monthlySavings >= 0 ? 'Sobrou neste mês' : 'Faltou neste mês';

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className={`transition-colors duration-300 space-y-8 animate-fadeIn ${isDark ? 'text-[#f5f5f5]' : 'text-[#202020]'}`}>

      {/* Hero Welcome & Summary Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Title & Balance Card */}
        <div className={`lg:col-span-2 rounded-2xl p-8 sm:p-12 flex flex-col justify-between transition-colors duration-300 shadow-sm ${
          isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e]' : 'bg-white border border-[#e8e8e8]'
        }`}>
          <div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-polysans mb-6 ${
              isDark ? 'bg-[#242424] text-[#ff682c] border border-[#333]' : 'bg-white text-[#816729]'
            }`}>
              <span aria-hidden="true" className="w-2 h-2 rounded-full bg-[#ff682c]" />
              <span>{monthName}</span>
            </div>
            <h1 className={`font-polysans text-4xl sm:text-5xl font-normal tracking-tight leading-none mb-4 ${isDark ? 'text-white' : 'text-[#202020]'}`}>
              Resumo do mês
            </h1>
            <p className={`font-inter text-base max-w-xl ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>
              Veja quanto você tem, quanto recebeu e quanto gastou neste mês.
            </p>
          </div>

          <div className={`mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 border-t ${isDark ? 'border-[#2e2e2e]' : 'border-[#e8e8e8]'}`}>
            <div>
              <span className="block font-polysans text-xs uppercase tracking-wider text-[#828282] mb-1">
                Saldo nas contas
              </span>
              <span className={`font-polysans text-3xl font-normal tabular-nums ${isDark ? 'text-white' : 'text-[#202020]'}`}>
                {formatCurrency(summary.totalBalance)}
              </span>
            </div>
            <div>
              <span className="block font-polysans text-xs uppercase tracking-wider text-[#828282] mb-1">
                {savingsLabel}
              </span>
              <span className={`font-polysans text-3xl font-normal tabular-nums ${summary.monthlySavings >= 0 ? (isDark ? 'text-white' : 'text-[#202020]') : 'text-[#ff682c]'}`}>
                {formatCurrency(Math.abs(summary.monthlySavings))}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats Panel */}
        <div className={`rounded-2xl p-8 flex flex-col justify-between shadow-sm transition-colors duration-300 ${
          isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e]' : 'bg-white border border-[#e8e8e8]'
        }`}>
          <div>
            <h3 className={`font-polysans text-lg font-normal mb-6 ${isDark ? 'text-white' : 'text-[#202020]'}`}>
              Entradas e saídas
            </h3>

            <div className="space-y-6">
              <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-[#2e2e2e]' : 'border-[#e8e8e8]'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#242424] text-white' : 'bg-[#efefef] text-[#202020]'}`}>
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <span className="block text-xs font-inter text-[#828282]">Receitas</span>
                    <span className={`font-polysans text-lg tabular-nums ${isDark ? 'text-white' : 'text-[#202020]'}`}>{formatCurrency(summary.monthlyIncome)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#242424] text-white' : 'bg-[#efefef] text-[#202020]'}`}>
                    <TrendingDown className="w-5 h-5 text-[#ff682c]" />
                  </div>
                  <div>
                    <span className="block text-xs font-inter text-[#828282]">Despesas</span>
                    <span className={`font-polysans text-lg tabular-nums ${isDark ? 'text-white' : 'text-[#202020]'}`}>{formatCurrency(summary.monthlyExpense)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`mt-8 pt-6 border-t ${isDark ? 'border-[#2e2e2e]' : 'border-[#e8e8e8]'}`}>
            <Link
              to="/transactions"
              className="w-full bg-[#ff682c] text-white font-polysans text-sm py-3.5 px-4 rounded-xl hover:bg-[#e05620] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-md flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Ver receitas e despesas</span>
            </Link>
          </div>
        </div>

      </div>

      {/* Financial Evolution Chart Section */}
      <div className={`rounded-2xl p-8 sm:p-10 transition-colors duration-300 shadow-sm ${
        isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e]' : 'bg-white border border-[#e8e8e8]'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
          <div>
            <h3 className={`font-polysans text-2xl font-normal ${isDark ? 'text-white' : 'text-[#202020]'}`}>
              Receitas e despesas ao longo do tempo
            </h3>
            <p className={`text-sm font-inter mt-1 ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>
              Compare o que entrou e saiu nos últimos 6 meses.
            </p>
          </div>
          <div className="flex items-center gap-6 mt-4 sm:mt-0 font-polysans text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-green-500 inline-block"></span>
              <span className={isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}>Receitas</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-red-500 inline-block"></span>
              <span className={isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}>Despesas</span>
            </div>
          </div>
        </div>

        <div style={{ width: '100%', height: '320px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={summary.evolution} margin={{ top: 10, right: 16, left: 12, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#828282" fontSize={12} tickLine={false} />
              <YAxis width={82} tickMargin={8} stroke="#828282" fontSize={12} tickLine={false} tickFormatter={(v) => `R$ ${Number(v).toLocaleString('pt-BR')}`} />
              <Tooltip
                formatter={(val: any) => formatCurrency(Number(val))}
                cursor={false}
                contentStyle={{
                  backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                  borderColor: isDark ? '#2a2a2a' : '#e8e8e8',
                  borderRadius: '12px',
                  color: isDark ? '#ffffff' : '#202020',
                  fontFamily: 'Inter',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }}
              />
              <Area type="monotone" dataKey="income" name="Receitas" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" activeDot={{ r: 5, fill: '#22c55e', stroke: '#22c55e' }} />
              <Area type="monotone" dataKey="expense" name="Despesas" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" activeDot={{ r: 5, fill: '#ef4444', stroke: '#ef4444' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Category Breakdown & Latest Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Category Breakdown */}
        <div className={`rounded-2xl p-8 sm:p-10 flex flex-col justify-between transition-colors duration-300 shadow-sm ${
          isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e]' : 'bg-white border border-[#e8e8e8]'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`font-polysans text-2xl font-normal ${isDark ? 'text-white' : 'text-[#202020]'}`}>
                Onde você mais gastou
              </h3>
              <PieChart className="w-5 h-5 text-[#828282]" />
            </div>
            <p className={`text-sm font-inter mb-6 ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>
              Despesas deste mês, separadas por categoria.
            </p>

            {summary.categoryBreakdown.length === 0 ? (
              <div className="py-12 text-center text-[#828282] font-inter text-sm">
                Nenhuma despesa registrada neste mês.
              </div>
            ) : (
              <div className="space-y-4">
                {summary.categoryBreakdown.map((cat, idx) => {
                  const totalExp = summary.monthlyExpense || 1;
                  const pct = ((cat.amount / totalExp) * 100).toFixed(1);
                  return (
                    <div key={idx} className={`p-4 rounded-xl ${isDark ? 'bg-[#242424]' : 'bg-white shadow-sm'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`font-polysans text-sm ${isDark ? 'text-white' : 'text-[#202020]'}`}>{cat.name}</span>
                        <span className={`font-polysans text-sm tabular-nums ${isDark ? 'text-white' : 'text-[#202020]'}`}>{formatCurrency(cat.amount)} <span className="text-xs text-[#828282]">({pct}%)</span></span>
                      </div>
                      <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-[#121212]' : 'bg-[#efefef]'}`}>
                        <div
                          className="h-full bg-[#ff682c] transition-all duration-500 rounded-full"
                          style={{ width: `${Math.min(Number(pct), 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className={`mt-8 pt-6 border-t ${isDark ? 'border-[#2e2e2e]' : 'border-[#e8e8e8]'}`}>
            <Link to="/budgets" className={`text-sm font-polysans hover:text-[#ff682c] flex items-center justify-between ${isDark ? 'text-white' : 'text-[#202020]'}`}>
              <span>Ver orçamento mensal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Latest Transactions */}
        <div className={`rounded-2xl p-8 sm:p-10 flex flex-col justify-between shadow-sm transition-colors duration-300 ${
          isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e]' : 'bg-white border border-[#e8e8e8]'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`font-polysans text-2xl font-normal ${isDark ? 'text-white' : 'text-[#202020]'}`}>
                Últimas receitas e despesas
              </h3>
              <Link to="/transactions" className="text-sm font-polysans text-[#ff682c] hover:underline">
                Ver todas
              </Link>
            </div>

            {summary.latestTransactions.length === 0 ? (
              <div className="py-12 text-center text-[#828282] font-inter text-sm">
                Nenhuma transação recente.
              </div>
            ) : (
              <div className="space-y-4">
                {summary.latestTransactions.map((tx) => (
                  <div key={tx.id} className={`flex items-center justify-between p-4 rounded-xl transition-colors ${isDark ? 'bg-[#242424]' : 'bg-[#efefef]'}`}>
                    <div>
                      <span className={`block font-polysans text-sm ${isDark ? 'text-white' : 'text-[#202020]'}`}>{tx.description}</span>
                      <span className="text-xs text-[#828282] font-inter">
                        {tx.category.name} • {new Date(tx.date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <span className={`font-polysans text-sm font-medium tabular-nums ${tx.type === 'INCOME' ? 'text-emerald-500' : (isDark ? 'text-white' : 'text-[#202020]')}`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`mt-8 pt-6 border-t ${isDark ? 'border-[#2e2e2e]' : 'border-[#e8e8e8]'}`}>
            <Link
              to="/transactions"
              className={`w-full font-polysans text-sm py-3.5 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 ${
                isDark
                  ? 'bg-[#242424] text-white hover:bg-[#ff682c]'
                  : 'bg-[#efefef] text-[#202020] hover:bg-[#202020] hover:text-white'
              }`}
            >
              <span>Registrar receita ou despesa</span>
              <Plus className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>

      {/* Budgets & Goals Quick Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Budgets Overview */}
        <div className={`rounded-2xl p-8 transition-colors duration-300 shadow-sm ${
          isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e]' : 'bg-white border border-[#e8e8e8]'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`font-polysans text-xl font-normal ${isDark ? 'text-white' : 'text-[#202020]'}`}>Seu orçamento deste mês</h3>
            <Link to="/budgets" className="text-sm font-polysans text-[#ff682c] hover:underline">Ver detalhes</Link>
          </div>
          {summary.budgetsOverview.length === 0 ? (
            <p className="text-sm text-[#828282] font-inter py-6">Nenhum orçamento configurado para este mês.</p>
          ) : (
            <div className="space-y-4">
              {summary.budgetsOverview.map((b) => (
                <div key={b.id} className="space-y-2">
                  <div className="flex justify-between text-sm font-inter">
                    <span className={`font-polysans ${isDark ? 'text-white' : 'text-[#202020]'}`}>{b.category}</span>
                    <span className={`tabular-nums ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>{formatCurrency(b.spent)} / {formatCurrency(b.limit)}</span>
                  </div>
                  <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-[#242424]' : 'bg-[#efefef]'}`}>
                    <div
                      className={`h-full rounded-full ${b.percentage > 90 ? 'bg-[#ff682c]' : (isDark ? 'bg-white' : 'bg-[#202020]')}`}
                      style={{ width: `${Math.min(b.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Goals Overview */}
        <div className={`rounded-2xl p-8 transition-colors duration-300 shadow-sm ${
          isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e]' : 'bg-white border border-[#e8e8e8]'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`font-polysans text-xl font-normal ${isDark ? 'text-white' : 'text-[#202020]'}`}>Suas metas de economia</h3>
            <Link to="/goals" className={`text-sm font-polysans hover:text-[#ff682c] ${isDark ? 'text-white' : 'text-[#202020]'}`}>Ver detalhes</Link>
          </div>
          {summary.goalsOverview.length === 0 ? (
            <p className="text-sm text-[#828282] font-inter py-6">Nenhuma meta cadastrada.</p>
          ) : (
            <div className="space-y-4">
              {summary.goalsOverview.map((g) => (
                <div key={g.id} className={`p-4 rounded-xl space-y-2 ${isDark ? 'bg-[#242424]' : 'bg-white shadow-sm'}`}>
                  <div className="flex justify-between text-sm">
                    <span className={`font-polysans ${isDark ? 'text-white' : 'text-[#202020]'}`}>{g.name}</span>
                    <span className="font-polysans text-[#ff682c]">{g.percentage}%</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#828282] font-inter tabular-nums">
                    <span>{formatCurrency(g.currentAmount)}</span>
                    <span>Objetivo: {formatCurrency(g.targetAmount)}</span>
                  </div>
                  <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-[#121212]' : 'bg-[#efefef]'}`}>
                    <div className="h-full bg-[#ff682c] rounded-full" style={{ width: `${Math.min(g.percentage, 100)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
