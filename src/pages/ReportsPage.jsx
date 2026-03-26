import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, Calendar, Download, Loader2, AlertCircle,
  Package, Users, Wallet, FileText, CheckCircle2, Filter
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Area, AreaChart, BarChart, Bar
} from 'recharts';
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

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

const parseDate = (val) => {
  if (!val) return null;
  if (Array.isArray(val)) return new Date(val[0], (val[1] || 1) - 1, val[2] || 1, val[3] || 0, val[4] || 0, val[5] || 0);
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

const fmt = (val) => {
  if (val == null) return '$0';
  return '$' + Number(val).toLocaleString('es-CO', { minimumFractionDigits: 0 });
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-lg text-sm">
        <p className="font-bold text-slate-800 dark:text-white">{label || payload[0]?.name}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-medium">
            {p.name}: {typeof p.value === 'number' && p.value > 100 ? fmt(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ReportsPage = () => {
  const { businessId, user } = useAuthStore();
  const [dashboard, setDashboard] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState({});
  const [activeTab, setActiveTab] = useState('ventas');

  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo);
  const [dateTo, setDateTo] = useState(today);

  useEffect(() => {
    const fetchData = async () => {
      if (!businessId) return;
      try {
        setLoading(true);
        const [dashRes, salesRes] = await Promise.all([
          dashboardService.getDashboard(businessId),
          saleService.getSales(businessId, { size: 1000, sort: 'createdAt,desc' }),
        ]);
        setDashboard(dashRes.data);
        setSales(salesRes.data?.content || salesRes.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Error al cargar reportes');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [businessId]);

  const filteredSales = useMemo(() => {
    const from = new Date(dateFrom + 'T00:00:00');
    const to = new Date(dateTo + 'T23:59:59');
    return sales.filter(s => {
      const d = parseDate(s.createdAt);
      return d && d >= from && d <= to;
    });
  }, [sales, dateFrom, dateTo]);

  const paymentMethodData = useMemo(() => {
    const counts = {};
    filteredSales.forEach(s => {
      const method = s.paymentMethod === 'CASH' ? 'Efectivo' : s.paymentMethod === 'CARD' ? 'Tarjeta' : s.paymentMethod === 'TRANSFER' ? 'Transferencia' : s.paymentMethod || 'Otro';
      counts[method] = (counts[method] || 0) + Number(s.total || 0);
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [filteredSales]);

  const dailySalesData = useMemo(() => {
    const byDay = {};
    filteredSales.forEach(s => {
      const d = parseDate(s.createdAt);
      if (!d) return;
      const key = d.toISOString().slice(0, 10);
      if (!byDay[key]) byDay[key] = { date: key, total: 0, count: 0 };
      byDay[key].total += Number(s.total || 0);
      byDay[key].count += 1;
    });
    return Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)).map(d => ({
      ...d,
      label: new Date(d.date + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
      total: Math.round(d.total),
    }));
  }, [filteredSales]);

  const topProductsData = useMemo(() => {
    return (dashboard?.topProducts || []).slice(0, 8).map(p => ({
      name: p.productName?.length > 15 ? p.productName.substring(0, 15) + '...' : p.productName,
      cantidad: p.quantitySold,
      ingresos: Math.round(p.totalRevenue || 0),
    }));
  }, [dashboard]);

  const statusData = useMemo(() => {
    const counts = {};
    filteredSales.forEach(s => {
      const status = s.status === 'COMPLETED' ? 'Completada' : s.status === 'CANCELLED' ? 'Cancelada' : 'Pendiente';
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredSales]);

  const totalFiltered = filteredSales.reduce((s, v) => s + Number(v.total || 0), 0);
  const avgTicket = filteredSales.length > 0 ? totalFiltered / filteredSales.length : 0;

  const markExported = (key) => {
    setExporting(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setExporting(prev => ({ ...prev, [key]: false })), 2000);
  };

  const handleExportSales = () => { generateSalesReport(filteredSales, { ...dashboard, totalSales: totalFiltered, salesCount: filteredSales.length, averageTicket: avgTicket }, user?.businessName); markExported('sales'); };
  const handleExportTopProducts = () => { generateTopProductsReport(dashboard?.topProducts || [], user?.businessName); markExported('top'); };
  const handleExportDailySales = () => { generateDailySalesReport(dailySalesData.map(d => ({ date: d.label, count: d.count, totalAmount: d.total })), dashboard, user?.businessName); markExported('daily'); };
  const handleExportInventory = async () => {
    try {
      let bid = user?.branchId;
      let branchName = user?.branchName || 'Principal';
      if (!bid) { const br = await branchService.getBranches(businessId); const branches = br.data?.content || br.data || []; if (branches.length > 0) { bid = branches[0].id; branchName = branches[0].name; } }
      if (!bid) { alert('No se encontraron sucursales'); return; }
      const res = await inventoryService.getStock(bid, { size: 1000 });
      generateInventoryReport(res.data?.content || res.data || [], branchName, user?.businessName);
      markExported('inventory');
    } catch { alert('Error al generar reporte'); }
  };
  const handleExportCustomers = async () => {
    try {
      const res = await customerService.getCustomers(businessId, { size: 1000 });
      generateCustomersReport(res.data?.content || res.data || [], user?.businessName);
      markExported('customers');
    } catch { alert('Error al generar reporte'); }
  };
  const handleExportCash = async () => {
    try {
      let bid = user?.branchId;
      if (!bid) { const br = await branchService.getBranches(businessId); const branches = br.data?.content || br.data || []; if (branches.length > 0) bid = branches[0].id; }
      const res = await cashService.getSessionHistory(bid);
      generateCashReport(res.data || [], user?.businessName);
      markExported('cash');
    } catch { alert('Error al generar reporte'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary-400" size={48} /></div>;
  if (error) return <div className="glass-panel p-8 rounded-3xl text-center"><AlertCircle className="mx-auto text-red-400 mb-4" size={48} /><p className="text-red-400">{error}</p></div>;

  const tabs = [
    { id: 'ventas', label: 'Ventas', icon: BarChart3 },
    { id: 'productos', label: 'Productos', icon: Package },
    { id: 'inventario', label: 'Inventario', icon: Package },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'caja', label: 'Caja', icon: Wallet },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Reportes y Estadisticas</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Visualiza, filtra y exporta reportes de tu negocio</p>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Filter size={16} className="text-primary-500" />
          <span className="text-sm font-semibold">Rango:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-800 dark:text-white" />
          <span className="text-slate-400 text-sm">a</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-800 dark:text-white" />
        </div>
        <div className="flex items-center gap-2 sm:ml-auto text-sm text-slate-500">
          <span className="font-medium">{filteredSales.length} ventas</span>
          <span>|</span>
          <span className="font-bold text-primary-500">{fmt(totalFiltered)}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Ventas Periodo', value: fmt(totalFiltered), sub: `${filteredSales.length} ventas`, icon: BarChart3, color: 'text-primary-400', bg: 'bg-primary-500/10' },
          { label: 'Ticket Promedio', value: fmt(avgTicket), sub: 'por venta', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'Productos', value: String(dashboard?.productsCount || 0), sub: 'en catalogo', icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Stock Bajo', value: String(dashboard?.lowStockProductsCount || 0), sub: 'alertas', icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-500/10' },
        ].map((card, i) => (
          <motion.div key={i} whileHover={{ y: -2 }} className="glass-panel p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${card.bg}`}><card.icon size={16} className={card.color} /></div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{card.label}</span>
            </div>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{card.value}</p>
            <p className="text-xs text-emerald-500 font-semibold mt-1">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5'}`}>
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* === VENTAS TAB === */}
      {activeTab === 'ventas' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-3xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><TrendingUp size={18} className="text-primary-500" /> Tendencia de Ventas</h3>
                <button onClick={handleExportDailySales} className="text-xs text-primary-500 hover:text-primary-400 flex items-center gap-1">{exporting.daily ? <CheckCircle2 size={12} /> : <Download size={12} />} PDF</button>
              </div>
              {dailySalesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={dailySalesData}>
                    <defs><linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="total" name="Total" stroke="#6366f1" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <p className="text-slate-500 text-center py-16 text-sm">No hay datos en este rango</p>}
            </div>

            <div className="glass-panel p-6 rounded-3xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Wallet size={18} className="text-purple-500" /> Por Metodo de Pago</h3>
                <button onClick={handleExportSales} className="text-xs text-primary-500 hover:text-primary-400 flex items-center gap-1">{exporting.sales ? <CheckCircle2 size={12} /> : <Download size={12} />} PDF</button>
              </div>
              {paymentMethodData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={paymentMethodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {paymentMethodData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-slate-500 text-center py-16 text-sm">No hay datos</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-3xl">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><FileText size={18} className="text-emerald-500" /> Por Estado</h3>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={40} paddingAngle={3} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                      {statusData.map((_, i) => <Cell key={i} fill={['#10b981', '#ef4444', '#f59e0b'][i] || COLORS[i]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-slate-500 text-center py-16 text-sm">No hay datos</p>}
            </div>

            <div className="glass-panel p-6 rounded-3xl">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Calendar size={18} className="text-blue-500" /> Ventas por Dia</h3>
              {dailySalesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dailySalesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Ventas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-slate-500 text-center py-16 text-sm">No hay datos</p>}
            </div>
          </div>

          {/* Sales Table */}
          <div className="glass-panel rounded-3xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 dark:text-white text-sm">Ventas del Periodo</h4>
              <button onClick={handleExportSales} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500/10 text-primary-500 text-xs font-medium hover:bg-primary-500/20">
                <Download size={12} /> Exportar PDF
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-200 dark:border-white/5">
                  <th className="text-left p-3 text-slate-500 font-medium text-xs">Factura</th>
                  <th className="text-left p-3 text-slate-500 font-medium text-xs">Fecha</th>
                  <th className="text-left p-3 text-slate-500 font-medium text-xs">Cliente</th>
                  <th className="text-left p-3 text-slate-500 font-medium text-xs">Metodo</th>
                  <th className="text-right p-3 text-slate-500 font-medium text-xs">Total</th>
                </tr></thead>
                <tbody>
                  {filteredSales.slice(0, 20).map(s => {
                    const d = parseDate(s.createdAt);
                    return (
                      <tr key={s.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                        <td className="p-3 text-xs font-mono text-slate-700 dark:text-slate-300">{s.invoiceNumber || '-'}</td>
                        <td className="p-3 text-xs text-slate-600 dark:text-slate-400">{d ? d.toLocaleDateString('es-CO') : '-'}</td>
                        <td className="p-3 text-xs text-slate-700 dark:text-slate-300">{s.customerName || 'Sin cliente'}</td>
                        <td className="p-3 text-xs">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.paymentMethod === 'CASH' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : s.paymentMethod === 'CARD' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'}`}>
                            {s.paymentMethod === 'CASH' ? 'Efectivo' : s.paymentMethod === 'CARD' ? 'Tarjeta' : s.paymentMethod || '-'}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-right font-bold text-slate-800 dark:text-white">{fmt(s.total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredSales.length === 0 && <p className="text-slate-500 text-center py-8 text-sm">No hay ventas en este rango</p>}
              {filteredSales.length > 20 && <p className="text-slate-400 text-center py-3 text-xs">Mostrando 20 de {filteredSales.length} ventas. Exporta el PDF para ver todas.</p>}
            </div>
          </div>
        </div>
      )}

      {/* === PRODUCTOS TAB === */}
      {activeTab === 'productos' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-3xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 dark:text-white">Top Productos (Cantidad)</h3>
                <button onClick={handleExportTopProducts} className="text-xs text-primary-500 hover:text-primary-400 flex items-center gap-1">{exporting.top ? <CheckCircle2 size={12} /> : <Download size={12} />} PDF</button>
              </div>
              {topProductsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProductsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="#94a3b8" width={120} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="cantidad" name="Cantidad" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-slate-500 text-center py-16 text-sm">No hay datos</p>}
            </div>

            <div className="glass-panel p-6 rounded-3xl">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4">Ingresos por Producto</h3>
              {topProductsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={topProductsData} dataKey="ingresos" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={45} paddingAngle={2} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {topProductsData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-slate-500 text-center py-16 text-sm">No hay datos</p>}
            </div>
          </div>

          <div className="glass-panel rounded-3xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-white/5"><h4 className="font-bold text-slate-800 dark:text-white text-sm">Ranking Completo</h4></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-200 dark:border-white/5">
                  <th className="text-left p-3 text-slate-500 font-medium text-xs">#</th>
                  <th className="text-left p-3 text-slate-500 font-medium text-xs">Producto</th>
                  <th className="text-center p-3 text-slate-500 font-medium text-xs">Cantidad</th>
                  <th className="text-right p-3 text-slate-500 font-medium text-xs">Ingresos</th>
                  <th className="p-3 text-slate-500 font-medium text-xs w-32">Barra</th>
                </tr></thead>
                <tbody>
                  {(dashboard?.topProducts || []).map((p, i) => {
                    const maxQty = dashboard?.topProducts?.[0]?.quantitySold || 1;
                    return (
                      <tr key={i} className="border-b border-slate-100 dark:border-white/5">
                        <td className="p-3 text-xs font-bold text-slate-400">{i + 1}</td>
                        <td className="p-3 text-xs font-medium text-slate-800 dark:text-white">{p.productName}</td>
                        <td className="p-3 text-xs text-center text-slate-600 dark:text-slate-300">{p.quantitySold} uds</td>
                        <td className="p-3 text-xs text-right font-bold text-slate-800 dark:text-white">{fmt(p.totalRevenue)}</td>
                        <td className="p-3"><div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(p.quantitySold / maxQty) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }} /></div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* === INVENTARIO TAB === */}
      {activeTab === 'inventario' && (
        <div className="glass-panel p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Reporte de Inventario</h3>
            <button onClick={handleExportInventory} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-500/10 text-primary-500 text-sm font-medium hover:bg-primary-500/20">
              {exporting.inventory ? <CheckCircle2 size={14} /> : <Download size={14} />} Exportar PDF
            </button>
          </div>
          <p className="text-slate-500 text-sm">Estado actual del inventario con cantidades, precios, valor total y alertas de stock bajo.</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 text-center">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Productos</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{dashboard?.productsCount || 0}</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-4 text-center">
              <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Stock Bajo</p>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{dashboard?.lowStockProductsCount || 0}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 text-center">
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Categorias</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{dashboard?.categoriesCount || '-'}</p>
            </div>
          </div>
        </div>
      )}

      {/* === CLIENTES TAB === */}
      {activeTab === 'clientes' && (
        <div className="glass-panel p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Reporte de Clientes</h3>
            <button onClick={handleExportCustomers} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-500/10 text-primary-500 text-sm font-medium hover:bg-primary-500/20">
              {exporting.customers ? <CheckCircle2 size={14} /> : <Download size={14} />} Exportar PDF
            </button>
          </div>
          <p className="text-slate-500 text-sm">Directorio completo de clientes con datos de contacto y documentos.</p>
          <div className="mt-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 text-center">
            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Clientes Registrados</p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{dashboard?.customersCount || 0}</p>
          </div>
        </div>
      )}

      {/* === CAJA TAB === */}
      {activeTab === 'caja' && (
        <div className="glass-panel p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Reporte de Sesiones de Caja</h3>
            <button onClick={handleExportCash} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-500/10 text-primary-500 text-sm font-medium hover:bg-primary-500/20">
              {exporting.cash ? <CheckCircle2 size={14} /> : <Download size={14} />} Exportar PDF
            </button>
          </div>
          <p className="text-slate-500 text-sm">Historial de aperturas y cierres de caja con saldos, ganancias y diferencias.</p>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
