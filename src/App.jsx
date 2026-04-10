import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import POSPage from './pages/POSPage';
import CustomerPage from './pages/CustomerPage';
import CashRegisterPage from './pages/CashRegisterPage';
import ReportsPage from './pages/ReportsPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import BranchesPage from './pages/BranchesPage';
import SuppliersPage from './pages/SuppliersPage';
import InventoryPage from './pages/InventoryPage';
import SettingsPage from './pages/SettingsPage';
import RestaurantTPVPage from './pages/RestaurantTPVPage';
import MainLayout from './layouts/MainLayout';
import useAuthStore from './store/authStore';
import BranchSelectorModal from './components/BranchSelectorModal';
import { LanguageProvider } from './i18n/LanguageContext';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const ProtectedPage = ({ children }) => (
  <ProtectedRoute><MainLayout>{children}</MainLayout></ProtectedRoute>
);

function App() {
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (user && user.theme) {
      document.documentElement.className = `theme-${user.theme} ${user.darkMode ? 'dark' : ''}`;
    } else {
      document.documentElement.className = 'theme-blue';
    }
  }, [user]);

  return (
    <HashRouter>
      {isAuthenticated && <BranchSelectorModal />}
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/dashboard" />} />

        <Route path="/dashboard" element={<ProtectedPage><DashboardPage /></ProtectedPage>} />
        <Route path="/pos" element={<ProtectedPage><POSPage /></ProtectedPage>} />
        <Route path="/customers" element={<ProtectedPage><CustomerPage /></ProtectedPage>} />
        <Route path="/cash" element={<ProtectedPage><CashRegisterPage /></ProtectedPage>} />
        <Route path="/reports" element={<ProtectedPage><ReportsPage /></ProtectedPage>} />
        <Route path="/products" element={<ProtectedPage><ProductsPage /></ProtectedPage>} />
        <Route path="/categories" element={<ProtectedPage><CategoriesPage /></ProtectedPage>} />
        <Route path="/branches" element={<ProtectedPage><BranchesPage /></ProtectedPage>} />
        <Route path="/suppliers" element={<ProtectedPage><SuppliersPage /></ProtectedPage>} />
        <Route path="/inventory" element={<ProtectedPage><InventoryPage /></ProtectedPage>} />
        <Route path="/tpv" element={<ProtectedPage><RestaurantTPVPage /></ProtectedPage>} />
        <Route path="/settings" element={<ProtectedPage><SettingsPage /></ProtectedPage>} />

        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </HashRouter>
  );
}

const AppWithProviders = () => (
  <LanguageProvider>
    <App />
  </LanguageProvider>
);

export default AppWithProviders;
