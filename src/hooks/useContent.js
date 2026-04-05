import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Carga los bloques temáticos y sus temas desde Supabase.
 * Filtra automáticamente por la academia del usuario autenticado.
 * Devuelve la misma estructura que tenía STUDY_BLOCKS en el JSON local,
 * para que StudyView no necesite cambios en su lógica interna.
 *
 * Nota: content_blocks no tiene columnas 'estimated_minutes' ni 'bg' en BD.
 * Se usan valores por defecto directamente.
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
      // Solo pedimos columnas que realmente existen en content_blocks
      let blocksQuery = supabase
        .from('content_blocks')
        .select('id, label, color, position, subject_id')
        .eq('academy_id', academyId)
        .order('position', { ascending: true })

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
        .select('id, block_id, title, position, content_json, keywords, laws, dates')
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
      // estimatedMinutes: 60 por defecto (la columna no existe en BD)
      // bg: color con opacidad 20% calculado desde el color del bloque
      const structured = blocksData.map(block => ({
        id:               block.id,
        label:            block.label,
        color:            block.color,
        bg:               block.color + '20',
        estimatedMinutes: 60,
        topics:           topicsByBlock[block.id] || [],
      }))

      setBlocks(structured)
      setLoading(false)
    }

    load()
  }, [userId, subjectId])

  return { blocks, loading, error }
}
