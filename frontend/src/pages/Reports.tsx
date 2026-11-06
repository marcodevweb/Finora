import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { DashboardSummary } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

export const Reports: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard');
        setSummary(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/export/transactions', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `finora-relatorio-completo-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showToast('Não foi possível exportar o relatório. Tente novamente.', 'error');
    }
  };

  if (loading || !summary) {
    return (
      <div className={`flex items-center justify-center min-h-[60vh] ${isDark ? 'text-[#f5f5f5]' : ''}`}>
        <p className="font-polysans text-lg text-[#828282]">Gerando relatórios e análises...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-12 transition-colors duration-300 ${isDark ? 'text-[#f5f5f5]' : 'text-[#202020]'}`}>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`font-polysans text-4xl font-normal tracking-tight ${isDark ? 'text-white' : 'text-[#202020]'}`}>Como estão suas finanças</h1>
          <p className={`text-sm font-inter mt-1 ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>
            Compare suas receitas e despesas e veja como seus gastos mudam ao longo do tempo.
          </p>
        </div>

        <div>
          <button
            onClick={handleExportCSV}
            className={`flex items-center gap-2 px-6 py-3.5 font-polysans text-sm rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg ${
              isDark ? 'bg-[#1a1a1a] text-white hover:bg-[#ff682c] border border-[#2e2e2e]' : 'bg-[#202020] text-white hover:bg-[#ff682c]'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Exportar Dados em CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`rounded-2xl p-8 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${
          isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e]' : 'bg-white border border-[#e8e8e8]'
        }`}>
          <span className="block font-polysans text-xs uppercase tracking-wider text-[#828282] mb-2">Recebido neste mês</span>
          <span className={`font-polysans text-3xl font-normal ${isDark ? 'text-white' : 'text-[#202020]'}`}>{formatCurrency(summary.monthlyIncome)}</span>
        </div>
        <div className={`rounded-2xl p-8 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${
          isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e]' : 'bg-white border border-[#e8e8e8]'
        }`}>
          <span className="block font-polysans text-xs uppercase tracking-wider text-[#828282] mb-2">Gasto neste mês</span>
          <span className="font-polysans text-3xl font-normal text-[#ff682c]">{formatCurrency(summary.monthlyExpense)}</span>
        </div>
        <div className={`rounded-2xl p-8 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${
          isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e]' : 'bg-white border border-[#e8e8e8]'
        }`}>
          <span className="block font-polysans text-xs uppercase tracking-wider text-[#828282] mb-2">Balanço Líquido Mensal</span>
          <span className={`font-polysans text-3xl font-normal ${summary.monthlySavings >= 0 ? (isDark ? 'text-white' : 'text-[#202020]') : 'text-[#ff682c]'}`}>
            {formatCurrency(summary.monthlySavings)}
          </span>
        </div>
      </div>

      {/* Monthly Comparison Bar Chart */}
      <div className={`rounded-2xl p-8 sm:p-10 transition-colors duration-300 ${
        isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e]' : 'bg-white border border-[#e8e8e8]'
      }`}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className={`font-polysans text-2xl font-normal ${isDark ? 'text-white' : 'text-[#202020]'}`}>Comparativo Histórico (6 Meses)</h3>
            <p className={`text-sm font-inter mt-1 ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>Dinheiro que entrou e saiu da sua conta.</p>
          </div>
        </div>

        <div style={{ width: '100%', height: '340px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary.evolution} margin={{ top: 10, right: 16, left: 12, bottom: 0 }}>
              <XAxis dataKey="month" stroke="#828282" fontSize={12} tickLine={false} />
              <YAxis width={82} tickMargin={8} stroke="#828282" fontSize={12} tickLine={false} tickFormatter={(v) => `R$ ${Number(v).toLocaleString('pt-BR')}`} />
              <Tooltip
                formatter={(val: any) => formatCurrency(Number(val))}
                cursor={false}
                contentStyle={{
                  backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                  borderColor: isDark ? '#2a2a2a' : '#e8e8e8',
                  borderRadius: '8px',
                  color: isDark ? '#ffffff' : '#202020',
                  fontFamily: 'Inter'
                }}
              />
              <Bar dataKey="income" name="Receitas" fill="#22c55e" activeBar={{ fill: '#22c55e' }} radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Despesas" fill="#ef4444" activeBar={{ fill: '#ef4444' }} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown Details */}
      <div className={`rounded-2xl p-8 sm:p-10 transition-colors duration-300 ${
        isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e]' : 'bg-white border border-[#e8e8e8]'
      }`}>
        <h3 className={`font-polysans text-2xl font-normal mb-6 ${isDark ? 'text-white' : 'text-[#202020]'}`}>Detalhamento por Categoria</h3>
        {summary.categoryBreakdown.length === 0 ? (
          <p className="text-sm text-[#828282] font-inter py-8">Nenhuma despesa registrada neste mês.</p>
        ) : (
          <div className="space-y-6">
            {summary.categoryBreakdown.map((cat, idx) => {
              const totalExp = summary.monthlyExpense || 1;
              const pct = ((cat.amount / totalExp) * 100).toFixed(1);
              return (
                <div key={idx} className={`p-6 rounded-xl transition-colors duration-300 ${
                  isDark ? 'bg-[#242424]' : 'bg-white border border-[#e8e8e8] shadow-sm'
                }`}>
                  <div className="flex justify-between items-center mb-3">
                    <span className={`font-polysans text-base ${isDark ? 'text-white' : 'text-[#202020]'}`}>{cat.name}</span>
                    <span className={`font-polysans text-base ${isDark ? 'text-white' : 'text-[#202020]'}`}>{formatCurrency(cat.amount)} <span className="text-sm text-[#828282]">({pct}%)</span></span>
                  </div>
                  <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? 'bg-[#121212]' : 'bg-white'}`}>
                    <div
                      className="h-full bg-[#ff682c] transition-all duration-500"
                      style={{ width: `${Math.min(Number(pct), 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
