import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, PieChart, Target, FileText, LogOut, User as UserIcon, Sun, Moon, CreditCard } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { FinoraMark } from './FinoraMark';
import api from '../services/api';

export const Navbar: React.FC = () => {
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
    { path: '/transactions', label: 'Minhas Movimentações', icon: Receipt },
    { path: '/budgets', label: 'Limites do Mês', icon: PieChart },
    { path: '/credit-cards', label: 'Cartões de Crédito', icon: CreditCard },
    { path: '/goals', label: 'Meus Objetivos', icon: Target },
    { path: '/reports', label: 'Relatórios', icon: FileText },
  ];

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors duration-300 shadow-sm ${
      isDark ? 'bg-[#121212]/90 border-[#2e2e2e]' : 'bg-[#ffffff]/90 border-[#e8e8e8]'
    }`}>
      <div className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">

        {/* Brand Logo */}
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 transform group-hover:scale-105 shadow-md text-[#ff682c] ${
            isDark ? 'bg-white' : 'bg-[#202020]'
          }`}>
            <FinoraMark className="w-6 h-6" />
          </div>
          <span className={`font-polysans text-2xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-[#202020]'}`}>
            Finora<span className="text-[#ff682c]">.</span>
          </span>
        </Link>

        {/* Floating Nav Pill Container */}
        <nav className={`hidden md:flex items-center px-4 py-1.5 rounded-full gap-2 transition-all duration-300 shadow-sm ${
          isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e]' : 'bg-[#f8f8f8] border border-[#e8e8e8]'
        }`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-polysans text-sm transition-all duration-300 ${
                  isActive
                    ? 'bg-[#ff682c] text-white shadow-md transform scale-105'
                    : isDark ? 'text-[#a0a0a0] hover:text-white hover:bg-[#242424]' : 'text-[#202020] hover:text-[#ff682c] hover:bg-white/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : isDark ? 'text-[#828282]' : 'text-[#4d4d4d]'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-polysans rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-sm ${
              isDark
                ? 'bg-[#1a1a1a] text-[#f5f5f5] hover:bg-[#2e2e2e] border border-[#2e2e2e]'
                : 'bg-white text-[#202020] hover:bg-[#f8f8f8] border border-[#e8e8e8]'
            }`}
            title="Alternar Tema (Dark/Light)"
          >
            {isDark ? <Sun className="w-4 h-4 text-[#ff682c]" /> : <Moon className="w-4 h-4 text-[#202020]" />}
            <span className="hidden xl:inline">{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>

          {user && (
            <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-inter ${isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e] text-[#a0a0a0]' : 'bg-white border border-[#e8e8e8] text-[#4d4d4d]'}`}>
              <UserIcon className="w-4 h-4 text-[#ff682c]" />
              <span className="font-medium">{user.name}</span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#ff682c] text-white font-polysans text-sm rounded-xl hover:bg-[#e05620] transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>

      </div>

      {/* Mobile Sub-nav bar */}
      <div className={`flex md:hidden overflow-x-auto px-4 py-2 gap-2 border-t transition-colors duration-300 ${
        isDark ? 'bg-[#1a1a1a] border-[#2e2e2e]' : 'bg-[#f8f8f8] border-[#e8e8e8]'
      }`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-1.5 whitespace-nowrap font-polysans text-xs px-3.5 py-2 rounded-full transition-all duration-200 ${
                isActive
                  ? 'bg-[#ff682c] text-white shadow-md'
                  : isDark ? 'text-[#f5f5f5] bg-[#242424]' : 'text-[#202020] bg-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
};
