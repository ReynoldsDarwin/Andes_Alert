import { EvaluacionAlerta } from '@/types/clima';
import { enviarSMSHttp } from '@/services/notificaciones/sms-httpsms';
import { enviarWhatsAppAlerta } from '@/services/notificaciones/whatsapp-meta';
import { supabase } from '@/lib/supabase';

export interface ResumenDespacho {
  dry: boolean;
  destinatarios: number;
}

export async function despacharAlertasMasivas(
  alerta: EvaluacionAlerta,
  opciones: { dry?: boolean } = {}
): Promise<ResumenDespacho> {
  const resumen: ResumenDespacho = { dry: !!opciones.dry, destinatarios: 0 };

  if (alerta.prioridad === 'BAJA') {
    console.log('Alerta de prioridad BAJA: Registrada en Dashboard web. No se encolan mensajes directos.');
    return resumen;
  }

  try {
    const { data: agricultores, error } = await supabase
      .from('agricultores')
      .select('nombre_completo, telefono, tolerancia_alerta');

    if (error) {
      console.error('Error al consultar agricultores en Supabase:', error);
      throw error;
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

    console.log(`Iniciando despacho multicanal simultáneo para ${contactosNotificables.length} agricultores.`);

    for (const contacto of contactosNotificables) {
      const [resWhatsApp, resSMS] = await Promise.allSettled([
        enviarWhatsAppAlerta(contacto.telefono, alerta),
        enviarSMSHttp(contacto.telefono, alerta.mensaje),
      ]);

      if (resWhatsApp.status === 'rejected') {
        console.error(`Fallo en entrega de WhatsApp para ${contacto.telefono}:`, resWhatsApp.reason);
      }
      if (resSMS.status === 'rejected') {
        console.error(`Fallo en entrega de SMS para ${contacto.telefono}:`, resSMS.reason);
      }
    }

    console.log(`Despacho finalizado. Alcanzados ${contactosNotificables.length} agricultores.`);
    return resumen;
  } catch (error) {
    console.error('Fallo general en la ejecución de la cola masiva de alertas:', error);
    return resumen;
  }
}