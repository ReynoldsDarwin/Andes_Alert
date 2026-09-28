import { EvaluacionAlerta } from '@/types/clima';

interface PanelAlertasProps {
  alerta: EvaluacionAlerta | null;
}

export default function PanelAlertas({ alerta }: PanelAlertasProps) {
  if (!alerta) {
    return (
      <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center shadow-sm transition-colors duration-300">
        <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-lg">✅ Monitoreo Activo</p>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Condiciones estables. No se detectan riesgos inminentes para las próximas horas.</p>
      </div>
    );
  }

  // Fondos y textos adaptables para modo Claro y Oscuro
  const estilosPorPrioridad = {
    ALTA: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-200 shadow-red-500/10',
    MEDIA: 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-200 shadow-amber-500/10',
    BAJA: 'bg-white border-slate-200 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 shadow-slate-500/5'
  };

  // Badges (etiquetas) adaptables para modo Claro y Oscuro
  const badgePorPrioridad = {
    ALTA: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30',
    MEDIA: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
    BAJA: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-600'
  };

  return (
    <div className={`p-6 sm:p-8 border rounded-2xl shadow-lg transition-colors duration-300 ${estilosPorPrioridad[alerta.prioridad]}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <h3 className="font-bold text-xl sm:text-2xl tracking-tight">
          Alerta: Riesgo de {alerta.fenomeno}
        </h3>
        <span className={`px-3 py-1 text-xs sm:text-sm font-bold rounded-full border ${badgePorPrioridad[alerta.prioridad]}`}>
          Prioridad {alerta.prioridad}
        </span>
      </div>
      
      <p className="text-base sm:text-lg leading-relaxed mb-6 font-medium opacity-90">{alerta.mensaje}</p>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-inherit/30 text-sm opacity-80 gap-2">
        <span>Hora crítica estimada: <strong className="font-bold">{alerta.horaEstimada}</strong></span>
        <span>
          Canal de despacho: <strong className="font-bold uppercase">{alerta.canalSugerido.replace('_', ' ')}</strong>
        </span>
      </div>
    </div>
  );
}