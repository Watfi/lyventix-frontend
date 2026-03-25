import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, User, Palette, ArrowRight, ArrowLeft, 
  CheckCircle2, Mail, Lock, Phone, MapPin, 
  Globe, LayoutTemplate, Briefcase
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import Input from '../components/Input';
import Button from '../components/Button';

const THEMES = [
  { id: 'blue', name: 'Premium Blue', color: 'bg-blue-500' },
  { id: 'emerald', name: 'Emerald Green', color: 'bg-emerald-500' },
  { id: 'violet', name: 'Deep Violet', color: 'bg-violet-500' },
  { id: 'amber', name: 'Sunset Amber', color: 'bg-amber-500' },
  { id: 'rose', name: 'Rose Red', color: 'bg-rose-500' },
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, loading, error, clearError } = useAuthStore();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // User data
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    // Business data
    businessName: '',
    businessType: 'MINIMARKET',
    country: '',
    address: '',
    city: '',
    // Config data
    theme: 'blue',
    language: 'es',
    currency: 'COP'
  });

  const updateForm = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearError();
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < 3) {
      nextStep();
      return;
    }
    
    const success = await register(formData);
    if (success) {
      navigate('/dashboard');
    }
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
  };

  return (
    <div className={`min-h-screen theme-${formData.theme} flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500`}
         style={{ background: 'radial-gradient(circle at top right, rgb(var(--primary-500) / 0.12), transparent 50%), radial-gradient(circle at bottom left, rgb(var(--primary-500) / 0.08), transparent 50%), rgb(var(--primary-50))' }}>
      {/* Dynamic Background Overlay */}
      <div className="dark:hidden absolute inset-0 bg-primary-500/5 backdrop-blur-3xl pointer-events-none" />
      <div className="hidden dark:block absolute inset-0 bg-slate-950 pointer-events-none" />
      <div className="absolute -top-[500px] -right-[500px] w-[1000px] h-[1000px] bg-primary-500/10 dark:bg-primary-600/10 rounded-full blur-3xl pointer-events-none transition-colors duration-500" />
      <div className="absolute -bottom-[500px] -left-[500px] w-[1000px] h-[1000px] bg-primary-600/10 dark:bg-primary-800/20 rounded-full blur-3xl pointer-events-none transition-colors duration-500" />

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-panel w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col md:flex-row"
      >
        {/* Left Sidebar - Progress */}
        <div className="w-full md:w-1/3 bg-slate-900/5 dark:bg-slate-900/50 p-8 flex flex-col justify-between border-r border-slate-200 dark:border-white/5">
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-primary-600 rounded-xl shadow-lg shadow-primary-600/30 flex items-center justify-center">
                <LayoutTemplate className="text-white" size={20} />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">Lyventix</span>
            </div>

            <div className="space-y-8">
              <div className={`flex items-center gap-4 transition-colors ${step >= 1 ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'bg-slate-200 dark:bg-white/10 text-slate-500'}`}>1</div>
                <div>
                  <p className="font-bold text-sm">Tu Cuenta</p>
                  <p className="text-xs opacity-60">Datos personales</p>
                </div>
              </div>
              <div className={`flex items-center gap-4 transition-colors ${step >= 2 ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'bg-slate-200 dark:bg-white/10 text-slate-500'}`}>2</div>
                <div>
                  <p className="font-bold text-sm">Tu Negocio</p>
                  <p className="text-xs opacity-60">Info de la empresa</p>
                </div>
              </div>
              <div className={`flex items-center gap-4 transition-colors ${step >= 3 ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 3 ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'bg-slate-200 dark:bg-white/10 text-slate-500'}`}>3</div>
                <div>
                  <p className="font-bold text-sm">Apariencia</p>
                  <p className="text-xs opacity-60">Personalización</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-slate-500 dark:text-slate-500 text-xs mt-10">
            ¿Ya tienes una cuenta? <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors font-medium">Inicia sesión</Link>
          </p>
        </div>

        {/* Right Content - Form */}
        <div className="w-full md:w-2/3 p-8">
          <form onSubmit={handleSubmit} className="h-full flex flex-col">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              {step === 1 && "Crea tu cuenta de administrador"}
              {step === 2 && "Háblanos de tu negocio"}
              {step === 3 && "Personaliza tu POS"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
              {step === 1 && "Estos serán tus datos para iniciar sesión en Lyventix."}
              {step === 2 && "Esta información aparecerá en tus facturas y reportes."}
              {step === 3 && "Elige los colores que mejor representen a tu marca."}
            </p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl mb-6">
                {error}
              </div>
            )}

            <div className="flex-1 overflow-hidden relative min-h-[320px]">
              <AnimatePresence mode="wait" custom={1}>
                
                {/* STEP 1: USER DATA */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    custom={1}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
                    className="space-y-4 absolute inset-0 overflow-y-auto pr-2"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Nombre" icon={User} required value={formData.firstName} onChange={e => updateForm('firstName', e.target.value)} />
                      <Input label="Apellidos" required value={formData.lastName} onChange={e => updateForm('lastName', e.target.value)} />
                    </div>
                    <Input label="Nombre de Usuario (Login)" icon={User} required value={formData.username} onChange={e => updateForm('username', e.target.value)} />
                    <Input label="Correo Electrónico" type="email" icon={Mail} required value={formData.email} onChange={e => updateForm('email', e.target.value)} />
                    <Input label="Contraseña" type="password" icon={Lock} required value={formData.password} onChange={e => updateForm('password', e.target.value)} />
                    <Input label="Teléfono" type="tel" icon={Phone} required value={formData.phone} onChange={e => updateForm('phone', e.target.value)} />
                  </motion.div>
                )}

                {/* STEP 2: BUSINESS DATA */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    custom={1}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
                    className="space-y-4 absolute inset-0 overflow-y-auto pr-2"
                  >
                    <Input label="Nombre de la Empresa" icon={Building2} required value={formData.businessName} onChange={e => updateForm('businessName', e.target.value)} />
                    
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block ml-1">Tipo de Negocio</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                        <select 
                          className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-xl pl-11 pr-4 py-3 text-slate-800 dark:text-white outline-none focus:border-primary-500 transition-colors [&>option]:bg-white dark:[&>option]:bg-[#1e293b] [&>option]:text-slate-800 dark:[&>option]:text-white shadow-sm shadow-primary-900/5 dark:shadow-none"
                          value={formData.businessType}
                          onChange={e => updateForm('businessType', e.target.value)}
                        >
                          <option value="MINIMARKET">Retail / Tienda / Minimercado</option>
                          <option value="RESTAURANT">Restaurante / Comida</option>
                          <option value="PHARMACY">Farmacia</option>
                          <option value="CLOTHING_STORE">Tienda de Ropa</option>
                          <option value="ELECTRONICS">Electrónica</option>
                          <option value="HARDWARE_STORE">Ferretería</option>
                          <option value="BEAUTY_SALON">Estética / Peluquería</option>
                          <option value="BAKERY">Panadería</option>
                          <option value="OTHER">Otro</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Input label="País" icon={Globe} required value={formData.country} onChange={e => updateForm('country', e.target.value)} />
                      <Input label="Ciudad" required value={formData.city} onChange={e => updateForm('city', e.target.value)} />
                    </div>
                    
                    <Input label="Dirección Principal" icon={MapPin} required value={formData.address} onChange={e => updateForm('address', e.target.value)} />
                  </motion.div>
                )}

                {/* STEP 3: APPEARANCE */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    custom={1}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
                    className="space-y-6 absolute inset-0 overflow-y-auto pr-2"
                  >
                    <div>
                      <label className="text-sm text-slate-600 dark:text-slate-300 mb-3 block">1. Color Principal del Sistema</label>
                      <div className="grid grid-cols-5 gap-3">
                        {THEMES.map(theme => (
                          <div 
                            key={theme.id}
                            onClick={() => updateForm('theme', theme.id)}
                            className={`aspect-square rounded-2xl cursor-pointer flex items-center justify-center transition-all ${theme.color} ${formData.theme === theme.id ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-900 scale-110 shadow-lg' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                            title={theme.name}
                          >
                            {formData.theme === theme.id && <CheckCircle2 className="text-white" size={24} />}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border-primary-500/30 bg-primary-500/5 dark:bg-primary-500/10">
                      <div className="flex items-center gap-3">
                        <Palette className="text-primary-600 dark:text-primary-400" size={24} />
                        <div>
                          <p className="text-slate-800 dark:text-white font-medium text-sm">Vista Previa</p>
                          <p className="text-slate-500 dark:text-slate-400 text-xs">Así se verán tus botones e iconos</p>
                        </div>
                      </div>
                      <Button type="button" variant="primary" className="pointer-events-none">Color Activo</Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-slate-600 dark:text-slate-300 mb-1 block">Idioma</label>
                        <select 
                          className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:border-primary-500 transition-colors [&>option]:bg-white dark:[&>option]:bg-[#1e293b]"
                          value={formData.language}
                          onChange={e => updateForm('language', e.target.value)}
                        >
                          <option value="es">Español</option>
                          <option value="en">English</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-slate-600 dark:text-slate-300 mb-1 block">Moneda Base</label>
                        <select 
                          className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:border-primary-500 transition-colors [&>option]:bg-white dark:[&>option]:bg-[#1e293b]"
                          value={formData.currency}
                          onChange={e => updateForm('currency', e.target.value)}
                        >
                          <option value="COP">COP ($)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="MXN">MXN ($)</option>
                        </select>
                      </div>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200 dark:border-white/10">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={prevStep} className="px-6">
                  <ArrowLeft size={18} /><span>Atrás</span>
                </Button>
              ) : (
                <div /> // Spacer
              )}
              
              <Button type="submit" loading={loading} className="px-8">
                {step < 3 ? (
                  <><span>Siguiente</span><ArrowRight size={18} /></>
                ) : (
                  <><span>Completar Registro</span><CheckCircle2 size={18} /></>
                )}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
