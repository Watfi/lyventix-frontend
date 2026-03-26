import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Palette,
  Settings,
  Save,
  CheckCircle2,
  Building,
  MapPin,
  Phone,
  MonitorSmartphone,
  Globe2,
  DollarSign,
  Moon,
  Sun,
  Upload,
  ImageIcon
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import businessService from '../services/businessService';
import Button from '../components/Button';
import Input from '../components/Input';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1').replace('/api/v1', '');
const getLogoUrl = (logoUrl) => {
  if (!logoUrl) return null;
  if (logoUrl.startsWith('http')) return logoUrl;
  return API_BASE + logoUrl;
};

const THEMES = [
  { id: 'blue', name: 'Premium Blue', color: 'bg-blue-500' },
  { id: 'emerald', name: 'Emerald Green', color: 'bg-emerald-500' },
  { id: 'violet', name: 'Deep Violet', color: 'bg-violet-500' },
  { id: 'amber', name: 'Sunset Amber', color: 'bg-amber-500' },
  { id: 'rose', name: 'Rose Red', color: 'bg-rose-500' },
];

const SettingsPage = () => {
  const { businessId, user, updateTheme, updateLogo } = useAuthStore();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const logoInputRef = useRef(null);

  // Business Data State
  const [businessData, setBusinessData] = useState({
    name: '',
    taxId: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    logoUrl: ''
  });

  // Config Data State
  const [configData, setConfigData] = useState({
    theme: 'blue',
    darkMode: true,
    language: 'es',
    currency: 'COP',
    timezone: 'America/Bogota',
    taxEnabled: true,
    taxName: 'IVA',
    taxRate: 19
  });

  useEffect(() => {
    const fetchBusinessInfo = async () => {
      if (!businessId) return;
      try {
        setLoading(true);
        const { data } = await businessService.getBusiness(businessId);
        
        setBusinessData({
          name: data.name || '',
          taxId: data.taxId || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          city: data.city || '',
          logoUrl: data.logoUrl || ''
        });

        if (data.config) {
          setConfigData({
            theme: data.config.theme || 'blue',
            darkMode: data.config.darkMode !== false, // default true
            language: data.config.language || 'es',
            currency: data.config.currency || 'COP',
            timezone: data.config.timezone || 'America/Bogota',
            taxEnabled: data.config.taxEnabled ?? true,
            taxName: data.config.taxName || 'IVA',
            taxRate: data.config.taxRate ?? 19
          });
        }
      } catch (err) {
        setError('Error al cargar la información del negocio');
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessInfo();
  }, [businessId]);

  const handleBusinessChange = (field, value) => {
    setBusinessData(prev => ({ ...prev, [field]: value }));
    setSuccess(false);
  };

  const handleConfigChange = async (field, value) => {
    const newConfig = { ...configData, [field]: value };
    setConfigData(newConfig);
    setSuccess(false);

    // Apply visual preview immediately
    if (field === 'theme') {
      document.documentElement.className = `theme-${value} ${newConfig.darkMode ? 'dark' : ''}`;
    }
    if (field === 'darkMode') {
      document.documentElement.className = `theme-${newConfig.theme} ${value ? 'dark' : ''}`;
    }

    // Auto-save appearance changes
    if (field === 'theme' || field === 'darkMode' || field === 'language') {
      try {
        setSaving(true);
        await businessService.updateConfig(businessId, newConfig);
        
        // Update local storage user config
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
          storedUser.theme = newConfig.theme;
          storedUser.darkMode = newConfig.darkMode;
          localStorage.setItem('user', JSON.stringify(storedUser));
          if (updateTheme) updateTheme(newConfig.theme, newConfig.darkMode); 
        }
        
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        console.error('Auto-save failed', err);
        setError('Error al autoguardar apariencia');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await businessService.updateBusiness(businessId, businessData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Error al guardar los datos del negocio');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await businessService.updateConfig(businessId, configData);
      
      // Update local storage user theme
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser) {
        storedUser.theme = configData.theme;
        localStorage.setItem('user', JSON.stringify(storedUser));
        if (updateTheme) updateTheme(configData.theme); // Update store if method exists
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Error al guardar la configuración');
      // Revert theme if failed
      if (user?.theme) {
         document.documentElement.className = `theme-${user.theme} ${user.darkMode ? 'dark' : ''}`;
         setConfigData(prev => ({...prev, theme: user.theme, darkMode: user.darkMode}));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingLogo(true);
      setError(null);
      const { data } = await businessService.uploadLogo(businessId, file);
      setBusinessData(prev => ({ ...prev, logoUrl: data.logoUrl }));
      updateLogo(data.logoUrl);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Error al subir el logo. Solo se permiten imágenes (máx. 5 MB).');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-400">Cargando configuración...</div>;
  }

  return (
    <div className="space-y-1 sm:space-y-6 animate-fade-in relative z-10 block w-full h-full overflow-x-hidden max-w-full text-[11px] sm:text-base">
      <div className="flex items-center justify-between gap-1 sm:gap-3">
        <h2 className="text-sm sm:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Configuración</h2>
        </div>
        {success && (
          <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-1 sm:px-4 sm:py-2 rounded-lg">
            <CheckCircle2 size={12} className="shrink-0" />
            <span className="font-medium">Guardado</span>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-1.5 md:gap-6 max-w-full overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-56 flex flex-row md:flex-col gap-0.5 sm:gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-1.5 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-3 rounded-md sm:rounded-xl text-[11px] sm:text-sm transition-all text-left whitespace-nowrap shrink-0 ${activeTab === 'general' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Building2 size={14} className="sm:w-5 sm:h-5" />
            <span className="font-medium">General</span>
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-1.5 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-3 rounded-md sm:rounded-xl text-[11px] sm:text-sm transition-all text-left whitespace-nowrap shrink-0 ${activeTab === 'appearance' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Palette size={14} className="sm:w-5 sm:h-5" />
            <span className="font-medium">Apariencia</span>
          </button>
          <button
            onClick={() => setActiveTab('taxes')}
            className={`flex items-center gap-1.5 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-3 rounded-md sm:rounded-xl text-[11px] sm:text-sm transition-all text-left whitespace-nowrap shrink-0 ${activeTab === 'taxes' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <DollarSign size={14} className="sm:w-5 sm:h-5" />
            <span className="font-medium">Impuestos</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 glass-card p-2 sm:p-5 md:p-8 rounded-xl sm:rounded-3xl min-h-0 md:min-h-[500px] min-w-0 overflow-hidden">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-4 rounded-xl mb-6">
              {error}
            </div>
          )}

          {activeTab === 'general' && (
            <form onSubmit={handleSaveGeneral} className="space-y-2.5 sm:space-y-6">
              <h3 className="text-sm sm:text-xl font-bold text-slate-800 dark:text-white mb-2 sm:mb-6 flex items-center gap-1.5">
                <Building size={16} className="text-primary-600 dark:text-primary-400 sm:w-5 sm:h-5" /> Datos de la Empresa
              </h3>

              {/* Logo upload */}
              <div className="flex flex-row items-center gap-2 sm:gap-6 p-1.5 sm:p-4 rounded-lg sm:rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                <div className="w-10 h-10 sm:w-20 sm:h-20 rounded-lg sm:rounded-2xl bg-primary-600/10 dark:bg-primary-600/20 border-2 border-dashed border-primary-400/40 flex items-center justify-center overflow-hidden shrink-0">
                  {businessData.logoUrl ? (
                    <img
                      src={getLogoUrl(businessData.logoUrl)}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <ImageIcon size={18} className="text-primary-400 opacity-60 sm:w-7 sm:h-7" />
                  )}
                </div>
                <div className="flex flex-col gap-1 sm:gap-2 items-start text-left min-w-0">
                  <p className="text-[11px] sm:text-sm font-medium text-slate-700 dark:text-slate-300">Logo</p>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <div className="flex gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="flex items-center gap-1 px-2 py-1 sm:px-4 sm:py-2 rounded-md sm:rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-[11px] sm:text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <Upload size={12} className="sm:w-4 sm:h-4" />
                      {uploadingLogo ? 'Subiendo...' : 'Subir'}
                    </button>
                    {businessData.logoUrl && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await businessService.removeLogo(businessId);
                            setBusinessData(prev => ({ ...prev, logoUrl: null }));
                            updateLogo(null);
                          } catch (err) {
                            setError('Error al eliminar el logo');
                          }
                        }}
                        className="flex items-center gap-1 px-2 py-1 sm:px-4 sm:py-2 rounded-md sm:rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-[11px] sm:text-sm font-medium transition-colors"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-6">
                <Input label="Nombre de la Empresa" required value={businessData.name} onChange={e => handleBusinessChange('name', e.target.value)} />
                <Input label="NIT / RUT" value={businessData.taxId} onChange={e => handleBusinessChange('taxId', e.target.value)} />
                <Input label="Teléfono" type="tel" icon={Phone} value={businessData.phone} onChange={e => handleBusinessChange('phone', e.target.value)} />
                <Input label="Correo" type="email" value={businessData.email} onChange={e => handleBusinessChange('email', e.target.value)} />
                <Input label="Dirección" icon={MapPin} className="md:col-span-2" value={businessData.address} onChange={e => handleBusinessChange('address', e.target.value)} />
                <Input label="Ciudad" value={businessData.city} onChange={e => handleBusinessChange('city', e.target.value)} />
              </div>

              <div className="pt-3 sm:pt-6 border-t border-white/10 flex justify-end">
                <Button type="submit" loading={saving} icon={Save}>Guardar</Button>
              </div>
            </form>
          )}

          {activeTab === 'appearance' && (
            <form onSubmit={handleSaveConfig} className="space-y-2.5 sm:space-y-6">
              <h3 className="text-sm sm:text-xl font-bold text-slate-800 dark:text-white mb-2 sm:mb-6 flex items-center gap-1.5">
                <MonitorSmartphone size={16} className="text-primary-600 dark:text-primary-400 sm:w-5 sm:h-5" /> Apariencia
              </h3>

              <div>
                <label className="text-[11px] sm:text-sm text-slate-600 dark:text-slate-300 mb-2 sm:mb-4 block">Color Principal</label>
                <div className="flex flex-wrap gap-2 sm:gap-4">
                  {THEMES.map(theme => (
                    <div
                      key={theme.id}
                      onClick={() => handleConfigChange('theme', theme.id)}
                      className={`w-8 h-8 sm:w-14 sm:h-14 rounded-lg sm:rounded-2xl cursor-pointer flex items-center justify-center transition-all ${theme.color} ${configData.theme === theme.id ? 'ring-2 sm:ring-4 ring-white ring-offset-1 sm:ring-offset-2 ring-offset-slate-900 scale-110 shadow-lg' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                      title={theme.name}
                    >
                      {configData.theme === theme.id && <CheckCircle2 className="text-white" size={14} />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2.5 sm:pt-6 border-t border-white/10 dark:border-white/10 border-slate-200">
                <label className="text-[11px] sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 sm:mb-4 block">Modo</label>
                <div className="flex bg-white/50 dark:bg-white/5 p-0.5 sm:p-1 rounded-lg sm:rounded-2xl w-full sm:w-max backdrop-blur-md shadow-sm border border-slate-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => handleConfigChange('darkMode', false)}
                    className={`flex items-center justify-center gap-1.5 flex-1 sm:flex-initial px-3 sm:px-6 py-2 sm:py-3 rounded-md sm:rounded-xl text-[11px] sm:text-sm transition-all ${!configData.darkMode ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                  >
                    <Sun size={14} className="sm:w-[18px] sm:h-[18px]" /> Claro
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfigChange('darkMode', true)}
                    className={`flex items-center justify-center gap-1.5 flex-1 sm:flex-initial px-3 sm:px-6 py-2 sm:py-3 rounded-md sm:rounded-xl text-[11px] sm:text-sm transition-all ${configData.darkMode ? 'bg-slate-800 text-white shadow-md border border-white/10' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                  >
                    <Moon size={14} className="sm:w-[18px] sm:h-[18px]" /> Oscuro
                  </button>
                </div>
              </div>

              <div className="pt-2.5 sm:pt-6 border-t border-slate-200 dark:border-white/10">
                <label className="text-[11px] sm:text-sm text-slate-600 dark:text-slate-300 mb-1.5 sm:mb-2 flex items-center gap-1.5"> <Globe2 size={13} className="sm:w-4 sm:h-4"/> Idioma</label>
                <select
                  className="w-full md:w-1/2 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-md sm:rounded-xl px-2.5 py-1.5 sm:px-4 sm:py-3 text-xs sm:text-base text-slate-800 dark:text-white outline-none focus:border-primary-500 transition-colors [&>option]:bg-white dark:[&>option]:bg-[#1e293b]"
                  value={configData.language}
                  onChange={e => handleConfigChange('language', e.target.value)}
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div className="pt-2 sm:pt-6 border-t border-white/10 flex justify-end">
                <p className="text-[10px] sm:text-xs text-slate-500">Cambios guardados automáticamente.</p>
              </div>
            </form>
          )}

          {activeTab === 'taxes' && (
            <form onSubmit={handleSaveConfig} className="space-y-2.5 sm:space-y-6">
              <h3 className="text-sm sm:text-xl font-bold text-slate-800 dark:text-white mb-2 sm:mb-6 flex items-center gap-1.5">
                <DollarSign size={16} className="text-primary-600 dark:text-primary-400 sm:w-5 sm:h-5" /> Regional
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-6">
                <div>
                  <label className="text-[11px] sm:text-sm text-slate-600 dark:text-slate-300 mb-1 sm:mb-2 block">Moneda</label>
                  <select
                    className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-md sm:rounded-xl px-2.5 py-1.5 sm:px-4 sm:py-3 text-xs sm:text-base text-slate-800 dark:text-white outline-none focus:border-primary-500 transition-colors [&>option]:bg-white dark:[&>option]:bg-[#1e293b]"
                    value={configData.currency}
                    onChange={e => handleConfigChange('currency', e.target.value)}
                  >
                    <option value="COP">COP - Peso Colombiano</option>
                    <option value="USD">USD - Dólar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="MXN">MXN - Peso Mexicano</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] sm:text-sm text-slate-600 dark:text-slate-300 mb-1 sm:mb-2 block">Zona Horaria</label>
                  <select
                    className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-md sm:rounded-xl px-2.5 py-1.5 sm:px-4 sm:py-3 text-xs sm:text-base text-slate-800 dark:text-white outline-none focus:border-primary-500 transition-colors [&>option]:bg-white dark:[&>option]:bg-[#1e293b]"
                    value={configData.timezone}
                    onChange={e => handleConfigChange('timezone', e.target.value)}
                  >
                    <option value="America/Bogota">Bogotá</option>
                    <option value="America/Mexico_City">Ciudad de México</option>
                    <option value="America/Argentina/Buenos_Aires">Buenos Aires</option>
                    <option value="America/New_York">Nueva York</option>
                    <option value="Europe/Madrid">Madrid</option>
                  </select>
                </div>

                <div className="col-span-1 md:col-span-2 border-t border-slate-200 dark:border-white/10 pt-2.5 sm:pt-6 mt-1 sm:mt-2">
                  <h4 className="text-xs sm:text-md font-bold text-slate-800 dark:text-white mb-2 sm:mb-4">Impuestos</h4>
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6">
                    <input
                      type="checkbox"
                      id="taxEnabled"
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded border-slate-300 dark:border-white/20 bg-white/5 text-primary-500 focus:ring-primary-500/50"
                      checked={configData.taxEnabled}
                      onChange={e => handleConfigChange('taxEnabled', e.target.checked)}
                    />
                    <label htmlFor="taxEnabled" className="text-[11px] sm:text-base text-slate-600 dark:text-slate-300 font-medium cursor-pointer">Habilitar impuestos</label>
                  </div>
                </div>

                {configData.taxEnabled && (
                  <>
                    <Input label="Nombre (Ej. IVA)" value={configData.taxName} onChange={e => handleConfigChange('taxName', e.target.value)} />
                    <Input label="Tasa (%)" type="number" step="0.1" value={configData.taxRate} onChange={e => handleConfigChange('taxRate', parseFloat(e.target.value))} />
                  </>
                )}
              </div>

              <div className="pt-3 sm:pt-6 border-t border-white/10 flex justify-end">
                <Button type="submit" loading={saving} icon={Save}>Guardar</Button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
