import { supabase } from './supabase'

/**
 * Inserta una notificación evitando el error 409 (duplicado).
 * La tabla notifications tiene un índice único por (user_id, type, día)
 * que impide duplicados del mismo tipo en el mismo día.
 * Primero comprobamos si ya existe una hoy; si existe, no insertamos.
 * Así evitamos el POST 409 que el navegador muestra en consola.
 */
export async function insertNotification(data: {
  user_id: string
  type:    string
  title:   string
  body?:   string | null
  link?:   string | null
}): Promise<void> {
  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)

  // Comprobar si ya existe una notificación de este tipo hoy para este usuario
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', data.user_id)
    .eq('type', data.type)
    .gte('created_at', todayStart.toISOString())

  if ((count ?? 0) > 0) return // ya existe, no duplicar

  const { error } = await supabase.from('notifications').insert({
    user_id: data.user_id,
    type:    data.type,
    title:   data.title,
    body:    data.body ?? null,
    link:    data.link ?? null,
  })
  if (error && error.code !== '23505') {
    console.warn('[insertNotification]', error.message)
  }
}

/**
 * Inserta múltiples notificaciones (para notificar a varios alumnos a la vez).
 * Filtra duplicados individualmente antes de insertar.
 */
export async function insertNotifications(rows: {
  user_id: string
  type:    string
  title:   string
  body?:   string | null
  link?:   string | null
}[]): Promise<void> {
  if (rows.length === 0) return

  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)

  // Obtener notificaciones existentes hoy para todos los usuarios+tipos implicados
  const userIds = [...new Set(rows.map(r => r.user_id))]
  const types   = [...new Set(rows.map(r => r.type))]

  const { data: existing } = await supabase
    .from('notifications')
    .select('user_id, type')
    .in('user_id', userIds)
    .in('type', types)
    .gte('created_at', todayStart.toISOString())

  const existingSet = new Set(
    (existing ?? []).map(e => `${e.user_id}::${e.type}`)
  )

  // Filtrar las que ya existen
  const toInsert = rows.filter(r => !existingSet.has(`${r.user_id}::${r.type}`))
  if (toInsert.length === 0) return

  const { error } = await supabase.from('notifications').insert(
    toInsert.map(r => ({
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