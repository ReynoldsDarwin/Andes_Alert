import { obtenerPronosticoTaraco } from '@/services/meteorologia/open-meteo';
import { analizarRiesgoHelada } from '@/core/motor-probabilidades';
import ClientDashboard from '@/components/dashboard/ClientDashboard';

// Fuerza a Next.js a revalidar los datos de esta página cada 15 minutos
export const revalidate = 900; 

export default async function Home() {
  // 1. Obtener datos crudos de la API
  const pronostico = await obtenerPronosticoTaraco();

  // 2. Extraer la temperatura más baja de las próximas 24 horas para evaluación
  const proximas24h = pronostico.temperatura.slice(0, 24);
  const tempMinima = Math.min(...proximas24h);
  const indiceMinimo = pronostico.temperatura.indexOf(tempMinima);
  
  // Formatear la hora de ocurrencia
  const horaCritica = new Date(pronostico.tiempo[indiceMinimo]).toLocaleTimeString('es-PE', {
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true
  });

  // Simulamos el cálculo de probabilidad térmica basándonos en la temperatura proyectada
  // (En producción, esto se cruzaría con el modelo Ensemble de Open-Meteo)
  let probabilidadHelada = 0;
  if (tempMinima <= -2) probabilidadHelada = 90;
  else if (tempMinima <= 0) probabilidadHelada = 65;
  else if (tempMinima <= 2) probabilidadHelada = 40;

  // 3. Pasar los datos al Motor de Reglas
  const alertaEvaluada = analizarRiesgoHelada(tempMinima, probabilidadHelada, horaCritica);

  return (
    <main className="relative flex min-h-screen items-center justify-center p-6 overflow-hidden">
      {/* 4. Delegamos toda la interfaz y animaciones al Client Component */}
      <ClientDashboard alertaEvaluada={alertaEvaluada} />
    </main>
  );
}