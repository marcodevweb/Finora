import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import api from '../services/api';
import { Budget, Category } from '../types';
import { Plus, PieChart, AlertCircle, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { CustomSelect } from '../components/CustomSelect';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { validateForm } from '../lib/formValidation';

export const Budgets: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { isDark } = useTheme();
  const { showToast } = useToast();

  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [deleteBudgetId, setDeleteBudgetId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const month = selectedMonth.getMonth() + 1;
  const year = selectedMonth.getFullYear();
  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(selectedMonth);
  const previousMonth = () => setSelectedMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  const nextMonth = () => setSelectedMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const [budRes, catRes] = await Promise.all([
        api.get('/budgets', { params: { month, year } }),
        api.get('/categories')
      ]);
      setBudgets(budRes.data);
      const expenseCats = catRes.data.filter((c: Category) => c.type === 'EXPENSE');
      setCategories(expenseCats);
      if (expenseCats.length > 0 && !categoryId) {
        setCategoryId(expenseCats[0].id);
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar orçamentos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [month, year]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm(e, (message) => showToast(message, 'error'))) return;
    try {
      setSubmitting(true);
      await api.post('/budgets', {
        categoryId,
        amount: parseFloat(amount),
        month,
        year
      });
      showToast('Orçamento definido com sucesso!');
      setAmount('');
      fetchBudgets();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao salvar orçamento.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/budgets/${id}`);
      showToast('Orçamento excluído com sucesso!');
      fetchBudgets();
    } catch (err) {
      showToast('Erro ao excluir orçamento.', 'error');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <>
      <div className={`space-y-12 transition-colors duration-300 ${isDark ? 'text-[#f5f5f5]' : 'text-[#202020]'}`}>

      <div>
        <h1 className={`font-polysans text-4xl font-normal tracking-tight ${isDark ? 'text-white' : 'text-[#202020]'}`}>Limites de gastos</h1>
        <p className={`text-sm font-inter mt-1 ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>
          Defina um limite por categoria e acompanhe o que já gastou.
        </p>
      </div>

      <section className={`flex items-center justify-between gap-4 rounded-2xl p-5 ${isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e]' : 'bg-white border border-[#e8e8e8]'}`} aria-label="Selecionar mês do orçamento">
        <button type="button" onClick={previousMonth} aria-label="Ver mês anterior" className={`p-2 rounded-lg ${isDark ? 'hover:bg-[#242424]' : 'hover:bg-[#f2f2f2]'}`}><ChevronLeft className="w-5 h-5" /></button>
        <div className="text-center">
          <p className="text-xs text-[#828282]">Acompanhando</p>
          <p className="font-polysans text-lg capitalize">{monthLabel}</p>
        </div>
        <button type="button" onClick={nextMonth} aria-label="Ver próximo mês" className={`p-2 rounded-lg ${isDark ? 'hover:bg-[#242424]' : 'hover:bg-[#f2f2f2]'}`}><ChevronRight className="w-5 h-5" /></button>
      </section>

      {budgets.length > 0 && (
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label="Resumo dos limites">
          {[
            { label: 'Limites definidos', value: budgets.reduce((sum, budget) => sum + Number(budget.amount), 0) },
            { label: 'Gasto acompanhado', value: budgets.reduce((sum, budget) => sum + Number(budget.spent || 0), 0) },
            { label: 'Ainda disponível', value: budgets.reduce((sum, budget) => sum + Math.max(Number(budget.amount) - Number(budget.spent || 0), 0), 0) },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl p-5 ${isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e]' : 'bg-white border border-[#e8e8e8]'}`}>
              <p className="text-sm text-[#828282]">{item.label}</p>
              <p className="mt-1 font-polysans text-xl tabular-nums">{formatCurrency(item.value)}</p>
            </div>
          ))}
        </section>
      )}

      {/* Add Budget Form Card */}
      <div className={`rounded-2xl p-8 transition-all duration-300 shadow-sm ${
        isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e]' : 'bg-white border border-[#e8e8e8]'
      }`}>
        <h3 className={`font-polysans text-2xl font-normal mb-6 ${isDark ? 'text-white' : 'text-[#202020]'}`}>Definir limite de gastos</h3>
        <form noValidate onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div>
            <label className={`block font-polysans text-xs uppercase tracking-wider mb-2 ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>Categoria</label>
            <CustomSelect
              value={categoryId}
              onChange={(val) => {
                if (val === '__new__') {
                  setIsCategoryModalOpen(true);
                } else {
                  setCategoryId(val);
                }
              }}
              options={[
                ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
                { value: '__new__', label: '+ Criar Nova Categoria...', className: 'text-[#ff682c] font-semibold' }
              ]}
            />
          </div>

          <div>
            <label className={`block font-polysans text-xs uppercase tracking-wider mb-2 ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>Quanto você quer gastar? (R$)</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full p-3.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff682c] transition-all tabular-nums ${
                isDark ? 'bg-[#242424] border border-[#333] text-white' : 'bg-white border border-[#e8e8e8]'
              }`}
              placeholder="Ex: 1000.00"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#ff682c] text-white font-polysans py-3.5 px-6 rounded-xl hover:bg-[#e05620] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? 'Salvando...' : 'Salvar limite'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Budgets List Grid */}
      <div className="space-y-6">
        <h3 className={`font-polysans text-2xl font-normal ${isDark ? 'text-white' : 'text-[#202020]'}`}>Acompanhamento Atual</h3>

        {loading ? (
          <div className="py-12 text-center text-[#828282] font-inter">Carregando orçamentos...</div>
        ) : budgets.length === 0 ? (
          <div className={`p-12 rounded-2xl text-center font-inter ${
            isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e]' : 'bg-white border border-[#e8e8e8]'
          }`}>
            <PieChart className="w-12 h-12 mx-auto mb-4 text-[#ff682c] opacity-80" />
            <h4 className={`font-polysans text-lg font-medium mb-1 ${isDark ? 'text-white' : 'text-[#202020]'}`}>Você ainda não definiu limites para este mês</h4>
            <p className="text-sm text-[#828282] mb-6">Defina limites de gastos por categoria para controlar seus custos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {budgets.map((b) => {
              const spent = b.spent || 0;
              const limit = b.amount;
              const percentage = b.percentage || 0;
              const isOver = percentage > 100;

              return (
                <div key={b.id} className={`rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${
                  isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e]' : 'bg-white border border-[#e8e8e8]'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`font-polysans text-lg font-medium ${isDark ? 'text-white' : 'text-[#202020]'}`}>{b.category?.name}</span>
                      <button onClick={() => setDeleteBudgetId(b.id)} className="p-2 rounded-lg text-[#828282] hover:text-red-500 hover:bg-red-500/10 transition-colors" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex justify-between text-sm font-inter mb-2">
                      <span className={isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}>Gasto: <strong className={`tabular-nums ${isDark ? 'text-white' : 'text-[#202020]'}`}>{formatCurrency(spent)}</strong></span>
                      <span className={isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}>Limite: <strong className={`tabular-nums ${isDark ? 'text-white' : 'text-[#202020]'}`}>{formatCurrency(limit)}</strong></span>
                    </div>

                    <div className={`w-full h-3 rounded-full overflow-hidden mb-4 ${isDark ? 'bg-[#242424]' : 'bg-[#efefef]'}`}>
                      <div
                        className={`h-full transition-all duration-500 ${isOver ? 'bg-[#ff682c]' : percentage > 80 ? 'bg-[#816729]' : (isDark ? 'bg-white' : 'bg-[#202020]')}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>

                    {isOver && (
                      <div className="flex items-center gap-2 text-xs text-[#ff682c] font-inter">
                        <AlertCircle className="w-4 h-4" />
                        <span>Orçamento ultrapassado em {percentage.toFixed(1)}%!</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>

      {/* New Category Modal */}
      {isCategoryModalOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[110] w-screen h-screen bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className={`rounded-2xl max-w-md w-full p-8 shadow-2xl relative transition-all duration-300 ${
            isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e] text-white' : 'bg-white text-[#202020]'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-polysans text-2xl font-normal">Nova Categoria de Despesa</h3>
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
                const res = await api.post('/categories', { name: newCatName.trim(), type: 'EXPENSE' });
                setCategories(prev => [...prev, res.data]);
                setCategoryId(res.data.id);
                showToast('Categoria criada com sucesso!');
                setIsCategoryModalOpen(false);
                setNewCatName('');
              } catch (err: any) {
                showToast(err.response?.data?.error || 'Erro ao criar categoria.', 'error');
              }
            }} className="space-y-4">
              <div>
                <label className={`block font-polysans text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>Qual a categoria?</label>
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
                  Salvar Alteração
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <ConfirmDialog
        open={deleteBudgetId !== null}
        title="Excluir este limite?"
        message="O limite desta categoria será removido do mês selecionado. Esta ação não pode ser desfeita."
        onCancel={() => setDeleteBudgetId(null)}
        onConfirm={() => {
          const budgetId = deleteBudgetId;
          setDeleteBudgetId(null);
          if (budgetId) void handleDelete(budgetId);
        }}
      />

    </>
  );
};
