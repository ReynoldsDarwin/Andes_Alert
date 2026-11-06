export type Canal = 'sms' | 'whatsapp';

export function canalesActivos(): Canal[] {
  const crudo = (process.env.CANALES_ACTIVOS ?? 'sms').toLowerCase();
  const lista: Canal[] = [];
  for (const parte of crudo.split(',')) {
    const valor = parte.trim();
    if ((valor === 'sms' || valor === 'whatsapp') && !lista.includes(valor)) {
      lista.push(valor);
    }
  }
  return lista.length > 0 ? lista : ['sms'];
}