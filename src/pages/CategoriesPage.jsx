import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tag, Plus, Edit2, Trash2, X, Loader2, AlertCircle } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import useAuthStore from '../store/authStore';
import categoryService from '../services/categoryService';

const CategoriesPage = () => {
  const { businessId } = useAuthStore();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', code: '', color: '#3b82f6', icon: '', displayOrder: '' });

  const fetchData = async () => {
    if (!businessId) return;
    try { setLoading(true); const res = await categoryService.getCategories(businessId); setCategories(res.data.content || res.data || []); }
    catch (err) { setError(err.response?.data?.message || 'Error al cargar categorías'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [businessId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, displayOrder: parseInt(form.displayOrder) || 0 };
      if (editing) { await categoryService.updateCategory(editing.id, payload); }
      else { await categoryService.createCategory(businessId, payload); }
      setShowModal(false); setEditing(null); setForm({ name: '', description: '', code: '', color: '#3b82f6', icon: '', displayOrder: '' }); fetchData();
    } catch (err) { setError(err.response?.data?.message || 'Error al guardar'); }
  };

  const handleEdit = (c) => { setEditing(c); setForm({ name: c.name || '', description: c.description || '', code: c.code || '', color: c.color || '#3b82f6', icon: c.icon || '', displayOrder: c.displayOrder || '' }); setShowModal(true); };
  const handleDelete = async (id) => { if (!confirm('¿Eliminar esta categoría?')) return; try { await categoryService.deleteCategory(id); fetchData(); } catch (err) { setError(err.response?.data?.message || 'Error'); } };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div><h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Categorías</h2><p className="text-slate-500 dark:text-slate-400 mt-1">Organiza tus productos por categorías</p></div>
        <Button onClick={() => { setEditing(null); setForm({ name: '', description: '', code: '', color: '#3b82f6', icon: '', displayOrder: '' }); setShowModal(true); }}><Plus size={20} /><span>Nueva Categoría</span></Button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3"><AlertCircle className="text-red-400" size={20} /><span className="text-red-400 text-sm">{error}</span><button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-white"><X size={16} /></button></div>}

      {loading ? <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-primary-400" size={40} /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {categories.map((c) => (
            <motion.div key={c.id} whileHover={{ y: -4 }} className="glass-card p-6 rounded-3xl relative group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: (c.color || '#3b82f6') + '20', color: c.color || '#3b82f6' }}><Tag size={24} /></div>
                <div><h4 className="text-slate-800 dark:text-white font-bold text-lg">{c.name}</h4>{c.code && <span className="text-slate-500 text-xs font-mono">{c.code}</span>}</div>
              </div>
              {c.description && <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{c.description}</p>}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/5">
                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${c.active !== false ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{c.active !== false ? 'Activa' : 'Inactiva'}</span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(c)} className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-500 dark:text-slate-400 hover:text-white transition-colors"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
            </motion.div>
          ))}
          {categories.length === 0 && <div className="col-span-full text-center py-16 text-slate-500"><Tag size={48} className="mx-auto mb-4 opacity-40" /><p>No hay categorías creadas</p></div>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel rounded-3xl p-8 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-bold text-slate-800 dark:text-white">{editing ? 'Editar Categoría' : 'Nueva Categoría'}</h3><button onClick={() => setShowModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-white"><X size={20} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Código" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
                <div><label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Color</label><input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full h-12 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent cursor-pointer" /></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Descripción</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:border-primary-500 h-20 resize-none" /></div>
              <div className="flex gap-3 pt-4"><Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button><Button type="submit" className="flex-1">{editing ? 'Actualizar' : 'Crear'}</Button></div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
