export async function enviarWhatsAppAlerta(numeroDestino: string, cuerpoMensaje: string) {
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const apiToken = process.env.WHATSAPP_API_TOKEN;

  if (!phoneId || !apiToken) {
    console.error('Credenciales de WhatsApp Meta ausentes en el entorno local.');
    return;
  }

  // Quitar el '+' y cualquier espacio o guión para cumplir el formato de Meta
  const numeroLimpio = numeroDestino.replace(/\D/g, '');

  const endpoint = `https://graph.facebook.com/v25.0/${phoneId}/messages`;

  // Usamos el payload de plantilla verificado en la consola de Meta
  const payload = {
    messaging_product: 'whatsapp',
    to: numeroLimpio,
    type: 'template',
    template: {
      name: 'hello_world',
      language: {
        code: 'en_US',
      },
    },
  };

  try {
    const respuesta = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!respuesta.ok) {
      const errorData = await respuesta.json();
      console.error('Error de API Meta al despachar WhatsApp:', errorData);
    } else {
      console.log(`✅ WhatsApp despachado con éxito al número ${numeroLimpio}`);
    }
  } catch (error) {
    console.error('Fallo en la conexión de red al despachar WhatsApp:', error);
  }
}