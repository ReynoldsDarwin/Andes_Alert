import { NextResponse } from 'next/server';
import { obtenerPronosticoTaraco } from '@/services/meteorologia/open-meteo';
import { analizarRiesgoHelada } from '@/core/motor-probabilidades';

export async function GET(request: Request) {
  try {
    const pronostico = await obtenerPronosticoTaraco();
    
    // Evaluar las próximas 24 horas
    const proximas24h = pronostico.temperatura.slice(0, 24);
    const tempMinima = Math.min(...proximas24h);
    const indiceMinimo = pronostico.temperatura.indexOf(tempMinima);
    
    const horaCritica = new Date(pronostico.tiempo[indiceMinimo]).toLocaleTimeString('es-PE', {
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });

    // Simulación de probabilidad basada en umbrales térmicos
    let probabilidadHelada = 0;
    if (tempMinima <= -2) probabilidadHelada = 90;
    else if (tempMinima <= 0) probabilidadHelada = 65;
    else if (tempMinima <= 2) probabilidadHelada = 40;

    const alertaEvaluada = analizarRiesgoHelada(tempMinima, probabilidadHelada, horaCritica);

    // Enviar a la cola de mensajería masiva si el riesgo es considerable
    if (alertaEvaluada && (alertaEvaluada.prioridad === 'ALTA' || alertaEvaluada.prioridad === 'MEDIA')) {
      console.log('🚨 EVENTO CRÍTICO DETECTADO. Despachando a cola SMS/WhatsApp:', alertaEvaluada);
      // TODO: Conectar con src/jobs/cola-alertas.ts
    }

    return NextResponse.json({ 
      status: 'success', 
      timestamp: new Date().toISOString(),
      alertaActiva: alertaEvaluada 
    });

  } catch (error) {
    console.error('Error en ingesta meteorológica:', error);
    return NextResponse.json(
      { status: 'error', message: 'Falla al procesar el modelo de Open-Meteo' }, 
      { status: 500 }
    );
  }
}