import { EvaluacionAlerta } from '@/types/clima';
import { enviarSMSAlerta } from '@/services/notificaciones/sms-twilio';
import { enviarWhatsAppAlerta } from '@/services/notificaciones/whatsapp-meta';
import { supabase } from '@/lib/supabase';

export async function despacharAlertasMasivas(alerta: EvaluacionAlerta) {
  // Las prioridades bajas (probabilidad < 50%) solo se muestran en la PWA y no disparan colas.
  if (alerta.prioridad === 'BAJA') {
    console.log('Alerta de prioridad BAJA: Registrada en Dashboard web. No se encolan mensajes directos.');
    return;
  }

  try {
    // 1. Obtener la lista de agricultores registrados en la base de datos
    const { data: agricultores, error } = await supabase
      .from('agricultores')
      .select('nombre_completo, telefono, tolerancia_alerta');

    if (error) throw error;
    if (!agricultores || agricultores.length === 0) return;

    // 2. Filtrar a quiénes se les notifica dependiendo de su preferencia de riesgo
    const contactosNotificables = agricultores.filter((user) => {
      if (alerta.prioridad === 'ALTA') return true; // Urgente > 75% notifica a todos[cite: 2]
      return user.tolerancia_alerta === 'MEDIA' || user.tolerancia_alerta === 'BAJA'; 
    });

    // 3. Despacho Multicanal: SMS urgente vs. Push de WhatsApp[cite: 2]
    for (const contacto of contactosNotificables) {
      if (alerta.canalSugerido === 'SMS_URGENTE') {
        await enviarSMSAlerta(contacto.telefono, alerta.mensaje);
      } else if (alerta.canalSugerido === 'PUSH_WHATSAPP') {
        await enviarWhatsAppAlerta(contacto.telefono, alerta.mensaje);
      }
    }
    
    console.log(`Despacho finalizado. Alcanzados ${contactosNotificables.length} agricultores.`);

  } catch (error) {
    console.error('Fallo general en la ejecución de la cola masiva de alertas:', error);
  }
}