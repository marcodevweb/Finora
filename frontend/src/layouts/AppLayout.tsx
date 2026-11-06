import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { ToastProvider } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';

export const AppLayout: React.FC = () => {
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
        <Sidebar />

        {/* Main Content wrapper shifted right for sidebar */}
        <div className="flex-1 ml-0 md:ml-72 flex flex-col min-h-screen">
          <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-12">
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
