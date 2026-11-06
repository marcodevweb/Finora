import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AppLayout } from './layouts/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Budgets } from './pages/Budgets';
import { CreditCards } from './pages/CreditCards';
import { Goals } from './pages/Goals';
import { Reports } from './pages/Reports';
import { ThemeProvider } from './context/ThemeContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = localStorage.getItem('finora_user');
  if (!user) {
    return <Navigate to="/register" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="budgets" element={<Budgets />} />
            <Route path="credit-cards" element={<CreditCards />} />
            <Route path="goals" element={<Goals />} />
            <Route path="reports" element={<Reports />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
