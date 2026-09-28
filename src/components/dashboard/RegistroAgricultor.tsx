'use client';

import { useActionState } from 'react';
import { registrarAgricultor, FormState } from '@/app/actions/registro';

const initialState: FormState = { success: false, message: '' };

export default function RegistroAgricultor() {
  const [state, formAction, isPending] = useActionState(registrarAgricultor, initialState);

  return (
    <div className="w-full text-left">
      <h3 className="mb-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
        Registro de Productores
      </h3>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Recibe avisos directos en tu teléfono celular ante riesgos de helada o tormenta.
      </p>

      <form action={formAction} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Nombre Completo
          </label>
          <input
            type="text"
            name="nombreCompleto"
            required
            placeholder="Ej: Juan Quispe"
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Número de Celular
          </label>
          <input
            type="tel"
            name="telefono"
            required
            placeholder="987654321"
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Sector / Comunidad
            </label>
            <select
              name="comunidad"
              required
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="Taraco Centro">Taraco Centro</option>
              <option value="Ramis">Ramis</option>
              <option value="Puente Ramis">Puente Ramis</option>
              <option value="Huancané Chico">Huancané Chico</option>
              <option value="Jasana">Jasana</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nivel de Alerta
            </label>
            <select
              name="toleranciaAlerta"
              required
              defaultValue="MEDIA"
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="ALTA">Solo Urgentes (&gt; 75%)</option>
              <option value="MEDIA">Preventivas (&gt; 50%)</option>
              <option value="BAJA">Todas (Informativas)</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 w-full rounded-lg bg-sky-600 py-3 font-bold text-white transition hover:bg-sky-500 disabled:opacity-50"
        >
          {isPending ? 'Guardando registro...' : 'Confirmar Registro'}
        </button>

        {state.message && (
          <p
            className={`mt-3 rounded-lg p-3 text-center text-sm font-medium ${
              state.success
                ? 'border border-emerald-500/40 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'border border-red-500/40 bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
            }`}
          >
            {state.message}
          </p>
        )}
      </form>
    </div>
  );
}