import { NextRequest, NextResponse } from 'next/server';
import { obtenerPronosticoTaraco } from '@/services/meteorologia/open-meteo';
import { analizarRiesgoHelada } from '@/core/motor-probabilidades';
import { despacharAlertasMasivas } from '@/jobs/cola-alertas';
import { indiceHoraActual } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 1. Proteger el endpoint: sin CRON_SECRET configurado, se rechaza todo
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 401 });
  }

  // Modo simulación: no envía nada. Solo en este modo se acepta ?temp=
  const dry = request.nextUrl.searchParams.get('dry') === '1';
  const tempParam = request.nextUrl.searchParams.get('temp');
  const tempSimulada =
    dry && tempParam !== null && tempParam.trim() !== '' && Number.isFinite(Number(tempParam))
      ? Number(tempParam)
      : null;

  try {
    // 2. Obtener datos meteorológicos actualizados de Taraco
    const datosPronostico = await obtenerPronosticoTaraco();

    if (!datosPronostico.temperatura || datosPronostico.temperatura.length === 0) {
      return NextResponse.json(
        { error: 'No se recibieron datos de pronóstico' },
        { status: 500 }
      );
    }

    // 3. Identificar la temperatura mínima prevista y su hora.
    // Open-Meteo devuelve el pronóstico desde las 00:00 de hoy: se parte de la
    // hora actual (Lima) para no alertar por horas que ya pasaron.
    const inicio = indiceHoraActual(datosPronostico.tiempo);
    const ventana = datosPronostico.temperatura.slice(inicio, inicio + 24);
    const temperaturaReal = Math.min(...ventana);
    const indiceMin = inicio + ventana.indexOf(temperaturaReal);
    const temperaturaMin = tempSimulada ?? temperaturaReal;

    const fechaHora = new Date(datosPronostico.tiempo[indiceMin]);
    const horaEstimada = !isNaN(fechaHora.getTime())
      ? fechaHora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true })
      : datosPronostico.tiempo[indiceMin] || '05:00 a. m.';

    // Estimación de probabilidad según el descenso térmico
    let probabilidad = 0;
    if (temperaturaMin <= -2) {
      probabilidad = 90;
    } else if (temperaturaMin <= 0) {
      probabilidad = 75;
    } else if (temperaturaMin <= 2) {
      probabilidad = 50;
    }

    // 4. Evaluar riesgo con el motor de probabilidades
    const evaluacion = analizarRiesgoHelada(temperaturaMin, probabilidad, horaEstimada);

    const simulacion = tempSimulada !== null ? { simulada: true, temperaturaReal } : undefined;

    if (!evaluacion) {
      return NextResponse.json({
        status: 'ejecutado',
        accion: 'Sin riesgo de helada agronómica (> 2°C)',
        temperaturaMin,
        horaEstimada,
        simulacion,
      });
    }

    // 5. Si la prioridad requiere acción (MEDIA o ALTA), despachar alertas
    if (evaluacion.prioridad === 'MEDIA' || evaluacion.prioridad === 'ALTA') {
      const resumen = await despacharAlertasMasivas(evaluacion, { dry });

      return NextResponse.json({
        status: 'ejecutado',
        accion: dry ? 'Simulación: no se envió nada' : 'Alertas despachadas',
        evaluacion,
        resumen,
        simulacion,
      });
    }

    return NextResponse.json({
      status: 'ejecutado',
      accion: 'Condiciones frías de prioridad baja, no se requirió despacho masivo',
      evaluacion,
      simulacion,
    });
  } catch (error) {
    console.error('Error durante la ejecución del cron de monitoreo:', error);
    return NextResponse.json(
      { error: 'Fallo al procesar el monitoreo climático', detalle: String(error) },
      { status: 500 }
    );
  }
}