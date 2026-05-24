import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { CurrentUser } from '../types'

// ── Tipos de datos que solo la card de Acciones necesita ──────────────────
export interface AccionesReplyRecibida {
  id:          string
  to_id:       string
  to_username: string
  body:        string          // lo que el director envió en su día
  reply_body:  string          // la respuesta del alumno
  reply_at:    string
  subject_id:  string | null
}

export interface AccionesHiloStale {
  id:           string
  title:        string
  body:         string
  created_at:   string
  author_id:    string
  author_name:  string
  subject_id:   string | null
  diasSinRespuesta: number
}

export interface AccionesData {
  replies:          AccionesReplyRecibida[]     // respuestas recibidas
  hilosSinStaff:    AccionesHiloStale[]         // hilos con 0 respuestas creados hace >48h
}

// ── localStorage helpers para hilos descartados ─────────────────────────────
// Los hilos descartados son efímeros (desaparecen cuando alguien responde),
// así que localStorage es aceptable. Se limpia automáticamente después de 30 días.
const DISMISSED_THREADS_KEY = (userId: string) => `acciones_dismissed_threads_${userId}`
const MAX_DISMISSED_AGE_MS  = 30 * 86400 * 1000 // 30 días

interface DismissedEntry { id: string; at: number }

function getDismissedThreads(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_THREADS_KEY(userId))
    if (!raw) return new Set()
    const entries = JSON.parse(raw) as DismissedEntry[]
    const now = Date.now()
    // Limpiar entradas antiguas
    const valid = entries.filter(e => now - e.at < MAX_DISMISSED_AGE_MS)
    if (valid.length !== entries.length) {
      localStorage.setItem(DISMISSED_THREADS_KEY(userId), JSON.stringify(valid))
    }
    return new Set(valid.map(e => e.id))
  } catch { return new Set() }
}

function dismissThread(userId: string, threadId: string) {
  try {
    const raw = localStorage.getItem(DISMISSED_THREADS_KEY(userId))
    const entries: DismissedEntry[] = raw ? JSON.parse(raw) : []
    if (!entries.some(e => e.id === threadId)) {
      entries.push({ id: threadId, at: Date.now() })
    }
    localStorage.setItem(DISMISSED_THREADS_KEY(userId), JSON.stringify(entries))
  } catch {}
}

// ── Hook principal ────────────────────────────────────────────────────────
export function useAcciones(currentUser: CurrentUser | null) {
  const [data,    setData]    = useState<AccionesData>({ replies: [], hilosSinStaff: [] })
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const academyId = currentUser?.academy_id
  const userId    = currentUser?.id

  const load = useCallback(async () => {
    if (!academyId || !userId) { setLoading(false); return }
    setLoading(true); setError(null)

    try {
      const now = new Date()
      const cutoff48h = new Date(now.getTime() - 48 * 3600 * 1000).toISOString()

      const [
        { data: messages },
        { data: threads },
      ] = await Promise.all([
        // direct_messages enviados por el director que recibieron respuesta y NO leídos
        supabase.from('direct_messages')
          .select('id, to_id, body, reply_body, reply_at, subject_id')
          .eq('from_id', userId)
          .eq('deleted_by_sender', false)
          .eq('read', false)
          .not('reply_body', 'is', null)
          .order('reply_at', { ascending: false }),

        // forum_threads con conteo de respuestas, creados hace >48h
        supabase.from('forum_threads')
          .select('id, title, body, created_at, author_id, subject_id, forum_replies(count)')
          .eq('academy_id', academyId)
          .lt('created_at', cutoff48h)
          .order('created_at', { ascending: false })
          .limit(50),
      ])

      // ── Resolver usernames de destinatarios y autores ───────────────
      const toIds     = new Set<string>((messages ?? []).map((m: any) => m.to_id))
      const authorIds = new Set<string>((threads  ?? []).map((t: any) => t.author_id))
      const allIds = Array.from(new Set([...toIds, ...authorIds]))

      let nameMap: Record<string, string> = {}
      if (allIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', allIds)
        for (const p of (profs ?? []) as { id: string; username: string }[]) {
          nameMap[p.id] = p.username
        }
      }

      // ── Empaquetado ─────────────────────────────────────────────────
      const dismissed = getDismissedThreads(userId)
      const hilosSinStaff: AccionesHiloStale[] = ((threads ?? []) as any[])
        .filter(t => (t.forum_replies?.[0]?.count ?? 0) === 0)
        .filter(t => !dismissed.has(t.id))
        .map(t => ({
          id:           t.id,
          title:        t.title,
          body:         t.body ?? '',
          created_at:   t.created_at,
          author_id:    t.author_id,
          author_name:  nameMap[t.author_id] ?? 'Usuario',
          subject_id:   t.subject_id,
          diasSinRespuesta: Math.floor((now.getTime() - new Date(t.created_at).getTime()) / 86400000),
        }))

      // Replies: ya filtradas por read=false en la query, no necesitamos localStorage
      const replies: AccionesReplyRecibida[] = ((messages ?? []) as any[])
        .map(m => ({
          id:          m.id,
          to_id:       m.to_id,
          to_username: nameMap[m.to_id] ?? 'Alumno',
          body:        m.body,
          reply_body:  m.reply_body,
          reply_at:    m.reply_at,
          subject_id:  m.subject_id,
        }))

      setData({ replies, hilosSinStaff })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando acciones')
    } finally {
      setLoading(false)
    }
  }, [academyId, userId])

  useEffect(() => { load() }, [load])

  // ── Mutaciones ──────────────────────────────────────────────────────────
  const marcarReplyVista = useCallback(async (replyId: string) => {
    if (!userId) return
    // Marcar como read en BD — persiste entre dispositivos
    await supabase.from('direct_messages').update({ read: true }).eq('id', replyId)
    setData(prev => ({ ...prev, replies: prev.replies.filter(r => r.id !== replyId) }))
  }, [userId])

  const descartarHilo = useCallback((threadId: string) => {
    if (!userId) return
    dismissThread(userId, threadId)
    setData(prev => ({ ...prev, hilosSinStaff: prev.hilosSinStaff.filter(h => h.id !== threadId) }))
  }, [userId])

  return { data, loading, error, reload: load, marcarReplyVista, descartarHilo }
}