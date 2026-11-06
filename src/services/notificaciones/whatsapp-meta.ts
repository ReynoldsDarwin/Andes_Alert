import { EvaluacionAlerta } from '@/types/clima';
import type { ResultadoEnvio } from '@/types/envio';

const TIMEOUT_MS = 10_000;

export async function enviarWhatsAppAlerta(
  numeroDestino: string,
  alerta: EvaluacionAlerta
): Promise<ResultadoEnvio> {
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const token = process.env.WHATSAPP_API_TOKEN;

  if (!phoneId || !token) {
    console.error('Credenciales de WhatsApp Meta ausentes en entorno.');
    return { ok: false, error: 'Credenciales de WhatsApp ausentes' };
  }

  // Sanitizar número sin símbolos para Meta (ej: 51989715318)
  const destinatarioLimpio = numeroDestino.replace(/\D/g, '');
  const visible = `***${destinatarioLimpio.slice(-3)}`; // para logs, sin exponer el número

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
            { type: 'text', text: accionSugerida },
          ],
        },
      ],
    },
  };

  try {
    const respuesta = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const data = await respuesta.json().catch(() => null);

    if (!respuesta.ok) {
      console.error(`❌ Error de API Meta al despachar WhatsApp a ${visible}:`, data);
      return { ok: false, error: `Meta respondió ${respuesta.status}` };
    }

    const id: string | undefined = data?.messages?.[0]?.id;
    console.log(`✅ WhatsApp aceptado por Meta para ${visible}. ID: ${id ?? 'ok'}`);
    return { ok: true, id };
  } catch (error) {
    const motivo = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error de red al despachar WhatsApp (${visible}):`, motivo);
    return { ok: false, error: `Fallo de red con Meta: ${motivo}` };
  }
}