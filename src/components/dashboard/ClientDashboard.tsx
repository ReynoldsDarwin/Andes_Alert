'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, X, BellRing } from 'lucide-react';
import PanelAlertas from './PanelAlertas';
import RegistroAgricultor from './RegistroAgricultor';
import { EvaluacionAlerta } from '@/types/clima';

interface Props {
  alertaEvaluada: EvaluacionAlerta | null;
}

export default function ClientDashboard({ alertaEvaluada }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <>
      {/* Botón flotante para alternar Tema Claro / Oscuro */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="fixed top-6 right-6 z-40 rounded-full border border-slate-300 bg-white/80 p-3 text-slate-800 shadow-md backdrop-blur transition hover:scale-105 dark:border-slate-700 dark:bg-slate-900/80 dark:text-sky-400"
        aria-label="Cambiar tema"
      >
        {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
      </button>

      {/* Contenido principal: se difumina si el modal está activo */}
      <div
        className={`flex w-full max-w-2xl flex-col items-center space-y-8 text-center transition-all duration-300 ${
          isModalOpen ? 'pointer-events-none scale-95 blur-md opacity-40' : 'scale-100 blur-none opacity-100'
        }`}
      >
        <header className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-sky-700 sm:text-6xl dark:text-sky-400">
            Andes Alert 🏔️
          </h1>
          <p className="text-base text-slate-600 sm:text-lg dark:text-slate-400">
            Monitoreo y alerta climática en tiempo real para Taraco - Huancané
          </p>
        </header>

        {/* Estado y clima como protagonista */}
        <div className="w-full">
          <PanelAlertas alerta={alertaEvaluada} />
        </div>

        {/* Botón para abrir el registro */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-3.5 font-bold text-white shadow-lg transition hover:bg-sky-500 hover:shadow-sky-500/25"
        >
          <BellRing size={20} />
          Registrarse para recibir alertas
        </button>
      </div>

      {/* Gran Modal Superpuesto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8 dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            >
              <X size={20} />
            </button>
            <RegistroAgricultor />
          </div>
        </div>
      )}
    </>
  );
}