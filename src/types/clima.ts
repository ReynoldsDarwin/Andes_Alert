export type TipoFenomeno = 'HELADA' | 'GRANIZADA' | 'LLUVIA_TORRENCIAL' | 'VIENTO_FUERTE';

export type NivelPrioridad = 'BAJA' | 'MEDIA' | 'ALTA';

export interface EvaluacionAlerta {
  fenomeno: TipoFenomeno;
  probabilidad: number; // 0 a 100 %
  prioridad: NivelPrioridad;
  mensaje: string;
  canalSugerido: 'SOLO_WEB' | 'PUSH_WHATSAPP' | 'SMS_URGENTE';
  horaEstimada: string;
}

export interface ClimaPronosticoTaraco {
  tiempo: string[];
  temperatura: number[];
  probabilidadPrecipitacion: number[];
  puntoRocio: number[];
  velocidadViento: number[];
}