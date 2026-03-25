import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, PieChart as PieChartIcon, TrendingUp, ArrowUpRight, Calendar,
  Download, Loader2, AlertCircle, Package, Users, Wallet, FileText, CheckCircle2
} from 'lucide-react';
import Button from '../components/Button';
import useAuthStore from '../store/authStore';
import dashboardService from '../services/dashboardService';
import saleService from '../services/saleService';
import inventoryService from '../services/inventoryService';
import customerService from '../services/customerService';
import cashService from '../services/cashService';
import branchService from '../services/branchService';
import {
  generateSalesReport,
  generateTopProductsReport,
  generateDailySalesReport,
  generateInventoryReport,
  generateCustomersReport,
  generateCashReport,
} from '../utils/pdfGenerator';

const ReportCard = ({ icon: Icon, title, description, color, colorBg, onExport, exporting }) => (
  <motion.div whileHover={{ y: -2 }} className="glass-panel p-6 rounded-3xl flex flex-col gap-4">
    <div className="flex items-start justify-between">
      <div className={`p-3 rounded-2xl ${colorBg}`}>
        <Icon size={22} className={color} />
      </div>
      <button
        onClick={onExport}
        disabled={exporting}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
          exporting
            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
            : 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40'
        }`}
      >
        {exporting ? <CheckCircle2 size={14} /> : <Download size={14} />}
        {exporting ? 'Descargado' : 'Exportar PDF'}
      </button>
    </div>
    <div>
      <h3 className="font-bold text-slate-800 dark:text-white text-lg">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
    </div>
  </motion.div>
);

const ReportsPage = () => {
  const { businessId, user } = useAuthStore();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      if (!businessId) return;
      try {
        setLoading(true);
        const response = await dashboardService.getDashboard(businessId);
        setDashboard(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Error al cargar reportes');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [businessId]);

  const markExported = (key) => {
    setExporting(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setExporting(prev => ({ ...prev, [key]: false })), 2000);
  };

  const handleExportSales = async () => {
    try {
      const res = await saleService.getSales(businessId, { size: 500, sort: 'createdAt,desc' });
      const sales = res.data?.content || res.data || [];
      generateSalesReport(sales, dashboard, user?.businessName);
      markExported('sales');
    } catch (e) { alert('Error al generar reporte de ventas'); }
  };

  const handleExportTopProducts = () => {
    generateTopProductsReport(dashboard?.topProducts || [], user?.businessName);
    markExported('top');
  };

  const handleExportDailySales = () => {
    generateDailySalesReport(dashboard?.recentSales || [], dashboard, user?.businessName);
    markExported('daily');
  };

  const handleExportInventory = async () => {
    try {
      const branchId = user?.branchId;
      let bid = branchId;
      let branchName = user?.branchName || 'Principal';
      if (!bid) {
        const brRes = await branchService.getBranches(businessId);
        const branches = brRes.data?.content || brRes.data || [];
        if (branches.length > 0) { bid = branches[0].id; branchName = branches[0].name; }
      }
      if (!bid) { alert('No se encontraron sucursales'); return; }
      const res = await inventoryService.getStock(bid, { size: 1000 });
      const stock = res.data?.content || res.data || [];
      generateInventoryReport(stock, branchName, user?.businessName);
      markExported('inventory');
    } catch (e) { alert('Error al generar reporte de inventario'); }
  };

  const handleExportCustomers = async () => {
    try {
      const res = await customerService.getCustomers(businessId, { size: 1000 });
      const customers = res.data?.content || res.data || [];
      generateCustomersReport(customers, user?.businessName);
      markExported('customers');
    } catch (e) { alert('Error al generar reporte de clientes'); }
  };

  const handleExportCash = async () => {
    try {
      const branchId = user?.branchId;
      let bid = branchId;
      if (!bid) {
        const brRes = await branchService.getBranches(businessId);
        const branches = brRes.data?.content || brRes.data || [];
        if (branches.length > 0) bid = branches[0].id;
      }
      const res = await cashService.getSessionHistory(bid);
      const sessions = res.data || [];
      generateCashReport(sessions, user?.businessName);
      markExported('cash');
    } catch (e) { alert('Error al generar reporte de caja'); }
  };

  const fmt = (val) => {
    if (val == null) return '$0';
    return '$' + Number(val).toLocaleString('es-CO', { minimumFractionDigits: 0 });
  };

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Reportes y Estadisticas</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Genera y exporta reportes detallados de tu negocio en PDF</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          { label: 'Ventas Totales', value: fmt(dashboard?.totalSales), sub: `${dashboard?.salesCount || 0} ventas`, icon: BarChart3, color: 'text-primary-400', bg: 'bg-primary-500/10' },
          { label: 'Ticket Promedio', value: fmt(dashboard?.averageTicket), sub: 'por venta', icon: PieChartIcon, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'Productos', value: String(dashboard?.productsCount || 0), sub: 'en catalogo', icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Stock Bajo', value: String(dashboard?.lowStockProductsCount || 0), sub: 'alertas', icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-500/10' },
        ].map((card, i) => (
          <motion.div key={i} whileHover={{ y: -3 }} className="glass-panel p-5 rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-xl ${card.bg}`}><card.icon size={18} className={card.color} /></div>
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{card.label}</span>
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{card.value}</p>
            <p className="text-xs text-emerald-500 font-semibold mt-1 flex items-center gap-1"><ArrowUpRight size={12} /> {card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Report Cards Grid */}
      <div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <FileText size={20} className="text-primary-500" /> Reportes Disponibles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <ReportCard
            icon={BarChart3}
            title="Reporte de Ventas"
            description="Listado completo de todas las ventas con factura, cliente, metodo de pago y totales."
            color="text-primary-500"
            colorBg="bg-primary-100 dark:bg-primary-900/30"
            onExport={handleExportSales}
            exporting={exporting.sales}
          />
          <ReportCard
            icon={TrendingUp}
            title="Productos Mas Vendidos"
            description="Ranking de productos por cantidad vendida con grafico de barras e ingresos generados."
            color="text-purple-500"
            colorBg="bg-purple-100 dark:bg-purple-900/30"
            onExport={handleExportTopProducts}
            exporting={exporting.top}
          />
          <ReportCard
            icon={Calendar}
            title="Ventas Diarias"
            description="Tendencia de ventas por dia con totales, transacciones y porcentaje de participacion."
            color="text-blue-500"
            colorBg="bg-blue-100 dark:bg-blue-900/30"
            onExport={handleExportDailySales}
            exporting={exporting.daily}
          />
          <ReportCard
            icon={Package}
            title="Inventario / Stock"
            description="Estado actual del inventario con cantidades, precios, valor total y alertas de stock bajo."
            color="text-emerald-500"
            colorBg="bg-emerald-100 dark:bg-emerald-900/30"
            onExport={handleExportInventory}
            exporting={exporting.inventory}
          />
          <ReportCard
            icon={Users}
            title="Clientes"
            description="Directorio completo de clientes registrados con datos de contacto y documentos."
            color="text-orange-500"
            colorBg="bg-orange-100 dark:bg-orange-900/30"
            onExport={handleExportCustomers}
            exporting={exporting.customers}
          />
          <ReportCard
            icon={Wallet}
            title="Sesiones de Caja"
            description="Historial de aperturas y cierres de caja con saldos, ganancias y diferencias."
            color="text-rose-500"
            colorBg="bg-rose-100 dark:bg-rose-900/30"
            onExport={handleExportCash}
            exporting={exporting.cash}
          />
        </div>
      </div>

      {/* Quick Data Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products Preview */}
        <div className="glass-panel p-8 rounded-3xl">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Top Productos</h3>
          <div className="space-y-5">
            {(dashboard?.topProducts || []).slice(0, 5).map((p, i) => {
              const maxQty = dashboard?.topProducts?.[0]?.quantitySold || 1;
              const colors = ['bg-primary-600', 'bg-blue-600', 'bg-purple-600', 'bg-orange-600', 'bg-emerald-600'];
              return (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-800 dark:text-white font-medium">{p.productName}</span>
                    <span className="text-slate-500">{p.quantitySold} uds &middot; {fmt(p.totalRevenue)}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(p.quantitySold / maxQty) * 100}%` }}
                      transition={{ duration: 1, delay: i * 0.15 }}
                      className={`h-full rounded-full ${colors[i % colors.length]}`}
                    />
                  </div>
                </div>
              );
            })}
            {(!dashboard?.topProducts || dashboard.topProducts.length === 0) && (
              <p className="text-slate-500 text-center py-6 text-sm">No hay datos aun</p>
            )}
          </div>
        </div>

        {/* Daily Sales Preview */}
        <div className="glass-panel p-8 rounded-3xl">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Ventas por Dia</h3>
          <div className="space-y-3">
            {(dashboard?.recentSales || []).slice(0, 7).map((day, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400"><Calendar size={14} /></div>
                  <div>
                    <p className="text-slate-800 dark:text-white font-medium text-sm">{day.date}</p>
                    <p className="text-slate-500 text-xs">{day.count} ventas</p>
                  </div>
                </div>
                <span className="text-slate-800 dark:text-white font-bold text-sm">{fmt(day.totalAmount)}</span>
              </div>
            ))}
            {(!dashboard?.recentSales || dashboard.recentSales.length === 0) && (
              <p className="text-slate-500 text-center py-6 text-sm">No hay datos aun</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
