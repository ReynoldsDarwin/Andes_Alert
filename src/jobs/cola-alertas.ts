import { EvaluacionAlerta } from '@/types/clima';
import type { ResultadoEnvio } from '@/types/envio';
import { enviarSMSHttp } from '@/services/notificaciones/sms-httpsms';
import { enviarWhatsAppAlerta } from '@/services/notificaciones/whatsapp-meta';
import { supabase } from '@/lib/supabase';

// Cuántos agricultores se procesan a la vez (cada uno usa 2 canales en paralelo).
const TAMANO_LOTE = 5;
const MAX_ERRORES_EN_RESUMEN = 5;

interface ContadorCanal {
  enviados: number;
  fallidos: number;
}

export interface ResumenDespacho {
  dry: boolean;
  destinatarios: number;
  sms: ContadorCanal;
  whatsapp: ContadorCanal;
  /** Agricultores a los que NO llegó el aviso por ningún canal. */
  sinEntrega: number;
  /** Muestra de errores (máx. 5), con el teléfono enmascarado. */
  errores: string[];
}

function normalizar(r: PromiseSettledResult<ResultadoEnvio>): ResultadoEnvio {
  if (r.status === 'fulfilled') return r.value;
  const motivo = r.reason instanceof Error ? r.reason.message : String(r.reason);
  return { ok: false, error: motivo };
}

export async function despacharAlertasMasivas(
  alerta: EvaluacionAlerta,
  opciones: { dry?: boolean } = {}
): Promise<ResumenDespacho> {
  const resumen: ResumenDespacho = {
    dry: !!opciones.dry,
    destinatarios: 0,
    sms: { enviados: 0, fallidos: 0 },
    whatsapp: { enviados: 0, fallidos: 0 },
    sinEntrega: 0,
    errores: [],
  };

  if (alerta.prioridad === 'BAJA') {
    console.log('Alerta de prioridad BAJA: Registrada en Dashboard web. No se encolan mensajes directos.');
    return resumen;
  }

  // Si Supabase falla, se lanza el error: el endpoint responde 500 y cron-job.org
  // lo marca como fallo, en lugar de verse como "0 destinatarios" con un 200.
  const { data: agricultores, error } = await supabase
    .from('agricultores')
    .select('nombre_completo, telefono, tolerancia_alerta');

  if (error) {
    console.error('Error al consultar agricultores en Supabase:', error);
    throw new Error(`No se pudo leer la tabla de agricultores: ${error.message}`);
  }

  if (!agricultores || agricultores.length === 0) {
    console.log('No se encontraron agricultores para notificar.');
    return resumen;
  }

  const contactosNotificables = agricultores.filter((user) => {
    if (alerta.prioridad === 'ALTA') return true;
    return user.tolerancia_alerta === 'MEDIA' || user.tolerancia_alerta === 'BAJA';
  });

  resumen.destinatarios = contactosNotificables.length;

  if (opciones.dry) {
    console.log(`[DRY] Se enviaría a ${resumen.destinatarios} agricultores. No se envió nada.`);
    return resumen;
  }

  console.log(`Iniciando despacho multicanal para ${contactosNotificables.length} agricultores.`);

  const registrar = (canal: 'sms' | 'whatsapp', telefono: string, r: ResultadoEnvio): boolean => {
    if (r.ok) {
      resumen[canal].enviados++;
      return true;
    }
    resumen[canal].fallidos++;
    if (resumen.errores.length < MAX_ERRORES_EN_RESUMEN) {
      resumen.errores.push(
        `${canal} ***${telefono.replace(/\D/g, '').slice(-3)}: ${r.error ?? 'error desconocido'}`
      );
    }
    return false;
  };

  for (let i = 0; i < contactosNotificables.length; i += TAMANO_LOTE) {
    const lote = contactosNotificables.slice(i, i + TAMANO_LOTE);

    await Promise.all(
      lote.map(async (contacto) => {
        const [resWhatsApp, resSMS] = await Promise.allSettled([
          enviarWhatsAppAlerta(contacto.telefono, alerta),
          enviarSMSHttp(contacto.telefono, alerta.mensaje),
        ]);

        const waOk = registrar('whatsapp', contacto.telefono, normalizar(resWhatsApp));
        const smsOk = registrar('sms', contacto.telefono, normalizar(resSMS));

        if (!waOk && !smsOk) resumen.sinEntrega++;
      })
    );
  }

  console.log(
    `Despacho finalizado. WhatsApp ${resumen.whatsapp.enviados}/${contactosNotificables.length}, ` +
      `SMS ${resumen.sms.enviados}/${contactosNotificables.length}, sin entrega: ${resumen.sinEntrega}.`
  );
  return resumen;
}