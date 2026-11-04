'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { BellRing, X, ThermometerSnowflake, Droplets, Wind, Sun, Moon, Clock, CalendarDays } from 'lucide-react';
import RegistroAgricultor from './RegistroAgricultor';
import WeatherEffects from './WeatherEffects';
import { EvaluacionAlerta } from '@/types/clima';
import { getBackgroundClasses } from '@/lib/theme-weather';

interface Props {
  alertaEvaluada: EvaluacionAlerta | null;
  horaActualIso: string;
  temperaturaActual: number;
  proyeccion?: {
    h18: number;
    h21: number;
    h00: number;
    h03: number;
  };
}

export default function ClientDashboard({ alertaEvaluada, horaActualIso, temperaturaActual, proyeccion }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  
  const bgClass = getBackgroundClasses(horaActualIso, alertaEvaluada);

  // Reloj en tiempo real y montaje seguro (evita errores de hidratación)
  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Aplicar Tema Claro/Oscuro al HTML base
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [isDarkMode, mounted]);

  const dateString = currentTime.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });

  const getIconoClima = () => {
    if (!alertaEvaluada) return <Sun className="text-yellow-300 drop-shadow-md" size={32} />;
    switch (alertaEvaluada.fenomeno) {
      case 'HELADA':
      case 'GRANIZADA': return <ThermometerSnowflake className="text-sky-200 drop-shadow-md" size={32} />;
      case 'LLUVIA_TORRENCIAL': return <Droplets className="text-blue-300 drop-shadow-md" size={32} />;
      case 'VIENTO_FUERTE': return <Wind className="text-slate-300 drop-shadow-md" size={32} />;
      default: return <Sun className="text-yellow-300 drop-shadow-md" size={32} />;
    }
  };

  // Variantes tipadas explícitamente para Framer Motion
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  // Previene el renderizado hasta que el cliente asuma el control (soluciona fallos SSR del reloj)
  if (!mounted) return null;

  return (
    <div className={`relative flex min-h-screen w-full flex-col items-center overflow-x-hidden transition-colors duration-1000 pb-10 ${bgClass}`}>
      
      <WeatherEffects fenomeno={alertaEvaluada?.fenomeno} />

      {/* Botón Flotante de Tema Claro/Oscuro */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="absolute top-6 right-6 z-40 rounded-full border border-white/20 bg-white/10 p-3 text-white shadow-lg backdrop-blur-md transition-all hover:scale-110 hover:bg-white/20 active:scale-95"
        aria-label="Cambiar tema"
      >
        {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
      </button>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate={isModalOpen ? "hidden" : "show"}
        className={`z-10 flex w-full max-w-md flex-col items-center px-6 pt-20 text-white transition-all duration-500 ${isModalOpen ? 'blur-md scale-95 opacity-40' : 'blur-none scale-100 opacity-100'}`}
      >
        {/* Cabecera: Ubicación y Fecha */}
        <motion.div variants={itemVariants} className="text-center">
          <h1 className="text-4xl font-medium tracking-wide drop-shadow-md">Taraco - Puno</h1>
          <p className="mt-1 text-sm font-medium text-white/90 drop-shadow-sm capitalize">
            {dateString}
          </p>
        </motion.div>
        
        {/* Temperatura Principal */}
        <motion.div variants={itemVariants} className="mt-6 flex flex-col items-center">
          <span className="text-[140px] font-thin tracking-tighter drop-shadow-lg leading-none -ml-4">
            {Math.round(temperaturaActual)}°
          </span>
          <div className="mt-4 flex items-center gap-3 bg-black/20 px-5 py-2.5 rounded-full backdrop-blur-md border border-white/10 shadow-lg">
            {getIconoClima()}
            <span className="text-xl font-medium capitalize drop-shadow-md">
              {alertaEvaluada ? alertaEvaluada.fenomeno.replace('_', ' ') : 'Mayormente Despejado'}
            </span>
          </div>
        </motion.div>

        {/* Tarjeta de Alerta Crítica (Glassmorphism) */}
        {alertaEvaluada && (
          <motion.div variants={itemVariants} className="mt-10 w-full rounded-3xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/20 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="text-white/80" size={18} />
                <h2 className="text-base font-semibold tracking-wide">Pronóstico Crítico</h2>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                alertaEvaluada.prioridad === 'ALTA' ? 'bg-red-500 text-white' : 
                alertaEvaluada.prioridad === 'MEDIA' ? 'bg-amber-500 text-white' : 'bg-slate-500 text-white'
              }`}>
                {alertaEvaluada.prioridad}
              </span>
            </div>
            <p className="mt-3 text-sm font-medium leading-relaxed text-white/95">
              {alertaEvaluada.mensaje}
            </p>
            <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-xs text-white/90">
              <span>Hora estimada: <strong>{alertaEvaluada.horaEstimada}</strong></span>
              <span>Probabilidad: <strong>{alertaEvaluada.probabilidad}%</strong></span>
            </div>
          </motion.div>
        )}

        {/* Tarjeta de Pronóstico por Horas */}
        <motion.div variants={itemVariants} className="mt-6 w-full rounded-3xl border border-white/20 bg-black/20 p-5 shadow-xl backdrop-blur-md">
           <div className="flex items-center gap-2 border-b border-white/20 pb-3 mb-4 text-white/90">
              <CalendarDays size={16} />
              <h2 className="text-xs font-semibold uppercase tracking-wider">Pronóstico 24 Horas</h2>
           </div>
           <div className="flex justify-between items-center text-center">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-white/80">Ahora</span>
                {getIconoClima()}
                <span className="text-base font-semibold">{Math.round(temperaturaActual)}°</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-white/80">18:00</span>
                <ThermometerSnowflake className="text-sky-300 mx-auto drop-shadow-md" size={24} />
                <span className="text-base font-semibold">{Math.round(proyeccion?.h18 || 0)}°</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-white/80">21:00</span>
                <ThermometerSnowflake className="text-sky-200 mx-auto drop-shadow-md" size={24} />
                <span className="text-base font-semibold">{Math.round(proyeccion?.h21 || 0)}°</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-white/80">00:00</span>
                <ThermometerSnowflake className="text-sky-100 mx-auto drop-shadow-md" size={24} />
                <span className="text-base font-semibold">{Math.round(proyeccion?.h00 || 0)}°</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-white/80">03:00</span>
                <ThermometerSnowflake className="text-white mx-auto drop-shadow-md" size={24} />
                <span className="text-base font-semibold">{Math.round(proyeccion?.h03 || 0)}°</span>
              </div>
           </div>
        </motion.div>

        {/* Botón de Registro */}
        <motion.button
          variants={itemVariants}
          onClick={() => setIsModalOpen(true)}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-white/20 px-6 py-4 font-bold text-white shadow-lg backdrop-blur-md transition-all hover:bg-white/30 active:scale-95 border border-white/10"
        >
          <BellRing size={22} />
          Registrarse para Alertas
        </motion.button>
      </motion.div>

      {/* Modal de Registro */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-2xl dark:bg-slate-950/95"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white/60 transition hover:bg-white/20 hover:text-white z-10"
              >
                <X size={20} />
              </button>
              
              <div className="mt-2 relative">
                <RegistroAgricultor />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}