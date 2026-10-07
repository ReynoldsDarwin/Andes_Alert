import { EvaluacionAlerta } from '@/types/clima';
import { enviarWhatsAppAlerta } from '@/services/notificaciones/whatsapp-meta';
import { supabase } from '@/lib/supabase';

export async function despacharAlertasMasivas(alerta: EvaluacionAlerta) {
  if (alerta.prioridad === 'BAJA') {
    console.log('Alerta de prioridad BAJA: Registrada en Dashboard web. No se encolan mensajes directos.');
    return;
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
      return;
    }

    const contactosNotificables = agricultores.filter((user) => {
      if (alerta.prioridad === 'ALTA') return true;
      return user.tolerancia_alerta === 'MEDIA' || user.tolerancia_alerta === 'BAJA';
    });

    console.log(`Iniciando despacho multicanal para ${contactosNotificables.length} agricultores.`);

    for (const contacto of contactosNotificables) {
      await enviarWhatsAppAlerta(contacto.telefono, alerta);
    }

    console.log(`Despacho finalizado. Alcanzados ${contactosNotificables.length} agricultores.`);
  } catch (error) {
    console.error('Fallo general en la ejecución de la cola masiva de alertas:', error);
  }
}