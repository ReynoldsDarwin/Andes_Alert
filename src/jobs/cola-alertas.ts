import { EvaluacionAlerta } from '@/types/clima';
import { enviarSMSAlerta } from '@/services/notificaciones/sms-twilio';
import { enviarWhatsAppAlerta } from '@/services/notificaciones/whatsapp-meta';
import { supabase } from '@/lib/supabase';

export async function despacharAlertasMasivas(alerta: EvaluacionAlerta) {
  // Las prioridades bajas (probabilidad < 50%) solo se registran en el Dashboard web
  if (alerta.prioridad === 'BAJA') {
    console.log('Alerta de prioridad BAJA: Registrada en Dashboard web. No se encolan mensajes directos.');
    return;
  }

  try {
    // 1. Obtener la lista de agricultores registrados en la base de datos
    const { data: agricultores, error } = await supabase
      .from('agricultores')
      .select('nombre_completo, telefono, tolerancia_alerta');

    if (error) {
      console.error('Error al consultar agricultores en Supabase:', error);
      throw error;
    }

    if (!agricultores || agricultores.length === 0) {
      console.log('No se encontraron agricultores para notificar.');
      return;
    }

    // 2. Filtrar a quiénes se les notifica dependiendo de su preferencia de riesgo
    const contactosNotificables = agricultores.filter((user) => {
      if (alerta.prioridad === 'ALTA') return true;
      return user.tolerancia_alerta === 'MEDIA' || user.tolerancia_alerta === 'BAJA';
    });

    console.log(`Iniciando despacho multicanal para ${contactosNotificables.length} agricultores.`);

    // 3. Despacho Multicanal Simultáneo (WhatsApp + SMS)
    for (const contacto of contactosNotificables) {
      // Promise.allSettled dispara ambos canales en paralelo y evita que un fallo detenga al otro
      const [resWhatsApp, resSMS] = await Promise.allSettled([
        enviarWhatsAppAlerta(contacto.telefono, alerta.mensaje),
        enviarSMSAlerta(contacto.telefono, alerta.mensaje)
      ]);

      if (resWhatsApp.status === 'rejected') {
        console.error(`Fallo en entrega de WhatsApp para ${contacto.telefono}:`, resWhatsApp.reason);
      }
      if (resSMS.status === 'rejected') {
        console.error(`Fallo en entrega de SMS para ${contacto.telefono}:`, resSMS.reason);
      }
    }

    console.log(`Despacho finalizado. Alcanzados ${contactosNotificables.length} agricultores.`);
  } catch (error) {
    console.error('Fallo general en la ejecución de la cola masiva de alertas:', error);
  }
}