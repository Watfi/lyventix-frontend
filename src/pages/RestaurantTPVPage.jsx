import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Minus, Trash2, Search, X, UtensilsCrossed, Users, Edit3, Check,
  ShoppingBag, CreditCard, Printer, XCircle, CheckCircle2, AlertTriangle,
  Bike, MapPin, Phone, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/authStore';
import usePOSStore from '../store/posStore';
import { useLanguage } from '../i18n/LanguageContext';
import tableService from '../services/tableService';
import Button from '../components/Button';
import Input from '../components/Input';
import ConfirmDialog from '../components/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';

const TABLE_STATUS_COLORS = {
  AVAILABLE: 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
  OCCUPIED: 'border-amber-500/50 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  RESERVED: 'border-violet-500/50 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400',
  OUT_OF_SERVICE: 'border-slate-500/50 bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-500',
};
const TABLE_STATUS_LABELS = {
  AVAILABLE: 'Disponible', OCCUPIED: 'Ocupada', RESERVED: 'Reservada', OUT_OF_SERVICE: 'Fuera de servicio',
};

// ── Print comanda ──
const printComanda = (tableName, cart, businessName) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-CO');
  const timeStr = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  const itemsHtml = cart.map(item => `
    <tr><td style="text-align:left;padding:2px 0;">${item.quantity}x ${item.customName || item.name}</td>
    <td style="text-align:right;padding:2px 0;white-space:nowrap;">$${(Number(item.salePrice) * item.quantity).toLocaleString()}</td></tr>
  `).join('');
  const html = `<!DOCTYPE html><html><head><title>Comanda</title>
    <style>@page{margin:0;size:80mm auto}body{font-family:'Courier New',monospace;font-size:12px;width:72mm;margin:4mm auto;color:#000}
    .header{text-align:center;border-bottom:1px dashed #000;padding-bottom:8px;margin-bottom:8px}.header h1{font-size:16px;margin:0}.header p{margin:2px 0;font-size:11px}
    .title{font-size:18px;font-weight:bold;text-align:center;margin:8px 0;text-transform:uppercase;letter-spacing:2px}table{width:100%;border-collapse:collapse}
    .separator{border-top:1px dashed #000;margin:8px 0}.footer{text-align:center;font-size:10px;margin-top:12px}@media print{body{margin:0;width:72mm}}</style>
    </head><body><div class="header"><h1>${businessName || 'Lyventix'}</h1><p>${dateStr} - ${timeStr}</p></div>
    <div class="title">COMANDA</div><p style="text-align:center;font-weight:bold;font-size:14px;margin:4px 0;">${tableName}</p>
    <div class="separator"></div><table>${itemsHtml}</table><div class="separator"></div>
    <div class="footer"><p>*** COMANDA PARA COCINA ***</p></div></body></html>`;
  const w = window.open('', '_blank', 'width=320,height=600');
  if (w) { w.document.write(html); w.document.close(); w.onload = () => { w.focus(); w.print(); w.onafterprint = () => w.close(); setTimeout(() => { try { w.close(); } catch(e){} }, 3000); }; }
};

