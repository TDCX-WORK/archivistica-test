import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Fecha local en formato YYYY-MM-DD sin problemas de timezone
function localDateStr(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Lunes de la semana actual en fecha local
function getLunesStr() {
  const today = new Date()
  const day   = today.getDay() // 0=dom,1=lun...6=sab
  const diff  = day === 0 ? -6 : 1 - day
  const lunes = new Date(today)
  lunes.setDate(today.getDate() + diff)
  return localDateStr(lunes)
}

async function loadPlanData(academyId, dateKey) {
  const { data: planData } = await supabase
    .from('study_plans')
    .select('*')
    .eq('academy_id', academyId)
    .eq('week_start', dateKey)
    .maybeSingle()

  if (!planData) return null

  const blockIds = planData.block_ids || []
  const topicIds = planData.topic_ids || []

  if (blockIds.length === 0 && topicIds.length === 0) return null

  let bloquesData = [], temasData = []

  if (blockIds.length > 0) {
    const { data } = await supabase
      .from('content_blocks')
      .select('id, label, color')
      .in('id', blockIds)
    bloquesData = data || []
  }

  if (topicIds.length > 0) {
    const { data } = await supabase
      .from('content_topics')
      .select('id, title, block_id')
      .in('id', topicIds)
    temasData = data || []
  }

  // Agrupar temas sueltos por su bloque padre
  const temasExtraByBlock = {}
  for (const t of temasData) {
    if (!temasExtraByBlock[t.block_id]) temasExtraByBlock[t.block_id] = []
    temasExtraByBlock[t.block_id].push(t)
  }

  // Bloques completos seleccionados
  const bloquesConTemas = bloquesData.map(b => ({
    ...b,
    temasEspecificos: temasExtraByBlock[b.id] || [],
    todosLosTemas: true,
  }))

  // Bloques padre de temas sueltos (cuando solo hay topic_ids sin block_ids)
  const blockIdsCompletos      = new Set(bloquesData.map(b => b.id))
  const blockIdsConSoloTemas   = [...new Set(temasData.map(t => t.block_id))]
    .filter(id => !blockIdsCompletos.has(id))

  if (blockIdsConSoloTemas.length > 0) {
    const { data: extraBlocks } = await supabase
      .from('content_blocks')
      .select('id, label, color')
      .in('id', blockIdsConSoloTemas)
    for (const b of extraBlocks || []) {
      bloquesConTemas.push({
        ...b,
        temasEspecificos: temasExtraByBlock[b.id] || [],
        todosLosTemas: false,
      })
    }
  }

  if (bloquesConTemas.length === 0) return null

  return { plan: planData, bloques: bloquesConTemas }
}

export function usePlanSemanal(academyId) {
  const [planSemanal,    setPlanSemanal]    = useState(null)
  const [bloquesSemanal, setBloquesSemanal] = useState([])
  const [planDiario,     setPlanDiario]     = useState(null)
  const [bloquesDiario,  setBloquesDiario]  = useState([])
  const [loading,        setLoading]        = useState(true)

  useEffect(() => {
    if (!academyId) { setLoading(false); return }

    const load = async () => {
      setLoading(true)

      const lunesKey = getLunesStr()
      const hoyKey   = localDateStr()

      // Cargar ambos planes en paralelo
      const [semanalResult, diarioResult] = await Promise.all([
        loadPlanData(academyId, lunesKey),
        // Si hoy ES lunes, no cargar diario por separado (es el mismo)
        hoyKey !== lunesKey ? loadPlanData(academyId, hoyKey) : Promise.resolve(null),
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
  }, [academyId])

  // Compatibilidad con ProfesorProfile que usa { plan, bloques }
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
