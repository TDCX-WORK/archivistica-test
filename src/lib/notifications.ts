import { supabase } from './supabase'

/**
 * Inserta una notificación silenciando el error 409 (duplicado).
 * La tabla notifications tiene un índice único por (user_id, type, día)
 * que impide duplicados del mismo tipo en el mismo día.
 * Esta función hace el insert y, si falla por duplicado, simplemente
 * lo ignora sin lanzar error ni ensuciar la consola.
 */
export async function insertNotification(data: {
  user_id: string
  type:    string
  title:   string
  body?:   string | null
  link?:   string | null
}): Promise<void> {
  const { error } = await supabase.from('notifications').insert({
    user_id: data.user_id,
    type:    data.type,
    title:   data.title,
    body:    data.body ?? null,
    link:    data.link ?? null,
  })
  // 409 = unique constraint violation (duplicado) → ignorar silenciosamente
  if (error && error.code !== '23505') {
    console.warn('[insertNotification]', error.message)
  }
}

/**
 * Inserta múltiples notificaciones (para notificar a varios alumnos a la vez).
 * Silencia duplicados individualmente.
 */
export async function insertNotifications(rows: {
  user_id: string
  type:    string
  title:   string
  body?:   string | null
  link?:   string | null
}[]): Promise<void> {
  if (rows.length === 0) return
  const { error } = await supabase.from('notifications').insert(
    rows.map(r => ({
      user_id: r.user_id,
      type:    r.type,
      title:   r.title,
      body:    r.body ?? null,
      link:    r.link ?? null,
    }))
  )
  if (error && error.code !== '23505') {
    console.warn('[insertNotifications]', error.message)
  }
}