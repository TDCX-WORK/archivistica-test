import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useAnnouncements(academyId, subjectId) {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!academyId) { setLoading(false); return }
    setLoading(true)
    setError(null)

    const now = new Date().toISOString()
    let q = supabase
      .from('announcements')
      .select('id, tipo, title, body, expires_at, created_at, author_id')
      .eq('academy_id', academyId)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('created_at', { ascending: false })

    if (subjectId) q = q.eq('subject_id', subjectId)

    const { data, error: qErr } = await q
    if (qErr) { setError('Error cargando avisos'); setLoading(false); return }
    setAnnouncements(data || [])
    setLoading(false)
  }, [academyId, subjectId])

  useEffect(() => { load() }, [load])

  const addAnnouncement = useCallback(async ({ authorId, tipo, title, body, expiresAt }) => {
    if (!academyId || !authorId) return null
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        academy_id: academyId,
        subject_id: subjectId || null,
        author_id:  authorId,
        tipo,
        title,
        body:       body || null,
        expires_at: expiresAt || null,
      })
      .select()
      .maybeSingle()

    if (error || !data) return null
    setAnnouncements(prev => [data, ...prev])
    return data
  }, [academyId, subjectId])

  const deleteAnnouncement = useCallback(async (id) => {
    await supabase.from('announcements').delete().eq('id', id)
    setAnnouncements(prev => prev.filter(a => a.id !== id))
  }, [])

  return { announcements, loading, error, addAnnouncement, deleteAnnouncement, reload: load }
}
