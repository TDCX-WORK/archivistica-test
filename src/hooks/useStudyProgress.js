import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export default function useStudyProgress(userId, academyId, subjectId) {
  const [readTopics,  setReadTopics]  = useState(new Set())
  const [bookmarks,   setBookmarks]   = useState(new Set())
  const [loading,     setLoading]     = useState(true)

  // ── Cargar datos al montar ──────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return

    const load = async () => {
      setLoading(true)

      const [{ data: reads }, { data: marks }] = await Promise.all([
        supabase.from('study_read').select('topic_id').eq('user_id', userId),
        supabase.from('study_bookmarks').select('topic_id').eq('user_id', userId),
      ])

      setReadTopics(new Set((reads || []).map(r => r.topic_id)))
      setBookmarks(new Set((marks || []).map(r => r.topic_id)))
      setLoading(false)
    }

    load()
  }, [userId])

  // ── Marcar / desmarcar leído ────────────────────────────────────────────
  const toggleRead = useCallback(async (topicId, blockId) => {
    if (!userId) return

    const isRead = readTopics.has(topicId)

    // Optimistic update
    setReadTopics(prev => {
      const next = new Set(prev)
      isRead ? next.delete(topicId) : next.add(topicId)
      return next
    })

    if (isRead) {
      await supabase
        .from('study_read')
        .delete()
        .eq('user_id', userId)
        .eq('topic_id', topicId)
    } else {
      await supabase
        .from('study_read')
        .upsert({
          user_id:    userId,
          topic_id:   topicId,
          block_id:   blockId,
          academy_id: academyId  || null,
          subject_id: subjectId  || null,
        })
    }
  }, [userId, academyId, subjectId, readTopics])

  // ── Marcar / quitar marcador ────────────────────────────────────────────
  const toggleBookmark = useCallback(async (topicId, blockId) => {
    if (!userId) return

    const isMarked = bookmarks.has(topicId)

    // Optimistic update
    setBookmarks(prev => {
      const next = new Set(prev)
      isMarked ? next.delete(topicId) : next.add(topicId)
      return next
    })

    if (isMarked) {
      await supabase
        .from('study_bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('topic_id', topicId)
    } else {
      await supabase
        .from('study_bookmarks')
        .upsert({
          user_id:    userId,
          topic_id:   topicId,
          block_id:   blockId,
          academy_id: academyId  || null,
          subject_id: subjectId  || null,
        })
    }
  }, [userId, academyId, subjectId, bookmarks])

  return { readTopics, bookmarks, loading, toggleRead, toggleBookmark }
}
