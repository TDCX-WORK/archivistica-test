import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface BlockWithCount {
  id:       string
  label:    string
  color:    string
  position: number
  count:    number
}

export interface SupuestoData {
  id:        string
  title:     string
  subtitle:  string
  scenario:  string
  questions: { question: string; options: unknown; answer: number; explanation: string }[]
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useHomeData(academyId: string | null | undefined, subjectId: string | null | undefined) {
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [blocks,         setBlocks]         = useState<BlockWithCount[]>([])
  const [supuestos,      setSupuestos]      = useState<SupuestoData[]>([])
  const [planDates,      setPlanDates]      = useState<Set<string>>(new Set())
  const [totalTopics,    setTotalTopics]    = useState(0)
  const [loading,        setLoading]        = useState(true)

  useEffect(() => {
    if (!academyId) return
    setLoading(true)

    const sid = subjectId
    const aid = academyId

    const load = async () => {
      // ── Paso 1: cargar bloques + supuestos + plan en paralelo ──────
      let bq = supabase.from('content_blocks').select('id,label,color,position').eq('academy_id', aid).order('position')
      if (sid) bq = bq.eq('subject_id', sid)

      let sq = supabase.from('supuestos')
        .select('id,slug,title,subtitle,scenario,position,supuesto_questions(id,question,options,answer,explanation,position)')
        .eq('academy_id', aid).order('position')
      if (sid) sq = sq.eq('subject_id', sid)

      let pq = supabase.from('study_plans').select('week_start').eq('academy_id', aid)
      if (sid) pq = pq.eq('subject_id', sid)

      const [{ data: blocksRaw }, { data: supRaw }, { data: planRaw }] = await Promise.all([bq, sq, pq])

      // ── Procesar bloques (ya los tenemos, sin query extra) ────────
      const blocksArr = (blocksRaw ?? []) as { id: string; label: string; color: string; position: number }[]
      const blockIds  = blocksArr.map(b => b.id)

      // ── Paso 2: preguntas por bloque + temas, usando blockIds ─────
      // (antes eran 4 queries separadas, ahora son 2 en paralelo)
      let questionsRaw: { block_id: string }[] = []
      let topicsCount = 0

      if (blockIds.length > 0) {
        let qq = supabase.from('questions').select('block_id').eq('academy_id', aid)
        if (sid) qq = qq.eq('subject_id', sid)

        const [qRes, tRes] = await Promise.all([
          qq,
          supabase.from('content_topics')
            .select('id', { count: 'exact', head: true })
            .in('block_id', blockIds),
        ])
        questionsRaw = (qRes.data ?? []) as { block_id: string }[]
        topicsCount  = tRes.count ?? 0
      }

      // ── Contar preguntas por bloque + total (sin query extra) ──────
      const qByBlock: Record<string, number> = {}
      let totalQ = 0
      for (const q of (questionsRaw ?? []) as { block_id: string }[]) {
        qByBlock[q.block_id] = (qByBlock[q.block_id] ?? 0) + 1
        totalQ++
      }

      const blocksWithCount: BlockWithCount[] = blocksArr.map(b => ({
        ...b, count: qByBlock[b.id] ?? 0,
      }))

      // ── Procesar supuestos ────────────────────────────────────────
      type RawSup = {
        slug: string; title: string; subtitle: string | null; scenario: string | null
        supuesto_questions: { question: string; options: string[]; answer: number; explanation: string | null; position: number }[]
      }
      const supData: SupuestoData[] = (supRaw ?? []).length > 0
        ? (supRaw as RawSup[]).map(s => ({
            id: s.slug, title: s.title, subtitle: s.subtitle ?? '', scenario: s.scenario ?? '',
            questions: (s.supuesto_questions ?? [])
              .sort((a, b) => a.position - b.position)
              .map(q => ({ question: q.question, options: q.options, answer: q.answer, explanation: q.explanation ?? '' }))
          }))
        : []

      // ── Procesar fechas del plan ──────────────────────────────────
      const dates = new Set((planRaw ?? []).map((p: { week_start: string }) => p.week_start))

      // ── Setear todo de golpe (React 18 batchea en async) ──────────
      setBlocks(blocksWithCount)
      setTotalQuestions(totalQ)
      setTotalTopics(topicsCount ?? 0)
      setSupuestos(supData)
      setPlanDates(dates)
      setLoading(false)
    }

    load()
  }, [academyId, subjectId])

  return { totalQuestions, blocks, supuestos, planDates, totalTopics, loading }
}