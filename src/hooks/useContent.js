import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Carga los bloques temáticos y sus temas desde Supabase.
 * Filtra automáticamente por la academia del usuario autenticado.
 * Devuelve la misma estructura que tenía STUDY_BLOCKS en el JSON local,
 * para que StudyView no necesite cambios en su lógica interna.
 */
export function useContent(userId, subjectId) {
  const [blocks, setBlocks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!userId) return

    const load = async () => {
      setLoading(true)
      setError(null)

      // 1. Obtener academy_id del perfil del usuario
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('academy_id')
        .eq('id', userId)
        .maybeSingle()

      if (profileErr || !profile?.academy_id) {
        setError('No se pudo obtener la academia del usuario')
        setLoading(false)
        return
      }

      const academyId = profile.academy_id

      // 2. Cargar bloques — filtrar por asignatura si existe
      let blocksQuery = supabase
        .from('content_blocks')
        .select('*')
        .eq('academy_id', academyId)
        .order('position', { ascending: true })

      // Si el usuario tiene asignatura, filtrar solo sus bloques
      if (subjectId) blocksQuery = blocksQuery.eq('subject_id', subjectId)

      const { data: blocksData, error: blocksErr } = await blocksQuery

      if (blocksErr) {
        setError('Error cargando bloques temáticos')
        setLoading(false)
        return
      }

      // 3. Cargar todos los temas de esos bloques en una sola query
      const blockIds = blocksData.map(b => b.id)

      const { data: topicsData, error: topicsErr } = await supabase
        .from('content_topics')
        .select('*')
        .in('block_id', blockIds)
        .order('position', { ascending: true })

      if (topicsErr) {
        setError('Error cargando temas')
        setLoading(false)
        return
      }

      // 4. Agrupar temas por bloque y construir la estructura final
      const topicsByBlock = {}
      for (const topic of topicsData) {
        if (!topicsByBlock[topic.block_id]) topicsByBlock[topic.block_id] = []
        topicsByBlock[topic.block_id].push({
          id:       topic.id,
          title:    topic.title,
          content:  (topic.content_json?.text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n'),
          laws:     topic.laws     || [],
          dates:    topic.dates    || [],
          keywords: topic.keywords || [],
        })
      }

      // 5. Estructura final compatible con la que usaba STUDY_BLOCKS
      const structured = blocksData.map(block => ({
        id:               block.id,
        label:            block.label,
        color:            block.color,
        bg:               block.bg || block.color + '20', // fallback si no hay bg
        estimatedMinutes: block.estimated_minutes || 60,
        topics:           topicsByBlock[block.id] || [],
      }))

      setBlocks(structured)
      setLoading(false)
    }

    load()
  }, [userId, subjectId])

  return { blocks, loading, error }
}
