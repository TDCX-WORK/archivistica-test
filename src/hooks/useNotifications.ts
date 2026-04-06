import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Notification } from '../types'

export function useNotifications(userId: string | null | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([])
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

    const all = (data ?? []) as Notification[]
    setNotifications(all)
    setUnreadCount(all.filter(n => !n.read).length)
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  // Suscripcion en tiempo real
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
        const nueva = payload.new as Notification
        setNotifications(prev => [nueva, ...prev])
        setUnreadCount(prev => prev + 1)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const markRead = useCallback(async (id: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const markAllRead = useCallback(async () => {
    if (!userId) return
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [userId])

  const deleteNotification = useCallback(async (id: string) => {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
    setNotifications(prev => {
      const removed = prev.find(n => n.id === id)
      if (removed && !removed.read) setUnreadCount(c => Math.max(0, c - 1))
      return prev.filter(n => n.id !== id)
    })
  }, [])

  const deleteAllRead = useCallback(async () => {
    if (!userId) return
    await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('read', true)
    setNotifications(prev => prev.filter(n => !n.read))
  }, [userId])

  const createNotification = useCallback(async ({
    targetUserId,
    type,
    title,
    body,
    link,
  }: {
    targetUserId: string
    type:         string
    title:        string
    body?:        string | null
    link?:        string | null
  }) => {
    await supabase.from('notifications').insert({
      user_id: targetUserId,
      type,
      title,
      body:    body ?? null,
      link:    link ?? null,
    })
  }, [])

  return {
    notifications, unreadCount, loading,
    markRead, markAllRead,
    deleteNotification, deleteAllRead,
    createNotification,
    reload: load,
  }
}