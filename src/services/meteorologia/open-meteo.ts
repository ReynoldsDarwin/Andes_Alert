import { ClimaPronosticoTaraco } from '@/types/clima';

// Coordenadas aproximadas de Taraco (Huancané, Puno)
const TARACO_COORDS = {
  latitude: -15.297,
  longitude: -69.983,
};

export async function obtenerPronosticoTaraco(): Promise<ClimaPronosticoTaraco> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.append('latitude', TARACO_COORDS.latitude.toString());
  url.searchParams.append('longitude', TARACO_COORDS.longitude.toString());
  url.searchParams.append(
    'hourly',
    'temperature_2m,precipitation_probability,dew_point_2m,wind_speed_10m'
  );
  url.searchParams.append('timezone', 'America/Lima');
  url.searchParams.append('forecast_days', '2');

  const res = await fetch(url.toString(), {
    next: { revalidate: 900 }, // Caché de 15 minutos en Next.js
  });

  if (!res.ok) {
    throw new Error(`Error al consultar Open-Meteo: ${res.statusText}`);
  }

  const data = await res.json();

  return {
    tiempo: data.hourly.time,
    temperatura: data.hourly.temperature_2m,
    probabilidadPrecipitacion: data.hourly.precipitation_probability,
    puntoRocio: data.hourly.dew_point_2m,
    velocidadViento: data.hourly.wind_speed_10m,
  };
}