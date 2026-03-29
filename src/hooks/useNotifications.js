import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount,   setUnreadCount]   = useState(0)
  const [loading,       setLoading]       = useState(true)

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return }

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(40)

    const all = data || []
    setNotifications(all)
    setUnreadCount(all.filter(n => !n.read).length)
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  // Suscripcion en tiempo real — llega una notificacion nueva y aparece al instante
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`notifications_${userId}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev])
        setUnreadCount(prev => prev + 1)
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [userId])

  const markRead = useCallback(async (id) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const markAllRead = useCallback(async () => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [userId])

  // Funcion helper para crear notificaciones desde el frontend
  const createNotification = useCallback(async ({ targetUserId, type, title, body, link }) => {
    await supabase.from('notifications').insert({
      user_id: targetUserId,
      type,
      title,
      body:    body || null,
      link:    link || null,
    })
  }, [])

  return {
    notifications, unreadCount, loading,
    markRead, markAllRead, createNotification,
    reload: load,
  }
}
