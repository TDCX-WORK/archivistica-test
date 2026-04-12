import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { StudyHighlight } from '../types'

export function useHighlights(
  userId:    string | null | undefined,
  academyId: string | null | undefined,
  subjectId: string | null | undefined
) {
  const [highlights, setHighlights] = useState<StudyHighlight[]>([])
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
      setHighlights((data ?? []) as StudyHighlight[])
      setLoading(false)
    }
    load()
  }, [userId, academyId])

  const addHighlight = useCallback(async ({
    topicId,
    text,
    color = '#FEF08A',
  }: {
    topicId: string
    text:    string
    color?:  string
  }): Promise<StudyHighlight | null> => {
    if (!userId || !topicId || !text?.trim()) return null

    // Comprobamos duplicado usando prev para no necesitar highlights como dependencia
    let existente: StudyHighlight | null = null
    setHighlights(prev => {
      existente = prev.find(h => h.topic_id === topicId && h.text === text) ?? null
      return prev
    })
    if (existente) return existente

    const { data, error } = await supabase
      .from('study_highlights')
      .insert({
        user_id:      userId,
        topic_id:     topicId,
        academy_id:   academyId ?? null,
        subject_id:   subjectId ?? null,
        start_offset: 0,
        end_offset:   0,
        text:         text.trim(),
        color,
      })
      .select()
      .maybeSingle()

    if (error || !data) return null
    const nuevo = data as StudyHighlight
    setHighlights(prev => [...prev, nuevo])
    return nuevo
  }, [userId, academyId, subjectId])

  const removeHighlight = useCallback(async (id: string) => {
    await supabase.from('study_highlights').delete().eq('id', id)
    setHighlights(prev => prev.filter(h => h.id !== id))
  }, [])

  const getTopicHighlights = useCallback((topicId: string): StudyHighlight[] => {
    return highlights.filter(h => h.topic_id === topicId)
  }, [highlights])

  const highlightCountByTopic = highlights.reduce<Record<string, number>>((acc, h) => {
    acc[h.topic_id] = (acc[h.topic_id] ?? 0) + 1
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