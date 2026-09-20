// Evalúa la probabilidad del clima y define la prioridad de alerta
export enum PrioridadAlerta {
  BAJA = 'BAJA',       // < 50%
  MEDIA = 'MEDIA',     // 50% - 75%
  ALTA = 'ALTA'        // > 75%
}

export const evaluarNivelAlerta = (probabilidad: number): PrioridadAlerta => {
  if (probabilidad > 75) return PrioridadAlerta.ALTA;
  if (probabilidad >= 50) return PrioridadAlerta.MEDIA;
  return PrioridadAlerta.BAJA;
};
