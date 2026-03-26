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
    <div className="space-y-2 sm:space-y-6 animate-fade-in relative z-10 block w-full h-full overflow-x-hidden max-w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
        <div>
          <h2 className="text-xl sm:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Configuración del Negocio</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 text-xs sm:text-base">Gestiona los detalles de la empresa y preferencias del sistema</p>
        </div>
        {success && (
          <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 sm:px-4 py-2 rounded-xl">
            <CheckCircle2 size={18} className="shrink-0" />
            <span className="font-medium text-xs sm:text-sm">Guardado</span>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-2 md:gap-6 max-w-full overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-56 flex flex-row md:flex-col gap-1 sm:gap-2 overflow-x-auto pb-1 md:pb-0 shrink-0">
          <button 
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 sm:gap-3 px-2.5 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm transition-all text-left whitespace-nowrap shrink-0 ${activeTab === 'general' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Building2 size={20} />
            <span className="font-medium text-sm">General</span>
          </button>
          <button 
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-2 sm:gap-3 px-2.5 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm transition-all text-left whitespace-nowrap shrink-0 ${activeTab === 'appearance' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Palette size={20} />
            <span className="font-medium text-sm">Apariencia</span>
          </button>
          <button 
            onClick={() => setActiveTab('taxes')}
            className={`flex items-center gap-2 sm:gap-3 px-2.5 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm transition-all text-left whitespace-nowrap shrink-0 ${activeTab === 'taxes' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <DollarSign size={20} />
            <span className="font-medium text-sm">Impuestos y Moneda</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 glass-card p-2 sm:p-5 md:p-8 rounded-2xl sm:rounded-3xl min-h-0 md:min-h-[500px] min-w-0 overflow-hidden">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-4 rounded-xl mb-6">
              {error}
            </div>
          )}

          {activeTab === 'general' && (
            <form onSubmit={handleSaveGeneral} className="space-y-4 sm:space-y-6">
              <h3 className="text-base sm:text-xl font-bold text-slate-800 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
                <Building className="text-primary-600 dark:text-primary-400" /> Datos de la Empresa
              </h3>
              
              {/* Logo upload */}
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 p-2 sm:p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-primary-600/10 dark:bg-primary-600/20 border-2 border-dashed border-primary-400/40 flex items-center justify-center overflow-hidden shrink-0">
                  {businessData.logoUrl ? (
                    <img
                      src={getLogoUrl(businessData.logoUrl)}
                      alt="Logo de la empresa"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <ImageIcon size={28} className="text-primary-400 opacity-60" />
                  )}
                </div>
                <div className="flex flex-col gap-2 items-center sm:items-start text-center sm:text-left">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Logo de la Empresa</p>
                  <p className="text-xs text-slate-500">PNG, JPG o SVG · Máximo 5 MB</p>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed w-max"
                    >
                      <Upload size={15} />
                      {uploadingLogo ? 'Subiendo...' : 'Subir imagen'}
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
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium transition-colors w-max"
                      >
                        Eliminar logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <Input label="Nombre de la Empresa" required value={businessData.name} onChange={e => handleBusinessChange('name', e.target.value)} />
                <Input label="NIT / RUT" value={businessData.taxId} onChange={e => handleBusinessChange('taxId', e.target.value)} />
                <Input label="Teléfono" type="tel" icon={Phone} value={businessData.phone} onChange={e => handleBusinessChange('phone', e.target.value)} />
                <Input label="Correo Electrónico" type="email" value={businessData.email} onChange={e => handleBusinessChange('email', e.target.value)} />
                <Input label="Dirección Principal" icon={MapPin} className="md:col-span-2" value={businessData.address} onChange={e => handleBusinessChange('address', e.target.value)} />
                <Input label="Ciudad" value={businessData.city} onChange={e => handleBusinessChange('city', e.target.value)} />
              </div>

              <div className="pt-6 border-t border-white/10 flex justify-end">
                <Button type="submit" loading={saving} icon={Save}>Guardar Cambios</Button>
              </div>
            </form>
          )}

          {activeTab === 'appearance' && (
            <form onSubmit={handleSaveConfig} className="space-y-4 sm:space-y-6">
              <h3 className="text-base sm:text-xl font-bold text-slate-800 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
                <MonitorSmartphone className="text-primary-600 dark:text-primary-400" /> Personalización Visual
              </h3>

              <div>
                <label className="text-sm text-slate-600 dark:text-slate-300 mb-4 block">Color Principal del Sistema</label>
                <div className="flex flex-wrap gap-2 sm:gap-4">
                  {THEMES.map(theme => (
                    <div
                      key={theme.id}
                      onClick={() => handleConfigChange('theme', theme.id)}
                      className={`w-9 h-9 sm:w-14 sm:h-14 rounded-lg sm:rounded-2xl cursor-pointer flex items-center justify-center transition-all ${theme.color} ${configData.theme === theme.id ? 'ring-2 sm:ring-4 ring-white ring-offset-1 sm:ring-offset-2 ring-offset-slate-900 scale-110 shadow-lg' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                      title={theme.name}
                    >
                      {configData.theme === theme.id && <CheckCircle2 className="text-white" size={16} />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 dark:border-white/10 border-slate-200">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4 block">Modo de Pantalla</label>
                <div className="flex bg-white/50 dark:bg-white/5 p-1 rounded-2xl w-full sm:w-max backdrop-blur-md shadow-sm border border-slate-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => handleConfigChange('darkMode', false)}
                    className={`flex items-center justify-center gap-2 flex-1 sm:flex-initial px-4 sm:px-6 py-3 rounded-xl transition-all ${!configData.darkMode ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                  >
                    <Sun size={18} /> Claro
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfigChange('darkMode', true)}
                    className={`flex items-center justify-center gap-2 flex-1 sm:flex-initial px-4 sm:px-6 py-3 rounded-xl transition-all ${configData.darkMode ? 'bg-slate-800 text-white shadow-md border border-white/10' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                  >
                    <Moon size={18} /> Oscuro
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 dark:border-white/10">
                <label className="text-sm text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-2"> <Globe2 size={16}/> Idioma de la interfaz</label>
                <select 
                  className="w-full md:w-1/2 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:border-primary-500 transition-colors [&>option]:bg-white dark:[&>option]:bg-[#1e293b]"
                  value={configData.language}
                  onChange={e => handleConfigChange('language', e.target.value)}
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div className="pt-6 border-t border-white/10 flex justify-end">
                <p className="text-xs text-slate-500">Los cambios de apariencia se guardan automáticamente.</p>
              </div>
            </form>
          )}

          {activeTab === 'taxes' && (
            <form onSubmit={handleSaveConfig} className="space-y-4 sm:space-y-6">
              <h3 className="text-base sm:text-xl font-bold text-slate-800 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
                <DollarSign className="text-primary-600 dark:text-primary-400" /> Preferencias Regionales
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="text-sm text-slate-600 dark:text-slate-300 mb-2 block">Moneda Base</label>
                  <select 
                    className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:border-primary-500 transition-colors [&>option]:bg-white dark:[&>option]:bg-[#1e293b]"
                    value={configData.currency}
                    onChange={e => handleConfigChange('currency', e.target.value)}
                  >
                    <option value="COP">COP ($) - Peso Colombiano</option>
                    <option value="USD">USD ($) - Dólar Estadounidense</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="MXN">MXN ($) - Peso Mexicano</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-slate-600 dark:text-slate-300 mb-2 block">Zona Horaria</label>
                  <select 
                    className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:border-primary-500 transition-colors [&>option]:bg-white dark:[&>option]:bg-[#1e293b]"
                    value={configData.timezone}
                    onChange={e => handleConfigChange('timezone', e.target.value)}
                  >
                    <option value="America/Bogota">América / Bogotá</option>
                    <option value="America/Mexico_City">América / Ciudad de México</option>
                    <option value="America/Argentina/Buenos_Aires">América / Buenos Aires</option>
                    <option value="America/New_York">América / Nueva York</option>
                    <option value="Europe/Madrid">Europa / Madrid</option>
                  </select>
                </div>

                <div className="col-span-1 md:col-span-2 border-t border-slate-200 dark:border-white/10 pt-6 mt-2">
                  <h4 className="text-md font-bold text-slate-800 dark:text-white mb-4">Configuración de Impuestos</h4>
                  <div className="flex items-center gap-3 mb-6">
                    <input 
                      type="checkbox" 
                      id="taxEnabled"
                      className="w-5 h-5 rounded border-slate-300 dark:border-white/20 bg-white/5 text-primary-500 focus:ring-primary-500/50"
                      checked={configData.taxEnabled}
                      onChange={e => handleConfigChange('taxEnabled', e.target.checked)}
                    />
                    <label htmlFor="taxEnabled" className="text-slate-600 dark:text-slate-300 font-medium cursor-pointer">Habilitar cálculo de impuestos global</label>
                  </div>
                </div>

                {configData.taxEnabled && (
                  <>
                    <Input label="Nombre del Impuesto (Ej. IVA, IGV)" value={configData.taxName} onChange={e => handleConfigChange('taxName', e.target.value)} />
                    <Input label="Tasa por Defecto (%)" type="number" step="0.1" value={configData.taxRate} onChange={e => handleConfigChange('taxRate', parseFloat(e.target.value))} />
                  </>
                )}
              </div>

              <div className="pt-6 border-t border-white/10 flex justify-end">
                <Button type="submit" loading={saving} icon={Save}>Guardar Configuración</Button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
