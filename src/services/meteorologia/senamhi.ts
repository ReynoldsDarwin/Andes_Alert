import { ClimaPronosticoTaraco } from '@/types/clima';
import { obtenerPronosticoTaraco as obtenerPronosticoOpenMeteo } from './open-meteo';

// Coordenadas y metadatos de la zona de Taraco (Huancané, Puno - Perú)
export const TARACO_SENAMHI_CONFIG = {
  estacionId: '113064', // Código de estación meteorológica cercana (Huancané / Taraco)
  departamento: 'PUNO',
  provincia: 'HUANCANE',
  distrito: 'TARACO',
  latitud: -15.297,
  longitud: -69.983,
};

export interface AvisoSenamhi {
  id: string;
  titulo: string;
  nivel: 'AMARILLO' | 'NARANJA' | 'ROJO';
  inicio: string;
  fin: string;
  descripcion: string;
  regionesAfectadas: string[];
}

export interface DatosEstacionSenamhi {
  estacion: string;
  departamento: string;
  temperaturaActual: number;
  temperaturaMinima: number;
  temperaturaMaxima: number;
  humedad: number;
  precipitacion: number;
  velocidadViento: number;
  fechaRegistro: string;
}

/**
 * Obtiene el pronóstico meteorológico oficial o estimado para Taraco utilizando las APIs públicas de SENAMHI.
 * Incluye mecanismo de respaldo (fallback) hacia Open-Meteo en caso de indisponibilidad del servicio de SENAMHI.
 */
export async function obtenerPronosticoSenamhi(): Promise<ClimaPronosticoTaraco> {
  try {
    // URL de la API pública de SENAMHI para datos de estaciones meteorológicas
    const url = `https://www.senamhi.gob.pe/servicios/api/pronostico-distrital?distrito=TARACO&dep=PUNO`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AndesAlert-ClimateSystem/1.0',
      },
      next: { revalidate: 1800 }, // Caché de 30 minutos
    });

    if (!response.ok) {
      console.warn(`[SENAMHI API] Respuesta no válida (${response.status}). Usando fuente de respaldo.`);
      return await obtenerPronosticoOpenMeteo();
    }

    const data = await response.json();

    if (!data || !data.pronostico || !Array.isArray(data.pronostico)) {
      console.warn('[SENAMHI API] Formato de respuesta no esperado. Usando fuente de respaldo.');
      return await obtenerPronosticoOpenMeteo();
    }

    // Mapeo de la respuesta de SENAMHI al modelo unificado ClimaPronosticoTaraco
    const tiempo: string[] = [];
    const temperatura: number[] = [];
    const probabilidadPrecipitacion: number[] = [];
    const puntoRocio: number[] = [];
    const velocidadViento: number[] = [];

    for (const item of data.pronostico) {
      tiempo.push(item.fechaHora || item.fecha);
      temperatura.push(Number(item.temperatura ?? 0));
      probabilidadPrecipitacion.push(Number(item.probabilidadLluvia ?? 0));
      puntoRocio.push(Number(item.puntoRocio ?? (item.temperatura - 3))); // Estimación si no viene el dato
      velocidadViento.push(Number(item.velocidadViento ?? 0));
    }

    return {
      tiempo,
      temperatura,
      probabilidadPrecipitacion,
      puntoRocio,
      velocidadViento,
    };
  } catch (error) {
    console.error('[SENAMHI API] Error al consultar datos de SENAMHI:', error);
    // Fallback de contingencia a Open-Meteo
    return await obtenerPronosticoOpenMeteo();
  }
}

/**
 * Consulta los avisos meteorológicos vigentes emitidos por SENAMHI para la región de Puno / Altiplano.
 */
export async function obtenerAvisosSenamhi(): Promise<AvisoSenamhi[]> {
  try {
    const url = 'https://www.senamhi.gob.pe/servicios/api/avisos-meteorologicos?region=PUNO';
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 3600 }, // Caché de 1 hora
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data.map((aviso: any) => ({
      id: String(aviso.id || aviso.numeroAviso),
      titulo: aviso.titulo || 'Aviso Meteorológico SENAMHI',
      nivel: (aviso.nivel as 'AMARILLO' | 'NARANJA' | 'ROJO') || 'AMARILLO',
      inicio: aviso.fechaInicio || new Date().toISOString(),
      fin: aviso.fechaFin || new Date().toISOString(),
      descripcion: aviso.descripcion || '',
      regionesAfectadas: aviso.afectados || ['PUNO'],
    }));
  } catch (error) {
    console.error('[SENAMHI API] Error al obtener avisos meteorológicos:', error);
    return [];
  }
}

