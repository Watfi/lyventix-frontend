import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Truck, Search, Plus, Edit2, Trash2, X, Loader2, AlertCircle, Mail, Phone, User } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import useAuthStore from '../store/authStore';
import supplierService from '../services/supplierService';
import { useLanguage } from '../i18n/LanguageContext';

const SuppliersPage = () => {
  const { businessId } = useAuthStore();
  const { t } = useLanguage();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', taxId: '', email: '', phone: '', address: '', contactName: '', paymentTerms: '' });

  const fetchData = async () => {
    if (!businessId) return;
    try { setLoading(true); const params = searchTerm ? { search: searchTerm } : {}; const res = await supplierService.getSuppliers(businessId, params); setSuppliers(res.data.content || res.data || []); }
    catch (err) { setError(err.response?.data?.message || 'Error al cargar proveedores'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [businessId]);
  useEffect(() => { const t = setTimeout(() => fetchData(), 400); return () => clearTimeout(t); }, [searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await supplierService.updateSupplier(editing.id, form); }
      else { await supplierService.createSupplier(businessId, form); }
      setShowModal(false); setEditing(null); setForm({ name: '', taxId: '', email: '', phone: '', address: '', contactName: '', paymentTerms: '' }); fetchData();
    } catch (err) { setError(err.response?.data?.message || 'Error'); }
  };

  const handleEdit = (s) => { setEditing(s); setForm({ name: s.name || '', taxId: s.taxId || '', email: s.email || '', phone: s.phone || '', address: s.address || '', contactName: s.contactName || '', paymentTerms: s.paymentTerms || '' }); setShowModal(true); };
  const handleDelete = async (id) => { if (!confirm(t('suppliers_confirm_delete'))) return; try { await supplierService.deleteSupplier(id); fetchData(); } catch (err) { setError(err.response?.data?.message || 'Error'); } };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div><h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{t('suppliers_title')}</h2><p className="text-slate-500 dark:text-slate-400 mt-1">{t('suppliers_desc')}</p></div>
        <Button onClick={() => { setEditing(null); setForm({ name: '', taxId: '', email: '', phone: '', address: '', contactName: '', paymentTerms: '' }); setShowModal(true); }}><Plus size={20} /><span>{t('suppliers_btn_new')}</span></Button>
      </div>

      <div className="glass-panel p-4 rounded-3xl"><Input className="flex-1" placeholder={t('suppliers_search_placeholder')} icon={Search} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3"><AlertCircle className="text-red-400" size={20} /><span className="text-red-400 text-sm">{error}</span><button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-white"><X size={16} /></button></div>}

      {loading ? <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-primary-400" size={40} /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {suppliers.map((s) => (
            <motion.div key={s.id} whileHover={{ y: -4 }} className="glass-card p-6 rounded-3xl relative group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-orange-600/20 rounded-2xl flex items-center justify-center text-orange-400"><Truck size={28} /></div>
                <div><h4 className="text-slate-800 dark:text-white font-bold text-lg">{s.name}</h4>{s.taxId && <span className="text-slate-500 text-xs">NIT: {s.taxId}</span>}</div>
              </div>
              <div className="space-y-3">
                {s.contactName && <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm"><User size={16} /><span>{s.contactName}</span></div>}
                {s.email && <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm"><Mail size={16} /><span className="truncate">{s.email}</span></div>}
                {s.phone && <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm"><Phone size={16} /><span>{s.phone}</span></div>}
              </div>
              {s.paymentTerms && <div className="mt-4 bg-slate-100 dark:bg-white/5 px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300">Condiciones: {s.paymentTerms}</div>}
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${s.active !== false ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{s.active !== false ? t('active') : t('inactive')}</span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(s)} className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-500 dark:text-slate-400 hover:text-white transition-colors"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(s.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
            </motion.div>
          ))}
          {suppliers.length === 0 && <div className="col-span-full text-center py-16 text-slate-500"><Truck size={48} className="mx-auto mb-4 opacity-40" /><p>{t('suppliers_no_found')}</p></div>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel rounded-3xl p-8 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-bold text-slate-800 dark:text-white">{editing ? t('suppliers_modal_edit_title') : t('suppliers_modal_new_title')}</h3><button onClick={() => setShowModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-white"><X size={20} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label={t('suppliers_form_name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <div className="grid grid-cols-2 gap-4">
                <Input label={t('suppliers_form_taxid')} value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
                <Input label={t('suppliers_form_contact')} value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label={t('email')} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <Input label={t('phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <Input label={t('address')} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              <Input label={t('suppliers_form_payment_terms')} value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} placeholder={t('suppliers_payment_placeholder')} />
              <div className="flex gap-3 pt-4"><Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">{t('cancel')}</Button><Button type="submit" className="flex-1">{editing ? t('update') : t('create')}</Button></div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SuppliersPage;
