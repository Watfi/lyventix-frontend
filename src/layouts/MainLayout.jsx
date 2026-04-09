import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  Package,
  Tag,
  Building2,
  Truck,
  Warehouse,
  UtensilsCrossed,
  Menu,
  X
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import lyventixIcon from '../assets/iconlyventix.png';
import { useLanguage } from '../i18n/LanguageContext';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1').replace('/api/v1', '');
const getLogoUrl = (logoUrl) => {
  if (!logoUrl) return null;
  if (logoUrl.startsWith('http')) return logoUrl;
  return API_BASE + logoUrl;
};

const NavItem = ({ to, icon: Icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => `
      flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group
      ${isActive
        ? 'bg-primary-500/10 dark:bg-primary-600/20 text-primary-700 dark:text-primary-400 border border-primary-500/20 shadow-lg shadow-primary-900/5'
        : 'text-slate-700 dark:text-slate-400 hover:bg-white dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200'}
    `}
  >
    <div className="flex items-center gap-3">
      <Icon size={20} className="group-hover:scale-110 transition-transform duration-200" />
      <span className="font-medium text-sm">{label}</span>
    </div>
    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
  </NavLink>
);

const SectionLabel = ({ label }) => (
  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-600 px-4 pt-6 pb-2">{label}</p>
);

const MainLayout = ({ children }) => {
  const { user, logout } = useAuthStore();
  const customLogoUrl = user?.logoUrl ? getLogoUrl(user.logoUrl) : null;
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { lang, setLanguage, t } = useLanguage();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen text-slate-900 dark:text-slate-200 transition-colors duration-300">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar - Glassmorphism */}
      <aside className={`
        w-72 border-r border-primary-200/30 dark:border-white/5 bg-white/60 dark:bg-slate-950/40 backdrop-blur-2xl p-6 flex flex-col fixed h-full z-40 overflow-y-auto shadow-[4px_0_24px_-12px_rgba(var(--primary-900),0.1)]
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        {/* Mobile close button */}
        <button
          onClick={closeSidebar}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors md:hidden"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-14 h-14 bg-primary-600 rounded-[1.15rem] flex items-center justify-center shadow-lg shadow-primary-600/30 overflow-hidden shrink-0">
            {customLogoUrl ? (
              <img src={customLogoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <img src={lyventixIcon} alt="Lyventix Logo" className="w-[140%] h-[140%] max-w-none object-contain text-white drop-shadow-sm" style={{ filter: 'brightness(0) invert(1)' }} />
            )}
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Lyventix</span>
        </div>

        <nav className="flex-1 space-y-1">
          <SectionLabel label={t('nav_principal')} />
          <NavItem to="/dashboard" icon={LayoutDashboard} label={t('nav_dashboard')} onClick={closeSidebar} />
          {['RESTAURANT', 'BAR', 'BAKERY', 'COFFEE'].includes(user?.businessType) ? (
            <NavItem to="/tpv" icon={UtensilsCrossed} label={t('nav_tpv')} onClick={closeSidebar} />
          ) : (
            <NavItem to="/pos" icon={ShoppingCart} label={t('nav_pos')} onClick={closeSidebar} />
          )}

          <SectionLabel label={t('nav_catalogo')} />
          <NavItem to="/products" icon={Package} label={t('nav_products')} onClick={closeSidebar} />
          <NavItem to="/categories" icon={Tag} label={t('nav_categories')} onClick={closeSidebar} />
          <NavItem to="/inventory" icon={Warehouse} label={t('nav_inventory')} onClick={closeSidebar} />

          <SectionLabel label={t('nav_negocio')} />
          <NavItem to="/customers" icon={Users} label={t('nav_customers')} onClick={closeSidebar} />
          <NavItem to="/suppliers" icon={Truck} label={t('nav_suppliers')} onClick={closeSidebar} />
          <NavItem to="/branches" icon={Building2} label={t('nav_branches')} onClick={closeSidebar} />

          <SectionLabel label={t('nav_finanzas')} />
          <NavItem to="/cash" icon={Wallet} label={t('nav_cash')} onClick={closeSidebar} />
          <NavItem to="/reports" icon={BarChart3} label={t('nav_reports')} onClick={closeSidebar} />

          <SectionLabel label={t('nav_sistema')} />
          <NavItem to="/settings" icon={Settings} label={t('nav_settings')} onClick={closeSidebar} />
        </nav>

        <div className="pt-4 border-t border-slate-200/50 dark:border-white/5 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium text-sm">{t('nav_logout')}</span>
          </button>
        </div>

        <div className="mt-4 p-4 rounded-2xl bg-slate-900/5 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold">
            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user?.username || 'Usuario'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.businessName || user?.roles?.[0] || 'Administrador'}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 flex flex-col min-h-screen">
        <header className="h-14 sm:h-16 md:h-20 border-b border-primary-200/30 dark:border-white/5 px-2 sm:px-4 md:px-8 flex items-center justify-between bg-white/60 dark:bg-slate-950/40 backdrop-blur-2xl sticky top-0 z-10 shadow-sm shadow-primary-900/5 dark:shadow-none gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Hamburger menu - mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors md:hidden shrink-0"
            >
              <Menu size={22} />
            </button>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg md:text-xl font-semibold text-slate-800 dark:text-white truncate">{t('header_greeting')}, <span className="hidden sm:inline">{user?.username || 'Admin'}</span><span className="sm:hidden">{(user?.username || 'Admin').split(' ')[0]}</span> 👋</h2>
              {user?.branchName && (
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  <Building2 size={10} className="inline mr-1" /><span className="truncate">{user.branchName}</span>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 shrink-0">
            <button
              onClick={() => setLanguage(lang === 'es' ? 'en' : 'es')}
              className="h-8 sm:h-10 px-2 sm:px-3 rounded-lg sm:rounded-xl border border-slate-200 dark:border-white/10 flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/5 transition-all shadow-sm text-xs sm:text-sm font-bold"
              title={lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
            >
              <span>{lang === 'es' ? '🇪🇸' : '🇺🇸'}</span>
              <span className="hidden sm:inline">{lang === 'es' ? 'ES' : 'EN'}</span>
            </button>
            <div onClick={() => navigate('/settings')} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/5 transition-all cursor-pointer shadow-sm">
              <Settings size={18} className="sm:w-5 sm:h-5" />
            </div>
            <div onClick={handleLogout} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl border border-rose-100 dark:border-rose-900/30 flex items-center justify-center text-rose-500 dark:text-rose-400 hover:text-white hover:bg-rose-500 transition-all cursor-pointer shadow-sm">
              <LogOut size={18} className="sm:w-5 sm:h-5" />
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
