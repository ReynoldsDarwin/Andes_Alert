import { EvaluacionAlerta } from '@/types/clima';

export function getBackgroundClasses(horaIso: string, alerta: EvaluacionAlerta | null) {
  const hora = new Date(horaIso).getHours();
  let faseDia = 'DIA';
  
  if (hora >= 5 && hora < 7) faseDia = 'AMANECER';
  else if (hora >= 17 && hora < 19) faseDia = 'ATARDECER';
  else if (hora >= 19 || hora < 5) faseDia = 'NOCHE';

  const isFrio = alerta?.fenomeno === 'HELADA' || alerta?.fenomeno === 'GRANIZADA';

  if (isFrio) {
    return faseDia === 'DIA' 
      ? 'bg-gradient-to-b from-slate-400 to-slate-600'
      : 'bg-gradient-to-b from-slate-900 to-sky-950';
  }

  switch (faseDia) {
    case 'AMANECER': return 'bg-gradient-to-b from-indigo-900 via-purple-800 to-orange-400';
    case 'DIA': return 'bg-gradient-to-b from-sky-400 to-blue-600';
    case 'ATARDECER': return 'bg-gradient-to-b from-blue-700 via-purple-600 to-orange-500';
    case 'NOCHE': return 'bg-gradient-to-b from-slate-900 to-blue-950';
    default: return 'bg-gradient-to-b from-sky-400 to-blue-600';
  }
}