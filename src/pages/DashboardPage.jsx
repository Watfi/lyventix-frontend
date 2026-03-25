import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Package,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import dashboardService from '../services/dashboardService';

const StatCard = ({ label, value, icon: Icon, trend, trendValue, color }) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="p-6 rounded-3xl glass-card flex flex-col gap-4"
  >
    <div className="flex items-center justify-between">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-opacity-100 shadow-sm`}>
        <Icon size={24} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${trend === 'up' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trendValue}
        </div>
      )}
    </div>
    <div>
      <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">{label}</p>
      <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{value}</h3>
    </div>
  </motion.div>
);

const DashboardPage = () => {
  const { businessId } = useAuthStore();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!businessId) return;
      try {
        setLoading(true);
        const response = await dashboardService.getDashboard(businessId);
        setDashboard(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Error al cargar el dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [businessId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary-400" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-8 rounded-3xl text-center">
        <AlertCircle className="mx-auto text-red-400 mb-4" size={48} />
        <p className="text-red-400 font-medium">{error}</p>
      </div>
    );
  }

  const fmt = (val) => {
    if (val == null) return '$0';
    return '$' + Number(val).toLocaleString('es-CO', { minimumFractionDigits: 0 });
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Ventas Totales"
          value={fmt(dashboard?.totalSales)}
          icon={TrendingUp}
          trend="up"
          trendValue={`${dashboard?.salesCount || 0} ventas`}
          color="text-primary-400 bg-primary-500"
        />
        <StatCard
          label="Ticket Promedio"
          value={fmt(dashboard?.averageTicket)}
          icon={Users}
          color="text-purple-400 bg-purple-500"
        />
        <StatCard
          label="Productos"
          value={dashboard?.productsCount || 0}
          icon={Package}
          color="text-blue-400 bg-blue-500"
        />
        <StatCard
          label="Stock Bajo"
          value={dashboard?.lowStockProductsCount || 0}
          icon={AlertCircle}
          trend={dashboard?.lowStockProductsCount > 0 ? 'down' : undefined}
          trendValue="Alertas"
          color="text-orange-400 bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <div className="lg:col-span-2 p-8 rounded-3xl glass-card min-h-[400px]">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-8">Productos Más Vendidos</h3>
          <div className="space-y-6">
            {(dashboard?.topProducts || []).map((p, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-800 dark:text-white font-medium">{p.productName}</span>
                  <span className="text-slate-500">
                    {p.quantitySold} uds • {fmt(p.totalRevenue)}
                  </span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${dashboard?.topProducts?.length > 0
                        ? (p.quantitySold / dashboard.topProducts[0].totalQuantity) * 100
                        : 0}%`
                    }}
                    transition={{ duration: 1, delay: i * 0.2 }}
                    className="h-full bg-primary-600"
                  />
                </div>
              </div>
            ))}
            {(!dashboard?.topProducts || dashboard.topProducts.length === 0) && (
              <p className="text-slate-500 dark:text-slate-500 text-center py-8">No hay datos de productos aún</p>
            )}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="p-8 rounded-3xl glass-card">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Ventas Recientes</h3>
          <div className="space-y-6">
            {(dashboard?.recentSales || []).map((sale, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 shrink-0 shadow-lg shadow-primary-500/50" />
                <div>
                  <p className="text-slate-800 dark:text-white text-sm font-medium">{sale.date}</p>
                  <p className="text-slate-500 text-xs mt-1">
                    {sale.count} ventas • {fmt(sale.totalAmount)}
                  </p>
                </div>
              </div>
            ))}
            {(!dashboard?.recentSales || dashboard.recentSales.length === 0) && (
              <p className="text-slate-500 text-center py-4">No hay ventas recientes</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
