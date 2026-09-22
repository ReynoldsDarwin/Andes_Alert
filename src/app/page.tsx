import { obtenerPronosticoTaraco } from '@/services/meteorologia/open-meteo';
import { analizarRiesgoHelada } from '@/core/motor-probabilidades';
import PanelAlertas from '@/components/dashboard/PanelAlertas';

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
    <main className="flex min-h-screen flex-col items-center p-8 bg-slate-950">
      <div className="w-full max-w-3xl">
        <header className="mb-10 text-center sm:text-left border-b border-slate-800 pb-6">
          <h1 className="text-4xl font-bold tracking-tight text-sky-400">
            Andes Alert 🏔️
          </h1>
          <p className="mt-2 text-slate-400">
            Panel de control meteorológico para el sector de Taraco - Huancané.
          </p>
        </header>

        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-slate-200">Estado Actual de Amenazas</h2>
          {/* 4. Renderizar el componente visual */}
          <PanelAlertas alerta={alertaEvaluada} />
        </section>
      </div>
    </main>
  );
}