import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, PieChart, Target, FileText, LogOut, Sun, Moon, ShieldCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const userStr = localStorage.getItem('finora_user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch { /* local sign-out still completes */ }
    localStorage.removeItem('finora_user');
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Início', icon: LayoutDashboard },
    { path: '/transactions', label: 'Receitas e despesas', icon: Receipt },
    { path: '/budgets', label: 'Orçamento mensal', icon: PieChart },
    { path: '/goals', label: 'Metas de economia', icon: Target },
    { path: '/reports', label: 'Relatórios', icon: FileText },
  ];

  return (
    <aside className={`w-72 fixed inset-y-0 left-0 z-40 flex flex-col justify-between border-r transition-colors duration-300 ${
      isDark ? 'bg-[#161616] border-[#2e2e2e]' : 'bg-[#f8f8f8] border-[#e8e8e8]'
    }`}>
      {/* Top section: Logo & Nav */}
      <div>
        <div className="h-24 px-8 flex items-center gap-3 border-b border-inherit">
          <div className={`w-10 h-10 flex items-center justify-center font-polysans font-medium text-lg rounded-xl shadow-md ${
            isDark ? 'bg-white text-[#121212]' : 'bg-[#202020] text-white'
          }`}>
            F
          </div>
          <div>
            <span className={`font-polysans text-2xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-[#202020]'}`}>
              Finora<span className="text-[#ff682c]">.</span>
            </span>
            <span className="block text-[10px] font-inter uppercase tracking-widest text-[#828282]">Finanças pessoais</span>
          </div>
        </div>

        <nav className="p-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-polysans text-sm transition-all duration-300 group ${
                  isActive
                    ? 'bg-[#ff682c] text-white shadow-lg shadow-[#ff682c]/20 transform translate-x-1'
                    : isDark
                    ? 'text-[#a0a0a0] hover:text-white hover:bg-[#202020]'
                    : 'text-[#4d4d4d] hover:text-[#202020] hover:bg-[#f0f0f0]'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : isDark ? 'text-[#828282]' : 'text-[#626262]'}`} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom section: Theme toggle, User profile & Logout */}
      <div className="p-6 border-t border-inherit space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-polysans rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-sm w-full justify-center ${
              isDark
                ? 'bg-[#202020] text-[#f5f5f5] hover:bg-[#2e2e2e] border border-[#333]'
                : 'bg-white text-[#202020] hover:bg-[#f8f8f8] border border-[#e8e8e8]'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4 text-[#ff682c]" /> : <Moon className="w-4 h-4 text-[#202020]" />}
            <span>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>
        </div>

        {user && (
          <div className={`p-4 rounded-xl flex items-center justify-between ${isDark ? 'bg-[#202020]' : 'bg-white border border-[#e8e8e8]'}`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-[#ff682c]/10 text-[#ff682c] flex items-center justify-center font-polysans font-bold shrink-0">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className={`font-polysans text-xs font-medium truncate ${isDark ? 'text-white' : 'text-[#202020]'}`}>{user.name}</p>
                <p className="text-[11px] text-[#828282] truncate font-inter">{user.email}</p>
              </div>
            </div>
            <div title="Conta Verificada">
              <ShieldCheck className="w-4 h-4 text-[#ff682c] shrink-0" />
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-polysans text-sm transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
            isDark ? 'bg-[#202020] text-[#ff682c] hover:bg-[#ff682c] hover:text-white border border-[#333]' : 'bg-white text-[#ff682c] border border-[#e8e8e8] hover:bg-[#ff682c] hover:text-white'
          }`}
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da conta</span>
        </button>
      </div>
    </aside>
  );
};
