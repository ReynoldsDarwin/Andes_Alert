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
  const rawTelefono = formData.get('telefono')?.toString().trim();
  const comunidad = formData.get('comunidad')?.toString().trim();
  const toleranciaAlerta = formData.get('toleranciaAlerta')?.toString().trim();

  if (!nombreCompleto || !rawTelefono || !comunidad || !toleranciaAlerta) {
    return { success: false, message: 'Todos los campos son obligatorios.' };
  }

  // 1. Limpiar cualquier carácter no numérico
  let digitos = rawTelefono.replace(/\D/g, '');

  // 2. Si el usuario ingresó por casualidad el 51 al inicio (11 dígitos), lo procesamos
  if (digitos.startsWith('51') && digitos.length === 11) {
    digitos = digitos.substring(2);
  }

  // 3. Validar estándar móvil de Perú (debe tener 9 dígitos e iniciar con 9)
  if (digitos.length !== 9 || !digitos.startsWith('9')) {
    return {
      success: false,
      message: 'Ingresa un número de celular peruano válido (9 dígitos comenzando con 9).',
    };
  }

  // 4. Formatear para Supabase con prefijo 51 sin símbolos (ej: 51987654321)
  const telefonoFinal = `51${digitos}`;

  const { error } = await supabase.from('agricultores').insert([
    {
      nombre_completo: nombreCompleto,
      telefono: telefonoFinal,
      comunidad: comunidad,
      tolerancia_alerta: toleranciaAlerta,
    },
  ]);

  if (error) {
    if (error.code === '23505') {
      return { success: false, message: 'Este número de teléfono ya se encuentra registrado.' };
    }
    return { success: false, message: `Error al registrar: ${error.message}` };
  }

  revalidatePath('/');
  return {
    success: true,
    message: '¡Registro exitoso! Recibirás avisos meteorológicos según tu preferencia.',
  };
}