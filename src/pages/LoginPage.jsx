import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { User, Lock, LogIn } from 'lucide-react';
import lyventixIcon from '../assets/iconlyventix.png';
import useAuthStore from '../store/authStore';
import Button from '../components/Button';
import Input from '../components/Input';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error, clearError } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(username, password);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden transition-colors duration-500"
         style={{ background: 'radial-gradient(circle at top right, rgb(var(--primary-500) / 0.12), transparent 50%), radial-gradient(circle at bottom left, rgb(var(--primary-500) / 0.08), transparent 50%), rgb(var(--primary-50))' }}>
      {/* Background Decorative Elements */}
      <div className="dark:hidden absolute inset-0 bg-primary-500/5 backdrop-blur-3xl" />
      <div className="hidden dark:block absolute inset-0 bg-slate-950" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-500/10 dark:bg-primary-900/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 dark:bg-blue-900/10 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 glass-panel rounded-3xl z-10 mx-4"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 bg-primary-600 rounded-[1.5rem] mx-auto mb-4 flex items-center justify-center shadow-xl shadow-primary-600/30 overflow-hidden"
          >
            <img src={lyventixIcon} alt="Lyventix Logo" className="w-[140%] h-[140%] max-w-none object-contain text-white drop-shadow-md" style={{ filter: 'brightness(0) invert(1)' }} />
          </motion.div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Lyventix</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Bienvenido de nuevo, ingresa tus credenciales</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Usuario"
            placeholder="Introduce tu usuario"
            value={username}
            onChange={(e) => { setUsername(e.target.value); clearError(); }}
            icon={User}
          />

          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError(); }}
            icon={Lock}
          />

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-500/10 border border-red-500/20 py-2 px-4 rounded-xl text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            loading={loading}
          >
            Iniciar Sesión
          </Button>

          <div className="flex flex-col items-center gap-4 pt-4 border-t border-slate-200 dark:border-white/10 mt-6">
            <button type="button" className="text-sm text-slate-600 dark:text-slate-400 hover:text-primary-700 dark:hover:text-primary-400 transition-colors">
              ¿Olvidaste tu contraseña?
            </button>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              ¿No tienes cuenta? <Link to="/register" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold underline-offset-4 hover:underline">Crea una para tu negocio</Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginPage;
