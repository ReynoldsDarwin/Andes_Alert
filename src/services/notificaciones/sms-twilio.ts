export async function enviarSMSAlerta(numeroDestino: string, cuerpoMensaje: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !twilioPhone) {
    console.error('Credenciales de Twilio ausentes en el entorno.');
    return;
  }

  // 1. Asegurar formato E.164 (+519XXXXXXXX)
  const soloDigitos = numeroDestino.replace(/\D/g, '');
  const numeroFormateado = numeroDestino.startsWith('+')
    ? numeroDestino
    : `+${soloDigitos}`;

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  // En cuentas de prueba, Twilio bloquea texto no registrado o caracteres especiales (emojis).
  // Sanitizamos el texto para evitar que el filtro de plantillas lo rechace.
  const mensajeLimpio = cuerpoMensaje
    .replace(/[^\w\s.,°:()/-]/gi, '') // Remueve emojis que activan filtros de spam
    .trim();

  const datosURL = new URLSearchParams({
    To: numeroFormateado,
    From: twilioPhone,
    Body: mensajeLimpio,
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
    console.error('❌ Fallo de red al conectar con Twilio:', error);
  }
}