/**
 * Adapta un texto al alfabeto GSM-7 para que el SMS use codificación de 7 bits
 * (160 caracteres por segmento) en lugar de UCS-2 (70 por segmento).
 *
 * - "°C" pasa a " grados"
 * - Se quitan las tildes de á í ó ú (é y ñ sí existen en GSM-7 y se conservan)
 * - Se eliminan emojis y cualquier otro carácter fuera del alfabeto
 */
const GSM7 = new Set(
  Array.from(
    '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡' +
      'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà'
  )
);

const SIN_TILDE: Record<string, string> = {
  á: 'a', í: 'i', ó: 'o', ú: 'u',
  Á: 'A', Í: 'I', Ó: 'O', Ú: 'U',
};

export function aTextoSMS(texto: string): string {
  return Array.from(texto.replace(/\s*°\s*C/gi, ' grados'))
    .map((c) => SIN_TILDE[c] ?? c)
    .filter((c) => GSM7.has(c))
    .join('')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/** Indica si todo el texto cabe en GSM-7 (útil para pruebas y diagnóstico). */
export function esGsm7(texto: string): boolean {
  return Array.from(texto).every((c) => GSM7.has(c));
}