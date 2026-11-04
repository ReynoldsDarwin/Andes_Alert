import { obtenerPronosticoTaraco } from '@/services/meteorologia/open-meteo';
import { analizarRiesgoHelada } from '@/core/motor-probabilidades';
import { indiceHoraActual } from '@/lib/utils';
import ClientDashboard from '@/components/dashboard/ClientDashboard';

export const revalidate = 900;

export default async function Home() {
  const pronostico = await obtenerPronosticoTaraco();

  // Open-Meteo devuelve el pronóstico desde las 00:00 de hoy; hay que partir
  // de la hora actual (Lima) para no mostrar ni evaluar horas ya pasadas.
  const inicio = indiceHoraActual(pronostico.tiempo);
  const ventana = pronostico.temperatura.slice(inicio, inicio + 24);

  const tempMinima = Math.min(...ventana);
  const indiceMinimo = inicio + ventana.indexOf(tempMinima);

  const temperaturaActual = pronostico.temperatura[inicio];
  const horaActualIso = pronostico.tiempo[inicio];

  // Temperatura de la próxima ocurrencia de una hora ("18", "21", "00", "03")
  // dentro de las próximas 24 horas.
  const getTempForHour = (hh: string): number => {
    const limite = Math.min(inicio + 24, pronostico.tiempo.length);
    for (let i = inicio; i < limite; i++) {
      if (pronostico.tiempo[i].slice(11, 13) === hh) {
        return pronostico.temperatura[i];
      }
    }
    return tempMinima;
  };

  const proyeccion = {
    h18: getTempForHour('18'),
    h21: getTempForHour('21'),
    h00: getTempForHour('00'),
    h03: getTempForHour('03'),
  };

  const horaCritica = new Date(pronostico.tiempo[indiceMinimo]).toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Mismos umbrales que /api/cron/monitoreo, para que lo que muestra la web
  // coincida con lo que se envía por SMS/WhatsApp.
  let probabilidadHelada = 0;
  if (tempMinima <= -2) probabilidadHelada = 90;
  else if (tempMinima <= 0) probabilidadHelada = 75;
  else if (tempMinima <= 2) probabilidadHelada = 50;

  const alertaEvaluada = analizarRiesgoHelada(tempMinima, probabilidadHelada, horaCritica);

  return (
    <main className="p-0 m-0 bg-slate-950 overflow-hidden">
      <ClientDashboard
        alertaEvaluada={alertaEvaluada}
        horaActualIso={horaActualIso}
        temperaturaActual={temperaturaActual}
        proyeccion={proyeccion}
      />
    </main>
  );
}