import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, MapPin, CheckCircle2 } from 'lucide-react';
import useAuthStore from '../store/authStore';
import branchService from '../services/branchService';

const BranchSelectorModal = () => {
  const { user, businessId, setBranch } = useAuthStore();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show modal if user is authenticated but has no branchId selected in this session
    if (user && businessId && !sessionStorage.getItem('branchSelected')) {
      setLoading(true);
      branchService.getBranches(businessId)
        .then(res => {
          const list = res.data?.content || res.data || [];
          setBranches(list);
          // If only 1 branch, auto-select and skip modal
          if (list.length <= 1) {
            if (list.length === 1) {
              setBranch(list[0].id, list[0].name);
            }
            sessionStorage.setItem('branchSelected', 'true');
            setShow(false);
          } else {
            setShow(true);
          }
        })
        .catch(() => {
          sessionStorage.setItem('branchSelected', 'true');
          setShow(false);
        })
        .finally(() => setLoading(false));
    }
  }, [user, businessId]);

  const handleSelect = (branch) => {
    setBranch(branch.id, branch.name);
    sessionStorage.setItem('branchSelected', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-lg shadow-2xl border border-white/10"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Building2 size={28} className="text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Selecciona tu Sucursal</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">¿Desde qué sucursal estás operando hoy?</p>
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-400">Cargando sucursales...</div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {branches.map((branch) => (
                <button
                  key={branch.id}
                  onClick={() => handleSelect(branch)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left hover:scale-[1.01] ${
                    user?.branchId === branch.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-slate-200 dark:border-white/10 hover:border-primary-300 dark:hover:border-primary-500/30'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                    <Building2 size={20} className="text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-white">{branch.name}</p>
                    {branch.address && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                        <MapPin size={10} /> {branch.address}{branch.city ? `, ${branch.city}` : ''}
                      </p>
                    )}
                    {branch.isMain && (
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30 px-2 py-0.5 rounded-full">
                        Principal
                      </span>
                    )}
                  </div>
                  {user?.branchId === branch.id && (
                    <CheckCircle2 size={20} className="text-primary-500 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BranchSelectorModal;
