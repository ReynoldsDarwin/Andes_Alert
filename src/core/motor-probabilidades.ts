import { EvaluacionAlerta, NivelPrioridad, TipoFenomeno } from '@/types/clima';

export function evaluarNivelAlerta(probabilidad: number): {
  prioridad: NivelPrioridad;
  canalSugerido: EvaluacionAlerta['canalSugerido'];
} {
  if (probabilidad > 75) {
    return { prioridad: 'ALTA', canalSugerido: 'SMS_URGENTE' };
  }
  if (probabilidad >= 50) {
    return { prioridad: 'MEDIA', canalSugerido: 'PUSH_WHATSAPP' };
  }
  return { prioridad: 'BAJA', canalSugerido: 'SOLO_WEB' };
}

export function analizarRiesgoHelada(
  temperaturaMinima: number,
  probabilidadHelada: number,
  hora: string
): EvaluacionAlerta | null {
  // En el altiplano de Taraco, temperaturas <= 0°C representan helada agronómica
  if (temperaturaMinima > 2) return null;

  const { prioridad, canalSugerido } = evaluarNivelAlerta(probabilidadHelada);

  let mensaje = '';
  if (prioridad === 'ALTA') {
    mensaje = `⚠️ ALERTA URGENTE: ${probabilidadHelada}% de probabilidad de helada severa (${temperaturaMinima}°C) en Taraco a las ${hora}. Proteja sembríos y ganado.`;
  } else if (prioridad === 'MEDIA') {
    mensaje = `Aviso preventivo: ${probabilidadHelada}% de riesgo de helada (${temperaturaMinima}°C) prevista para las ${hora}. Estar atentos.`;
  } else {
    mensaje = `Condiciones frías (${temperaturaMinima}°C) con baja probabilidad (${probabilidadHelada}%) de helada.`;
  }

  return {
    fenomeno: 'HELADA',
    probabilidad: probabilidadHelada,
    prioridad,
    mensaje,
    canalSugerido,
    horaEstimada: hora,
  };
}