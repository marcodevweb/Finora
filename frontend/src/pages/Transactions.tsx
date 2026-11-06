import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import api from '../services/api';
import { Transaction, Category, Account } from '../types';
import { Plus, Search, Download, Trash2, Edit3, X, Utensils, Home, Car, Briefcase, Film, HeartPulse, Coffee, Tag, Receipt as ReceiptIcon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { EmptyState } from '../components/EmptyState';
import { CustomSelect } from '../components/CustomSelect';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { validateForm } from '../lib/formValidation';
import { DatePicker, formatDateValue, localDateValue } from '../components/DatePicker';
import { MonthFilter } from '../components/MonthFilter';

const getCategoryIcon = (name: string) => {
  const lower = (name || '').toLowerCase();
  if (lower.includes('aliment') || lower.includes('mercado') || lower.includes('comida')) return Utensils;
  if (lower.includes('morad') || lower.includes('casa') || lower.includes('aluguel')) return Home;
  if (lower.includes('transp') || lower.includes('carro') || lower.includes('uber') || lower.includes('gasolina')) return Car;
  if (lower.includes('salár') || lower.includes('trabalho') || lower.includes('renda')) return Briefcase;
  if (lower.includes('lazer') || lower.includes('entretenimento') || lower.includes('cinema')) return Film;
  if (lower.includes('saúde') || lower.includes('farmácia') || lower.includes('médico')) return HeartPulse;
  if (lower.includes('café') || lower.includes('restaurante')) return Coffee;
  return Tag;
};

export const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();
  const { showToast } = useToast();

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [deleteTransactionId, setDeleteTransactionId] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    accountId: '',
    categoryId: '',
    amount: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    description: '',
    date: localDateValue(),
    notes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (categoryFilter) params.categoryId = categoryFilter;
      if (monthFilter) {
        const [year, month] = monthFilter.split('-').map(Number);
        const lastDay = new Date(year, month, 0).getDate();
        params.startDate = `${monthFilter}-01`;
        params.endDate = `${monthFilter}-${String(lastDay).padStart(2, '0')}`;
      }

      const [txRes, catRes, accRes] = await Promise.all([
        api.get('/transactions', { params }),
        api.get('/categories'),
        api.get('/accounts')
      ]);

      setTransactions(txRes.data);
      setCategories(catRes.data);

      const uniqueAccounts = accRes.data.filter((conta: Account, index: number, self: Account[]) =>
        index === self.findIndex(c => c.name === conta.name)
      );
      setAccounts(uniqueAccounts);

      if (uniqueAccounts.length > 0 && !formData.accountId) {
        setFormData(prev => ({ ...prev, accountId: uniqueAccounts[0].id }));
      }
      const firstExpenseCategory = catRes.data.find((category: Category) => category.type === 'EXPENSE');
      if (firstExpenseCategory && !formData.categoryId) {
        setFormData(prev => ({ ...prev, categoryId: firstExpenseCategory.id }));
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar transações.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, typeFilter, categoryFilter, monthFilter]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm(e, (message) => showToast(message, 'error'))) return;
    try {
      if (editingId) {
        await api.put(`/transactions/${editingId}`, formData);
        showToast('Transação atualizada com sucesso!');
      } else {
        await api.post('/transactions', formData);
        showToast('Transação criada com sucesso!');
      }
      setIsModalOpen(false);
      setEditingId(null);
      resetForm();
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao salvar transação.', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      accountId: accounts[0]?.id || '',
      categoryId: categories.find((category) => category.type === 'EXPENSE')?.id || '',
      amount: '',
      type: 'EXPENSE',
      description: '',
      date: localDateValue(),
      notes: '',
    });
  };

  const handleEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setFormData({
      accountId: tx.accountId,
      categoryId: tx.categoryId,
      amount: String(tx.amount),
      type: tx.type,
      description: tx.description,
      date: tx.date.slice(0, 10),
      notes: tx.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/transactions/${id}`);
      showToast('Transação excluída com sucesso!');
      fetchData();
    } catch (err) {
      showToast('Erro ao excluir transação.', 'error');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const exportTransactions = () => {
    const columns = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Conta', 'Valor (R$)', 'Observações'];
    const escapeCell = (value: string | number) => {
      const safeValue = String(value).replace(/^[=+@-]/, (prefix) => `'${prefix}`);
      return `"${safeValue.replace(/"/g, '""')}"`;
    };
    const rows = transactions.map((transaction) => [
      formatDateValue(transaction.date.slice(0, 10)),
      transaction.type === 'INCOME' ? 'Receita' : 'Despesa',
      transaction.description,
      transaction.category?.name || '',
      transaction.account?.name || '',
      Number(transaction.amount).toFixed(2).replace('.', ','),
      transaction.notes || '',
    ]);
    const csv = [columns, ...rows].map((row) => row.map(escapeCell).join(';')).join('\r\n');
    const file = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finora-receitas-e-despesas-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-6 sm:space-y-10 transition-colors duration-300 ${isDark ? 'text-[#f5f5f5]' : 'text-[#202020]'}`}>

      {/* Header & CTA */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className={`font-polysans text-3xl sm:text-4xl font-normal tracking-tight ${isDark ? 'text-white' : 'text-[#202020]'}`}>Receitas e despesas</h1>
          <p className={`text-sm font-inter mt-1 ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>
            Registre seu salário, compras e outras entradas ou saídas de dinheiro.
          </p>
        </div>

        <div className="w-full xl:w-auto">
          <button
            onClick={() => {
              setEditingId(null);
              resetForm();
              setIsModalOpen(true);
            }}
            className="w-full xl:w-auto flex items-center justify-center gap-2 bg-[#ff682c] text-white font-polysans text-sm py-3.5 px-6 rounded-xl hover:bg-[#e05620] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar receita ou despesa</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className={`rounded-2xl p-4 sm:p-6 transition-all duration-300 shadow-sm ${
        isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e]' : 'bg-white border border-[#e8e8e8]'
      }`}>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:items-end">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
            <div className="relative w-full min-w-0 sm:flex-1">
              <span aria-hidden="true" className="mb-1.5 hidden h-4 sm:block" />
              <Search className="absolute left-4 top-[2.4375rem] w-4 h-4 text-[#828282]" />
              <input
                type="text"
                placeholder="Buscar por descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar por descrição"
                className={`h-[3.125rem] w-full pl-11 pr-4 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff682c] transition-all ${
                  isDark ? 'bg-[#242424] border border-[#333] text-white' : 'bg-white border border-[#e8e8e8]'
                }`}
              />
            </div>
            <MonthFilter value={monthFilter} onChange={setMonthFilter} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(128px,0.8fr)_minmax(160px,1.1fr)_auto] xl:items-end">
            <div className="w-full">
              <CustomSelect
                value={typeFilter}
                onChange={(val) => setTypeFilter(val)}
                options={[
                  { value: '', label: 'Todos os Tipos' },
                  { value: 'INCOME', label: 'Receitas' },
                  { value: 'EXPENSE', label: 'Despesas' },
                ]}
              />
            </div>

            <div className="w-full">
              <CustomSelect
                value={categoryFilter}
                onChange={(val) => setCategoryFilter(val)}
                options={[
                  { value: '', label: 'Todas as Categorias' },
                  ...categories.map(c => ({ value: c.id, label: c.name }))
                ]}
              />
            </div>

            <button
              type="button"
              onClick={exportTransactions}
              disabled={transactions.length === 0}
              className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:col-span-2 xl:col-span-1 xl:w-auto ${isDark ? 'border-[#333] text-white hover:bg-[#242424]' : 'border-[#e8e8e8] text-[#202020] hover:bg-[#f8f8f8]'}`}
            >
              <Download className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="py-20 text-center text-[#828282] font-inter">Carregando suas receitas e despesas...</div>
      ) : transactions.length === 0 ? (
        <EmptyState
          title={search || typeFilter || categoryFilter || monthFilter ? 'Nenhuma movimentação encontrada' : 'Suas finanças começam aqui'}
          description={search || typeFilter || categoryFilter || monthFilter
            ? 'Tente ajustar os filtros ou escolha outro mês.'
            : 'Registre seu primeiro salário ou gasto para acompanhar para onde seu dinheiro vai.'}
          icon={ReceiptIcon}
          actionLabel={search || typeFilter || categoryFilter || monthFilter ? 'Limpar filtros' : 'Registrar receita ou despesa'}
          onAction={() => {
            if (search || typeFilter || categoryFilter || monthFilter) {
              setSearch('');
              setTypeFilter('');
              setCategoryFilter('');
              setMonthFilter('');
            } else {
              setEditingId(null);
              resetForm();
              setIsModalOpen(true);
            }
          }}
        />
      ) : (
        <div className={`rounded-2xl overflow-hidden shadow-sm transition-colors duration-300 ${
          isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e]' : 'bg-white border border-[#e8e8e8]'
        }`}>
          <div className="hidden overflow-x-auto xl:block">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-xs uppercase tracking-wider font-polysans ${
                  isDark ? 'border-[#2e2e2e] text-[#a0a0a0] bg-[#161616]' : 'border-[#e8e8e8] text-[#4d4d4d] bg-[#f8f8f8]'
                }`}>
                  <th className="py-4 px-6">Categoria / Descrição</th>
                  <th className="py-4 px-6">Conta</th>
                  <th className="py-4 px-6">Data</th>
                  <th className="py-4 px-6 text-right">Valor</th>
                  <th className="py-4 px-6 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-inherit">
                {transactions.map((tx) => {
                  const CatIcon = getCategoryIcon(tx.category?.name);
                  const isIncome = tx.type === 'INCOME';
                  return (
                    <tr key={tx.id} className={`group transition-colors duration-200 ${
                      isDark ? 'border-[#2e2e2e] hover:bg-[#242424]' : 'border-[#e8e8e8] hover:bg-[#fafafa]'
                    }`}>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isIncome ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[#ff682c]/10 text-[#ff682c]'
                          }`}>
                            <CatIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <span className={`block font-polysans font-medium text-sm ${isDark ? 'text-white' : 'text-[#202020]'}`}>
                              {tx.description}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm font-inter text-[#828282]">
                        {tx.account?.name || 'Conta Principal'}
                      </td>
                      <td className="py-4 px-6 text-sm font-inter text-[#828282]">
                        {formatDateValue(tx.date.slice(0, 10))}
                      </td>
                      <td className={`py-4 px-6 text-right font-polysans font-medium text-base tabular-nums ${
                        isIncome ? 'text-emerald-500' : isDark ? 'text-white' : 'text-[#202020]'
                      }`}>
                        {isIncome ? '+ ' : '- '}{formatCurrency(tx.amount)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(tx)}
                            className="p-2 rounded-lg text-[#828282] hover:text-[#ff682c] hover:bg-[#ff682c]/10 transition-colors"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTransactionId(tx.id)}
                            className="p-2 rounded-lg text-[#828282] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="divide-y xl:hidden">
            {transactions.map((tx) => {
              const CatIcon = getCategoryIcon(tx.category?.name);
              const isIncome = tx.type === 'INCOME';
              return (
                <article key={tx.id} className={`p-4 ${isDark ? 'border-[#2e2e2e]' : 'border-[#e8e8e8]'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        isIncome ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[#ff682c]/10 text-[#ff682c]'
                      }`}>
                        <CatIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className={`truncate font-polysans text-sm font-medium ${isDark ? 'text-white' : 'text-[#202020]'}`}>
                          {tx.description}
                        </p>
                        <p className="mt-0.5 truncate font-inter text-xs text-[#828282]">
                          {tx.category?.name || 'Sem categoria'} · {tx.account?.name || 'Conta Principal'}
                        </p>
                      </div>
                    </div>
                    <span className={`shrink-0 text-right font-polysans text-sm font-medium tabular-nums ${
                      isIncome ? 'text-emerald-500' : isDark ? 'text-white' : 'text-[#202020]'
                    }`}>
                      {isIncome ? '+ ' : '- '}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <time className="font-inter text-xs text-[#828282]">{formatDateValue(tx.date.slice(0, 10))}</time>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(tx)}
                        aria-label={`Editar ${tx.description}`}
                        className="flex h-11 w-11 items-center justify-center rounded-lg text-[#828282] hover:bg-[#ff682c]/10 hover:text-[#ff682c]"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTransactionId(tx.id)}
                        aria-label={`Excluir ${tx.description}`}
                        className="flex h-11 w-11 items-center justify-center rounded-lg text-[#828282] hover:bg-red-500/10 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100] w-screen h-screen bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className={`relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl p-5 shadow-2xl transition-all duration-300 sm:p-8 ${
            isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e] text-white' : 'bg-white text-[#202020]'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-polysans text-xl font-normal sm:text-2xl">
                {editingId ? 'Editar Transação' : 'Registrar receita ou despesa'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-[#828282] hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form noValidate onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={`block font-polysans text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>Tipo</label>
                  <CustomSelect
                    value={formData.type}
                    onChange={(val) => {
                      const nextType = val as 'INCOME' | 'EXPENSE';
                      const firstCategory = categories.find((category) => category.type === nextType);
                      setFormData((previous) => ({ ...previous, type: nextType, categoryId: firstCategory?.id || '' }));
                    }}
                    options={[
                      { value: 'EXPENSE', label: 'Despesa' },
                      { value: 'INCOME', label: 'Receita' },
                    ]}
                  />
                </div>

                <div>
                  <label className={`block font-polysans text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>Valor em reais</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className={`w-full p-3.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff682c] transition-all tabular-nums ${
                      isDark ? 'bg-[#242424] border border-[#333] text-white' : 'bg-white border border-[#e8e8e8]'
                    }`}
                    placeholder="150.00"
                  />
                </div>
              </div>

              <div>
                <label className={`block font-polysans text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>Descrição</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full p-3.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff682c] transition-all ${
                    isDark ? 'bg-[#242424] border border-[#333] text-white' : 'bg-white border border-[#e8e8e8]'
                  }`}
                  placeholder="Ex: Mercado da semana, Salário"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block font-polysans text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>Categoria</label>
                  <CustomSelect
                    value={formData.categoryId}
                    onChange={(val) => {
                      if (val === '__new__') {
                        setNewCatType(formData.type);
                        setIsCategoryModalOpen(true);
                      } else {
                        setFormData({ ...formData, categoryId: val });
                      }
                    }}
                    options={[
                      ...categories.filter((category) => category.type === formData.type).map((category) => ({ value: category.id, label: category.name })),
                      { value: '__new__', label: '+ Criar Nova Categoria...', className: 'text-[#ff682c] font-semibold' }
                    ]}
                  />
                </div>

                <div>
                  <label className={`block font-polysans text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>Conta usada</label>
                  <CustomSelect
                    value={formData.accountId}
                    onChange={(val) => setFormData({ ...formData, accountId: val })}
                    options={accounts.map((a) => ({ value: a.id, label: a.name }))}
                    placeholder="Selecione a conta"
                  />
                </div>
              </div>

              <div>
                <label className={`block font-polysans text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>Data</label>
                <DatePicker
                  value={formData.date}
                  onChange={(date) => setFormData((previous) => ({ ...previous, date }))}
                  isDark={isDark}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`w-1/2 font-polysans py-3.5 px-6 rounded-xl transition-all ${
                    isDark ? 'bg-[#242424] border border-[#333] text-white hover:bg-[#333]' : 'bg-white border border-[#e8e8e8] text-[#202020] hover:bg-[#f8f8f8]'
                  }`}
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-[#ff682c] text-white font-polysans py-3.5 px-6 rounded-xl hover:bg-[#e05620] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
                >
                  {editingId ? 'Salvar alterações' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* New Category Modal */}
      {isCategoryModalOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[110] w-screen h-screen bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className={`rounded-2xl max-w-md w-full p-8 shadow-2xl relative transition-all duration-300 ${
            isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e] text-white' : 'bg-white text-[#202020]'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-polysans text-2xl font-normal">Nova Categoria</h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-2 rounded-xl text-[#828282] hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form noValidate onSubmit={async (e) => {
              e.preventDefault();
              if (!validateForm(e, (message) => showToast(message, 'error'))) return;
              if (!newCatName.trim()) return;
              try {
                const res = await api.post('/categories', { name: newCatName.trim(), type: newCatType });
                setCategories(prev => [...prev, res.data]);
                setFormData(prev => ({ ...prev, categoryId: res.data.id }));
                showToast('Categoria criada com sucesso!');
                setIsCategoryModalOpen(false);
                setNewCatName('');
              } catch (err: any) {
                showToast(err.response?.data?.error || 'Erro ao criar categoria.', 'error');
              }
            }} className="space-y-4">
              <div>
                <label className={`block font-polysans text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>Categoria</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className={`w-full p-3.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff682c] transition-all ${
                    isDark ? 'bg-[#242424] border border-[#333] text-white' : 'bg-white border border-[#e8e8e8]'
                  }`}
                  placeholder="Ex: ✈️ Viagens, 📚 Cursos..."
                />
              </div>

              <div>
                <label className={`block font-polysans text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>Tipo</label>
                <select
                  value={newCatType}
                  onChange={(e) => setNewCatType(e.target.value as 'INCOME' | 'EXPENSE')}
                  className={`w-full p-3.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff682c] transition-all ${
                    isDark ? 'bg-[#242424] border border-[#333] text-white' : 'bg-white border border-[#e8e8e8]'
                  }`}
                >
                  <option value="EXPENSE">Despesa</option>
                  <option value="INCOME">Receita</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className={`w-1/2 font-polysans py-3.5 px-6 rounded-xl transition-all ${
                    isDark ? 'bg-[#242424] border border-[#333] text-white hover:bg-[#333]' : 'bg-white border border-[#e8e8e8] text-[#202020] hover:bg-[#f8f8f8]'
                  }`}
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-[#ff682c] text-white font-polysans py-3.5 px-6 rounded-xl hover:bg-[#e05620] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
                >
                  {editingId ? 'Salvar alterações' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <ConfirmDialog
        open={deleteTransactionId !== null}
        title="Excluir esta movimentação?"
        message="Este registro será removido e o saldo da conta será atualizado. Esta ação não pode ser desfeita."
        onCancel={() => setDeleteTransactionId(null)}
        onConfirm={() => {
          const transactionId = deleteTransactionId;
          setDeleteTransactionId(null);
          if (transactionId) void handleDelete(transactionId);
        }}
      />

    </div>
  );
};
