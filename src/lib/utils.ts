/**
 * @param tiempo  Arreglo de timestamps de Open-Meteo.
 * @param ahora   Fecha de referencia (solo para pruebas). Por defecto, ahora.
 */
export function indiceHoraActual(tiempo: string[], ahora: Date = new Date()): number {
  if (!tiempo || tiempo.length === 0) return 0;

  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(ahora);

  const get = (tipo: string): string =>
    partes.find((p) => p.type === tipo)?.value ?? '';

  const referencia = `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:00`;

  const indice = tiempo.findIndex((t) => t >= referencia);
  return indice === -1 ? tiempo.length - 1 : indice;
}