const RestaurantTPVPage = () => {
  const { businessId, user } = useAuthStore();
  const { t } = useLanguage();
  const { confirm, dialogProps } = useConfirm();
  const {
    cart, products, tables, selectedTable, branchId, loading, error, tableOrders,
    initPOS, selectTable, searchProducts, addToCart, removeFromCart,
    updateQuantity, updateItemOverride, clearCart, clearTableOrder, getTotals, processSale, cancelSale
  } = usePOSStore();

  const [activeTab, setActiveTab] = useState('tables'); // 'tables' | 'delivery'
  const [showAddTable, setShowAddTable] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editValues, setEditValues] = useState({ name: '', price: '' });
  const [processingMessage, setProcessingMessage] = useState(null);
  const [localTables, setLocalTables] = useState([]);
  const [saleConfirmation, setSaleConfirmation] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Delivery orders (virtual tables stored locally)
  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [showAddDelivery, setShowAddDelivery] = useState(false);
  const [newDeliveryName, setNewDeliveryName] = useState('');
  const [deliveryCounter, setDeliveryCounter] = useState(1);

  // Delivery info modal (shown when cobrar on delivery)
  const [showDeliveryInfo, setShowDeliveryInfo] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState({ customerName: '', address: '', phone: '' });

  useEffect(() => {
    if (businessId) initPOS(businessId, user?.branchId);
  }, [businessId]);

  useEffect(() => { setLocalTables(tables); }, [tables]);

  const reloadTables = useCallback(async () => {
    if (!branchId) return;
    try {
      const res = await tableService.getTables(branchId);
      setLocalTables(res.data || []);
    } catch (e) { /* ignore */ }
  }, [branchId]);

  // ── Table handlers ──
  const handleAddTable = async () => {
    if (!newTableName.trim() || !branchId) return;
    try {
      await tableService.createTable(branchId, { name: newTableName, capacity: newTableCapacity });
      setNewTableName(''); setNewTableCapacity(4); setShowAddTable(false);
      reloadTables();
    } catch (e) { alert('Error al crear mesa'); }
  };

  const handleDeleteTable = async (tableId) => {
    const ok = await confirm({ title: '¿Eliminar?', message: '¿Eliminar esta mesa?' });
    if (!ok) return;
    try {
      await tableService.deleteTable(tableId);
      if (selectedTable?.id === tableId) { selectTable(null); clearCart(); }
      clearTableOrder(tableId);
      reloadTables();
    } catch (e) { alert('Error al eliminar mesa'); }
  };

  const handleSelectTable = (table) => {
    if (selectedTable?.id === table.id) {
      selectTable(null);
    } else {
      selectTable(table);
    }
    setSearchQuery('');
  };

  // ── Delivery handlers ──
  const handleAddDelivery = () => {
    const name = newDeliveryName.trim() || `Domicilio #${deliveryCounter}`;
    const id = `delivery-${Date.now()}`;
    setDeliveryOrders(prev => [...prev, {
      id, name, capacity: 1, status: 'AVAILABLE', isDelivery: true,
    }]);
    setDeliveryCounter(prev => prev + 1);
    setNewDeliveryName('');
    setShowAddDelivery(false);
  };

  const handleDeleteDelivery = async (deliveryId) => {
    const ok = await confirm({ title: '¿Eliminar?', message: '¿Eliminar este domicilio?' });
    if (!ok) return;
    if (selectedTable?.id === deliveryId) { selectTable(null); clearCart(); }
    clearTableOrder(deliveryId);
    setDeliveryOrders(prev => prev.filter(d => d.id !== deliveryId));
  };

  // ── Product add with auto-OCCUPIED ──
  const handleAddProduct = (product) => {
    addToCart(product);
    // Mark table as occupied if it's a real table and was available
    if (selectedTable && !selectedTable.isDelivery && selectedTable.status === 'AVAILABLE') {
      tableService.updateStatus(selectedTable.id, 'OCCUPIED').catch(() => {});
      // Update local state immediately
      setLocalTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, status: 'OCCUPIED' } : t));
      selectTable({ ...selectedTable, status: 'OCCUPIED' });
    }
    setSearchQuery('');
  };

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length >= 2 && businessId) searchProducts(q, businessId);
  };

  const handleStartEdit = (item) => {
    setEditingItem(item.id);
    setEditValues({ name: item.customName || item.name, price: String(item.salePrice) });
  };
  const handleSaveEdit = (itemId) => {
    updateItemOverride(itemId, { customName: editValues.name, customPrice: parseFloat(editValues.price) || 0 });
    setEditingItem(null);
  };

  const handleComanda = async () => {
    if (cart.length === 0) return;
    const label = selectedTable?.name || 'Llevar';
    printComanda(label, cart, user?.businessName);
    const result = await processSale(businessId, { status: 'PENDING' });
    if (result.success) {
      setProcessingMessage('Comanda enviada a cocina');
      reloadTables();
      setTimeout(() => setProcessingMessage(null), 2500);
    }
  };

  const handleCobrar = () => {
    if (cart.length === 0) return;
    if (selectedTable?.isDelivery) {
      // Show delivery info form before completing
      setDeliveryInfo({ customerName: '', address: '', phone: '' });
      setShowDeliveryInfo(true);
    } else {
      finalizeSale();
    }
  };

  const finalizeSale = async (extraNotes) => {
    const snap = [...cart];
    const tots = getTotals();
    const tableName = selectedTable?.isDelivery
      ? `${selectedTable.name}`
      : selectedTable?.name;
    const notes = extraNotes || null;
    const result = await processSale(businessId, { status: 'COMPLETED', notes });
    if (result.success) {
      setSaleConfirmation({ ...result.data, _cart: snap, _totals: tots, _table: tableName, _deliveryInfo: selectedTable?.isDelivery ? deliveryInfo : null });
      reloadTables();
      if (selectedTable?.isDelivery) {
        setDeliveryOrders(prev => prev.filter(d => d.id !== selectedTable.id));
      }
    }
  };

  const handleDeliveryConfirm = () => {
    const notes = `DOMICILIO | Cliente: ${deliveryInfo.customerName} | Dir: ${deliveryInfo.address} | Tel: ${deliveryInfo.phone}`;
    setShowDeliveryInfo(false);
    finalizeSale(notes);
  };

  const handleCancelSale = async () => {
    if (!selectedTable) return;
    const order = tableOrders[selectedTable.id];
    if (order?.saleId) {
      const result = await cancelSale(businessId, order.saleId, selectedTable.id);
      if (result.success) {
        setProcessingMessage('Venta cancelada');
        reloadTables();
        if (selectedTable.isDelivery) {
          setDeliveryOrders(prev => prev.filter(d => d.id !== selectedTable.id));
        }
        selectTable(null);
        setTimeout(() => setProcessingMessage(null), 2500);
      }
    } else {
      clearCart();
      clearTableOrder(selectedTable.id);
      if (selectedTable.isDelivery) {
        setDeliveryOrders(prev => prev.filter(d => d.id !== selectedTable.id));
      }
      selectTable(null);
    }
    setShowCancelConfirm(false);
  };

  const currentTableOrder = selectedTable ? tableOrders[selectedTable.id] : null;
  const hasPendingSale = !!currentTableOrder?.saleId;
  const { subtotal, tax, total } = getTotals();

  const getTableItemCount = (tableId) => {
    if (selectedTable?.id === tableId) return cart.length;
    return tableOrders[tableId]?.cart?.length || 0;
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 md:gap-6 h-[calc(100vh-5rem)] md:h-[calc(100vh-8rem)]">
      {/* ═══ Left Panel ═══ */}
      <div className={`${selectedTable ? 'hidden md:flex' : 'flex'} md:w-1/2 flex-col min-h-0`}>
        {/* Tabs */}
        <div className="flex items-center gap-1 p-0.5 sm:p-1 mb-2 sm:mb-4 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 w-fit">
          <button onClick={() => { setActiveTab('tables'); if (selectedTable?.isDelivery) selectTable(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all ${activeTab === 'tables' ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            <UtensilsCrossed size={14} className="sm:w-4 sm:h-4" /> Mesas
          </button>
          <button onClick={() => { setActiveTab('delivery'); if (selectedTable && !selectedTable.isDelivery) selectTable(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all ${activeTab === 'delivery' ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            <Bike size={14} className="sm:w-4 sm:h-4" /> Domicilios
          </button>
        </div>

        {/* ── Tab: Mesas ── */}
        {activeTab === 'tables' && (
          <>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h2 className="text-sm sm:text-lg font-bold text-slate-800 dark:text-white">Mesas</h2>
              <button onClick={() => setShowAddTable(!showAddTable)}
                className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs sm:text-sm font-medium transition-colors">
                <Plus size={14} /> Agregar
              </button>
            </div>

            {showAddTable && (
              <div className="mb-3 sm:mb-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-primary-200/50 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl space-y-2 sm:space-y-3">
                <Input label="Nombre de la mesa" placeholder="Ej: Mesa 1, Terraza A" value={newTableName} onChange={(e) => setNewTableName(e.target.value)} />
                <div>
                  <label className="text-sm text-slate-600 dark:text-slate-300 mb-1 block">Capacidad</label>
                  <input type="number" min={1} max={20} value={newTableCapacity} onChange={(e) => setNewTableCapacity(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 text-slate-800 dark:text-slate-100 focus:border-primary-500/50 focus:outline-none transition-colors" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddTable} icon={Check}>{t('create')}</Button>
                  <Button variant="ghost" onClick={() => setShowAddTable(false)}>{t('cancel')}</Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-3 overflow-y-auto flex-1 content-start">
              {localTables.map((table) => {
                const itemCount = getTableItemCount(table.id);
                return (
                  <div key={table.id} onClick={() => handleSelectTable(table)}
                    className={`relative p-2 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] group
                      ${selectedTable?.id === table.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500/30'
                        : TABLE_STATUS_COLORS[table.status] || TABLE_STATUS_COLORS.AVAILABLE}`}>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteTable(table.id); }}
                      className="absolute top-1 right-1 sm:top-2 sm:right-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-500 transition-all">
                      <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" />
                    </button>
                    {itemCount > 0 && (
                      <div className="absolute -top-1.5 -left-1.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-500 text-white text-[10px] sm:text-xs font-bold flex items-center justify-center shadow-lg">{itemCount}</div>
                    )}
                    <div className="text-center">
                      <p className="font-bold text-sm sm:text-lg">{table.name}</p>
                      <div className="flex items-center justify-center gap-1 mt-0.5 text-[10px] sm:text-xs opacity-70"><Users size={10} className="sm:w-3 sm:h-3" /><span>{table.capacity}</span></div>
                      <span className="inline-block mt-1 sm:mt-2 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-current/10">
                        {TABLE_STATUS_LABELS[table.status] || table.status}
                      </span>
                    </div>
                  </div>
                );
              })}
              {localTables.length === 0 && (
                <div className="col-span-3 text-center py-8 sm:py-12 text-slate-400">
                  <UtensilsCrossed size={36} className="sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-30" />
                  <p className="font-medium text-sm sm:text-base">No hay mesas configuradas</p>
                  <p className="text-xs sm:text-sm mt-1">Agrega tu primera mesa</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Tab: Domicilios ── */}
        {activeTab === 'delivery' && (
          <>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h2 className="text-sm sm:text-lg font-bold text-slate-800 dark:text-white">Domicilios</h2>
              <button onClick={() => setShowAddDelivery(!showAddDelivery)}
                className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs sm:text-sm font-medium transition-colors">
                <Plus size={14} /> Nuevo
              </button>
            </div>

            {showAddDelivery && (
              <div className="mb-3 sm:mb-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-primary-200/50 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl space-y-2 sm:space-y-3">
                <Input label="Nombre del domicilio" placeholder={`Ej: Domicilio #${deliveryCounter}`}
                  value={newDeliveryName} onChange={(e) => setNewDeliveryName(e.target.value)} />
                <div className="flex gap-2">
                  <Button onClick={handleAddDelivery} icon={Check}>{t('create')}</Button>
                  <Button variant="ghost" onClick={() => setShowAddDelivery(false)}>{t('cancel')}</Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 sm:gap-3 overflow-y-auto flex-1 content-start">
              {deliveryOrders.map((order) => {
                const itemCount = getTableItemCount(order.id);
                return (
                  <div key={order.id} onClick={() => handleSelectTable(order)}
                    className={`relative p-2 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] group
                      ${selectedTable?.id === order.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500/30'
                        : itemCount > 0
                          ? 'border-amber-500/50 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                          : 'border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 text-slate-700 dark:text-slate-300'}`}>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteDelivery(order.id); }}
                      className="absolute top-1 right-1 sm:top-2 sm:right-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-500 transition-all">
                      <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" />
                    </button>
                    {itemCount > 0 && (
                      <div className="absolute -top-1.5 -left-1.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-500 text-white text-[10px] sm:text-xs font-bold flex items-center justify-center shadow-lg">{itemCount}</div>
                    )}
                    <div className="text-center">
                      <Bike size={18} className="sm:w-[22px] sm:h-[22px] mx-auto mb-1 text-primary-600 dark:text-primary-400" />
                      <p className="font-bold text-xs sm:text-sm truncate">{order.name}</p>
                      <span className="inline-block mt-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-current/10">
                        {itemCount > 0 ? 'En proceso' : 'Nuevo'}
                      </span>
                    </div>
                  </div>
                );
              })}
              {deliveryOrders.length === 0 && (
                <div className="col-span-3 text-center py-8 sm:py-12 text-slate-400">
                  <Bike size={36} className="sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-30" />
                  <p className="font-medium text-sm sm:text-base">No hay domicilios activos</p>
                  <p className="text-xs sm:text-sm mt-1">Crea un nuevo domicilio</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ═══ Right Panel - Order ═══ */}
      <div className={`${selectedTable ? 'flex' : 'hidden md:flex'} md:w-1/2 flex-col rounded-xl sm:rounded-2xl border border-white dark:border-white/5 bg-white/80 dark:bg-slate-900/40 backdrop-blur-2xl shadow-xl overflow-hidden min-h-0 flex-1`}>
        {selectedTable ? (
          <>
            {/* Header */}
            <div className="px-3 py-2.5 sm:px-5 sm:py-4 border-b border-slate-200/50 dark:border-white/5 bg-primary-50/50 dark:bg-primary-900/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <button onClick={() => selectTable(null)}
                    className="md:hidden p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-white/5 text-slate-500 transition-colors shrink-0">
                    <X size={16} />
                  </button>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm sm:text-lg text-slate-800 dark:text-white truncate">
                      {selectedTable.name}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 truncate">
                      {selectedTable.isDelivery ? (
                        <>Domicilio</>
                      ) : (
                        <>{TABLE_STATUS_LABELS[selectedTable.status]} · {selectedTable.capacity} pers.</>
                      )}
                      {hasPendingSale && <span className="ml-1 sm:ml-2 text-amber-500 font-semibold">· Activa</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  {(cart.length > 0 || hasPendingSale) && (
                    <button onClick={() => setShowCancelConfirm(true)}
                      className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 transition-colors" title="Cancelar orden">
                      <XCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                  )}
                  <button onClick={() => selectTable(null)}
                    className="hidden md:block p-2 rounded-xl hover:bg-slate-200/50 dark:hover:bg-white/5 text-slate-500 transition-colors">
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Product search */}
            <div className="px-3 py-2 sm:px-5 sm:py-3 border-b border-slate-200/50 dark:border-white/5">
              <div className="relative">
                <Search size={14} className="sm:w-4 sm:h-4 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder={t('pos_search_products')} value={searchQuery} onChange={handleSearch}
                  className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-primary-500/50 focus:outline-none transition-colors text-xs sm:text-sm" />
              </div>
              {searchQuery.length >= 2 && products.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 shadow-lg">
                  {products.map((product) => (
                    <button key={product.id} onClick={() => handleAddProduct(product)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-left transition-colors border-b border-slate-100 dark:border-white/5 last:border-0">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{product.name}</span>
                      <span className="text-sm font-bold text-primary-600 dark:text-primary-400">${Number(product.salePrice).toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto px-3 py-2 sm:px-5 sm:py-3 space-y-1.5 sm:space-y-2">
              {cart.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-slate-400">
                  <ShoppingBag size={28} className="sm:w-9 sm:h-9 mx-auto mb-2 opacity-30" />
                  <p className="text-xs sm:text-sm">Busca y agrega productos</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-1.5 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                    {editingItem === item.id ? (
                      <div className="flex-1 space-y-2">
                        <input value={editValues.name} onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-1.5 rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none" placeholder="Nombre" />
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">$</span>
                          <input type="number" value={editValues.price} onChange={(e) => setEditValues(prev => ({ ...prev, price: e.target.value }))}
                            className="w-24 px-3 py-1.5 rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none" />
                          <button onClick={() => handleSaveEdit(item.id)} className="p-1.5 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"><Check size={14} /></button>
                          <button onClick={() => setEditingItem(null)} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 transition-colors"><X size={14} /></button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{item.customName || item.name}</p>
                          <p className="text-[10px] sm:text-xs text-primary-600 dark:text-primary-400 font-semibold">${Number(item.salePrice).toLocaleString()}</p>
                        </div>
                        <button onClick={() => handleStartEdit(item)} className="hidden sm:block p-1.5 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 text-primary-500 transition-colors"><Edit3 size={14} /></button>
                        <div className="flex items-center gap-0.5 sm:gap-1.5 bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl border border-slate-200 dark:border-white/10 px-0.5 sm:px-1">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 sm:p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-md sm:rounded-lg transition-colors text-slate-600 dark:text-slate-400"><Minus size={12} className="sm:w-3.5 sm:h-3.5" /></button>
                          <span className="w-5 sm:w-8 text-center text-xs sm:text-sm font-bold text-slate-800 dark:text-white">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 sm:p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-md sm:rounded-lg transition-colors text-slate-600 dark:text-slate-400"><Plus size={12} className="sm:w-3.5 sm:h-3.5" /></button>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white w-14 sm:w-20 text-right">${(Number(item.salePrice) * item.quantity).toLocaleString()}</p>
                        <button onClick={() => removeFromCart(item.id)} className="p-1 sm:p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"><Trash2 size={12} className="sm:w-3.5 sm:h-3.5" /></button>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200/50 dark:border-white/5 px-3 py-2.5 sm:px-5 sm:py-4 space-y-2 sm:space-y-3 bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="space-y-0.5 sm:space-y-1">
                <div className="flex justify-between text-[11px] sm:text-sm text-slate-500"><span>{t('pos_subtotal')}</span><span>${subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-[11px] sm:text-sm text-slate-500"><span>{t('pos_iva_label')}</span><span>${tax.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm sm:text-lg font-bold text-slate-800 dark:text-white pt-1 border-t border-slate-200 dark:border-white/10"><span>{t('pos_total')}</span><span>${total.toLocaleString()}</span></div>
              </div>
              {processingMessage && (
                <div className="text-center py-1.5 px-3 sm:py-2 sm:px-4 rounded-lg sm:rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm font-medium">{processingMessage}</div>
              )}
              <div className="flex gap-1.5 sm:gap-2">
                <button onClick={handleComanda} disabled={cart.length === 0 || loading}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-base font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  <Printer size={15} className="sm:w-[18px] sm:h-[18px]" /> {t('pos_order_btn')}
                </button>
                <button onClick={handleCobrar} disabled={cart.length === 0 || loading}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs sm:text-base font-medium shadow-lg shadow-primary-600/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  <CreditCard size={15} className="sm:w-[18px] sm:h-[18px]" /> {t('pos_charge_btn')}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              {activeTab === 'tables' ? (
                <><UtensilsCrossed size={40} className="sm:w-14 sm:h-14 mx-auto mb-3 opacity-20" /><p className="font-medium text-sm sm:text-lg">Selecciona una mesa</p><p className="text-xs sm:text-sm mt-1">Elige una mesa del panel izquierdo</p></>
              ) : (
                <><Bike size={40} className="sm:w-14 sm:h-14 mx-auto mb-3 opacity-20" /><p className="font-medium text-sm sm:text-lg">Selecciona un domicilio</p><p className="text-xs sm:text-sm mt-1">Crea o elige un domicilio</p></>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-white/10 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto mb-4 flex items-center justify-center">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">¿Cancelar orden?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                {hasPendingSale ? 'Se cancelará la venta pendiente y se liberará la mesa.' : 'Se eliminarán todos los productos de la orden actual.'}
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowCancelConfirm(false)}>{t('cancel')}</Button>
                <button onClick={handleCancelSale}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors">Sí, cancelar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sale Confirmation Modal */}
      <AnimatePresence>
        {saleConfirmation && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/10 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mx-auto mb-5 flex items-center justify-center">
                <CheckCircle2 size={40} className="text-emerald-500" />
              </motion.div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">{t('pos_sale_completed')}</h2>
              {saleConfirmation._table && <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{saleConfirmation._table}</p>}
              {saleConfirmation._deliveryInfo && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 space-y-0.5">
                  <p className="flex items-center justify-center gap-1"><User size={10} /> {saleConfirmation._deliveryInfo.customerName}</p>
                  <p className="flex items-center justify-center gap-1"><MapPin size={10} /> {saleConfirmation._deliveryInfo.address}</p>
                  {saleConfirmation._deliveryInfo.phone && <p className="flex items-center justify-center gap-1"><Phone size={10} /> {saleConfirmation._deliveryInfo.phone}</p>}
                </div>
              )}
              {saleConfirmation.invoiceNumber && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Factura: <span className="font-mono font-bold text-primary-600 dark:text-primary-400">{saleConfirmation.invoiceNumber}</span></p>
              )}
              <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 mb-5 space-y-2 text-left">
                {saleConfirmation._cart?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300">{item.quantity}x {item.customName || item.name}</span>
                    <span className="font-semibold text-slate-800 dark:text-white">${(Number(item.salePrice) * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                {saleConfirmation._totals && (
                  <div className="border-t border-slate-200 dark:border-white/10 pt-2 mt-2">
                    <div className="flex justify-between text-sm text-slate-500"><span>{t('pos_subtotal')}</span><span>${saleConfirmation._totals.subtotal.toLocaleString()}</span></div>
                    <div className="flex justify-between text-sm text-slate-500"><span>{t('pos_iva_label')}</span><span>${saleConfirmation._totals.tax.toLocaleString()}</span></div>
                    <div className="flex justify-between text-lg font-bold text-slate-800 dark:text-white mt-1"><span>{t('pos_total')}</span><span>${saleConfirmation._totals.total.toLocaleString()}</span></div>
                  </div>
                )}
              </div>
              <Button className="w-full" onClick={() => setSaleConfirmation(null)}>{t('close')}</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delivery Info Modal (shown at checkout) */}
      <AnimatePresence>
        {showDeliveryInfo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <Bike size={24} className="text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">Datos del domicilio</h3>
                  <p className="text-xs text-slate-500">Completa la información de entrega</p>
                </div>
              </div>
              <div className="space-y-4">
                <Input label="Nombre del cliente" placeholder="Ej: Juan Pérez" icon={User}
                  value={deliveryInfo.customerName} onChange={(e) => setDeliveryInfo(prev => ({ ...prev, customerName: e.target.value }))} />
                <Input label="Dirección de entrega" placeholder="Ej: Calle 10 #25-30, Apto 201" icon={MapPin}
                  value={deliveryInfo.address} onChange={(e) => setDeliveryInfo(prev => ({ ...prev, address: e.target.value }))} />
                <Input label={t('phone')} placeholder="Ej: 300 123 4567" icon={Phone}
                  value={deliveryInfo.phone} onChange={(e) => setDeliveryInfo(prev => ({ ...prev, phone: e.target.value }))} />
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="flex-1" onClick={() => setShowDeliveryInfo(false)}>{t('cancel')}</Button>
                <Button className="flex-1" onClick={handleDeliveryConfirm}
                  disabled={!deliveryInfo.customerName.trim() || !deliveryInfo.address.trim()}>
                  <CreditCard size={16} />
                  <span className="ml-2">Confirmar y Cobrar</span>
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="fixed bottom-6 right-6 px-4 py-3 rounded-xl bg-red-500 text-white shadow-lg text-sm font-medium">{error}</div>
      )}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
};

export default RestaurantTPVPage;
