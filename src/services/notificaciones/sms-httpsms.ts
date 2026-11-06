import type { ResultadoEnvio } from '@/types/envio';

const TIMEOUT_MS = 10_000;

export async function enviarSMSHttp(
  numeroDestino: string,
  cuerpoMensaje: string
): Promise<ResultadoEnvio> {
  const apiKey = process.env.HTTPSMS_API_KEY;
  const fromNumber = process.env.HTTPSMS_FROM_NUMBER;

  if (!apiKey || !fromNumber) {
    console.error('Credenciales de httpSMS ausentes en variables de entorno.');
    return { ok: false, error: 'Credenciales de httpSMS ausentes' };
  }

  // Asegurar formato internacional E.164 (+519XXXXXXXX)
  const soloDigitos = numeroDestino.replace(/\D/g, '');
  const destinatarioFormateado = numeroDestino.startsWith('+')
    ? numeroDestino
    : `+${soloDigitos}`;
  const visible = `***${soloDigitos.slice(-3)}`; // para logs, sin exponer el número

  try {
    const respuesta = await fetch('https://api.httpsms.com/v1/messages/send', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        content: cuerpoMensaje,
        from: fromNumber,
        to: destinatarioFormateado,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const resultado = await respuesta.json().catch(() => null);

    if (!respuesta.ok) {
      console.error(`❌ Error de API httpSMS al enviar SMS a ${visible}:`, resultado);
      return { ok: false, error: `httpSMS respondió ${respuesta.status}` };
    }

    const id: string | undefined = resultado?.data?.id;
    console.log(`✅ SMS aceptado por httpSMS para ${visible}. ID: ${id ?? 'ok'}`);
    return { ok: true, id };
  } catch (error) {
    const motivo = error instanceof Error ? error.message : String(error);
    console.error(`❌ Fallo de red conectando con httpSMS (${visible}):`, motivo);
    return { ok: false, error: `Fallo de red con httpSMS: ${motivo}` };
  }
}