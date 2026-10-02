import { NextRequest, NextResponse } from 'next/server';
import { obtenerPronosticoTaraco } from '@/services/meteorologia/open-meteo';
import { analizarRiesgoHelada } from '@/core/motor-probabilidades';
import { despacharAlertasMasivas } from '@/jobs/cola-alertas';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 1. Proteger el endpoint mediante CRON_SECRET de Vercel
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Acceso no autorizado' },
      { status: 401 }
    );
  }

  try {
    // 2. Obtener datos meteorológicos actualizados de Taraco
    const datosPronostico = await obtenerPronosticoTaraco();

    if (!datosPronostico.temperatura || datosPronostico.temperatura.length === 0) {
      return NextResponse.json(
        { error: 'No se recibieron datos de pronóstico' },
        { status: 500 }
      );
    }

    // 3. Identificar la temperatura mínima prevista y su hora
    const temperaturaMin = Math.min(...datosPronostico.temperatura);
    const indiceMin = datosPronostico.temperatura.indexOf(temperaturaMin);

    // Formatear la hora del pronóstico (ej: "2026-10-02T04:00" -> "04:00 a. m.")
    const fechaHora = new Date(datosPronostico.tiempo[indiceMin]);
    const horaEstimada = !isNaN(fechaHora.getTime())
      ? fechaHora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true })
      : datosPronostico.tiempo[indiceMin] || '05:00 a. m.';

    // Estimación de probabilidad: para heladas radiativas en Taraco, si temp <= 0°C
    // se asigna probabilidad según el descenso térmico
    let probabilidad = 0;
    if (temperaturaMin <= -2) {
      probabilidad = 90;
    } else if (temperaturaMin <= 0) {
      probabilidad = 75;
    } else if (temperaturaMin <= 2) {
      probabilidad = 50;
    }

    // 4. Evaluar riesgo con el motor de probabilidades
    const evaluacion = analizarRiesgoHelada(
      temperaturaMin,
      probabilidad,
      horaEstimada
    );

    // Si la temperatura es > 2°C, la función retorna null (sin helada)
    if (!evaluacion) {
      return NextResponse.json({
        status: 'ejecutado',
        accion: 'Sin riesgo de helada agronómica (> 2°C)',
        temperaturaMin,
        horaEstimada,
      });
    }

    // 5. Si la prioridad requiere acción (MEDIA o ALTA), despachar alertas
    if (evaluacion.prioridad === 'MEDIA' || evaluacion.prioridad === 'ALTA') {
      await despacharAlertasMasivas(evaluacion);

      return NextResponse.json({
        status: 'ejecutado',
        accion: 'Alertas despachadas',
        evaluacion,
      });
    }

    return NextResponse.json({
      status: 'ejecutado',
      accion: 'Condiciones frías de prioridad baja, no se requirió despacho masivo',
      evaluacion,
    });
  } catch (error) {
    console.error('Error durante la ejecución del cron de monitoreo:', error);
    return NextResponse.json(
      { error: 'Fallo al procesar el monitoreo climático', detalle: String(error) },
      { status: 500 }
    );
  }
}