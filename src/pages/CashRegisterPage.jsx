import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  Unlock,
  Lock,
  ArrowUpRight,
  History,
  AlertCircle,
  Loader2,
  X,
  Calendar,
  Building2,
  RefreshCw
} from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import cashService from '../services/cashService';
import branchService from '../services/branchService';
import useAuthStore from '../store/authStore';
import { useLanguage } from '../i18n/LanguageContext';

const CashRegisterPage = () => {
  const { user, businessId, setBranch } = useAuthStore();
  const { t } = useLanguage();
  const [session, setSession] = useState(null);
  const [cashRegister, setCashRegister] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('');
  const [closingAmount, setClosingAmount] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [resolvedBranchId, setResolvedBranchId] = useState(null);

  const resolveBranchId = useCallback(async () => {
    if (user?.branchId) return user.branchId;
    try {
      const res = await branchService.getBranches(businessId);
      const branches = res.data?.content || res.data || [];
      if (branches.length > 0) {
        setBranch(branches[0].id, branches[0].name);
        return branches[0].id;
      }
    } catch { /* ignore */ }
    return null;
  }, [user?.branchId, businessId]);

  const getOrCreateRegister = async (branchId) => {
    if (!branchId) return null;
    try {
      const res = await cashService.getRegisters(branchId);
      const registers = res.data || [];
      if (registers.length > 0) return registers[0];
      const createRes = await cashService.createRegister({
        name: 'Caja Principal',
        code: 'CAJA-' + branchId.substring(0, 6).toUpperCase(),
        branchId,
      });
      return createRes.data;
    } catch (err) {
      console.error('Error getting/creating register:', err);
      return null;
    }
  };

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const branchId = await resolveBranchId();
      setResolvedBranchId(branchId);
      const register = await getOrCreateRegister(branchId);
      setCashRegister(register);

      // Fetch current session
      try {
        const response = await cashService.getCurrentSession();
        setSession(response.data);
      } catch (err) {
        if (err.response?.status === 404) {
          setSession(null);
        } else {
          throw err;
        }
      }

      // Fetch history
      if (branchId) {
        try {
          const histRes = await cashService.getSessionHistory(branchId);
          setSessionHistory(histRes.data || []);
        } catch { setSessionHistory([]); }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar sesión de caja');
    } finally {
      setLoading(false);
    }
  }, [resolveBranchId]);

  useEffect(() => {
    fetchAll();
  }, []);

  // Auto-refresh session every 15 seconds while open
  useEffect(() => {
    if (!session || session.status !== 'OPEN') return;
    const interval = setInterval(async () => {
      try {
        const res = await cashService.getCurrentSession();
        setSession(res.data);
      } catch { /* ignore */ }
    }, 15000);
    return () => clearInterval(interval);
  }, [session?.id]);

  const handleOpenSession = async (e) => {
    e.preventDefault();
    if (!cashRegister) {
      setError('No se encontró una caja registradora. Verifica tu sucursal.');
      return;
    }
    try {
      setActionLoading(true);
      await cashService.openSession({
        cashRegisterId: cashRegister.id,
        openingBalance: parseFloat(openingAmount) || 0,
      });
      setShowOpenModal(false);
      setOpeningAmount('');
      await fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al abrir sesión');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseSession = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const actualBalance = parseFloat(closingAmount) || 0;
      await cashService.closeSession(session.id, actualBalance, closingNotes || null);
      setShowCloseModal(false);
      setClosingAmount('');
      setClosingNotes('');
      await fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cerrar sesión');
    } finally {
      setActionLoading(false);
    }
  };

  const isSessionOpen = session && session.status === 'OPEN';

  const fmt = (val) => {
    if (val == null) return '$0';
    return '$' + Number(val).toLocaleString('es-CO', { minimumFractionDigits: 0 });
  };

  const parseDate = (val) => {
    if (!val) return null;
    if (Array.isArray(val)) return new Date(val[0], (val[1] || 1) - 1, val[2] || 1, val[3] || 0, val[4] || 0, val[5] || 0);
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  const fmtDate = (val) => {
    const d = parseDate(val);
    if (!d) return '-';
    return d.toLocaleString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary-400" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{t('cash_title')}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {t('cash_desc')}
            {user?.branchName && <span className="ml-2 text-primary-500 font-semibold">• {user.branchName}</span>}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchAll} className="px-3">
            <RefreshCw size={18} />
          </Button>
          <Button
            variant={isSessionOpen ? 'outline' : 'primary'}
            onClick={isSessionOpen ? () => {
              setClosingAmount(String(session?.expectedBalance || session?.openingBalance || 0));
              setShowCloseModal(true);
            } : () => setShowOpenModal(true)}
            loading={actionLoading}
          >
            {isSessionOpen ? <Lock size={20} /> : <Unlock size={20} />}
            <span>{isSessionOpen ? t('cash_close_btn') : t('cash_open_btn')}</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="text-red-400" size={20} />
          <span className="text-red-400 text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-white"><X size={16} /></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Wallet size={120} />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">{t('cash_expected_balance')}</p>
              <h3 className="text-4xl font-bold text-slate-800 dark:text-white mt-2">
                {isSessionOpen ? fmt(session?.expectedBalance || session?.openingBalance) : fmt(0)}
              </h3>
              {isSessionOpen && (
                <div className="flex flex-col gap-2 mt-6">
                  <div className="flex items-center gap-1 text-emerald-400 text-sm font-semibold">
                    <ArrowUpRight size={16} /> Apertura: {fmt(session?.openingBalance)}
                  </div>
                  <div className="flex items-center gap-1 text-blue-400 text-sm font-semibold">
                    <ArrowUpRight size={16} /> Ventas: {fmt((session?.expectedBalance || 0) - (session?.openingBalance || 0))}
                  </div>
                </div>
              )}
            </div>

            <div className="glass-panel p-8 rounded-3xl">
              <p className="text-slate-500 dark:text-slate-400 font-medium">Estado de Sesión</p>
              <div className="flex items-center gap-3 mt-4">
                <div className={`w-3 h-3 rounded-full ${isSessionOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  {isSessionOpen ? t('cash_session_open') : t('cash_session_closed')}
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-4">
                {isSessionOpen
                  ? `Abierta el ${fmtDate(session?.openingDate)}`
                  : t('cash_no_active')}
              </p>
            </div>
          </div>

          {/* Historial de Sesiones */}
          <div className="glass-panel rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-white/[0.02]">
              <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <History size={18} className="text-primary-400" />
                {t('cash_history_title')}
              </h4>
            </div>
            {/* Mobile card view */}
            <div className="lg:hidden p-4 space-y-3">
              {sessionHistory.length > 0 ? sessionHistory.map((s) => (
                <div key={s.id} className="bg-white/40 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/5 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      s.status === 'OPEN'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'OPEN' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      {s.status === 'OPEN' ? t('cash_session_open') : t('cash_session_closed')}
                    </span>
                    <span className="text-slate-500 text-xs">{s.user?.username || s.user?.firstName || '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-xs mb-2">
                    <Calendar size={11} className="text-slate-400" />
                    <span>{fmtDate(s.openingDate)}</span>
                  </div>
                  {s.closingDate && <p className="text-slate-500 text-xs mb-3">Cierre: {fmtDate(s.closingDate)}</p>}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-2">
                      <p className="text-slate-500">{t('cash_col_opening_amount')}</p>
                      <p className="text-slate-800 dark:text-white font-bold">{fmt(s.openingBalance)}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-2">
                      <p className="text-slate-500">{t('cash_col_expected')}</p>
                      <p className="text-blue-500 font-bold">{fmt(s.expectedBalance)}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-2">
                      <p className="text-slate-500">{t('cash_col_actual')}</p>
                      <p className="text-slate-800 dark:text-white font-bold">{s.actualBalance != null ? fmt(s.actualBalance) : '-'}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-2">
                      <p className="text-slate-500">{t('cash_col_profit')}</p>
                      <p className="text-amber-500 font-bold">{s.expectedBalance != null && s.openingBalance != null ? fmt(Number(s.expectedBalance) - Number(s.openingBalance)) : '-'}</p>
                    </div>
                  </div>
                  {s.difference != null && (
                    <div className="mt-2 text-center">
                      <span className={`text-xs font-bold ${Number(s.difference) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {t('cash_col_difference')}: {Number(s.difference) > 0 ? '+' : ''}{fmt(s.difference)}
                      </span>
                    </div>
                  )}
                </div>
              )) : (
                <p className="text-slate-500 text-center py-8">{t('cash_history_empty')}</p>
              )}
            </div>

            {/* Desktop table view */}
            <div className="overflow-x-auto hidden lg:block">
              {sessionHistory.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/5">
                      <th className="text-left p-4 text-slate-500 dark:text-slate-400 font-medium">{t('cash_col_status')}</th>
                      <th className="text-left p-4 text-slate-500 dark:text-slate-400 font-medium">{t('cash_col_opening')}</th>
                      <th className="text-left p-4 text-slate-500 dark:text-slate-400 font-medium">{t('cash_col_closing')}</th>
                      <th className="text-right p-4 text-slate-500 dark:text-slate-400 font-medium">{t('cash_col_opening_amount')}</th>
                      <th className="text-right p-4 text-slate-500 dark:text-slate-400 font-medium">{t('cash_col_expected')}</th>
                      <th className="text-right p-4 text-slate-500 dark:text-slate-400 font-medium">{t('cash_col_actual')}</th>
                      <th className="text-right p-4 text-slate-500 dark:text-slate-400 font-medium">{t('cash_col_difference')}</th>
                      <th className="text-right p-4 text-slate-500 dark:text-slate-400 font-medium">{t('cash_col_profit')}</th>
                      <th className="text-left p-4 text-slate-500 dark:text-slate-400 font-medium">{t('cash_col_user')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionHistory.map((s) => (
                      <tr key={s.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            s.status === 'OPEN'
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                              : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'OPEN' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                            {s.status === 'OPEN' ? t('cash_session_open') : t('cash_session_closed')}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <Calendar size={12} className="text-slate-400" />
                            {fmtDate(s.openingDate)}
                          </div>
                        </td>
                        <td className="p-4 text-slate-700 dark:text-slate-300">
                          {s.closingDate ? fmtDate(s.closingDate) : <span className="text-slate-400">-</span>}
                        </td>
                        <td className="p-4 text-right font-semibold text-slate-800 dark:text-white">{fmt(s.openingBalance)}</td>
                        <td className="p-4 text-right font-semibold text-blue-500">{fmt(s.expectedBalance)}</td>
                        <td className="p-4 text-right font-semibold text-slate-800 dark:text-white">
                          {s.actualBalance != null ? fmt(s.actualBalance) : <span className="text-slate-400">-</span>}
                        </td>
                        <td className="p-4 text-right">
                          {s.difference != null ? (
                            <span className={`font-bold ${Number(s.difference) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                              {Number(s.difference) > 0 ? '+' : ''}{fmt(s.difference)}
                            </span>
                          ) : <span className="text-slate-400">-</span>}
                        </td>
                        <td className="p-4 text-right">
                          {s.expectedBalance != null && s.openingBalance != null ? (
                            <span className="font-bold text-amber-500">
                              {fmt(Number(s.expectedBalance) - Number(s.openingBalance))}
                            </span>
                          ) : <span className="text-slate-400">-</span>}
                        </td>
                        <td className="p-4 text-slate-700 dark:text-slate-300 text-xs">
                          {s.user?.username || s.user?.firstName || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-slate-500 text-center py-8">{t('cash_history_empty')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-primary-600/10 border border-primary-500/20">
            <div className="flex items-center gap-2 text-primary-400 mb-4">
              <AlertCircle size={20} />
              <h5 className="font-bold">Recordatorio</h5>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Recuerda realizar el arqueo de caja al finalizar el turno para asegurar que el balance físico coincida con el sistema.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h5 className="text-slate-800 dark:text-white font-bold">Resumen de Sesión</h5>
            {isSessionOpen ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Apertura</span>
                  <span className="text-slate-800 dark:text-white font-bold">{fmt(session?.openingBalance)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Ventas en Efectivo</span>
                  <span className="text-emerald-400 font-bold">{fmt((session?.expectedBalance || 0) - (session?.openingBalance || 0))}</span>
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-white/5 flex justify-between items-center">
                  <span className="text-slate-800 dark:text-white font-bold">Balance Esperado</span>
                  <span className="text-slate-800 dark:text-white font-black text-lg">{fmt(session?.expectedBalance || session?.openingBalance)}</span>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Sin sesión activa</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal Abrir Caja */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t('cash_opening_modal_title')}</h3>
              <button onClick={() => setShowOpenModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleOpenSession} className="space-y-6">
              <Input
                label={t('cash_opening_amount_label')}
                type="number"
                placeholder="0.00"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                required
              />
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowOpenModal(false)} className="flex-1">{t('cancel')}</Button>
                <Button type="submit" className="flex-1" loading={actionLoading}>{t('cash_open_btn')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cerrar Caja */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t('cash_closing_modal_title')}</h3>
              <button onClick={() => setShowCloseModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-white"><X size={20} /></button>
            </div>

            <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Apertura</span>
                <span className="text-slate-800 dark:text-white font-bold">{fmt(session?.openingBalance)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Balance Esperado (sistema)</span>
                <span className="text-emerald-500 font-bold">{fmt(session?.expectedBalance)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-200 dark:border-white/10">
                <span className="text-amber-600 dark:text-amber-400 font-semibold">Ganancias de la sesión</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">{fmt((session?.expectedBalance || 0) - (session?.openingBalance || 0))}</span>
              </div>
            </div>

            <form onSubmit={handleCloseSession} className="space-y-5">
              <Input
                label={t('cash_closing_amount_label')}
                type="number"
                placeholder="0.00"
                value={closingAmount}
                onChange={(e) => setClosingAmount(e.target.value)}
                required
              />
              {closingAmount && (
                <div className={`text-sm font-bold p-3 rounded-xl text-center ${
                  parseFloat(closingAmount) - (session?.expectedBalance || 0) >= 0
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                }`}>
                  Diferencia: {fmt(parseFloat(closingAmount) - (session?.expectedBalance || 0))}
                </div>
              )}
              <Input
                label={t('notes')}
                placeholder={t('cash_closing_notes_placeholder')}
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
              />
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowCloseModal(false)} className="flex-1">{t('cancel')}</Button>
                <Button type="submit" className="flex-1" loading={actionLoading}>{t('cash_close_btn')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashRegisterPage;
