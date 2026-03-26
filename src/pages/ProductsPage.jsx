import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Search, Plus, Edit2, Trash2, X, Loader2, AlertCircle, Warehouse } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import useAuthStore from '../store/authStore';
import productService from '../services/productService';
import categoryService from '../services/categoryService';

const ProductsPage = () => {
  const { businessId, user } = useAuthStore();
  const businessType = user?.businessType || 'OTHER';

  const fieldsByBusinessType = {
    CLOTHING_STORE: ['brand', 'color', 'material', 'gender', 'season'],
    MINIMARKET: ['brand', 'saleUnitOfMeasure', 'conversionFactor', 'sanitaryRegistration'],
    PHARMACY: ['brand', 'model', 'sanitaryRegistration', 'saleUnitOfMeasure', 'conversionFactor'],
    HARDWARE_STORE: ['brand', 'model', 'material', 'saleUnitOfMeasure', 'conversionFactor'],
    ELECTRONICS: ['brand', 'model', 'warrantyDays'],
    AUTO_PARTS: ['brand', 'model', 'warrantyDays'],
    BEAUTY_SALON: ['brand', 'sanitaryRegistration'],
    RESTAURANT: ['brand'],
    BAKERY: ['brand', 'saleUnitOfMeasure', 'conversionFactor'],
    BOOKSTORE: ['brand'],
    OTHER: ['brand', 'model', 'color', 'material'],
  };

  const visibleFields = fieldsByBusinessType[businessType] || fieldsByBusinessType['OTHER'];
  const showField = (field) => visibleFields.includes(field);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', sku: '', barcode: '', salePrice: '', costPrice: '', categoryId: '', productType: 'SIMPLE', taxable: true, taxRate: '19', description: '', brand: '', model: '', color: '', material: '', gender: '', season: '', saleUnitOfMeasure: '', conversionFactor: '', sanitaryRegistration: '', warrantyDays: '' });

  const fetchProducts = async () => {
    if (!businessId) return;
    try {
      setLoading(true);
      const params = searchTerm ? { search: searchTerm } : {};
      const res = await productService.getProducts(businessId, params);
      setProducts(res.data.content || res.data || []);
    } catch (err) { setError(err.response?.data?.message || 'Error al cargar productos'); }
    finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    if (!businessId) return;
    try {
      const res = await categoryService.getCategories(businessId);
      setCategories(res.data.content || res.data || []);
    } catch (e) { /* silent */ }
  };

  useEffect(() => { fetchProducts(); fetchCategories(); }, [businessId]);
  useEffect(() => { const t = setTimeout(() => fetchProducts(), 400); return () => clearTimeout(t); }, [searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        sku: form.sku || null,
        barcode: form.barcode || null,
        productType: form.productType || 'SIMPLE',
        categoryId: form.categoryId || null,
        salePrice: parseFloat(form.salePrice) || 0,
        costPrice: parseFloat(form.costPrice) || 0,
        taxable: form.taxable,
        taxRate: parseFloat(form.taxRate) || 0,
        active: true,
        brand: form.brand || null,
        model: form.model || null,
        color: form.color || null,
        material: form.material || null,
        gender: form.gender || null,
        season: form.season || null,
        saleUnitOfMeasure: form.saleUnitOfMeasure || null,
        conversionFactor: form.conversionFactor ? parseFloat(form.conversionFactor) : null,
        sanitaryRegistration: form.sanitaryRegistration || null,
        warrantyDays: form.warrantyDays ? parseInt(form.warrantyDays) : null,
      };
      if (editing) { await productService.updateProduct(editing.id, payload); }
      else { await productService.createProduct(businessId, payload); }
      setShowModal(false); setEditing(null); resetForm(); fetchProducts();
    } catch (err) { setError(err.response?.data?.message || 'Error al guardar producto'); }
  };

  const handleEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name || '', sku: p.sku || '', barcode: p.barcode || '', salePrice: p.salePrice || '', costPrice: p.costPrice || '', categoryId: p.categoryId || '', productType: p.productType || 'SIMPLE', taxable: p.taxable ?? true, taxRate: p.taxRate || '19', description: p.description || '', brand: p.brand || '', model: p.model || '', color: p.color || '', material: p.material || '', gender: p.gender || '', season: p.season || '', saleUnitOfMeasure: p.saleUnitOfMeasure || '', conversionFactor: p.conversionFactor || '', sanitaryRegistration: p.sanitaryRegistration || '', warrantyDays: p.warrantyDays || '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try { await productService.deleteProduct(id); fetchProducts(); } catch (err) { setError(err.response?.data?.message || 'Error'); }
  };

  const resetForm = () => setForm({ name: '', sku: '', barcode: '', salePrice: '', costPrice: '', categoryId: '', productType: 'SIMPLE', taxable: true, taxRate: '19', description: '', brand: '', model: '', color: '', material: '', gender: '', season: '', saleUnitOfMeasure: '', conversionFactor: '', sanitaryRegistration: '', warrantyDays: '' });

  const fmt = (v) => v != null ? '$' + Number(v).toLocaleString('es-CO') : '$0';

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Productos</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Gestiona tu catálogo de productos y servicios</p>
        </div>
        <Button onClick={() => { setEditing(null); resetForm(); setShowModal(true); }}><Plus size={20} /><span>Nuevo Producto</span></Button>
      </div>

      <div className="glass-panel p-4 rounded-3xl"><Input className="flex-1" placeholder="Buscar por nombre, SKU o código..." icon={Search} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3"><AlertCircle className="text-red-400" size={20} /><span className="text-red-400 text-sm">{error}</span><button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-white"><X size={16} /></button></div>}

      {loading ? <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-primary-400" size={40} /></div> : (
        <div className="glass-panel rounded-3xl overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-2">
            {products.map((p) => (
              <div key={p.id} className="bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-white/5 p-5 rounded-3xl flex flex-col gap-4 relative group hover:bg-white/80 dark:hover:bg-slate-900/80 hover:border-primary-500/30 transition-all shadow-sm hover:shadow-lg hover:shadow-primary-900/5">
                {/* Header (Status / Category) */}
                <div className="flex justify-between items-start">
                  <span className="bg-primary-100 dark:bg-white/5 px-2 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase text-primary-700 dark:text-slate-300 truncate max-w-[60%]">
                    {p.categoryName || 'Sin categoría'}
                  </span>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase shrink-0 ${p.active !== false ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' : 'bg-red-500/10 text-red-500 dark:text-red-400'}`}>
                    {p.active !== false ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                {/* Main Content */}
                <div className="flex flex-col items-center text-center mt-2">
                  <div className="w-24 h-24 bg-primary-600/10 dark:bg-primary-600/20 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4 overflow-hidden shrink-0 shadow-inner">
                    {p.mainImageUrl ? (
                      <img src={p.mainImageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package size={36} className="opacity-80" />
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white line-clamp-2 leading-tight">{p.name}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 font-mono">{p.barcode || p.sku || 'Sin código'}</p>
                  <p className="text-[10px] text-primary-700 dark:text-primary-300 font-bold tracking-wider uppercase mt-2 bg-primary-100 dark:bg-primary-900/30 px-2 py-1 rounded-md">
                    {p.productType === 'RAW_MATERIAL' ? 'Insumo' : p.productType || 'SIMPLE'}
                  </p>
                </div>

                {/* Footer (Price / Actions) */}
                <div className="mt-auto pt-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Precio</span>
                    <span className="text-xl font-black text-slate-800 dark:text-white">{fmt(p.salePrice)}</span>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(p)} className="p-2.5 bg-slate-100 dark:bg-white/5 hover:bg-primary-500 hover:text-white rounded-xl text-slate-600 dark:text-slate-400 transition-all shadow-sm">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-2.5 bg-red-500/10 hover:bg-red-500 hover:text-white rounded-xl text-red-500 transition-all shadow-sm">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {products.length === 0 && <div className="text-center py-16 text-slate-500"><Package size={48} className="mx-auto mb-4 opacity-40" /><p>No se encontraron productos</p></div>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-bold text-slate-800 dark:text-white">{editing ? 'Editar Producto' : 'Nuevo Producto'}</h3><button onClick={() => setShowModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-white"><X size={20} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                <Input label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Código de Barras" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tipo de Producto *</label>
                  <select value={form.productType} onChange={(e) => setForm({ ...form, productType: e.target.value })} className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:border-primary-500 transition-colors [&>option]:bg-white dark:[&>option]:bg-white [&>option]:text-slate-800 dark:[&>option]:text-white">
                    <option value="SIMPLE" className="bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white">Producto Simple</option>
                    <option value="VARIABLE" className="bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white">Con Variantes</option>
                    <option value="SERVICE" className="bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white">Servicio</option>
                    <option value="DIGITAL" className="bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white">Digital</option>
                    <option value="BUNDLE" className="bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white">Combo/Paquete</option>
                    <option value="WEIGHTED" className="bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white">Por Peso</option>
                    <option value="VOLUME" className="bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white">Por Volumen</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Categoría</label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:border-primary-500 transition-colors [&>option]:bg-white dark:[&>option]:bg-white [&>option]:text-slate-800 dark:[&>option]:text-white">
                  <option value="" className="bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white">Sin categoría</option>
                  {categories.map(c => <option key={c.id} value={c.id} className="bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white">{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Precio Venta *" type="number" step="0.01" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} required />
                <Input label="Precio Costo" type="number" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
                <Input label="Impuesto %" type="number" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />
              </div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Descripción</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:border-primary-500 transition-colors h-20 resize-none shadow-sm shadow-primary-900/5 dark:shadow-none" /></div>
              {visibleFields.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10 pb-2">Información Adicional</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {showField('brand') && <Input label="Marca" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />}
                    {showField('model') && <Input label="Modelo/Referencia" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />}
                    {showField('color') && <Input label="Color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />}
                    {showField('material') && <Input label="Material" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} />}
                    {showField('gender') && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Género</label>
                        <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:border-primary-500 transition-colors [&>option]:bg-white dark:[&>option]:bg-white [&>option]:text-slate-800 dark:[&>option]:text-white">
                          <option value="">Seleccionar...</option>
                          <option value="Hombre">Hombre</option>
                          <option value="Mujer">Mujer</option>
                          <option value="Unisex">Unisex</option>
                          <option value="Niño">Niño</option>
                          <option value="Niña">Niña</option>
                        </select>
                      </div>
                    )}
                    {showField('season') && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Temporada</label>
                        <select value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:border-primary-500 transition-colors [&>option]:bg-white dark:[&>option]:bg-white [&>option]:text-slate-800 dark:[&>option]:text-white">
                          <option value="">Seleccionar...</option>
                          <option value="Primavera-Verano">Primavera-Verano</option>
                          <option value="Otoño-Invierno">Otoño-Invierno</option>
                          <option value="Todo el año">Todo el año</option>
                        </select>
                      </div>
                    )}
                    {showField('saleUnitOfMeasure') && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Unidad de Venta</label>
                        <select value={form.saleUnitOfMeasure} onChange={(e) => setForm({ ...form, saleUnitOfMeasure: e.target.value })} className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:border-primary-500 transition-colors [&>option]:bg-white dark:[&>option]:bg-white [&>option]:text-slate-800 dark:[&>option]:text-white">
                          <option value="">Seleccionar...</option>
                          <option value="Unidad">Unidad</option>
                          <option value="Caja">Caja</option>
                          <option value="Kg">Kg</option>
                          <option value="Lb">Lb</option>
                          <option value="Litro">Litro</option>
                          <option value="Metro">Metro</option>
                          <option value="Docena">Docena</option>
                          <option value="Paquete">Paquete</option>
                        </select>
                      </div>
                    )}
                    {showField('conversionFactor') && <Input label="Factor de Conversión" type="number" step="0.01" placeholder="Ej: 24 unidades por caja" value={form.conversionFactor} onChange={(e) => setForm({ ...form, conversionFactor: e.target.value })} />}
                    {showField('sanitaryRegistration') && <Input label="Registro Sanitario (INVIMA)" value={form.sanitaryRegistration} onChange={(e) => setForm({ ...form, sanitaryRegistration: e.target.value })} />}
                    {showField('warrantyDays') && <Input label="Garantía (días)" type="number" value={form.warrantyDays} onChange={(e) => setForm({ ...form, warrantyDays: e.target.value })} />}
                  </div>
                </div>
              )}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center gap-3">
                <Warehouse size={18} className="text-amber-400" />
                <p className="text-amber-300 text-xs">El stock se gestiona desde el módulo de <strong>Inventario</strong> por sucursal.</p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button>
                <Button type="submit" className="flex-1">{editing ? 'Actualizar' : 'Crear Producto'}</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
