import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { BloqueConTemas, StudyPlan } from '../types'

function localDateStr(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getLunesStr(): string {
  const today = new Date()
  const day   = today.getDay()
  const diff  = day === 0 ? -6 : 1 - day
  const lunes = new Date(today)
  lunes.setDate(today.getDate() + diff)
  return localDateStr(lunes)
}

interface PlanResult {
  plan:    StudyPlan
  bloques: BloqueConTemas[]
}

async function loadPlanData(
  academyId: string,
  subjectId: string | null | undefined,
  dateKey:   string
): Promise<PlanResult | null> {
  let query = supabase
    .from('study_plans')
    .select('*')
    .eq('academy_id', academyId)
    .eq('week_start', dateKey)

  if (subjectId) query = query.eq('subject_id', subjectId)

  const { data: planData } = await query.maybeSingle()

  if (!planData) return null

  const plan = planData as StudyPlan

  const blockIds = plan.block_ids ?? []
  const topicIds = plan.topic_ids ?? []

  if (blockIds.length === 0 && topicIds.length === 0) return null

  let bloquesData: { id: string; label: string; color: string }[] = []
  let temasData:   { id: string; title: string; block_id: string }[] = []

  if (blockIds.length > 0) {
    const { data } = await supabase
      .from('content_blocks')
      .select('id, label, color')
      .in('id', blockIds)
    bloquesData = (data ?? []) as typeof bloquesData
  }

  if (topicIds.length > 0) {
    const { data } = await supabase
      .from('content_topics')
      .select('id, title, block_id')
      .in('id', topicIds)
    temasData = (data ?? []) as typeof temasData
  }

  const temasExtraByBlock: Record<string, { id: string; title: string; block_id: string }[]> = {}
  for (const t of temasData) {
    if (!temasExtraByBlock[t.block_id]) temasExtraByBlock[t.block_id] = []
    temasExtraByBlock[t.block_id]!.push(t)
  }

  const blockIdsCompletos = new Set(bloquesData.map(b => b.id))

  const bloquesConTemas: BloqueConTemas[] = bloquesData.map(b => ({
    ...b,
    temasEspecificos: temasExtraByBlock[b.id] ?? [],
    todosLosTemas:    true,
  }))

  const blockIdsConSoloTemas = [...new Set(temasData.map(t => t.block_id))]
    .filter(id => !blockIdsCompletos.has(id))

  if (blockIdsConSoloTemas.length > 0) {
    const { data: extraBlocks } = await supabase
      .from('content_blocks')
      .select('id, label, color')
      .in('id', blockIdsConSoloTemas)
    for (const b of (extraBlocks ?? []) as typeof bloquesData) {
      bloquesConTemas.push({
        ...b,
        temasEspecificos: temasExtraByBlock[b.id] ?? [],
        todosLosTemas:    false,
      })
    }
  }

  if (bloquesConTemas.length === 0) return null

  return { plan, bloques: bloquesConTemas }
}

export function usePlanSemanal(
  academyId: string | null | undefined,
  subjectId: string | null | undefined
) {
  const [planSemanal,    setPlanSemanal]    = useState<StudyPlan | null>(null)
  const [bloquesSemanal, setBloquesSemanal] = useState<BloqueConTemas[]>([])
  const [planDiario,     setPlanDiario]     = useState<StudyPlan | null>(null)
  const [bloquesDiario,  setBloquesDiario]  = useState<BloqueConTemas[]>([])
  const [loading,        setLoading]        = useState(true)

  useEffect(() => {
    if (!academyId) { setLoading(false); return }

    const load = async () => {
      setLoading(true)

      const lunesKey = getLunesStr()
      const hoyKey   = localDateStr()

      const [semanalResult, diarioResult] = await Promise.all([
        loadPlanData(academyId, subjectId, lunesKey),
        hoyKey !== lunesKey
          ? loadPlanData(academyId, subjectId, hoyKey)
          : Promise.resolve(null),
      ])

      if (semanalResult) {
        setPlanSemanal(semanalResult.plan)
        setBloquesSemanal(semanalResult.bloques)
      } else {
        setPlanSemanal(null)
        setBloquesSemanal([])
      }

      if (diarioResult) {
        setPlanDiario(diarioResult.plan)
        setBloquesDiario(diarioResult.bloques)
      } else {
        setPlanDiario(null)
        setBloquesDiario([])
      }

      setLoading(false)
    }

    load()
  }, [academyId, subjectId])

  return {
    plan:           planSemanal,
    bloques:        bloquesSemanal,
    planSemanal,
    bloquesSemanal,
    planDiario,
    bloquesDiario,
    loading,
  }
}