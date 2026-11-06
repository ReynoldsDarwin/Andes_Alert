import { EvaluacionAlerta } from '@/types/clima';
import type { ResultadoEnvio } from '@/types/envio';
import { enviarSMSHttp } from '@/services/notificaciones/sms-httpsms';
import { enviarWhatsAppAlerta } from '@/services/notificaciones/whatsapp-meta';
import { supabase } from '@/lib/supabase';
import { canalesActivos, type Canal } from '@/lib/canales';

// Cuántos agricultores se procesan a la vez.
const TAMANO_LOTE = 5;
const MAX_ERRORES_EN_RESUMEN = 5;

interface ContadorCanal {
  enviados: number;
  fallidos: number;
}

export interface OpcionesDespacho {
  /** Simulación: calcula destinatarios pero no envía nada. */
  dry?: boolean;
  /** Limita el envío a UN agricultor ya registrado (para pruebas controladas). */
  solo?: string | null;
}

export interface ResumenDespacho {
  dry: boolean;
  canalesActivos: Canal[];
  soloAplicado: boolean;
  destinatarios: number;
  sms: ContadorCanal;
  whatsapp: ContadorCanal;
  /** Agricultores a los que NO llegó el aviso por ningún canal intentado. */
  sinEntrega: number;
  /** Muestra de errores (máx. 5), con el teléfono enmascarado. */
  errores: string[];
}

/** Deja solo dígitos y antepone 51 si viene un celular de 9 dígitos. */
export function normalizarTelefono(telefono: string): string {
  const digitos = telefono.replace(/\D/g, '');
  return digitos.length === 9 && digitos.startsWith('9') ? `51${digitos}` : digitos;
}

async function seguro(fn: () => Promise<ResultadoEnvio>): Promise<ResultadoEnvio> {
  try {
    return await fn();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function despacharAlertasMasivas(
  alerta: EvaluacionAlerta,
  opciones: OpcionesDespacho = {}
): Promise<ResumenDespacho> {
  const canales = canalesActivos();
  const usaWhatsApp = canales.includes('whatsapp');
  const usaSms = canales.includes('sms');
  const solo = opciones.solo ? normalizarTelefono(opciones.solo) : null;

  const resumen: ResumenDespacho = {
    dry: !!opciones.dry,
    canalesActivos: canales,
    soloAplicado: solo !== null,
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

  // Con "solo" se envía únicamente a ese agricultor REGISTRADO (nunca a un número
  // arbitrario) y se ignora la tolerancia, porque es una prueba dirigida.
  const contactosNotificables = solo
    ? agricultores.filter((u) => normalizarTelefono(u.telefono) === solo)
    : agricultores.filter((u) => {
        if (alerta.prioridad === 'ALTA') return true;
        return u.tolerancia_alerta === 'MEDIA' || u.tolerancia_alerta === 'BAJA';
      });

  resumen.destinatarios = contactosNotificables.length;

  if (opciones.dry) {
    console.log(`[DRY] Se enviaría a ${resumen.destinatarios} agricultores. No se envió nada.`);
    return resumen;
  }

  console.log(
    `Iniciando despacho (${canales.join('+')}) para ${contactosNotificables.length} agricultores.`
  );

  const registrar = (canal: Canal, telefono: string, r: ResultadoEnvio): boolean => {
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

  const notificar = async (contacto: { telefono: string }) => {
    const whatsapp = () => seguro(() => enviarWhatsAppAlerta(contacto.telefono, alerta));
    const sms = () => seguro(() => enviarSMSHttp(contacto.telefono, alerta.mensaje));
    const intentos: { canal: Canal; res: ResultadoEnvio }[] = [];

    if (usaWhatsApp && usaSms) {
      if (alerta.prioridad === 'ALTA') {
        // Alerta severa: redundancia, se usan ambos canales a la vez.
        const [rw, rs] = await Promise.all([whatsapp(), sms()]);
        intentos.push({ canal: 'whatsapp', res: rw }, { canal: 'sms', res: rs });
      } else {
        // Aviso preventivo: WhatsApp primero, SMS solo como respaldo si falla.
        const rw = await whatsapp();
        intentos.push({ canal: 'whatsapp', res: rw });
        if (!rw.ok) intentos.push({ canal: 'sms', res: await sms() });
      }
    } else if (usaWhatsApp) {
      intentos.push({ canal: 'whatsapp', res: await whatsapp() });
    } else {
      intentos.push({ canal: 'sms', res: await sms() });
    }

    let algunoOk = false;
    for (const { canal, res } of intentos) {
      if (registrar(canal, contacto.telefono, res)) algunoOk = true;
    }
    if (!algunoOk) resumen.sinEntrega++;
  };

  for (let i = 0; i < contactosNotificables.length; i += TAMANO_LOTE) {
    await Promise.all(contactosNotificables.slice(i, i + TAMANO_LOTE).map(notificar));
  }

  console.log(
    `Despacho finalizado. WhatsApp ${resumen.whatsapp.enviados} ok/${resumen.whatsapp.fallidos} fallos, ` +
      `SMS ${resumen.sms.enviados} ok/${resumen.sms.fallidos} fallos, sin entrega: ${resumen.sinEntrega}.`
  );
  return resumen;
}