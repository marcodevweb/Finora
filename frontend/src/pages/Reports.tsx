import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { Transaction } from '../types';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { CustomSelect } from '../components/CustomSelect';

type Period = 'day' | 'week' | 'month' | 'year' | 'custom';
type TransactionType = '' | 'INCOME' | 'EXPENSE';

const localDateValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const dateFromValue = (value: string) => new Date(`${value}T00:00:00`);
const addDays = (date: Date, amount: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
};
const toISODate = (date: Date) => localDateValue(date);
const dayLabel = (date: Date) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);
const fullDateLabel = (date: Date) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(date);
const monthLabel = (date: Date) => new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date).replace('.', '');

export const Reports: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<TransactionType>('');
  const [period, setPeriod] = useState<Period>('month');
  const [referenceDate, setReferenceDate] = useState(localDateValue);
  const [customStart, setCustomStart] = useState(localDateValue);
  const [customEnd, setCustomEnd] = useState(localDateValue);
  const { isDark } = useTheme();
  const { showToast } = useToast();

  const range = useMemo(() => {
    const anchor = dateFromValue(referenceDate);
    let start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
    let end = new Date(start);

    if (period === 'week') {
      const weekday = (start.getDay() + 6) % 7;
      start = addDays(start, -weekday);
      end = addDays(start, 6);
    } else if (period === 'month') {
      start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    } else if (period === 'year') {
      start = new Date(anchor.getFullYear(), 0, 1);
      end = new Date(anchor.getFullYear(), 11, 31);
    } else if (period === 'custom') {
      start = dateFromValue(customStart);
      end = dateFromValue(customEnd);
    }

    return { start, end, startDate: toISODate(start), endDate: toISODate(end) };
  }, [period, referenceDate, customStart, customEnd]);

  useEffect(() => {
    let canceled = false;
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = { startDate: range.startDate, endDate: range.endDate };
        if (selectedType) params.type = selectedType;
        const response = await api.get<Transaction[]>('/transactions', { params });
        if (!canceled) setTransactions(response.data);
      } catch (error) {
        console.error(error);
        if (!canceled) {
          showToast('Não foi possível carregar o relatório. Tente novamente.', 'error');
          setTransactions([]);
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    };
    void fetchTransactions();
    // showToast intentionally stays out of dependencies: its context function is recreated on renders.
    return () => { canceled = true; };
  }, [range.startDate, range.endDate, selectedType]);

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const totals = useMemo(() => transactions.reduce((result, transaction) => {
    const amount = Number(transaction.amount);
    if (transaction.type === 'INCOME') result.income += amount;
    else result.expense += amount;
    return result;
  }, { income: 0, expense: 0 }), [transactions]);

  const periodName = useMemo(() => {
    if (period === 'day') return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(range.start);
    if (period === 'week') return `${fullDateLabel(range.start)} a ${fullDateLabel(range.end)}`;
    if (period === 'month') return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(range.start);
    if (period === 'year') return String(range.start.getFullYear());
    return `${fullDateLabel(range.start)} a ${fullDateLabel(range.end)}`;
  }, [period, range]);

  const chartData = useMemo(() => {
    const daySpan = Math.max(1, Math.round((range.end.getTime() - range.start.getTime()) / 86400000) + 1);
    const bucketByMonth = period === 'year' || (period === 'custom' && daySpan > 31);
    const bucketCount = bucketByMonth ?
      (range.end.getFullYear() - range.start.getFullYear()) * 12 + range.end.getMonth() - range.start.getMonth() + 1 : daySpan;
    const buckets = Array.from({ length: bucketCount }, (_, index) => {
      const date = bucketByMonth ? new Date(range.start.getFullYear(), range.start.getMonth() + index, 1) : addDays(range.start, index);
      const key = bucketByMonth ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` : toISODate(date);
      return { key, label: bucketByMonth ? monthLabel(date) : period === 'week' ?
        new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date).replace('.', '') : dayLabel(date), income: 0, expense: 0 };
    });
    const bucketIndex = new Map(buckets.map((bucket, index) => [bucket.key, index]));
    transactions.forEach((transaction) => {
      const date = dateFromValue(transaction.date.slice(0, 10));
      const key = bucketByMonth ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` : toISODate(date);
      const index = bucketIndex.get(key);
      if (index === undefined) return;
      if (transaction.type === 'INCOME') buckets[index].income += Number(transaction.amount);
      else buckets[index].expense += Number(transaction.amount);
    });
    return buckets;
  }, [transactions, range, period]);

  const categoryBreakdown = useMemo(() => {
    const totalsByCategory = new Map<string, { id: string; name: string; amount: number }>();
    transactions.filter((transaction) => transaction.type === 'EXPENSE').forEach((transaction) => {
      const name = transaction.category?.name || 'Sem categoria';
      const id = transaction.categoryId || name;
      const item = totalsByCategory.get(id) || { id, name, amount: 0 };
      item.amount += Number(transaction.amount);
      totalsByCategory.set(id, item);
    });
    return [...totalsByCategory.values()].sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const kpis = useMemo(() => {
    if (!selectedType) return [
      { label: `Receitas em ${periodName}`, value: totals.income, color: isDark ? 'text-white' : 'text-[#202020]', formatted: formatCurrency(totals.income) },
      { label: `Despesas em ${periodName}`, value: totals.expense, color: 'text-[#ff682c]', formatted: formatCurrency(totals.expense) },
      { label: 'Saldo do período', value: totals.income - totals.expense, color: totals.income - totals.expense < 0 ? 'text-[#ff682c]' : isDark ? 'text-white' : 'text-[#202020]', formatted: formatCurrency(totals.income - totals.expense) },
    ];

    const amount = selectedType === 'INCOME' ? totals.income : totals.expense;
    const average = transactions.length ? amount / transactions.length : 0;
    const title = selectedType === 'INCOME' ? 'receita' : 'despesa';
    return [
      { label: `${selectedType === 'INCOME' ? 'Receitas' : 'Despesas'} em ${periodName}`, value: amount, color: selectedType === 'EXPENSE' ? 'text-[#ff682c]' : isDark ? 'text-white' : 'text-[#202020]', formatted: formatCurrency(amount) },
      { label: 'Lançamentos no período', value: transactions.length, color: isDark ? 'text-white' : 'text-[#202020]', formatted: String(transactions.length) },
      { label: `Média por ${title}`, value: average, color: isDark ? 'text-white' : 'text-[#202020]', formatted: formatCurrency(average) },
    ];
  }, [selectedType, periodName, totals, transactions.length, isDark]);

  const handleExportCSV = async () => {
    try {
      const params: Record<string, string> = { startDate: range.startDate, endDate: range.endDate };
      if (selectedType) params.type = selectedType;
      const response = await api.get('/export/transactions', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `finora-relatorio-${range.startDate}-${range.endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showToast('Não foi possível exportar o relatório. Tente novamente.', 'error');
    }
  };

  const inputClass = `h-[3.125rem] w-full rounded-xl border px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff682c] ${
    isDark ? 'bg-[#242424] border-[#333] text-white' : 'bg-white border-[#e8e8e8] text-[#202020]'
  }`;
  const labelClass = `mb-1.5 block text-xs font-inter ${isDark ? 'text-[#a0a0a0]' : 'text-[#828282]'}`;
  const filterSurface = isDark ? 'bg-[#1a1a1a] border-[#2e2e2e]' : 'bg-white border-[#e8e8e8]';

  return (
    <div className={`space-y-8 sm:space-y-10 transition-colors duration-300 ${isDark ? 'text-[#f5f5f5]' : 'text-[#202020]'}`}>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className={`font-polysans text-3xl sm:text-4xl font-normal tracking-tight ${isDark ? 'text-white' : 'text-[#202020]'}`}>Como estão suas finanças</h1>
          <p className={`mt-1 text-sm font-inter ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>Acompanhe receitas e despesas em qualquer período.</p>
        </div>
        <button onClick={handleExportCSV} disabled={loading} className={`flex min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-3.5 font-polysans text-sm transition-all duration-300 disabled:opacity-50 sm:w-auto sm:px-6 ${isDark ? 'bg-[#1a1a1a] text-white hover:bg-[#ff682c] border border-[#2e2e2e]' : 'bg-[#202020] text-white hover:bg-[#ff682c]'}`}>
          <Download className="w-4 h-4" /><span>Exportar dados em CSV</span>
        </button>
      </div>

      <section aria-label="Filtros do relatório" className={`grid grid-cols-1 gap-4 rounded-2xl border p-4 shadow-sm sm:p-6 xl:grid-cols-[minmax(190px,0.8fr)_minmax(180px,0.7fr)_minmax(240px,1fr)] ${filterSurface}`}>
        <div>
          <label className={labelClass}>Mostrar</label>
          <CustomSelect value={selectedType} onChange={(value) => setSelectedType(value as TransactionType)} options={[
            { value: '', label: 'Receitas e despesas' },
            { value: 'INCOME', label: 'Somente receitas' },
            { value: 'EXPENSE', label: 'Somente despesas' },
          ]} />
        </div>
        <div>
          <label className={labelClass}>Período</label>
          <CustomSelect value={period} onChange={(value) => setPeriod(value as Period)} options={[
            { value: 'day', label: 'Dia' }, { value: 'week', label: 'Semana' }, { value: 'month', label: 'Mês' },
            { value: 'year', label: 'Ano' }, { value: 'custom', label: 'Personalizado' },
          ]} />
        </div>
        {period === 'custom' ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div><label htmlFor="report-start" className={labelClass}>De</label><input id="report-start" type="date" value={customStart} max={customEnd} onChange={(event) => setCustomStart(event.target.value)} className={inputClass} /></div>
            <div><label htmlFor="report-end" className={labelClass}>Até</label><input id="report-end" type="date" value={customEnd} min={customStart} onChange={(event) => setCustomEnd(event.target.value)} className={inputClass} /></div>
          </div>
        ) : (
          <div>
            <label htmlFor="report-reference" className={labelClass}>{period === 'year' ? 'Ano de referência' : 'Data de referência'}</label>
            {period === 'year' ? <input id="report-reference" type="number" min="2000" max="2100" value={dateFromValue(referenceDate).getFullYear()} onChange={(event) => {
              const year = Number(event.target.value);
              if (year >= 2000 && year <= 2100) setReferenceDate(`${year}-${referenceDate.slice(5)}`);
            }} className={inputClass} /> : <input id="report-reference" type="date" value={referenceDate} onChange={(event) => setReferenceDate(event.target.value || localDateValue())} className={inputClass} />}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 sm:gap-6">
        {kpis.map((item) => (
          <div key={item.label} className={`rounded-2xl border p-6 sm:p-8 ${filterSurface}`}>
            <span className="mb-2 block font-polysans text-xs uppercase tracking-wider text-[#828282]">{item.label}</span>
            <span className={`font-polysans text-2xl sm:text-3xl font-normal tabular-nums ${item.color}`}>{loading ? '…' : item.formatted}</span>
          </div>
        ))}
      </div>

      <section className={`rounded-2xl border p-5 sm:p-8 lg:p-10 ${filterSurface}`}>
        <div className="mb-6">
          <h2 className={`font-polysans text-xl sm:text-2xl font-normal ${isDark ? 'text-white' : 'text-[#202020]'}`}>Movimentações: {periodName}</h2>
          <p className={`mt-1 text-sm font-inter ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>Valores agrupados por {period === 'year' || (period === 'custom' && chartData.length > 31) ? 'mês' : 'dia'}.</p>
        </div>
        {loading ? <p className="py-12 text-center text-sm text-[#828282]">Atualizando relatório…</p> : transactions.length === 0 ? <p className="py-12 text-center text-sm text-[#828282]">Nenhuma movimentação neste período e filtro.</p> : (
          <div className="h-[300px] w-full sm:h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 2, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={isDark ? '#333' : '#ededed'} />
                <XAxis dataKey="label" stroke="#828282" fontSize={12} tickLine={false} interval="preserveStartEnd" />
                <YAxis width={76} tickMargin={8} stroke="#828282" fontSize={12} tickLine={false} tickFormatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} />
                <Tooltip formatter={(value: number) => formatCurrency(Number(value))} cursor={false} contentStyle={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff', borderColor: isDark ? '#2a2a2a' : '#e8e8e8', borderRadius: '8px', color: isDark ? '#ffffff' : '#202020', fontFamily: 'Inter' }} />
                <Legend />
                {selectedType !== 'EXPENSE' && <Bar dataKey="income" name="Receitas" fill="#22c55e" activeBar={{ fill: '#22c55e' }} radius={[4, 4, 0, 0]} />}
                {selectedType !== 'INCOME' && <Bar dataKey="expense" name="Despesas" fill="#ef4444" activeBar={{ fill: '#ef4444' }} radius={[4, 4, 0, 0]} />}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {selectedType !== 'INCOME' && <section className={`rounded-2xl border p-5 sm:p-8 lg:p-10 ${filterSurface}`}>
        <h2 className={`mb-6 font-polysans text-xl sm:text-2xl font-normal ${isDark ? 'text-white' : 'text-[#202020]'}`}>Despesas por categoria</h2>
        {loading ? <p className="py-8 text-sm text-[#828282]">Atualizando categorias…</p> : categoryBreakdown.length === 0 ? <p className="py-8 text-sm text-[#828282]">Nenhuma despesa registrada neste período.</p> : (
          <div className="space-y-4">
            {categoryBreakdown.map((category) => {
              const percentage = totals.expense > 0 ? (category.amount / totals.expense) * 100 : 0;
              return <div key={category.id} className={`rounded-xl border p-4 sm:p-5 ${isDark ? 'bg-[#242424] border-[#333]' : 'bg-white border-[#e8e8e8]'}`}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className={`font-polysans text-base ${isDark ? 'text-white' : 'text-[#202020]'}`}>{category.name}</span>
                  <span className={`font-polysans text-base tabular-nums ${isDark ? 'text-white' : 'text-[#202020]'}`}>{formatCurrency(category.amount)} <span className="text-sm text-[#828282]">({percentage.toFixed(1)}%)</span></span>
                </div>
                <div className={`h-3 w-full overflow-hidden rounded-full ${isDark ? 'bg-[#121212]' : 'bg-[#f1f1f1]'}`}><div className="h-full bg-[#ff682c] transition-all duration-500" style={{ width: `${Math.min(percentage, 100)}%` }} /></div>
              </div>;
            })}
          </div>
        )}
      </section>}
    </div>
  );
};
