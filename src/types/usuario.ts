export interface Agricultor {
  id: string;
  nombreCompleto: string;
  telefono: string; // Formato internacional (ej. +51999888777)
  comunidad: string; // Ej: Taraco Centro, Ramis, Huancané Chico
  toleranciaAlerta: 'BAJA' | 'MEDIA' | 'ALTA'; // Nivel mínimo de riesgo del que desea ser notificado
}