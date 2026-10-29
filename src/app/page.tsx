import { obtenerPronosticoTaraco } from '@/services/meteorologia/open-meteo';
import { analizarRiesgoHelada } from '@/core/motor-probabilidades';
import ClientDashboard from '@/components/dashboard/ClientDashboard';

export const revalidate = 900; 

export default async function Home() {
  const pronostico = await obtenerPronosticoTaraco();

  const proximas24h = pronostico.temperatura.slice(0, 24);
  const tempMinima = Math.min(...proximas24h);
  const indiceMinimo = pronostico.temperatura.indexOf(tempMinima);
  
  // Extraemos la temperatura actual (índice 0) y el timestamp actual
  const temperaturaActual = pronostico.temperatura[0];
  const horaActualIso = pronostico.tiempo[0];

  const horaCritica = new Date(pronostico.tiempo[indiceMinimo]).toLocaleTimeString('es-PE', {
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true
  });

  let probabilidadHelada = 0;
  if (tempMinima <= -2) probabilidadHelada = 90;
  else if (tempMinima <= 0) probabilidadHelada = 65;
  else if (tempMinima <= 2) probabilidadHelada = 40;

  const alertaEvaluada = analizarRiesgoHelada(tempMinima, probabilidadHelada, horaCritica);

  return (
    <main className="p-0 m-0 bg-slate-950">
      <ClientDashboard 
        alertaEvaluada={alertaEvaluada} 
        horaActualIso={horaActualIso}
        temperaturaActual={temperaturaActual}
      />
    </main>
  );
}