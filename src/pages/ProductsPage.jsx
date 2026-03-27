import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Search, Plus, Edit2, Trash2, X, Loader2, AlertCircle, Warehouse, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import useAuthStore from '../store/authStore';
import productService from '../services/productService';
import categoryService from '../services/categoryService';

const CLOTHING_SIZES = {
  Ropa: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
  Zapatos: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
  'Niños Ropa': ['2', '4', '6', '8', '10', '12', '14', '16'],
  'Niños Zapatos': ['20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34'],
  Pantalones: ['28', '30', '32', '34', '36', '38', '40', '42'],
};

const COMMON_COLORS = ['Negro', 'Blanco', 'Azul', 'Rojo', 'Verde', 'Amarillo', 'Gris', 'Rosado', 'Morado', 'Beige', 'Café', 'Naranja'];

const selectClasses = "w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:border-primary-500 transition-colors [&>option]:text-slate-800 dark:[&>option]:text-white";

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
  const showVariants = businessType === 'CLOTHING_STORE' || businessType === 'OTHER';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const emptyForm = { name: '', sku: '', barcode: '', salePrice: '', costPrice: '', categoryId: '', productType: 'SIMPLE', taxable: true, taxRate: '19', description: '', brand: '', model: '', color: '', material: '', gender: '', season: '', saleUnitOfMeasure: '', conversionFactor: '', sanitaryRegistration: '', warrantyDays: '' };
  const [form, setForm] = useState(emptyForm);

  // Variants state
  const [variants, setVariants] = useState([]);
  const [showVariantBuilder, setShowVariantBuilder] = useState(false);
  const [sizeType, setSizeType] = useState('Ropa');
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [customSize, setCustomSize] = useState('');
  const [customColor, setCustomColor] = useState('');

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

  const generateVariantsFromSelection = () => {
    const newVariants = [];
    const sizes = selectedSizes.length > 0 ? selectedSizes : [''];
    const colors = selectedColors.length > 0 ? selectedColors : [''];

    for (const size of sizes) {
      for (const color of colors) {
        const parts = [size, color].filter(Boolean);
        const name = parts.join(' / ') || 'Variante';
        // Don't add duplicates
        if (!variants.find(v => v.attribute1Value === size && v.attribute2Value === color) &&
            !newVariants.find(v => v.attribute1Value === size && v.attribute2Value === color)) {
          newVariants.push({
            name,
            variantSku: '',
            variantBarcode: '',
            attribute1Name: size ? 'Talla' : '',
            attribute1Value: size,
            attribute2Name: color ? 'Color' : '',
            attribute2Value: color,
            attribute3Name: '',
            attribute3Value: '',
            variantPrice: '',
            stockQuantity: 0,
            active: true,
          });
        }
      }
    }
    setVariants([...variants, ...newVariants]);
    setShowVariantBuilder(false);
  };

  const removeVariant = (idx) => setVariants(variants.filter((_, i) => i !== idx));
  const updateVariant = (idx, field, value) => {
    const updated = [...variants];
    updated[idx] = { ...updated[idx], [field]: value };
    updated[idx].name = [updated[idx].attribute1Value, updated[idx].attribute2Value].filter(Boolean).join(' / ') || 'Variante';
    setVariants(updated);
  };

  const toggleSize = (s) => setSelectedSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleColor = (c) => setSelectedColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  const addCustomSize = () => { if (customSize.trim() && !selectedSizes.includes(customSize.trim())) { setSelectedSizes([...selectedSizes, customSize.trim()]); setCustomSize(''); } };
  const addCustomColor = () => { if (customColor.trim() && !selectedColors.includes(customColor.trim())) { setSelectedColors([...selectedColors, customColor.trim()]); setCustomColor(''); } };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const hasVariants = form.productType === 'VARIABLE' && variants.length > 0;
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
        hasVariants,
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
        variants: hasVariants ? variants.map(v => {
          const basePrice = parseFloat(form.salePrice) || 0;
          const vPrice = parseFloat(v.variantPrice);
          const adjustment = !isNaN(vPrice) && vPrice > 0 ? vPrice - basePrice : 0;
          return {
            name: v.name,
            variantSku: v.variantSku || null,
            variantBarcode: v.variantBarcode || null,
            attribute1Name: v.attribute1Name || null,
            attribute1Value: v.attribute1Value || null,
            attribute2Name: v.attribute2Name || null,
            attribute2Value: v.attribute2Value || null,
            attribute3Name: v.attribute3Name || null,
            attribute3Value: v.attribute3Value || null,
            priceAdjustment: adjustment,
            stockQuantity: parseInt(v.stockQuantity) || 0,
            active: v.active !== false,
          };
        }) : null,
      };
      if (editing) { await productService.updateProduct(editing.id, payload); }
      else { await productService.createProduct(businessId, payload); }
      setShowModal(false); setEditing(null); resetForm(); fetchProducts();
    } catch (err) {
      console.error('Error guardando producto:', err.response?.status, err.response?.data, err);
      setError(err.response?.data?.message || err.message || 'Error al guardar producto');
    }
  };

  const handleEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name || '', sku: p.sku || '', barcode: p.barcode || '', salePrice: p.salePrice || '', costPrice: p.costPrice || '', categoryId: p.categoryId || '', productType: p.productType || 'SIMPLE', taxable: p.taxable ?? true, taxRate: p.taxRate || '19', description: p.description || '', brand: p.brand || '', model: p.model || '', color: p.color || '', material: p.material || '', gender: p.gender || '', season: p.season || '', saleUnitOfMeasure: p.saleUnitOfMeasure || '', conversionFactor: p.conversionFactor || '', sanitaryRegistration: p.sanitaryRegistration || '', warrantyDays: p.warrantyDays || '' });
    // Load existing variants - convert priceAdjustment to absolute price
    if (p.variants && p.variants.length > 0) {
      const basePrice = parseFloat(p.salePrice) || 0;
      setVariants(p.variants.map(v => ({
        name: v.name || '',
        variantSku: v.variantSku || '',
        variantBarcode: v.variantBarcode || '',
        attribute1Name: v.attribute1Name || '',
        attribute1Value: v.attribute1Value || '',
        attribute2Name: v.attribute2Name || '',
        attribute2Value: v.attribute2Value || '',
        attribute3Name: v.attribute3Name || '',
        attribute3Value: v.attribute3Value || '',
        variantPrice: basePrice + (parseFloat(v.priceAdjustment) || 0),
        stockQuantity: v.stockQuantity || 0,
        active: v.active !== false,
      })));
    } else {
      setVariants([]);
    }
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try { await productService.deleteProduct(id); fetchProducts(); } catch (err) { setError(err.response?.data?.message || 'Error'); }
  };

  const resetForm = () => { setForm(emptyForm); setVariants([]); setSelectedSizes([]); setSelectedColors([]); };

  const handleSeedCategories = async () => {
    try {
      await categoryService.seedDefaults(businessId);
      fetchCategories();
    } catch (err) { setError(err.response?.data?.message || 'Error al generar categorías'); }
  };

  const fmt = (v) => v != null ? '$' + Number(v).toLocaleString('es-CO') : '$0';

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Productos</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Gestiona tu catálogo de productos y servicios</p>
        </div>
        <div className="flex gap-3">
          {categories.length === 0 && (
            <Button variant="outline" onClick={handleSeedCategories}>
              <Layers size={18} /><span>Generar Categorías</span>
            </Button>
          )}
          <Button onClick={() => { setEditing(null); resetForm(); setShowModal(true); }}><Plus size={20} /><span>Nuevo Producto</span></Button>
        </div>
      </div>

      <div className="glass-panel p-4 rounded-3xl"><Input className="flex-1" placeholder="Buscar por nombre, SKU o código..." icon={Search} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3"><AlertCircle className="text-red-400" size={20} /><span className="text-red-400 text-sm">{error}</span><button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-white"><X size={16} /></button></div>}

      {loading ? <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-primary-400" size={40} /></div> : (
        <div className="glass-panel rounded-3xl overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-2">
            {products.map((p) => (
              <div key={p.id} className="bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-white/5 p-5 rounded-3xl flex flex-col gap-4 relative group hover:bg-white/80 dark:hover:bg-slate-900/80 hover:border-primary-500/30 transition-all shadow-sm hover:shadow-lg hover:shadow-primary-900/5">
                <div className="flex justify-between items-start">
                  <span className="bg-primary-100 dark:bg-white/5 px-2 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase text-primary-700 dark:text-slate-300 truncate max-w-[60%]">
                    {p.categoryName || 'Sin categoría'}
                  </span>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase shrink-0 ${p.active !== false ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' : 'bg-red-500/10 text-red-500 dark:text-red-400'}`}>
                    {p.active !== false ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
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
                  {p.hasVariants && p.variants?.length > 0 && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{p.variants.length} variante{p.variants.length !== 1 ? 's' : ''}</p>
                  )}
                </div>
                <div className="mt-auto pt-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Precio</span>
                    <span className="text-xl font-black text-slate-800 dark:text-white">{fmt(p.salePrice)}</span>
                  </div>
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

      {/* Modal */}
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
                  <select value={form.productType} onChange={(e) => setForm({ ...form, productType: e.target.value })} className={selectClasses}>
                    <option value="SIMPLE">Producto Simple</option>
                    <option value="VARIABLE">Con Variantes (Tallas/Colores)</option>
                    <option value="SERVICE">Servicio</option>
                    <option value="DIGITAL">Digital</option>
                    <option value="BUNDLE">Combo/Paquete</option>
                    <option value="WEIGHTED">Por Peso</option>
                    <option value="VOLUME">Por Volumen</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Categoría</label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className={selectClasses}>
                  <option value="">Sin categoría</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Precio Venta *" type="number" step="0.01" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} required />
                <Input label="Precio Costo" type="number" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
                <Input label="Impuesto %" type="number" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />
              </div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Descripción</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:border-primary-500 transition-colors h-20 resize-none shadow-sm shadow-primary-900/5 dark:shadow-none" /></div>

              {/* Additional fields by business type */}
              {visibleFields.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10 pb-2">Información Adicional</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {showField('brand') && <Input label="Marca" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />}
                    {showField('model') && <Input label="Modelo/Referencia" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />}
                    {showField('color') && form.productType !== 'VARIABLE' && <Input label="Color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />}
                    {showField('material') && <Input label="Material" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} />}
                    {showField('gender') && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Género</label>
                        <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={selectClasses}>
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
                        <select value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} className={selectClasses}>
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
                        <select value={form.saleUnitOfMeasure} onChange={(e) => setForm({ ...form, saleUnitOfMeasure: e.target.value })} className={selectClasses}>
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

              {/* Variants section for VARIABLE product type */}
              {form.productType === 'VARIABLE' && showVariants && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Layers size={16} /> Variantes (Tallas y Colores)
                    </h4>
                    <button type="button" onClick={() => setShowVariantBuilder(!showVariantBuilder)} className="text-xs text-primary-500 hover:text-primary-400 font-semibold flex items-center gap-1">
                      {showVariantBuilder ? <><ChevronUp size={14} /> Cerrar</> : <><Plus size={14} /> Agregar Tallas/Colores</>}
                    </button>
                  </div>

                  {/* Quick variant builder */}
                  {showVariantBuilder && (
                    <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 space-y-4 border border-slate-200 dark:border-white/10">
                      {/* Size type selector */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Tipo de Talla</label>
                        <div className="flex flex-wrap gap-2">
                          {Object.keys(CLOTHING_SIZES).map(type => (
                            <button key={type} type="button" onClick={() => { setSizeType(type); setSelectedSizes([]); }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${sizeType === type ? 'bg-primary-500 text-white' : 'bg-white dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10'}`}>
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Size chips */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Seleccionar Tallas</label>
                        <div className="flex flex-wrap gap-2">
                          {CLOTHING_SIZES[sizeType].map(s => (
                            <button key={s} type="button" onClick={() => toggleSize(s)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedSizes.includes(s) ? 'bg-primary-500 text-white shadow-md' : 'bg-white dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:border-primary-400'}`}>
                              {s}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <input value={customSize} onChange={(e) => setCustomSize(e.target.value)} placeholder="Talla personalizada..." onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSize())}
                            className="flex-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none" />
                          <button type="button" onClick={addCustomSize} className="px-3 py-1.5 bg-slate-200 dark:bg-white/10 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-primary-500 hover:text-white transition-all">+</button>
                        </div>
                      </div>

                      {/* Color chips */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Seleccionar Colores</label>
                        <div className="flex flex-wrap gap-2">
                          {COMMON_COLORS.map(c => (
                            <button key={c} type="button" onClick={() => toggleColor(c)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedColors.includes(c) ? 'bg-primary-500 text-white shadow-md' : 'bg-white dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:border-primary-400'}`}>
                              {c}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <input value={customColor} onChange={(e) => setCustomColor(e.target.value)} placeholder="Color personalizado..." onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomColor())}
                            className="flex-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none" />
                          <button type="button" onClick={addCustomColor} className="px-3 py-1.5 bg-slate-200 dark:bg-white/10 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-primary-500 hover:text-white transition-all">+</button>
                        </div>
                      </div>

                      {/* Preview & Generate */}
                      {(selectedSizes.length > 0 || selectedColors.length > 0) && (
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-white/10">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Se generarán <strong className="text-primary-500">{Math.max(selectedSizes.length, 1) * Math.max(selectedColors.length, 1)}</strong> variante(s)
                          </span>
                          <button type="button" onClick={generateVariantsFromSelection}
                            className="px-4 py-2 bg-primary-500 text-white rounded-xl text-xs font-bold hover:bg-primary-600 transition-all shadow-md">
                            Generar Variantes
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Existing variants list */}
                  {variants.length > 0 && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-[1fr_1fr_100px_32px] gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
                        <span>Talla</span><span>Color</span><span>Precio Venta</span><span></span>
                      </div>
                      {variants.map((v, idx) => (
                        <div key={idx} className="grid grid-cols-[1fr_1fr_100px_32px] gap-2 items-center bg-white dark:bg-white/5 rounded-xl p-2 border border-slate-200 dark:border-white/10">
                          <input value={v.attribute1Value} onChange={(e) => updateVariant(idx, 'attribute1Value', e.target.value)} placeholder="Talla"
                            className="bg-transparent text-sm text-slate-800 dark:text-white outline-none px-2 py-1 rounded-lg border border-transparent focus:border-primary-500" />
                          <input value={v.attribute2Value} onChange={(e) => updateVariant(idx, 'attribute2Value', e.target.value)} placeholder="Color"
                            className="bg-transparent text-sm text-slate-800 dark:text-white outline-none px-2 py-1 rounded-lg border border-transparent focus:border-primary-500" />
                          <input type="number" value={v.variantPrice} onChange={(e) => updateVariant(idx, 'variantPrice', e.target.value)} placeholder={form.salePrice || '0'}
                            className="bg-transparent text-sm text-slate-800 dark:text-white outline-none px-2 py-1 rounded-lg border border-transparent focus:border-primary-500 text-center" />
                          <button type="button" onClick={() => removeVariant(idx)} className="p-1 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 px-1">
                        Deja vacío para usar el precio base del producto
                      </p>
                    </div>
                  )}

                  {/* Manual add single variant */}
                  {!showVariantBuilder && (
                    <button type="button" onClick={() => setVariants([...variants, { name: '', attribute1Name: 'Talla', attribute1Value: '', attribute2Name: 'Color', attribute2Value: '', attribute3Name: '', attribute3Value: '', variantPrice: '', stockQuantity: 0, variantSku: '', variantBarcode: '', active: true }])}
                      className="text-xs text-primary-500 hover:text-primary-400 font-semibold flex items-center gap-1">
                      <Plus size={14} /> Agregar variante manual
                    </button>
                  )}
                </div>
              )}

              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3 flex items-center gap-3">
                <Warehouse size={18} className="text-amber-600 dark:text-amber-400" />
                <p className="text-amber-700 dark:text-amber-300 text-xs">El stock se gestiona desde el módulo de <strong>Inventario</strong> por sucursal.</p>
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
