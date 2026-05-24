import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { emit } from '../lib/eventBus'
import type { CurrentUser } from '../types'

/**
 * Hook que encapsula todas las operaciones de escritura del AccionModal.
 * Extraído de AccionesPanel para centralizar el acceso a datos.
 */
export function useAccionesActions(
  currentUser: CurrentUser | null,
  updateStudentProfile: (userId: string, fields: Record<string, any>) => Promise<boolean>,
  reloadProfiles: () => Promise<void> | void,
) {
  const academyId = currentUser?.academy_id
  const userId    = currentUser?.id

  /** Marcar pago de un alumno como pagado */
  const marcarPago = useCallback(async (alumnoId: string, monto: number, notas: string) => {
    if (!academyId) return { error: 'Sin academy_id' }
    const now   = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const { error: payErr } = await supabase.from('academy_payments').upsert({
      academy_id: academyId,
      alumno_id:  alumnoId,
      amount:     monto,
      month,
      status:     'paid',
      paid_at:    new Date().toISOString(),
      notes:      notas || null,
    }, { onConflict: 'academy_id,alumno_id,month' })
    if (payErr) return { error: `Error registrando pago: ${payErr.message}` }

    const ok = await updateStudentProfile(alumnoId, { payment_status: 'paid' })
    if (!ok) return { error: 'Pago registrado, pero no se actualizó el estado del alumno' }

    emit('director-data-changed')
    return { error: null }
  }, [academyId, updateStudentProfile])

  /** Asignar o actualizar precio mensual */
  const asignarPrecio = useCallback(async (alumnoId: string, precio: number) => {
    const ok = await updateStudentProfile(alumnoId, { monthly_price: precio })
    if (!ok) return { error: 'No se pudo guardar el precio' }
    emit('director-data-changed')
    return { error: null }
  }, [updateStudentProfile])

  /** Quitar precio mensual */
  const quitarPrecio = useCallback(async (alumnoId: string) => {
    const ok = await updateStudentProfile(alumnoId, { monthly_price: null })
    if (!ok) return { error: 'No se pudo quitar el precio' }
    emit('director-data-changed')
    return { error: null }
  }, [updateStudentProfile])

  /** Renovar acceso sumando meses */
  const renovarAcceso = useCallback(async (alumnoId: string, meses: number) => {
    const { data: current, error: readErr } = await supabase
      .from('profiles').select('access_until').eq('id', alumnoId).maybeSingle()
    if (readErr) return { error: `No se pudo leer el acceso actual: ${readErr.message}` }

    const base = (current as { access_until: string | null } | null)?.access_until
      ? new Date(Math.max(new Date((current as { access_until: string }).access_until).getTime(), Date.now()))
      : new Date()
    base.setMonth(base.getMonth() + meses)

    const { error: updErr } = await supabase.from('profiles')
      .update({ access_until: base.toISOString() })
      .eq('id', alumnoId)
    if (updErr) return { error: `No se pudo renovar: ${updErr.message}` }

    await reloadProfiles()
    emit('director-data-changed')
    return { error: null }
  }, [reloadProfiles])

  /** Completar datos de contacto del alumno */
  const completarDatos = useCallback(async (alumnoId: string, patch: Record<string, any>) => {
    const ok = await updateStudentProfile(alumnoId, patch)
    if (!ok) return { error: 'No se pudieron guardar los datos' }
    return { error: null }
  }, [updateStudentProfile])

  /** Enviar mensaje directo (para reply a alumno, recordatorio, etc.) */
  const enviarMensaje = useCallback(async (toId: string, body: string, subjectId?: string | null) => {
    if (!academyId || !userId) return { error: 'Sin sesión' }
    const { error: insErr } = await supabase.from('direct_messages').insert({
      from_id:    userId,
      to_id:      toId,
      academy_id: academyId,
      subject_id: subjectId ?? null,
      body:       body.trim(),
    })
    if (insErr) return { error: `No se pudo enviar: ${insErr.message}` }
    return { error: null }
  }, [academyId, userId])

  /** Responder a un hilo del foro */
  const responderHilo = useCallback(async (threadId: string, body: string) => {
    if (!academyId || !userId) return { error: 'Sin sesión' }
    const { error: insErr } = await supabase.from('forum_replies').insert({
      thread_id:   threadId,
      academy_id:  academyId,
      author_id:   userId,
      body:        body.trim(),
      is_solution: false,
    })
    if (insErr) return { error: `No se pudo publicar: ${insErr.message}` }
    return { error: null }
  }, [academyId, userId])

  return { marcarPago, asignarPrecio, quitarPrecio, renovarAcceso, completarDatos, enviarMensaje, responderHilo }
}