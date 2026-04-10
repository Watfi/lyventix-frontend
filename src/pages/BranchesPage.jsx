import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Plus, Edit2, Trash2, X, Loader2, AlertCircle, MapPin, Phone, Mail, Star } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import useAuthStore from '../store/authStore';
import branchService from '../services/branchService';
import { useLanguage } from '../i18n/LanguageContext';
import ConfirmDialog from '../components/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';

const BranchesPage = () => {
  const { businessId } = useAuthStore();
  const { t } = useLanguage();
  const { confirm, dialogProps } = useConfirm();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: '', name: '', phone: '', email: '', address: '', city: '', state: '', postalCode: '', isMain: false });

  const fetch = async () => {
    if (!businessId) return;
    try { setLoading(true); const res = await branchService.getBranches(businessId); setBranches(res.data || []); }
    catch (err) { setError(err.response?.data?.message || 'Error al cargar sucursales'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [businessId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await branchService.updateBranch(businessId, editing.id, form); }
      else { await branchService.createBranch(businessId, form); }
      setShowModal(false); setEditing(null); setForm({ code: '', name: '', phone: '', email: '', address: '', city: '', state: '', postalCode: '', isMain: false }); fetch();
    } catch (err) { setError(err.response?.data?.message || 'Error al guardar'); }
  };

  const handleEdit = (b) => { setEditing(b); setForm({ code: b.code || '', name: b.name || '', phone: b.phone || '', email: b.email || '', address: b.address || '', city: b.city || '', state: b.state || '', postalCode: b.postalCode || '', isMain: b.isMain || false }); setShowModal(true); };
  const handleDelete = async (id) => { const ok = await confirm({ title: '¿Eliminar?', message: t('branches_confirm_delete') }); if (!ok) return; try { await branchService.deleteBranch(businessId, id); fetch(); } catch (err) { setError(err.response?.data?.message || 'Error'); } };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div><h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{t('branches_title')}</h2><p className="text-slate-500 dark:text-slate-400 mt-1">{t('branches_desc')}</p></div>
        <Button onClick={() => { setEditing(null); setForm({ code: '', name: '', phone: '', email: '', address: '', city: '', state: '', postalCode: '', isMain: false }); setShowModal(true); }}><Plus size={20} /><span>{t('branches_btn_new')}</span></Button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3"><AlertCircle className="text-red-400" size={20} /><span className="text-red-400 text-sm">{error}</span><button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-white"><X size={16} /></button></div>}

      {loading ? <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-primary-400" size={40} /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {branches.map((b) => (
            <motion.div key={b.id} whileHover={{ y: -4 }} className="glass-card p-6 rounded-3xl relative group">
              {b.isMain && <div className="absolute top-4 right-4 flex items-center gap-1 bg-amber-500/10 text-amber-400 text-xs font-bold px-2 py-1 rounded-lg"><Star size={12} /> {t('branches_status_main')}</div>}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-400"><Building2 size={28} /></div>
                <div><h4 className="text-slate-800 dark:text-white font-bold text-lg">{b.name}</h4><span className="text-slate-500 text-xs font-mono">{b.code}</span></div>
              </div>
              <div className="space-y-3">
                {b.address && <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm"><MapPin size={16} /><span className="truncate">{b.address}, {b.city}</span></div>}
                {b.phone && <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm"><Phone size={16} /><span>{b.phone}</span></div>}
                {b.email && <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm"><Mail size={16} /><span className="truncate">{b.email}</span></div>}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${b.active !== false ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{b.active !== false ? t('active') : t('inactive')}</span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(b)} className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-500 dark:text-slate-400 hover:text-white transition-colors"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(b.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
            </motion.div>
          ))}
          {branches.length === 0 && <div className="col-span-full text-center py-16 text-slate-500"><Building2 size={48} className="mx-auto mb-4 opacity-40" /><p>{t('branches_no_found')}</p></div>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel rounded-3xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-bold text-slate-800 dark:text-white">{editing ? t('branches_modal_edit_title') : t('branches_modal_new_title')}</h3><button onClick={() => setShowModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-white"><X size={20} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label={t('branches_form_code')} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
                <Input label={t('name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label={t('phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <Input label={t('email')} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <Input label={t('address')} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <Input label={t('city')} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                <Input label={t('branches_form_state')} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </div>
              <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={form.isMain} onChange={(e) => setForm({ ...form, isMain: e.target.checked })} className="w-4 h-4 rounded border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-primary-600" /><span className="text-slate-600 dark:text-slate-300 text-sm">{t('branches_form_main')}</span></label>
              <div className="flex gap-3 pt-4"><Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">{t('cancel')}</Button><Button type="submit" className="flex-1">{editing ? t('update') : t('create')}</Button></div>
            </form>
          </motion.div>
        </div>
      )}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
};

export default BranchesPage;
