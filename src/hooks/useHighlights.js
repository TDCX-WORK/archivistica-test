import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useHighlights(userId, academyId, subjectId) {
  const [highlights, setHighlights] = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    const load = async () => {
      setLoading(true)
      let q = supabase
        .from('study_highlights')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
      if (academyId) q = q.eq('academy_id', academyId)
      const { data } = await q
      setHighlights(data || [])
      setLoading(false)
    }
    load()
  }, [userId, academyId])

  const addHighlight = useCallback(async ({ topicId, text, color = '#FEF08A' }) => {
    if (!userId || !topicId || !text?.trim()) return null

    // Evitar duplicados exactos del mismo texto en el mismo tema
    const exists = highlights.find(h => h.topic_id === topicId && h.text === text)
    if (exists) return exists

    const { data, error } = await supabase
      .from('study_highlights')
      .insert({
        user_id:      userId,
        topic_id:     topicId,
        academy_id:   academyId || null,
        subject_id:   subjectId || null,
        start_offset: 0,  // mantenemos la columna pero no la usamos
        end_offset:   0,
        text:         text.trim(),
        color,
      })
      .select()
      .maybeSingle()

    if (error || !data) return null
    setHighlights(prev => [...prev, data])
    return data
  }, [userId, academyId, subjectId, highlights])

  const removeHighlight = useCallback(async (id) => {
    await supabase.from('study_highlights').delete().eq('id', id)
    setHighlights(prev => prev.filter(h => h.id !== id))
  }, [])

  const getTopicHighlights = useCallback((topicId) => {
    return highlights.filter(h => h.topic_id === topicId)
  }, [highlights])

  const highlightCountByTopic = highlights.reduce((acc, h) => {
    acc[h.topic_id] = (acc[h.topic_id] || 0) + 1
    return acc
  }, {})

  return {
    highlights,
    loading,
    addHighlight,
    removeHighlight,
    getTopicHighlights,
    highlightCountByTopic,
  }
}
