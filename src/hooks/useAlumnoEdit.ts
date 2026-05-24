import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { emit } from '../lib/eventBus'

/**
 * Hook que encapsula las operaciones de edición de alumnos.
 * Usado por SeccionAlumnos (director) para guardar datos de student_profiles
 * y renovar acceso en profiles.
 */
export function useAlumnoEdit(
  updateStudentProfile: (id: string, fields: Record<string, any>) => Promise<boolean>,
) {
  /** Guardar datos del alumno (student_profiles + access_until en profiles) */
  const guardarAlumno = useCallback(async (
    userId: string,
    form: {
      full_name:     string
      phone:         string
      email_contact: string
      city:          string
      exam_date:     string
      monthly_price: string
      access_until:  string
    }
  ): Promise<{ error: string | null }> => {
    const { error: upsertErr } = await supabase.from('student_profiles').upsert({
      id:             userId,
      full_name:      form.full_name     || null,
      phone:          form.phone         || null,
      email_contact:  form.email_contact || null,
      city:           form.city          || null,
      exam_date:      form.exam_date     || null,
      monthly_price:  form.monthly_price ? parseFloat(form.monthly_price) : null,
      updated_at:     new Date().toISOString(),
    }, { onConflict: 'id' })

    if (upsertErr) return { error: `Error al guardar: ${upsertErr.message}` }

    if (form.access_until) {
      const { error: accErr } = await supabase.from('profiles')
        .update({ access_until: new Date(form.access_until + 'T23:59:59').toISOString() })
        .eq('id', userId)
      if (accErr) return { error: `Error al actualizar acceso: ${accErr.message}` }
    }

    // Sincronizar estado local del padre
    await updateStudentProfile(userId, {
      full_name:     form.full_name     || null,
      phone:         form.phone         || null,
      email_contact: form.email_contact || null,
      city:          form.city          || null,
      exam_date:     form.exam_date     || null,
      monthly_price: form.monthly_price ? parseFloat(form.monthly_price) : null,
    })

    emit('director-data-changed')
    return { error: null }
  }, [updateStudentProfile])

  return { guardarAlumno }
}