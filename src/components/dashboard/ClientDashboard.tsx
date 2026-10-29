'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, X, ThermometerSnowflake, Droplets, Wind, Sun } from 'lucide-react';
import RegistroAgricultor from './RegistroAgricultor';
import WeatherEffects from './WeatherEffects';
import { EvaluacionAlerta } from '@/types/clima';
import { getBackgroundClasses } from '@/lib/theme-weather';

interface Props {
  alertaEvaluada: EvaluacionAlerta | null;
  horaActualIso: string;
  temperaturaActual: number;
}

export default function ClientDashboard({ alertaEvaluada, horaActualIso, temperaturaActual }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const bgClass = getBackgroundClasses(horaActualIso, alertaEvaluada);

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

  return (
    <div className={`relative flex min-h-screen w-full flex-col items-center overflow-hidden transition-colors duration-1000 ${bgClass}`}>
      <WeatherEffects fenomeno={alertaEvaluada?.fenomeno} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isModalOpen ? 0.2 : 1, scale: isModalOpen ? 0.95 : 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 flex w-full max-w-md flex-col items-center px-6 pt-24 text-white"
      >
        <h1 className="text-4xl font-medium tracking-wide drop-shadow-md">Taraco - Puno</h1>
        
        <div className="mt-4 flex flex-col items-center">
          <div className="flex items-center justify-center gap-4">
            <span className="text-9xl font-thin tracking-tighter drop-shadow-lg leading-none">
              {Math.round(temperaturaActual)}°
            </span>
          </div>
          <div className="mt-4 flex items-center gap-3 bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
            {getIconoClima()}
            <span className="text-xl font-medium capitalize drop-shadow-md">
              {alertaEvaluada ? alertaEvaluada.fenomeno.replace('_', ' ') : 'Mayormente Despejado'}
            </span>
          </div>
        </div>

        {alertaEvaluada && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-12 w-full rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 border-b border-white/20 pb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                alertaEvaluada.prioridad === 'ALTA' ? 'bg-red-500/80' : 
                alertaEvaluada.prioridad === 'MEDIA' ? 'bg-amber-500/80' : 'bg-slate-500/80'
              }`}>
                PRIORIDAD {alertaEvaluada.prioridad}
              </span>
              <h2 className="text-lg font-semibold tracking-wide">Pronóstico Crítico</h2>
            </div>
            <p className="mt-4 text-base font-medium leading-relaxed text-white/95">
              {alertaEvaluada.mensaje}
            </p>
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-sm text-white/80">
              <span>Hora: <strong>{alertaEvaluada.horaEstimada}</strong></span>
              <span>Canal: <strong>{alertaEvaluada.canalSugerido.replace('_', ' ')}</strong></span>
            </div>
          </motion.div>
        )}

        <button
          onClick={() => setIsModalOpen(true)}
          className="mt-12 flex w-full items-center justify-center gap-3 rounded-2xl bg-white/20 px-6 py-4 font-bold text-white shadow-lg backdrop-blur-md transition-all hover:bg-white/30 active:scale-95 border border-white/10"
        >
          <BellRing size={22} />
          Registrarse para Alertas
        </button>
      </motion.div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-2xl"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white/60 transition hover:bg-white/20 hover:text-white"
              >
                <X size={20} />
              </button>
              <div className="mt-2">
                <RegistroAgricultor />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}