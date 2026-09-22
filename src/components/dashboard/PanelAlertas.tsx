import { EvaluacionAlerta } from '@/types/clima';

interface PanelAlertasProps {
  alerta: EvaluacionAlerta | null;
}

export default function PanelAlertas({ alerta }: PanelAlertasProps) {
  if (!alerta) {
    return (
      <div className="p-6 bg-slate-900 border border-slate-700 rounded-xl text-center">
        <p className="text-emerald-400 font-semibold text-lg">✅ Monitoreo Activo</p>
        <p className="text-slate-400 mt-2">Condiciones estables. No se detectan riesgos inminentes de helada para las próximas horas.</p>
      </div>
    );
  }

  const estilosPorPrioridad = {
    ALTA: 'bg-red-950/40 border-red-500/50 text-red-200',
    MEDIA: 'bg-amber-950/40 border-amber-500/50 text-amber-200',
    BAJA: 'bg-slate-800 border-slate-600 text-slate-300'
  };

  return (
    <div className={`p-6 border rounded-xl ${estilosPorPrioridad[alerta.prioridad]}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-xl tracking-tight">
          Alerta: Riesgo de {alerta.fenomeno}
        </h3>
        <span className="px-3 py-1 text-sm font-bold bg-black/30 rounded-full border border-inherit">
          Prioridad {alerta.prioridad}
        </span>
      </div>
      
      <p className="text-lg leading-relaxed mb-6">{alerta.mensaje}</p>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-inherit/30 text-sm opacity-90">
        <span>Hora crítica estimada: <strong>{alerta.horaEstimada}</strong></span>
        <span className="mt-2 sm:mt-0">
          Canal de despacho: <strong className="uppercase">{alerta.canalSugerido.replace('_', ' ')}</strong>
        </span>
      </div>
    </div>
  );
}