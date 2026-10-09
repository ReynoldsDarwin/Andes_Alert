export async function enviarSMSHttp(numeroDestino: string, cuerpoMensaje: string) {
  const apiKey = process.env.HTTPSMS_API_KEY;
  const fromNumber = process.env.HTTPSMS_FROM_NUMBER;

  if (!apiKey || !fromNumber) {
    console.error('Credenciales de httpSMS ausentes en variables de entorno.');
    return;
  }

  // Asegurar formato internacional E.164 (+519XXXXXXXX)
  const soloDigitos = numeroDestino.replace(/\D/g, '');
  const destinatarioFormateado = numeroDestino.startsWith('+')
    ? numeroDestino
    : `+${soloDigitos}`;

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
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      console.error('❌ Error de API httpSMS al enviar SMS:', resultado);
    } else {
      console.log(`✅ SMS despachado vía Android a ${destinatarioFormateado}. ID: ${resultado.data?.id || 'ok'}`);
    }
  } catch (error) {
    console.error('❌ Fallo de red conectando con httpSMS:', error);
  }
}