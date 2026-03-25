import React from 'react';
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
  UtensilsCrossed
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import lyventixIcon from '../assets/iconlyventix.png';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1').replace('/api/v1', '');
const getLogoUrl = (logoUrl) => {
  if (!logoUrl) return null;
  if (logoUrl.startsWith('http')) return logoUrl;
  return API_BASE + logoUrl;
};

const NavItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen text-slate-900 dark:text-slate-200 transition-colors duration-300">
      {/* Sidebar - Glassmorphism */}
      <aside className="w-72 border-r border-primary-200/30 dark:border-white/5 bg-white/60 dark:bg-slate-950/40 backdrop-blur-2xl p-6 flex flex-col fixed h-full z-20 overflow-y-auto shadow-[4px_0_24px_-12px_rgba(var(--primary-900),0.1)]">
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
          <SectionLabel label="Principal" />
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          {['RESTAURANT', 'BAR', 'BAKERY', 'COFFEE'].includes(user?.businessType) ? (
            <NavItem to="/tpv" icon={UtensilsCrossed} label="TPV Restaurante" />
          ) : (
            <NavItem to="/pos" icon={ShoppingCart} label="Ventas (POS)" />
          )}

          <SectionLabel label="Catálogo" />
          <NavItem to="/products" icon={Package} label="Productos" />
          <NavItem to="/categories" icon={Tag} label="Categorías" />
          <NavItem to="/inventory" icon={Warehouse} label="Inventario" />

          <SectionLabel label="Negocio" />
          <NavItem to="/customers" icon={Users} label="Clientes" />
          <NavItem to="/suppliers" icon={Truck} label="Proveedores" />
          <NavItem to="/branches" icon={Building2} label="Sucursales" />

          <SectionLabel label="Finanzas" />
          <NavItem to="/cash" icon={Wallet} label="Caja" />
          <NavItem to="/reports" icon={BarChart3} label="Reportes" />

          <SectionLabel label="Sistema" />
          <NavItem to="/settings" icon={Settings} label="Configuración" />
        </nav>

        <div className="pt-4 border-t border-slate-200/50 dark:border-white/5 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium text-sm">Cerrar Sesión</span>
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
      <main className="flex-1 ml-72 flex flex-col min-h-screen">
        <header className="h-20 border-b border-primary-200/30 dark:border-white/5 px-8 flex items-center justify-between bg-white/60 dark:bg-slate-950/40 backdrop-blur-2xl sticky top-0 z-10 shadow-sm shadow-primary-900/5 dark:shadow-none">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Buen día, {user?.username || 'Admin'} 👋</h2>
            {user?.branchName && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <Building2 size={10} className="inline mr-1" />{user.branchName}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div onClick={() => navigate('/settings')} className="w-10 h-10 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/5 transition-all cursor-pointer shadow-sm">
              <Settings size={20} />
            </div>
            <div onClick={handleLogout} className="w-10 h-10 rounded-xl border border-rose-100 dark:border-rose-900/30 flex items-center justify-center text-rose-500 dark:text-rose-400 hover:text-white hover:bg-rose-500 transition-all cursor-pointer shadow-sm">
              <LogOut size={20} />
            </div>
          </div>
        </header>

        <div className="p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
