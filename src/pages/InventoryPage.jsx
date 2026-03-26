import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Warehouse, Search, ArrowUpRight, ArrowDownRight, ArrowLeftRight, X, Loader2, AlertCircle,
  Package, ChevronDown, ChevronUp, Edit2, History, Clock, TrendingUp, TrendingDown
} from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import useAuthStore from '../store/authStore';
import inventoryService from '../services/inventoryService';
import branchService from '../services/branchService';
import productService from '../services/productService';

const InventoryPage = () => {
  const { businessId } = useAuthStore();
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Expanded row for kardex
  const [expandedItem, setExpandedItem] = useState(null);
  const [kardex, setKardex] = useState([]);
  const [loadingKardex, setLoadingKardex] = useState(false);

  // Entry/Exit modal
  const [showModal, setShowModal] = useState(false);
  const [movementType, setMovementType] = useState('entry');
  const [form, setForm] = useState({ productId: '', variantId: '', quantity: '', unitCost: '', reason: 'PURCHASE', reference: '', notes: '' });
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Edit stock settings modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({ minQuantity: '', maxQuantity: '' });

  // Transfer modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferItem, setTransferItem] = useState(null);
  const [transferForm, setTransferForm] = useState({ targetBranchId: '', quantity: '', notes: '' });

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowProductDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Data fetching ──
  const fetchBranches = async () => {
    if (!businessId) return;
    try {
      const res = await branchService.getBranches(businessId);
      const list = res.data || [];
      setBranches(list);
      if (list.length > 0) setSelectedBranch(list[0].id);
      else setLoading(false);
    } catch (e) { setLoading(false); }
  };

  const fetchStock = async () => {
    if (!selectedBranch) { setStock([]); setLoading(false); return; }
    try {
      setLoading(true); setError(null);
      const res = await inventoryService.getStock(selectedBranch);
      setStock(res.data.content || res.data || []);
    } catch (err) {
      console.error('Stock fetch:', err.response?.status, err.response?.data);
      if (err.response?.status === 404) setStock([]);
      else { setError(`Error ${err.response?.status || ''}: ${err.response?.data?.message || err.message}`); setStock([]); }
    } finally { setLoading(false); }
  };

  const fetchKardex = async (productId) => {
    if (!selectedBranch || !productId) return;
    try {
      setLoadingKardex(true);
      const res = await inventoryService.getKardex(selectedBranch, productId);
      setKardex(res.data || []);
    } catch (err) {
      console.error('Kardex fetch error:', err);
      setKardex([]);
    } finally { setLoadingKardex(false); }
  };

  useEffect(() => { fetchBranches(); }, [businessId]);
  useEffect(() => { if (selectedBranch) { fetchStock(); setExpandedItem(null); } }, [selectedBranch]);
  useEffect(() => { const t = setTimeout(() => { if (selectedBranch) fetchStock(); }, 400); return () => clearTimeout(t); }, [searchTerm]);

  // ── Product search for modal ──
  useEffect(() => {
    if (productSearch.length < 2) { setProductResults([]); return; }
    const t = setTimeout(async () => {
      if (!businessId) return;
      try {
        setSearchingProducts(true);
        const res = await productService.getProducts(businessId, { search: productSearch, size: 10 });
        setProductResults(res.data.content || res.data || []);
        setShowProductDropdown(true);
      } catch (e) { /* silent */ }
      finally { setSearchingProducts(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [productSearch, businessId]);

  // ── Handlers ──
  const toggleExpand = (item) => {
    if (expandedItem === item.productId) { setExpandedItem(null); setKardex([]); }
    else { setExpandedItem(item.productId); fetchKardex(item.productId); }
  };

  const selectProduct = (product) => {
    setSelectedProduct(product);
    setForm({ ...form, productId: product.id, variantId: '' });
    setProductSearch(product.name);
    setShowProductDropdown(false);
  };

  const openMovementModal = (type) => {
    setMovementType(type);
    setForm({ productId: '', variantId: '', quantity: '', unitCost: '', reason: type === 'entry' ? 'PURCHASE' : 'SALE', reference: '', notes: '' });
    setSelectedProduct(null); setProductSearch(''); setProductResults([]);
    setShowModal(true);
  };

  const handleMovement = async (e) => {
    e.preventDefault();
    if (!form.productId) { setError('Debes seleccionar un producto'); return; }
    try {
      const payload = {
        productId: form.productId,
        variantId: form.variantId || null,
        quantity: parseInt(form.quantity) || 1,
        unitCost: parseFloat(form.unitCost) || 0,
        reason: form.reason,
        reference: form.reference || null,
        notes: form.notes || null,
      };
      if (movementType === 'entry') await inventoryService.createEntry(selectedBranch, payload);
      else await inventoryService.createExit(selectedBranch, payload);
      setShowModal(false);
      fetchStock();
    } catch (err) { setError(err.response?.data?.message || 'Error al registrar movimiento'); }
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setEditForm({ minQuantity: item.minQuantity ?? '', maxQuantity: item.maxQuantity ?? '' });
    setShowEditModal(true);
  };

  const openTransferModal = (item) => {
    setTransferItem(item);
    setTransferForm({ targetBranchId: '', quantity: '', notes: '' });
    setShowTransferModal(true);
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferForm.targetBranchId || !transferForm.quantity) return;
    try {
      await inventoryService.transferStock(
        selectedBranch,
        transferForm.targetBranchId,
        transferItem.productId,
        parseInt(transferForm.quantity),
        transferForm.notes || null
      );
      setShowTransferModal(false);
      fetchStock();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al transferir stock');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await inventoryService.updateStockSettings(
        editItem.inventoryId,
        editForm.minQuantity !== '' ? parseInt(editForm.minQuantity) : null,
        editForm.maxQuantity !== '' ? parseInt(editForm.maxQuantity) : null
      );
      setShowEditModal(false);
      fetchStock();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar configuración de stock');
    }
  };

  const fmt = (v) => v != null ? '$' + Number(v).toLocaleString('es-CO') : '$0';
  const branchName = branches.find(b => b.id === selectedBranch)?.name || 'sucursal';
  const filteredStock = searchTerm
    ? stock.filter(s => (s.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) || (s.productSku || '').toLowerCase().includes(searchTerm.toLowerCase()))
    : stock;

  const reasonLabels = {
    PURCHASE: 'Compra', SALE: 'Venta', ADJUSTMENT: 'Ajuste', TRANSFER_IN: 'Transferencia ↓',
    TRANSFER_OUT: 'Transferencia ↑', RETURN: 'Devolución', DAMAGE: 'Daño', EXPIRATION: 'Vencimiento'
  };

  return (
    <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Inventario</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Stock actual, entradas y salidas por sucursal</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Button variant="outline" onClick={() => openMovementModal('entry')} disabled={!selectedBranch}>
            <ArrowUpRight size={18} /><span className="hidden sm:inline">Entrada</span>
          </Button>
          <Button variant="outline" onClick={() => openMovementModal('exit')} disabled={!selectedBranch}>
            <ArrowDownRight size={18} /><span className="hidden sm:inline">Salida</span>
          </Button>
          <Button variant="outline" onClick={() => { setTransferItem(null); setTransferForm({ targetBranchId: '', quantity: '', notes: '' }); setShowTransferModal(true); }} disabled={!selectedBranch || branches.length < 2}>
            <ArrowLeftRight size={18} /><span className="hidden sm:inline">Transferir</span>
          </Button>
        </div>
      </div>

      {/* Branch selector + search */}
      <div className="glass-panel p-3 sm:p-4 rounded-2xl sm:rounded-3xl flex flex-col md:flex-row items-stretch md:items-center gap-3 sm:gap-4">
        <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}
          className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-slate-800 dark:text-white outline-none focus:border-primary-500 transition-colors w-full md:min-w-[200px] md:w-auto [&>option]:bg-white dark:[&>option]:bg-[#1e293b] [&>option]:text-slate-800 dark:[&>option]:text-white">
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          {branches.length === 0 && <option value="">No hay sucursales</option>}
        </select>
        <Input className="flex-1" placeholder="Filtrar productos en inventario..." icon={Search} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <div className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{filteredStock.length} producto{filteredStock.length !== 1 ? 's' : ''}</div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="text-red-400 shrink-0" size={20} />
          <span className="text-red-400 text-sm flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white"><X size={16} /></button>
        </div>
      )}

      {/* Stock table */}
      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-primary-400" size={40} /></div>
      ) : (
        <>
          {/* Mobile card view */}
          <div className="lg:hidden space-y-3">
            {filteredStock.map((item) => (
              <div key={item.inventoryId || item.productId} className="glass-card p-3 sm:p-4 rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary-600/20 rounded-xl flex items-center justify-center text-primary-400 shrink-0"><Package size={18} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 dark:text-white font-semibold text-sm truncate">{item.productName}</p>
                    <p className="text-slate-500 text-xs font-mono">{item.productSku || 'Sin SKU'}</p>
                  </div>
                  <span className={`font-black text-xl ${item.lowStock ? 'text-red-400' : 'text-emerald-400'}`}>{item.quantity}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg text-[10px] text-slate-600 dark:text-slate-300">{item.categoryName || 'Sin cat.'}</span>
                  {item.lowStock
                    ? <span className="bg-red-500/10 text-red-400 text-[10px] font-bold px-2 py-1 rounded-lg inline-flex items-center gap-1"><AlertCircle size={10} />Bajo</span>
                    : <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-lg">Normal</span>}
                  <span className="text-slate-800 dark:text-white font-bold text-xs ml-auto">{fmt(item.salePrice)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                  <span>Mín: {item.minQuantity ?? '-'}</span>
                  <span>Máx: {item.maxQuantity ?? '-'}</span>
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-white/5">
                  <button onClick={() => toggleExpand(item)} className="flex-1 flex items-center justify-center gap-1.5 p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl text-slate-500 dark:text-slate-400 text-xs transition-colors">
                    <History size={14} /><span>Kardex</span>
                  </button>
                  <button onClick={() => openEditModal(item)} className="flex-1 flex items-center justify-center gap-1.5 p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl text-slate-500 dark:text-slate-400 text-xs transition-colors">
                    <Edit2 size={14} /><span>Config</span>
                  </button>
                  <button onClick={() => openTransferModal(item)} className="flex-1 flex items-center justify-center gap-1.5 p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl text-slate-500 dark:text-slate-400 text-xs transition-colors" disabled={branches.length < 2}>
                    <ArrowLeftRight size={14} /><span>Transferir</span>
                  </button>
                </div>
                {/* Mobile expanded kardex */}
                <AnimatePresence>
                  {expandedItem === item.productId && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/5">
                        <div className="flex items-center gap-2 mb-3">
                          <Clock size={14} className="text-primary-400" />
                          <h4 className="text-slate-800 dark:text-white font-semibold text-xs">Historial</h4>
                        </div>
                        {loadingKardex ? (
                          <div className="flex items-center justify-center py-4"><Loader2 className="animate-spin text-primary-400" size={20} /></div>
                        ) : kardex.length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {kardex.map((mov, idx) => (
                              <div key={mov.id || idx} className="flex items-center gap-3 bg-slate-50 dark:bg-white/[0.03] rounded-xl px-3 py-2">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${mov.movementType === 'ENTRY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                  {mov.movementType === 'ENTRY' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className={`font-bold text-xs ${mov.movementType === 'ENTRY' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {mov.movementType === 'ENTRY' ? '+' : '-'}{mov.quantity}
                                  </span>
                                  <span className="text-slate-500 text-xs ml-2">{reasonLabels[mov.reason] || mov.reason}</span>
                                </div>
                                <span className="text-slate-500 text-[10px] shrink-0">
                                  {mov.createdAt ? new Date(mov.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) : '-'}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-500 text-xs text-center py-3">Sin movimientos</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
            {filteredStock.length === 0 && (
              <div className="text-center py-16 text-slate-500">
                <Warehouse size={48} className="mx-auto mb-4 opacity-40" />
                <p>No hay productos en inventario</p>
              </div>
            )}
          </div>

          {/* Desktop table view */}
          <div className="glass-panel rounded-3xl overflow-hidden hidden lg:block">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/5">
                <tr>
                  <th className="px-5 py-4 w-8"></th>
                  <th className="px-5 py-4">Producto</th>
                  <th className="px-5 py-4">SKU</th>
                  <th className="px-5 py-4">Categoría</th>
                  <th className="px-5 py-4 text-center">Stock</th>
                  <th className="px-5 py-4 text-center">Mín</th>
                  <th className="px-5 py-4 text-center">Máx</th>
                  <th className="px-5 py-4">Precio</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                {filteredStock.map((item) => (
                  <React.Fragment key={item.inventoryId || item.productId}>
                    {/* Main row */}
                    <tr className={`hover:bg-white/[0.03] transition-colors ${expandedItem === item.productId ? 'bg-white/[0.03]' : ''}`}>
                      <td className="px-5 py-4">
                        <button onClick={() => toggleExpand(item)} className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-500 dark:text-slate-400 hover:text-white transition-colors">
                          {expandedItem === item.productId ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-600/20 rounded-xl flex items-center justify-center text-primary-400"><Package size={18} /></div>
                          <p className="text-slate-800 dark:text-white font-medium">{item.productName}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{item.productSku || '-'}</td>
                      <td className="px-5 py-4"><span className="bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg text-xs text-slate-600 dark:text-slate-300">{item.categoryName || 'Sin cat.'}</span></td>
                      <td className="px-5 py-4 text-center">
                        <span className={`font-bold text-lg ${item.lowStock ? 'text-red-400' : 'text-emerald-400'}`}>{item.quantity}</span>
                      </td>
                      <td className="px-5 py-4 text-center text-slate-500">{item.minQuantity ?? '-'}</td>
                      <td className="px-5 py-4 text-center text-slate-500">{item.maxQuantity ?? '-'}</td>
                      <td className="px-5 py-4 text-slate-800 dark:text-white font-bold">{fmt(item.salePrice)}</td>
                      <td className="px-5 py-4">
                        {item.lowStock
                          ? <span className="bg-red-500/10 text-red-400 text-xs font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1"><AlertCircle size={12} />Bajo</span>
                          : <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-lg">Normal</span>}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex gap-1.5 justify-end">
                          <button onClick={() => toggleExpand(item)} className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-500 dark:text-slate-400 hover:text-primary-400 transition-colors" title="Ver historial">
                            <History size={15} />
                          </button>
                          <button onClick={() => openEditModal(item)} className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-500 dark:text-slate-400 hover:text-amber-400 transition-colors" title="Editar stock mín/máx">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => openTransferModal(item)} className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-400 transition-colors" title="Transferir a otra sucursal" disabled={branches.length < 2}>
                            <ArrowLeftRight size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded kardex row */}
                    <AnimatePresence>
                      {expandedItem === item.productId && (
                        <tr>
                          <td colSpan={10} className="p-0">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 py-5 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-200 dark:border-white/5">
                                <div className="flex items-center gap-2 mb-4">
                                  <Clock size={16} className="text-primary-400" />
                                  <h4 className="text-slate-800 dark:text-white font-semibold text-sm">Historial de Movimientos — {item.productName}</h4>
                                </div>

                                {loadingKardex ? (
                                  <div className="flex items-center justify-center py-6"><Loader2 className="animate-spin text-primary-400" size={24} /></div>
                                ) : kardex.length > 0 ? (
                                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                    {kardex.map((mov, idx) => (
                                      <div key={mov.id || idx} className="flex items-center gap-4 bg-slate-50 dark:bg-white/[0.03] rounded-xl px-4 py-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mov.movementType === 'ENTRY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                          {mov.movementType === 'ENTRY' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className={`font-bold text-sm ${mov.movementType === 'ENTRY' ? 'text-emerald-400' : 'text-red-400'}`}>
                                              {mov.movementType === 'ENTRY' ? '+' : '-'}{mov.quantity}
                                            </span>
                                            <span className="text-slate-500 text-xs">•</span>
                                            <span className="text-slate-600 dark:text-slate-300 text-xs">{reasonLabels[mov.reason] || mov.reason}</span>
                                          </div>
                                          <div className="flex items-center gap-3 mt-1">
                                            {mov.reference && <span className="text-slate-500 text-xs">Ref: {mov.reference}</span>}
                                            {mov.notes && <span className="text-slate-500 text-xs truncate">{mov.notes}</span>}
                                          </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                          {mov.unitCost && <p className="text-slate-600 dark:text-slate-300 text-xs font-mono">{fmt(mov.unitCost)}/ud</p>}
                                          <p className="text-slate-500 text-xs mt-0.5">
                                            {mov.createdAt ? new Date(mov.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-slate-500 text-sm text-center py-4">No hay movimientos registrados para este producto</p>
                                )}
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {filteredStock.length === 0 && (
            <div className="text-center py-16 text-slate-500">
              <Warehouse size={48} className="mx-auto mb-4 opacity-40" />
              <p>No hay productos en inventario para esta sucursal</p>
              <p className="text-xs mt-2">Haz clic en "Entrada" para agregar stock</p>
            </div>
          )}
        </div>
        </>
      )}

      {/* ═══════ Entry/Exit Modal ═══════ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">{movementType === 'entry' ? '📥 Entrada de Inventario' : '📤 Salida de Inventario'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-white"><X size={20} /></button>
            </div>

            <div className="bg-slate-100 dark:bg-white/5 px-4 py-3 rounded-xl mb-5 text-sm text-slate-600 dark:text-slate-300">
              Sucursal: <span className="font-bold text-slate-800 dark:text-white">{branchName}</span>
            </div>

            <form onSubmit={handleMovement} className="space-y-4">
              {/* Product Search */}
              <div ref={dropdownRef} className="relative">
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Buscar Producto *</label>
                <div className="relative">
                  <input type="text" value={productSearch}
                    onChange={(e) => { setProductSearch(e.target.value); setSelectedProduct(null); setForm({ ...form, productId: '' }); }}
                    onFocus={() => { if (productResults.length > 0) setShowProductDropdown(true); }}
                    placeholder="Escribe el nombre del producto..."
                    className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:border-primary-500 transition-colors pr-10" required />
                  {searchingProducts && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-500 dark:text-slate-400" />}
                  {selectedProduct && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 text-sm">✓</span>}
                </div>
                {showProductDropdown && productResults.length > 0 && (
                  <div className="absolute z-[60] w-full mt-2 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                    {productResults.map(p => (
                      <button key={p.id} type="button" onClick={() => selectProduct(p)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors flex items-center justify-between border-b border-slate-200 dark:border-white/5 last:border-0">
                        <div><p className="text-slate-800 dark:text-white font-medium text-sm">{p.name}</p><p className="text-slate-500 text-xs">{p.sku || 'Sin SKU'}</p></div>
                        <span className="text-primary-400 font-bold text-sm">{fmt(p.salePrice)}</span>
                      </button>
                    ))}
                  </div>
                )}
                {showProductDropdown && productSearch.length >= 2 && productResults.length === 0 && !searchingProducts && (
                  <div className="absolute z-[60] w-full mt-2 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-xl p-4 text-center text-slate-500 text-sm">No se encontraron productos</div>
                )}
              </div>

              {selectedProduct && (
                <div className="space-y-3">
                  <div className="bg-primary-600/10 border border-primary-500/20 rounded-xl p-3 flex items-center gap-3">
                    <Package className="text-primary-400" size={20} />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 dark:text-white font-medium text-sm truncate">{selectedProduct.name}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs">SKU: {selectedProduct.sku || '-'}</p>
                    </div>
                  </div>
                  {selectedProduct.hasVariants && selectedProduct.variants && selectedProduct.variants.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Variante *</label>
                      <select value={form.variantId} onChange={(e) => setForm({ ...form, variantId: e.target.value })}
                        className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:border-primary-500 transition-colors [&>option]:text-slate-800 dark:[&>option]:text-white" required>
                        <option value="">Seleccionar variante...</option>
                        {selectedProduct.variants.map(v => (
                          <option key={v.id} value={v.id}>
                            {[v.attribute1Value, v.attribute2Value].filter(Boolean).join(' / ') || v.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input label="Cantidad *" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required min="1" />
                <Input label="Costo Unitario" type="number" step="0.01" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Razón *</label>
                <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:border-primary-500 [&>option]:bg-white [&>option]:text-white">
                  {movementType === 'entry' ? (<>
                    <option value="PURCHASE">Compra</option><option value="ADJUSTMENT">Ajuste</option>
                    <option value="TRANSFER_IN">Transferencia Entrada</option><option value="RETURN">Devolución</option>
                  </>) : (<>
                    <option value="SALE">Venta</option><option value="ADJUSTMENT">Ajuste</option>
                    <option value="TRANSFER_OUT">Transferencia Salida</option><option value="DAMAGE">Daño</option>
                    <option value="EXPIRATION">Vencimiento</option>
                  </>)}
                </select>
              </div>

              <Input label="Referencia" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Ej: Factura #123" />

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button>
                <Button type="submit" className="flex-1" disabled={!selectedProduct || (selectedProduct?.hasVariants && selectedProduct?.variants?.length > 0 && !form.variantId)}>
                  {movementType === 'entry' ? '📥 Registrar Entrada' : '📤 Registrar Salida'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ═══════ Edit Stock Settings Modal ═══════ */}
      {showEditModal && editItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">⚙️ Configurar Stock</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-white"><X size={20} /></button>
            </div>

            <div className="bg-slate-100 dark:bg-white/5 rounded-xl p-4 mb-5 flex items-center gap-3">
              <Package className="text-primary-400" size={20} />
              <div>
                <p className="text-slate-800 dark:text-white font-medium">{editItem.productName}</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Stock actual: <span className="font-bold text-slate-800 dark:text-white">{editItem.quantity}</span></p>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <Input label="Stock Mínimo (alerta)" type="number" value={editForm.minQuantity}
                onChange={(e) => setEditForm({ ...editForm, minQuantity: e.target.value })}
                placeholder="Ej: 5" />
              <Input label="Stock Máximo" type="number" value={editForm.maxQuantity}
                onChange={(e) => setEditForm({ ...editForm, maxQuantity: e.target.value })}
                placeholder="Ej: 100" />
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20 rounded-xl p-3">
                <p className="text-amber-700 dark:text-amber-300 text-xs">Cuando el stock baje del mínimo, se mostrará una alerta de "Stock Bajo".</p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">Cancelar</Button>
                <Button type="submit" className="flex-1">Guardar</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ═══════ Transfer Stock Modal ═══════ */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">🔄 Transferir Stock</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-white"><X size={20} /></button>
            </div>

            {transferItem && (
              <div className="bg-slate-100 dark:bg-white/5 rounded-xl p-4 mb-5 flex items-center gap-3">
                <Package className="text-primary-400" size={20} />
                <div>
                  <p className="text-slate-800 dark:text-white font-medium">{transferItem.productName}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Stock disponible: <span className="font-bold text-slate-800 dark:text-white">{transferItem.quantity}</span></p>
                </div>
              </div>
            )}

            {!transferItem && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-5">
                <p className="text-blue-300 text-xs">Selecciona un producto desde la tabla usando el botón de transferencia.</p>
              </div>
            )}

            <form onSubmit={transferItem ? handleTransferSubmit : (e) => e.preventDefault()} className="space-y-4">
              <div className="bg-slate-100 dark:bg-white/5 rounded-xl p-3">
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Desde:</p>
                <p className="text-slate-800 dark:text-white font-medium">{branchName}</p>
              </div>

              <div>
                <label className="text-sm text-slate-600 dark:text-slate-300 mb-1 block">Sucursal destino</label>
                <select value={transferForm.targetBranchId} onChange={(e) => setTransferForm({ ...transferForm, targetBranchId: e.target.value })}
                  className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:border-primary-500 [&>option]:bg-white">
                  <option value="">Seleccionar sucursal...</option>
                  {branches.filter(b => b.id !== selectedBranch).map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <Input label="Cantidad a transferir" type="number" min="1" max={transferItem?.quantity || 999}
                value={transferForm.quantity} onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })}
                placeholder="Ej: 10" required />

              <Input label="Notas (opcional)" value={transferForm.notes}
                onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                placeholder="Motivo de la transferencia..." />

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowTransferModal(false)} className="flex-1">Cancelar</Button>
                <Button type="submit" className="flex-1" disabled={!transferItem || !transferForm.targetBranchId || !transferForm.quantity}>🔄 Transferir</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
