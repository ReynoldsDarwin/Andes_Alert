// Resultado de un intento de envío por un canal (SMS o WhatsApp).
// ok = el proveedor aceptó el mensaje (no garantiza que llegó al teléfono).
// Si ok es false, `error` explica el motivo.
export interface ResultadoEnvio {
  ok: boolean;
  id?: string;
  error?: string;
}