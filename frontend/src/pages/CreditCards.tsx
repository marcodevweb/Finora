import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import api from '../services/api';
import { CreditCard as CreditCardType } from '../types';
import { CreditCard as CreditCardIcon, Plus, Trash2, X, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { validateForm } from '../lib/formValidation';

export const CreditCards: React.FC = () => {
  const [cards, setCards] = useState<CreditCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteCardId, setDeleteCardId] = useState<string | null>(null);
  const { isDark } = useTheme();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [closingDay, setClosingDay] = useState('5');
  const [dueDay, setDueDay] = useState('10');
  const [color, setColor] = useState('#ff682c');

  const fetchCards = async () => {
    try {
      setLoading(true);
      const res = await api.get('/credit-cards');
      setCards(res.data);
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar cartões de crédito.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm(e, (message) => showToast(message, 'error'))) return;
    try {
      setSubmitting(true);
      await api.post('/credit-cards', {
        name,
        limit: parseFloat(limit),
        closingDay: parseInt(closingDay),
        dueDay: parseInt(dueDay),
        color
      });
      showToast('Cartão de crédito cadastrado com sucesso!');
      setName('');
      setLimit('');
      setIsModalOpen(false);
      fetchCards();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao cadastrar cartão.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/credit-cards/${id}`);
      showToast('Cartão excluído com sucesso!');
      fetchCards();
    } catch (err) {
      showToast('Erro ao excluir cartão.', 'error');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className={`space-y-12 transition-colors duration-300 ${isDark ? 'text-[#f5f5f5]' : 'text-[#202020]'}`}>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`font-polysans text-4xl font-normal tracking-tight ${isDark ? 'text-white' : 'text-[#202020]'}`}>Cartões de Crédito</h1>
          <p className={`text-sm font-inter mt-1 ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>
            Controle seus cartões, limites e datas importantes em um só lugar.
          </p>
        </div>

        <div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3.5 bg-[#ff682c] text-white font-polysans text-sm rounded-xl hover:bg-[#e05620] transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cartão</span>
          </button>
        </div>
      </div>

      {/* Cards List */}
      {loading ? (
        <div className="py-12 text-center text-[#828282] font-inter">Carregando cartões...</div>
      ) : cards.length === 0 ? (
        <div className={`p-12 rounded-2xl text-center font-inter ${
          isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e]' : 'bg-white border border-[#e8e8e8]'
        }`}>
          <CreditCardIcon className="w-12 h-12 mx-auto mb-4 text-[#ff682c] opacity-80" />
          <h4 className={`font-polysans text-lg font-medium mb-1 ${isDark ? 'text-white' : 'text-[#202020]'}`}>Nenhum cartão cadastrado</h4>
          <p className="text-sm text-[#828282] mb-6">Adicione seus cartões para acompanhar limites e faturas.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff682c] text-white font-polysans text-sm rounded-xl hover:bg-[#e05620] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeiro Cartão</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card: any) => (
            <div
              key={card.id}
              className={`rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl relative overflow-hidden ${
                isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e]' : 'bg-white border border-[#e8e8e8]'
              }`}
            >
              <div
                className="absolute top-0 left-0 right-0 h-2"
                style={{ backgroundColor: card.color || '#ff682c' }}
              ></div>

              <div>
                <div className="flex items-center justify-between mb-4 mt-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: card.color || '#ff682c' }}
                    >
                      <CreditCardIcon className="w-5 h-5" />
                    </div>
                    <h3 className={`font-polysans text-lg font-medium ${isDark ? 'text-white' : 'text-[#202020]'}`}>{card.name}</h3>
                  </div>
                  <button
                    onClick={() => setDeleteCardId(card.id)}
                    className="p-2 rounded-lg text-[#828282] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Excluir Cartão"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 font-inter text-sm mb-6">
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}>Limite Total:</span>
                    <strong className={`tabular-nums ${isDark ? 'text-white' : 'text-[#202020]'}`}>{formatCurrency(card.limit)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}>Fechamento:</span>
                    <span className={`tabular-nums font-medium ${isDark ? 'text-white' : 'text-[#202020]'}`}>Dia {card.closingDay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}>Vencimento:</span>
                    <span className={`tabular-nums font-medium ${isDark ? 'text-white' : 'text-[#202020]'}`}>Dia {card.dueDay}</span>
                  </div>
                </div>
              </div>

              <div className={`pt-4 border-t flex items-center justify-between text-xs font-inter ${
                isDark ? 'border-[#2e2e2e] text-[#828282]' : 'border-[#e8e8e8] text-[#828282]'
              }`}>
                <span>Cartão Ativo</span>
                <span className="text-[#ff682c] font-medium">Finora Secure</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Card Modal */}
      {isModalOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[110] w-screen h-screen bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className={`rounded-2xl max-w-md w-full p-8 shadow-2xl relative transition-all duration-300 ${
            isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e] text-white' : 'bg-white text-[#202020]'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-polysans text-2xl font-normal">Novo Cartão de Crédito</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-[#828282] hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form noValidate onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block font-polysans text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>Nome do Cartão</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full p-3.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff682c] transition-all ${
                    isDark ? 'bg-[#242424] border border-[#333] text-white' : 'bg-white border border-[#e8e8e8]'
                  }`}
                  placeholder="Ex: Nubank Ultravioleta, Visa Infinite..."
                />
              </div>

              <div>
                <label className={`block font-polysans text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>Limite (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  className={`w-full p-3.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff682c] transition-all tabular-nums ${
                    isDark ? 'bg-[#242424] border border-[#333] text-white' : 'bg-white border border-[#e8e8e8]'
                  }`}
                  placeholder="Ex: 5000.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block font-polysans text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>Dia Fechamento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={closingDay}
                    onChange={(e) => setClosingDay(e.target.value)}
                    className={`w-full p-3.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff682c] transition-all tabular-nums ${
                      isDark ? 'bg-[#242424] border border-[#333] text-white' : 'bg-white border border-[#e8e8e8]'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block font-polysans text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>Dia Vencimento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className={`w-full p-3.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff682c] transition-all tabular-nums ${
                      isDark ? 'bg-[#242424] border border-[#333] text-white' : 'bg-white border border-[#e8e8e8]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block font-polysans text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>Cor do Cartão</label>
                <div className="flex gap-3 items-center">
                  {['#ff682c', '#202020', '#816729', '#2563eb', '#7c3aed', '#db2777'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-[#ff682c] scale-110' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
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
                  disabled={submitting}
                  className="w-1/2 bg-[#ff682c] text-white font-polysans py-3.5 px-6 rounded-xl hover:bg-[#e05620] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : 'Salvar Cartão'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <ConfirmDialog
        open={deleteCardId !== null}
        title="Excluir este cartão?"
        message="Os dados deste cartão serão removidos. As movimentações já registradas não serão apagadas."
        onCancel={() => setDeleteCardId(null)}
        onConfirm={() => {
          const cardId = deleteCardId;
          setDeleteCardId(null);
          if (cardId) void handleDelete(cardId);
        }}
      />
    </div>
  );
};
