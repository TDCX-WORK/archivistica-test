import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

export interface DirectMessage {
  id:                  string
  from_id:             string
  to_id:               string
  academy_id:          string
  subject_id:          string | null
  body:                string
  read:                boolean
  reply_body:          string | null
  reply_at:            string | null
  created_at:          string
  deleted_by_sender:   boolean
  deleted_by_receiver: boolean
  from_role?:          string  // 'profesor' | 'director' — joined client-side
}

// ── Hook para ALUMNOS ────────────────────────────────────────────────────────
export function useAlumnoMessages(userId: string | null | undefined) {
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [unread,   setUnread]   = useState(0)
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    const { data } = await supabase
      .from('direct_messages')
      .select('*')
      .eq('to_id', userId)
      .eq('deleted_by_receiver', false)
      .order('created_at', { ascending: false })
    const msgs = (data ?? []) as DirectMessage[]

    // Enriquecer con from_role
    const fromIds = [...new Set(msgs.map(m => m.from_id))]
    if (fromIds.length > 0) {
      const { data: senders } = await supabase
        .from('profiles')
        .select('id, role')
        .in('id', fromIds)
      const roleMap: Record<string, string> = {}
      for (const s of (senders ?? [])) roleMap[(s as {id:string;role:string}).id] = (s as {id:string;role:string}).role
      msgs.forEach(m => { m.from_role = roleMap[m.from_id] ?? 'profesor' })
    }

    setMessages(msgs)
    setUnread(msgs.filter(m => !m.read).length)
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  // Cache de roles para no hacer query extra por cada mensaje realtime
  const roleCache = useRef<Record<string, string>>({})

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`dm_alumno_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'direct_messages',
        filter: `to_id=eq.${userId}`,
      }, async (payload) => {
        const nuevo = payload.new as DirectMessage

        // Intentar resolver from_role desde cache
        if (roleCache.current[nuevo.from_id]) {
          nuevo.from_role = roleCache.current[nuevo.from_id]
        } else {
          const { data: sender } = await supabase
            .from('profiles').select('role').eq('id', nuevo.from_id).maybeSingle()
          const role = (sender as {role:string}|null)?.role ?? 'profesor'
          roleCache.current[nuevo.from_id] = role
          nuevo.from_role = role
        }

        setMessages(prev => [nuevo, ...prev])
        setUnread(prev => prev + 1)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const markRead = useCallback(async (id: string) => {
    await supabase.from('direct_messages').update({ read: true }).eq('id', id)
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m))
    setUnread(prev => Math.max(0, prev - 1))
  }, [])

  const markAllRead = useCallback(async () => {
    if (!userId) return
    await supabase.from('direct_messages').update({ read: true }).eq('to_id', userId).eq('read', false)
    setMessages(prev => prev.map(m => ({ ...m, read: true })))
    setUnread(0)
  }, [userId])

  const replyToMessage = useCallback(async (id: string, replyBody: string): Promise<boolean> => {
    const msg = messages.find(m => m.id === id)
    if (!msg) return false
    const { error } = await supabase
      .from('direct_messages')
      .update({ reply_body: replyBody.trim(), reply_at: new Date().toISOString(), read: true })
      .eq('id', id)
    if (error) return false
    setMessages(prev => prev.map(m =>
      m.id === id ? { ...m, reply_body: replyBody.trim(), reply_at: new Date().toISOString(), read: true } : m
    ))
    setUnread(prev => Math.max(0, prev - 1))
    try {
      const { data: me } = await supabase.from('profiles').select('username').eq('id', userId).maybeSingle()
      await supabase.from('notifications').insert({
        user_id: msg.from_id,
        type:    'respuesta_mensaje',
        title:   `${(me as {username:string}|null)?.username ?? 'Un alumno'} ha respondido a tu mensaje`,
        body:    replyBody.trim().slice(0, 100),
        link:    '/profesor',
      })
    } catch (_) {}
    return true
  }, [messages, userId])

  // Alumno "borra" — marca deleted_by_receiver, no borra de BD
  const deleteMessage = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('direct_messages')
      .update({ deleted_by_receiver: true })
      .eq('id', id)
    if (!error) {
      setMessages(prev => {
        const removed = prev.find(m => m.id === id)
        if (removed && !removed.read) setUnread(u => Math.max(0, u - 1))
        return prev.filter(m => m.id !== id)
      })
    }
  }, [])

  return { messages, unread, loading, markRead, markAllRead, replyToMessage, deleteMessage, reload: load }
}

// ── Hook para PROFESORES ─────────────────────────────────────────────────────
export function useProfesorMessages(
  userId:    string | null | undefined,
  academyId: string | null | undefined,
  subjectId: string | null | undefined
) {
  const [sent,    setSent]    = useState<DirectMessage[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    const { data } = await supabase
      .from('direct_messages')
      .select('*')
      .eq('from_id', userId)
      .eq('deleted_by_sender', false)     // ← filtrar borrados por profesor
      .order('created_at', { ascending: false })
    setSent((data ?? []) as DirectMessage[])
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`dm_profe_${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'direct_messages',
        filter: `from_id=eq.${userId}`,
      }, (payload) => {
        const updated = payload.new as DirectMessage
        if (updated.reply_body) {
          setSent(prev => prev.map(m => m.id === updated.id ? updated : m))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const sendMessage = useCallback(async (toId: string, body: string): Promise<boolean> => {
    if (!userId || !academyId || !body.trim()) return false
    const { data, error } = await supabase
      .from('direct_messages')
      .insert({
        from_id:    userId,
        to_id:      toId,
        academy_id: academyId,
        subject_id: subjectId ?? null,
        body:       body.trim(),
      })
      .select()
      .maybeSingle()
    if (error || !data) return false
    setSent(prev => [data as DirectMessage, ...prev])
    return true
  }, [userId, academyId, subjectId])

  // Profesor "borra" — marca deleted_by_sender, no borra de BD
  const deleteSentMessage = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('direct_messages')
      .update({ deleted_by_sender: true })
      .eq('id', id)
    if (!error) {
      setSent(prev => prev.filter(m => m.id !== id))
    }
  }, [])

  const pendingReplies = sent.filter(m => m.reply_body && m.reply_at)

  return { sent, pendingReplies, loading, sendMessage, deleteSentMessage, reload: load }
}