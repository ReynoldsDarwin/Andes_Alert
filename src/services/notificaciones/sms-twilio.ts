export async function enviarSMSAlerta(numeroDestino: string, cuerpoMensaje: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !twilioPhone) {
    console.error('Credenciales de Twilio ausentes en entorno local.');
    return;
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const datosURL = new URLSearchParams({
    To: numeroDestino,
    From: twilioPhone,
    Body: cuerpoMensaje,
  });

  try {
    const respuesta = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      },
      body: datosURL.toString(),
    });

    if (!respuesta.ok) {
      const e = await respuesta.json();
      console.error('Error de API Twilio al enviar SMS:', e);
    }
  } catch (error) {
    console.error('Fallo en la conexión de red al despachar SMS de Twilio', error);
  }
}