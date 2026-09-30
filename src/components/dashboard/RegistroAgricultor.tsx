'use client';

import { useActionState } from 'react';
import { registrarAgricultor, FormState } from '@/app/actions/registro';

const initialState: FormState = { success: false, message: '' };

export default function RegistroAgricultor() {
  const [state, formAction, isPending] = useActionState(registrarAgricultor, initialState);

  return (
    <div className="w-full text-center">
      <h3 className="mb-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        Registro de Alertas
      </h3>
      <p className="mb-8 text-sm font-medium text-slate-600 dark:text-slate-400">
        Protege tu cultivo y ganado. Regístrate para recibir avisos directos.
      </p>

      <form action={formAction} className="space-y-5 text-left">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Nombre Completo
          </label>
          <input
            type="text"
            name="nombreCompleto"
            required
            placeholder="Ej: Juan Quispe"
            className="w-full rounded-xl border border-slate-300/60 bg-white/50 px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Número de Celular
          </label>
          <input
            type="tel"
            name="telefono"
            required
            placeholder="987654321"
            className="w-full rounded-xl border border-slate-300/60 bg-white/50 px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Sector / Comunidad
            </label>
            <select
              name="comunidad"
              required
              className="w-full appearance-none rounded-xl border border-slate-300/60 bg-white/50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 dark:border-white/10 dark:bg-slate-900/50 dark:text-white"
            >
              <option value="Taraco Centro">Taraco Centro</option>
              <option value="Ramis">Ramis</option>
              <option value="Puente Ramis">Puente Ramis</option>
              <option value="Huancané Chico">Huancané Chico</option>
              <option value="Jasana">Jasana</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Nivel de Alerta
            </label>
            <select
              name="toleranciaAlerta"
              required
              defaultValue="MEDIA"
              className="w-full appearance-none rounded-xl border border-slate-300/60 bg-white/50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 dark:border-white/10 dark:bg-slate-900/50 dark:text-white"
            >
              <option value="ALTA">Solo Urgentes</option>
              <option value="MEDIA">Preventivas</option>
              <option value="BAJA">Todas (Información)</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="mt-4 w-full rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-3.5 font-bold text-white shadow-lg shadow-sky-500/30 transition-all hover:scale-[1.02] hover:shadow-sky-500/50 disabled:opacity-50 disabled:hover:scale-100"
        >
          {isPending ? 'Procesando...' : 'Confirmar Registro'}
        </button>

        {state.message && (
          <p
            className={`mt-4 rounded-xl p-3 text-center text-sm font-medium ${
              state.success
                ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400'
            }`}
          >
            {state.message}
          </p>
        )}
      </form>
    </div>
  );
}