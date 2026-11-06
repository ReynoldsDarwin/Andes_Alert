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

  const params = request.nextUrl.searchParams;

  // ?dry=1  -> simulación: no envía nada.
  const dry = params.get('dry') === '1';

  // ?solo=519XXXXXXXX -> limita el envío a UN agricultor ya registrado (pruebas).
  const soloCrudo = params.get('solo');
  const solo = soloCrudo === null ? null : soloCrudo.replace(/[\s+\-]/g, '');
  if (solo !== null && !/^\d{9,15}$/.test(solo)) {
    return NextResponse.json(
      { error: 'Parámetro solo inválido: use el celular con 9 a 15 dígitos' },
      { status: 400 }
    );
  }

  // ?temp=<valor> -> simula la temperatura mínima. Solo se acepta junto con dry=1
  // o con solo=..., nunca para un envío masivo real.
  const tempParam = params.get('temp');
  const tempSimulada =
    (dry || solo !== null) &&
    tempParam !== null &&
    tempParam.trim() !== '' &&
    Number.isFinite(Number(tempParam))
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
    const evaluacionBase = analizarRiesgoHelada(temperaturaMin, probabilidad, horaEstimada);

    const simulacion =
      tempSimulada !== null ? { simulada: true, temperaturaReal, envioReal: !dry } : undefined;

    if (!evaluacionBase) {
      return NextResponse.json({
        status: 'ejecutado',
        accion: 'Sin riesgo de helada agronómica (> 2°C)',
        temperaturaMin,
        horaEstimada,
        simulacion,
      });
    }

    // Un envío real con temperatura simulada es una prueba: se rotula en el mensaje.
    const evaluacion =
      tempSimulada !== null && !dry
        ? { ...evaluacionBase, mensaje: `[PRUEBA] ${evaluacionBase.mensaje}` }
        : evaluacionBase;

    // 5. Si la prioridad requiere acción (MEDIA o ALTA), despachar alertas
    if (evaluacion.prioridad === 'MEDIA' || evaluacion.prioridad === 'ALTA') {
      const resumen = await despacharAlertasMasivas(evaluacion, { dry, solo });

      // Fallo total: había destinatarios y a NINGUNO le llegó el aviso por ningún canal.
      // Se responde 502 para que cron-job.org lo registre como fallo y te avise.
      const falloTotal =
        !dry && resumen.destinatarios > 0 && resumen.sinEntrega === resumen.destinatarios;
      const hayFallos =
        !dry &&
        (resumen.sinEntrega > 0 || resumen.sms.fallidos > 0 || resumen.whatsapp.fallidos > 0);

      let accion = 'Alertas despachadas';
      if (dry) accion = 'Simulación: no se envió nada';
      else if (falloTotal) accion = 'FALLO TOTAL: el aviso no llegó a ningún agricultor';
      else if (hayFallos) accion = 'Alertas despachadas con fallos parciales';

      return NextResponse.json(
        {
          status: falloTotal ? 'error' : 'ejecutado',
          accion,
          evaluacion,
          resumen,
          simulacion,
        },
        { status: falloTotal ? 502 : 200 }
      );
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
      {
        error: 'Fallo al procesar el monitoreo climático',
        detalle: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}