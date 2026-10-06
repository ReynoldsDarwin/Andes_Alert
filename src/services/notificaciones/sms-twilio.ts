export async function enviarSMSAlerta(numeroDestino: string, cuerpoMensaje: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !twilioPhone) {
    console.error('Credenciales de Twilio ausentes en entorno local o de producción.');
    return;
  }

  // 1. Sanitizar y garantizar formato E.164 (+519XXXXXXXX) para Twilio
  const soloDigitos = numeroDestino.replace(/\D/g, '');
  const numeroFormateado = numeroDestino.startsWith('+')
    ? numeroDestino
    : `+${soloDigitos}`;

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const datosURL = new URLSearchParams({
    To: numeroFormateado,
    From: twilioPhone,
    Body: cuerpoMensaje,
  });

  try {
    const credencialesBase64 = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const respuesta = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credencialesBase64}`,
      },
      body: datosURL.toString(),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      console.error('❌ Error de API Twilio al enviar SMS:', resultado);
    } else {
      console.log(`✅ SMS despachado con éxito a ${numeroFormateado}. SID: ${resultado.sid}`);
    }
  } catch (error) {
    console.error('❌ Fallo en la conexión de red al despachar SMS de Twilio:', error);
  }
}