import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  UserPlus,
  PackageSearch,
  X,
  User,
  CheckCircle2,
  Receipt,
  Printer
} from 'lucide-react';
import usePOSStore from '../store/posStore';
import useAuthStore from '../store/authStore';
import customerService from '../services/customerService';
import Button from '../components/Button';
import Input from '../components/Input';

const POSPage = () => {
  const [search, setSearch] = useState('');
  const [showTables, setShowTables] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [saleConfirmation, setSaleConfirmation] = useState(null); // holds completed sale data
  const { businessId, user } = useAuthStore();
  const {
    products,
    cart,
    loading,
    tables,
    selectedTable,
    isRestaurant,
    selectTable,
    initPOS,
    searchProducts,
    addToCart,
    removeFromCart,
    updateQuantity,
    getTotals,
    processSale
  } = usePOSStore();

  const { subtotal, tax, total } = getTotals();

  useEffect(() => {
    if (businessId) {
       initPOS(businessId, user?.branchId);
    }
  }, [businessId, user?.branchId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.length > 2 && businessId) searchProducts(search, businessId);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, businessId]);

  // Customer search
  useEffect(() => {
    if (!showCustomerModal || !businessId) return;
    const timer = setTimeout(() => {
      setLoadingCustomers(true);
      customerService.getCustomers(businessId, { search: customerSearch, size: 20 })
        .then(res => {
          const data = res.data;
          setCustomers(data.content || data || []);
        })
        .catch(() => setCustomers([]))
        .finally(() => setLoadingCustomers(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch, showCustomerModal, businessId]);

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 h-auto md:h-[calc(100vh-140px)]">
      {/* Product Selection Area */}
      <div className="flex-[2] flex flex-col gap-4 md:gap-6 min-h-[40vh] md:min-h-0">
        <div className="glass-panel p-3 md:p-4 rounded-2xl md:rounded-3xl flex items-center gap-2 md:gap-4">
          <Input
            className="flex-1"
            placeholder="Buscar productos..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button variant="secondary" className="px-3 md:px-4">
            <PackageSearch size={20} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6 pr-1 md:pr-2">
          {products.map((product) => (
            <motion.div
              layout
              key={product.id}
              whileHover={{ y: -4 }}
              onClick={() => addToCart(product)}
              className="glass-card p-3 md:p-5 rounded-2xl md:rounded-3xl cursor-pointer flex flex-col justify-between"
            >
                <h4 className="text-slate-800 dark:text-white font-bold leading-tight text-sm md:text-base">{product.name}</h4>
                <p className="text-slate-600 dark:text-slate-500 text-xs md:text-sm mt-1 truncate">SKU: {product.sku || '-'}</p>
              <div className="flex items-center justify-between mt-3 md:mt-6">
                <span className="text-base md:text-xl font-bold text-slate-800 dark:text-white">${Number(product.salePrice).toLocaleString()}</span>
                <div className="p-1.5 md:p-2 bg-primary-600 rounded-lg md:rounded-xl text-white shadow-lg shadow-primary-900/10">
                  <Plus size={16} />
                </div>
              </div>
            </motion.div>
          ))}
          {products.length === 0 && !loading && (
             <div className="col-span-full flex flex-col items-center justify-center opacity-40 py-10 md:py-20">
                <Search size={48} className="md:w-16 md:h-16" />
                <p className="mt-3 md:mt-4 text-sm md:text-lg">Busca productos para comenzar</p>
             </div>
          )}
        </div>
      </div>

      {/* Cart Area */}
      <div className="flex-1 glass-panel rounded-2xl md:rounded-3xl flex flex-col overflow-hidden min-h-[300px]">
        <div className="p-4 md:p-6 border-b border-white/5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="text-primary-600 dark:text-primary-400" size={24} />
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Carrito</h3>
            </div>
            <span className="bg-white/5 px-3 py-1 rounded-lg text-sm font-medium">
              {cart.reduce((acc, i) => acc + i.quantity, 0)} items
            </span>
          </div>

          {isRestaurant && (
            <div className="flex items-center justify-between bg-primary-50 dark:bg-primary-900/20 p-3 rounded-xl border border-primary-100 dark:border-primary-500/20">
               <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Mesa Seleccionada</p>
                  <p className="text-sm font-bold text-primary-700 dark:text-primary-400">{selectedTable ? selectedTable.name : 'Ninguna'}</p>
               </div>
               <Button size="sm" variant={selectedTable ? "outline" : "primary"} onClick={() => setShowTables(true)} className="text-xs py-1.5 px-3 h-auto">
                 {selectedTable ? 'Cambiar' : 'Seleccionar'}
               </Button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-4">
          <AnimatePresence initial={false}>
            {cart.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 md:gap-4 group"
              >
                <div className="flex-1 min-w-0">
                  <h5 className="text-slate-800 dark:text-white font-semibold truncate text-sm">{item.name}</h5>
                  <p className="text-slate-500 dark:text-slate-500 text-xs mt-0.5">${Number(item.salePrice).toLocaleString()} / ud</p>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 rounded-xl p-1 border border-slate-200 dark:border-white/5">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-1 hover:bg-white dark:hover:bg-white/10 rounded-lg text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-slate-800 dark:text-white">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div className="text-right min-w-[60px] md:min-w-[80px]">
                  <p className="text-slate-800 dark:text-white font-bold text-xs md:text-sm">${(Number(item.salePrice) * item.quantity).toLocaleString()}</p>
                </div>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-1.5 md:p-2 text-slate-600 hover:text-red-400 transition-colors md:opacity-0 md:group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Totals & Checkout */}
        <div className="p-4 md:p-6 bg-white/5 border-t border-white/10 space-y-3 md:space-y-4">
          {selectedCustomer && !isRestaurant && (
            <div className="flex items-center justify-between bg-primary-50 dark:bg-primary-900/20 p-3 rounded-xl border border-primary-100 dark:border-primary-500/20">
              <div className="flex items-center gap-2">
                <User size={14} className="text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-semibold text-primary-700 dark:text-primary-400 truncate">
                  {selectedCustomer.fullName || selectedCustomer.firstName}
                </span>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-xs text-slate-500 hover:text-red-500 transition-colors">
                <X size={14} />
              </button>
            </div>
          )}
          <div className="space-y-2">
            <div className="flex justify-between text-slate-500 dark:text-slate-400 text-sm"><span>Subtotal</span><span>${subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400 text-sm"><span>Impuestos (19%)</span><span>${tax.toLocaleString()}</span></div>
            <div className="flex justify-between text-slate-800 dark:text-white text-lg md:text-xl font-bold pt-2 border-t border-slate-200 dark:border-white/5"><span>Total</span><span>${total.toLocaleString()}</span></div>
          </div>
          <div className="grid grid-cols-2 gap-2 md:gap-3">
             {isRestaurant ? (
                <>
                  <Button className="py-3 md:py-4 flex-1 bg-amber-500 hover:bg-amber-600 border-amber-500 shadow-amber-900/10 text-white" onClick={async () => {
                    const snap = [...cart]; const tots = { subtotal, tax, total };
                    const result = await processSale(businessId, { paymentMethod: 'CASH', status: 'PENDING' });
                    if (result?.success) setSaleConfirmation({ ...result.data, _status: 'PENDING', _cart: snap, _totals: tots });
                  }}>
                    <span className="font-bold uppercase tracking-wider text-xs">Comanda</span>
                  </Button>
                  <Button className="py-3 md:py-4 flex-1" onClick={async () => {
                    const snap = [...cart]; const tots = { subtotal, tax, total };
                    const result = await processSale(businessId, { paymentMethod: 'CASH', status: 'COMPLETED' });
                    if (result?.success) setSaleConfirmation({ ...result.data, _status: 'COMPLETED', _cart: snap, _totals: tots });
                  }}>
                    <span className="font-bold uppercase tracking-wider text-xs">Cobrar</span>
                  </Button>
                </>
             ) : (
                <>
                  <Button variant="outline" className="py-3 md:py-4" onClick={() => setShowCustomerModal(true)}>
                    {selectedCustomer ? (
                      <span className="text-xs font-bold truncate">{selectedCustomer.fullName || selectedCustomer.firstName}</span>
                    ) : (
                      <UserPlus size={18} />
                    )}
                  </Button>
                  <Button className="py-3 md:py-4 flex-1" onClick={async () => {
                    const cartSnapshot = [...cart];
                    const totalsSnapshot = { subtotal, tax, total };
                    const result = await processSale(businessId, { paymentMethod: 'CASH', status: 'COMPLETED', customerId: selectedCustomer?.id || null });
                    if (result?.success) {
                      setSaleConfirmation({
                        ...result.data,
                        _status: 'COMPLETED',
                        _cart: cartSnapshot,
                        _totals: totalsSnapshot,
                        _customer: selectedCustomer,
                      });
                      setSelectedCustomer(null);
                    }
                  }}>
                    <CreditCard size={18} />
                    <span className="ml-2 font-bold uppercase tracking-wider text-sm">Cobrar</span>
                  </Button>
                </>
             )}
          </div>
        </div>
      </div>

      {/* Customer Selection Modal */}
      <AnimatePresence>
        {showCustomerModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-white/10"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Seleccionar Cliente</h2>
                <button onClick={() => setShowCustomerModal(false)} className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors text-slate-500">
                  <X size={18} />
                </button>
              </div>

              <Input
                placeholder="Buscar por nombre, email o NIT..."
                icon={Search}
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />

              <div className="mt-4 max-h-80 overflow-y-auto space-y-2">
                {/* Option to remove customer */}
                <button
                  onClick={() => { setSelectedCustomer(null); setShowCustomerModal(false); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    !selectedCustomer ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-white/5 hover:border-primary-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-400">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Sin cliente</p>
                    <p className="text-xs text-slate-500">Venta sin asignar cliente</p>
                  </div>
                </button>

                {loadingCustomers && <p className="text-center text-sm text-slate-400 py-4">Buscando...</p>}

                {customers.map(customer => (
                  <button
                    key={customer.id}
                    onClick={() => { setSelectedCustomer(customer); setShowCustomerModal(false); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      selectedCustomer?.id === customer.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-white/5 hover:border-primary-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm">
                      {(customer.firstName || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                        {customer.fullName || `${customer.firstName || ''} ${customer.lastName || ''}`.trim()}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {customer.email || customer.taxId || customer.phone || ''}
                      </p>
                    </div>
                  </button>
                ))}

                {!loadingCustomers && customers.length === 0 && customerSearch.length > 0 && (
                  <p className="text-center text-sm text-slate-400 py-4">No se encontraron clientes</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tables Modal */}
      <AnimatePresence>
        {showTables && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-3xl shadow-2xl border border-white/10"
            >
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Seleccionar Mesa</h2>
                 <button onClick={() => setShowTables(false)} className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors text-slate-500">
                    Cerrar
                 </button>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                 <button 
                    onClick={() => { selectTable(null); setShowTables(false); }}
                    className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all ${
                      selectedTable === null ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] text-slate-600 dark:text-slate-400 hover:border-primary-300'
                    }`}
                 >
                    <span className="text-sm font-bold">Llevar / Barra</span>
                 </button>

                 {tables.map(table => (
                   <button 
                      key={table.id}
                      onClick={() => { selectTable(table); setShowTables(false); }}
                      className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all ${
                        selectedTable?.id === table.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 
                        table.status === 'OCCUPIED' ? 'border-amber-500/50 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' :
                        'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] text-slate-600 dark:text-slate-400 hover:border-primary-300'
                      }`}
                   >
                      <span className="text-sm font-bold">{table.name}</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                         {table.status === 'OCCUPIED' ? 'Ocupada' : 'Libre'} ({table.capacity}p)
                      </span>
                   </button>
                 ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sale Confirmation Modal */}
      <AnimatePresence>
        {saleConfirmation && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/10 text-center"
            >
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mx-auto mb-5 flex items-center justify-center"
              >
                <CheckCircle2 size={40} className="text-emerald-500" />
              </motion.div>

              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
                {saleConfirmation._status === 'COMPLETED' ? 'Venta Completada' : 'Comanda Guardada'}
              </h2>

              {saleConfirmation.invoiceNumber && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Factura: <span className="font-mono font-bold text-primary-600 dark:text-primary-400">{saleConfirmation.invoiceNumber}</span>
                </p>
              )}

              <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 mb-5 space-y-2 text-left">
                {saleConfirmation._cart && saleConfirmation._cart.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300">{item.quantity}x {item.customName || item.name}</span>
                    <span className="font-semibold text-slate-800 dark:text-white">${(Number(item.salePrice) * item.quantity).toLocaleString()}</span>
                  </div>
                ))}

                <div className="border-t border-slate-200 dark:border-white/10 pt-2 mt-2">
                  {saleConfirmation._totals && (
                    <>
                      <div className="flex justify-between text-sm text-slate-500"><span>Subtotal</span><span>${saleConfirmation._totals.subtotal.toLocaleString()}</span></div>
                      <div className="flex justify-between text-sm text-slate-500"><span>IVA</span><span>${saleConfirmation._totals.tax.toLocaleString()}</span></div>
                      <div className="flex justify-between text-lg font-bold text-slate-800 dark:text-white mt-1"><span>Total</span><span>${saleConfirmation._totals.total.toLocaleString()}</span></div>
                    </>
                  )}
                  {!saleConfirmation._totals && saleConfirmation.total != null && (
                    <div className="flex justify-between text-lg font-bold text-slate-800 dark:text-white"><span>Total</span><span>${Number(saleConfirmation.total).toLocaleString()}</span></div>
                  )}
                </div>

                {saleConfirmation._customer && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-white/10 mt-2">
                    <User size={14} className="text-primary-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      {saleConfirmation._customer.fullName || saleConfirmation._customer.firstName}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSaleConfirmation(null)}
                >
                  Nueva Venta
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    // TODO: print functionality
                    setSaleConfirmation(null);
                  }}
                >
                  <Printer size={16} />
                  <span className="ml-2">Imprimir</span>
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default POSPage;
