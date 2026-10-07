import { EvaluacionAlerta } from '@/types/clima';

export async function enviarWhatsAppAlerta(numeroDestino: string, alerta: EvaluacionAlerta) {
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const token = process.env.WHATSAPP_API_TOKEN;

  if (!phoneId || !token) {
    console.error('Credenciales de WhatsApp Meta ausentes en entorno.');
    return;
  }

  // Sanitizar número sin símbolos para Meta (ej: 51989715318)
  const destinatarioLimpio = numeroDestino.replace(/\D/g, '');

  const endpoint = `https://graph.facebook.com/v19.0/${phoneId}/messages`;

  // Mapear recomendación breve para el parámetro {{5}}
  const accionSugerida = alerta.fenomeno.toLowerCase().includes('lluvia')
    ? 'revisar drenajes y asegurar insumos'
    : 'cubrir cultivos y resguardar ganado';

  const payload = {
    messaging_product: 'whatsapp',
    to: destinatarioLimpio,
    type: 'template',
    template: {
      name: 'alerta_clima_taraco',
      language: { code: 'es_PE' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: alerta.fenomeno },
            { type: 'text', text: String(alerta.probabilidad) },
            { type: 'text', text: 'Taraco' },
            { type: 'text', text: alerta.horaEstimada || 'las próximas horas' },
            { type: 'text', text: accionSugerida }
          ]
        }
      ]
    }
  };

  try {
    const respuesta = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await respuesta.json();

    if (!respuesta.ok) {
      console.error('❌ Error de API Meta al despachar WhatsApp:', data);
    } else {
      console.log(`✅ WhatsApp con alerta climática despachado a ${destinatarioLimpio}. SID:`, data.messages?.[0]?.id);
    }
  } catch (error) {
    console.error('❌ Error de red al despachar WhatsApp:', error);
  }
}