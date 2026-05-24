import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface AlumnoSesion {
  score:      number
  played_at:  string | null
  created_at: string | null
  total:      number | null
}

export interface FalloConPregunta {
  question_id: string
  fail_count:  number
  next_review: string | null
  question:    {
    id:          string
    question:    string
    options:     unknown
    answer:      number
    explanation: string | null
  } | null
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useAlumnoDetalle(alumnoId: string | null | undefined, academyId: string | null | undefined) {
  const [sesiones,    setSesiones]    = useState<AlumnoSesion[]>([])
  const [temasLeidos, setTemasLeidos] = useState<{ topic_id: string }[]>([])
  const [fallos,      setFallos]      = useState<FalloConPregunta[]>([])
  const [loading,     setLoading]     = useState(true)

  const load = useCallback(async () => {
    if (!alumnoId || !academyId) { setLoading(false); return }
    setLoading(true)

    const [{ data: sess }, { data: reads }, { data: wrongs }] = await Promise.all([
      supabase.from('sessions').select('score, played_at, created_at, total')
        .eq('user_id', alumnoId).order('created_at', { ascending: false }).limit(30),
      supabase.from('study_read').select('topic_id')
        .eq('user_id', alumnoId).eq('academy_id', academyId),
      supabase.from('wrong_answers').select('question_id, fail_count, next_review')
        .eq('user_id', alumnoId).order('fail_count', { ascending: false }).limit(15),
    ])

    setSesiones((sess ?? []) as AlumnoSesion[])
    setTemasLeidos((reads ?? []) as { topic_id: string }[])

    if (wrongs?.length) {
      const qIds = (wrongs as { question_id: string }[]).map(f => f.question_id).filter(Boolean)
      const { data: pregs } = await supabase
        .from('questions').select('id, question, options, answer, explanation').in('id', qIds)
      const map: Record<string, NonNullable<FalloConPregunta['question']>> = {}
      for (const q of (pregs ?? []) as NonNullable<FalloConPregunta['question']>[]) map[q.id] = q
      setFallos((wrongs as { question_id: string; fail_count: number; next_review: string | null }[])
        .map(f => ({ ...f, question: map[f.question_id] ?? null })))
    } else {
      setFallos([])
    }

    setLoading(false)
  }, [alumnoId, academyId])

  useEffect(() => { load() }, [load])

  return { sesiones, temasLeidos, fallos, loading, reload: load }
}