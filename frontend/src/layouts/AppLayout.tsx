import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { FinoraMark } from '../components/FinoraMark';
import { ToastProvider } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';

export const AppLayout: React.FC = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const user = localStorage.getItem('finora_user');
  const { isDark } = useTheme();

  if (!user) {
    return <Navigate to="/register" replace />;
  }

  return (
    <ToastProvider>
      <div className={`min-h-screen flex flex-col font-inter transition-colors duration-300 ${
        isDark ? 'bg-[#121212] text-[#f5f5f5]' : 'bg-[#ffffff] text-[#202020]'
      }`}>
        <Sidebar isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />

        {/* Main Content wrapper shifted right for sidebar */}
        <div className="flex-1 ml-0 xl:ml-72 flex flex-col min-h-screen">
          <header className={`sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 xl:hidden ${
            isDark ? 'border-[#2e2e2e] bg-[#121212] text-white' : 'border-[#e8e8e8] bg-white text-[#202020]'
          }`}>
            <button
              type="button"
              aria-label="Abrir menu de navegação"
              aria-expanded={isMobileNavOpen}
              onClick={() => setIsMobileNavOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-[#ff682c]"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-[#ff682c]">
              <FinoraMark className="h-6 w-6" />
              <span className={`font-polysans text-lg font-semibold ${isDark ? 'text-white' : 'text-[#202020]'}`}>
                Finora<span className="text-[#ff682c]">.</span>
              </span>
            </div>
          </header>
          <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6 sm:py-8 xl:py-12">
            <Outlet />
          </main>

          <footer className={`border-t py-8 mt-20 transition-colors duration-300 ${
            isDark ? 'bg-[#1a1a1a] border-[#2e2e2e] text-[#a0a0a0]' : 'bg-[#f8f8f8] border-[#e8e8e8] text-[#828282]'
          }`}>
            <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-center text-center text-sm font-inter">
              <p>© {new Date().getFullYear()} Finora. Todos os direitos reservados. Seu organizador financeiro pessoal.</p>
            </div>
          </footer>
        </div>
      </div>
    </ToastProvider>
  );
};
