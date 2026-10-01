'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export interface FormState {
  success: boolean;
  message: string;
}

export async function registrarAgricultor(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const nombreCompleto = formData.get('nombreCompleto')?.toString().trim();
  const telefono = formData.get('telefono')?.toString().trim();
  const comunidad = formData.get('comunidad')?.toString().trim();
  const toleranciaAlerta = formData.get('toleranciaAlerta')?.toString().trim();

  if (!nombreCompleto || !telefono || !comunidad || !toleranciaAlerta) {
    return { success: false, message: 'Todos los campos son obligatorios.' };
  }

  // Validar formato de teléfono básico (debe incluir prefijo +51 o ser de 9 dígitos)
  let telefonoNormalizado = telefono;
  if (!telefonoNormalizado.startsWith('+')) {
    telefonoNormalizado = `+51${telefonoNormalizado.replace(/\s+/g, '')}`;
  }

  const { error } = await supabase.from('agricultores').insert([
    {
      nombre_completo: nombreCompleto,
      telefono: telefonoNormalizado,
      comunidad:comunidad,
      tolerancia_alerta: toleranciaAlerta,
    },
  ]);

  if (error) {
    if (error.code === '23505') {
      return { success: false, message: 'Este número de teléfono ya está registrado.' };
    }
    return { success: false, message: `Error al registrar: ${error.message}` };
  }

  revalidatePath('/');
  return {
    success: true,
    message: '¡Registro exitoso! Recibirás avisos meteorológicos según tu preferencia.',
  };
}