import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import api from '../services/api';
import { FinancialGoal } from '../types';
import { Target, Plus, Trash2, ArrowUpCircle, Trophy, HelpCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { validateForm } from '../lib/formValidation';

export const Goals: React.FC = () => {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { isDark } = useTheme();
  const { showToast } = useToast();

  // Form State
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');

  // Contribution Modal
  const [contributingGoalId, setContributingGoalId] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributing, setContributing] = useState(false);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/goals');
      setGoals(res.data);
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar metas.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateGoal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm(e, (message) => showToast(message, 'error'))) return;
    try {
      setSubmitting(true);
      await api.post('/goals', {
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
        targetDate: targetDate ? new Date(targetDate).toISOString() : undefined,
      });
      showToast('Meta criada com sucesso!');
      setName('');
      setTargetAmount('');
      setCurrentAmount('');
      setTargetDate('');
      fetchGoals();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao criar meta.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContribute = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm(e, (message) => showToast(message, 'error'))) return;
    if (!contributingGoalId) return;
    try {
      setContributing(true);
      await api.post(`/goals/${contributingGoalId}/contribute`, {
        amount: parseFloat(contributionAmount),
      });
      showToast('Valor adicionado à meta.');
      setContributingGoalId(null);
      setContributionAmount('');
      fetchGoals();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao adicionar valor à meta.', 'error');
    } finally {
      setContributing(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/goals/${id}`);
      showToast('Meta excluída com sucesso!');
      fetchGoals();
    } catch (err) {
      showToast('Erro ao excluir meta.', 'error');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className={`space-y-12 transition-colors duration-300 ${isDark ? 'text-[#f5f5f5]' : 'text-[#202020]'}`}>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`font-polysans text-4xl font-normal tracking-tight ${isDark ? 'text-white' : 'text-[#202020]'}`}>Metas de economia</h1>
          <p className={`text-sm font-inter mt-1 ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>
            Crie objetivos, como uma viagem ou reserva, e acompanhe quanto falta para chegar lá.
          </p>
        </div>
      </div>

      {/* New Goal Form Card */}
      <div className={`rounded-2xl p-8 transition-all duration-300 shadow-sm ${
        isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e]' : 'bg-white border border-[#e8e8e8]'
      }`}>
        <h3 className={`font-polysans text-2xl font-normal mb-6 ${isDark ? 'text-white' : 'text-[#202020]'}`}>Criar uma meta</h3>
        <form noValidate onSubmit={handleCreateGoal} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div>
            <label className={`block font-polysans text-xs uppercase tracking-wider mb-2 ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>O que você quer conquistar?</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full p-3.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff682c] transition-all ${
                isDark ? 'bg-[#242424] border border-[#333] text-white' : 'bg-white border border-[#e8e8e8]'
              }`}
              placeholder="Ex: Reserva de Emergência"
            />
          </div>

          <div>
            <label className={`block font-polysans text-xs uppercase tracking-wider mb-2 ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>Valor Alvo (R$)</label>
            <input
              type="number"
              step="0.01"
              required
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className={`w-full p-3.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff682c] transition-all tabular-nums ${
                isDark ? 'bg-[#242424] border border-[#333] text-white' : 'bg-white border border-[#e8e8e8]'
              }`}
              placeholder="Ex: 30000.00"
            />
          </div>

          <div>
            <label className={`block font-polysans text-xs uppercase tracking-wider mb-2 ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>Valor Inicial (R$)</label>
            <input
              type="number"
              step="0.01"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              className={`w-full p-3.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff682c] transition-all tabular-nums ${
                isDark ? 'bg-[#242424] border border-[#333] text-white' : 'bg-white border border-[#e8e8e8]'
              }`}
              placeholder="Ex: 5000.00"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#ff682c] text-white font-polysans py-3.5 px-6 rounded-xl hover:bg-[#e05620] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? 'Criando...' : 'Criar meta'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Goals List Grid */}
      <div className="space-y-6">
        <h3 className={`font-polysans text-2xl font-normal ${isDark ? 'text-white' : 'text-[#202020]'}`}>Suas Metas</h3>

        {loading ? (
          <div className="py-12 text-center text-[#828282] font-inter">Carregando metas...</div>
        ) : goals.length === 0 ? (
          <div className={`p-12 rounded-2xl text-center font-inter ${
            isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e]' : 'bg-white border border-[#e8e8e8]'
          }`}>
            <Target className="w-12 h-12 mx-auto mb-4 text-[#ff682c] opacity-80" />
            <h4 className={`font-polysans text-lg font-medium mb-1 ${isDark ? 'text-white' : 'text-[#202020]'}`}>Você ainda não criou uma meta</h4>
            <p className="text-sm text-[#828282] mb-6">Comece com um objetivo e quanto pretende guardar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((g) => {
              const current = g.currentAmount;
              const target = g.targetAmount;
              const pct = Math.min(Math.round((current / target) * 100), 100);

              return (
                <div key={g.id} className={`rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${
                  isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e]' : 'bg-white border border-[#e8e8e8]'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-[#ff682c]" />
                        <span className={`font-polysans text-lg font-medium ${isDark ? 'text-white' : 'text-[#202020]'}`}>{g.name}</span>
                      </div>
                      <button onClick={() => setDeleteGoalId(g.id)} className="p-2 rounded-lg text-[#828282] hover:text-red-500 hover:bg-red-500/10 transition-colors" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex justify-between text-sm font-inter mb-2">
                      <span className={isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}>Acumulado: <strong className={`tabular-nums ${isDark ? 'text-white' : 'text-[#202020]'}`}>{formatCurrency(current)}</strong></span>
                      <span className="text-[#ff682c] font-medium">{pct}%</span>
                    </div>

                    <div className="flex justify-between text-xs text-[#828282] font-inter mb-4">
                      <span>Alvo: <strong className="tabular-nums">{formatCurrency(target)}</strong></span>
                    </div>

                    <div className={`w-full h-3 rounded-full overflow-hidden mb-6 ${isDark ? 'bg-[#242424]' : 'bg-[#efefef]'}`}>
                      <div className="h-full bg-[#ff682c] transition-all duration-500" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={() => setContributingGoalId(g.id)}
                      className={`w-full font-polysans text-sm py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 ${
                        isDark ? 'bg-[#242424] text-white hover:bg-[#ff682c]' : 'bg-[#efefef] text-[#202020] hover:bg-[#ff682c] hover:text-white'
                      }`}
                    >
                      <ArrowUpCircle className="w-4 h-4" />
                      <span>Adicionar Aporte</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Contribution Modal */}
      {contributingGoalId && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100] w-screen h-screen bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className={`rounded-2xl max-w-md w-full p-8 shadow-2xl relative transition-all duration-300 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e] text-white' : 'bg-white text-[#202020]'
          }`}>
            <h3 className={`font-polysans text-2xl font-normal mb-2 ${isDark ? 'text-white' : 'text-[#202020]'}`}>Adicionar Aporte</h3>
            <p className="text-xs text-[#828282] mb-6 font-inter">Insira o valor que deseja depositar para avançar rumo a esta meta.</p>
            <form noValidate onSubmit={handleContribute} className="space-y-4">
              <div>
                <label className={`block font-polysans text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>Valor do Aporte (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  className={`w-full p-3.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff682c] transition-all tabular-nums ${
                    isDark ? 'bg-[#242424] border border-[#333] text-white' : 'bg-white border border-[#e8e8e8]'
                  }`}
                  placeholder="Ex: 500.00"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setContributingGoalId(null)}
                  className={`w-1/2 font-polysans py-3.5 px-6 rounded-xl transition-all ${
                    isDark ? 'bg-[#242424] border border-[#333] text-white hover:bg-[#333]' : 'bg-white border border-[#e8e8e8] text-[#202020] hover:bg-[#f8f8f8]'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={contributing}
                  className="w-1/2 bg-[#ff682c] text-white font-polysans py-3.5 px-6 rounded-xl hover:bg-[#e05620] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-md disabled:opacity-50"
                >
                  {contributing ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <ConfirmDialog
        open={deleteGoalId !== null}
        title="Excluir esta meta?"
        message="A meta e o histórico dos valores adicionados serão removidos. Esta ação não pode ser desfeita."
        onCancel={() => setDeleteGoalId(null)}
        onConfirm={() => {
          const goalId = deleteGoalId;
          setDeleteGoalId(null);
          if (goalId) void handleDelete(goalId);
        }}
      />

    </div>
  );
};
