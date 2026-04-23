import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { StructuredBlock, StructuredTopic } from '../types'

export function useContent(
  academyId: string | null | undefined,
  subjectId: string | null | undefined
) {
  const [blocks,  setBlocks]  = useState<StructuredBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!academyId) return

    const load = async () => {
      setLoading(true)
      setError(null)

      // 1. Cargar bloques
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

      const typedBlocks = (blocksData ?? []) as {
        id: string; label: string; color: string; position: number; subject_id: string | null
      }[]

      // 2. Cargar todos los temas de esos bloques
      const blockIds = typedBlocks.map(b => b.id)

      if (blockIds.length === 0) {
        setBlocks([])
        setLoading(false)
        return
      }

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

      const typedTopics = (topicsData ?? []) as {
        id: string
        block_id: string
        title: string
        position: number
        content_json: { text: string } | null
        keywords: string[] | null
        laws: string[] | null
        dates: string[] | null
      }[]

      // 3. Agrupar temas por bloque
      const topicsByBlock: Record<string, StructuredTopic[]> = {}
      for (const topic of typedTopics) {
        if (!topicsByBlock[topic.block_id]) topicsByBlock[topic.block_id] = []
        topicsByBlock[topic.block_id]!.push({
          id:       topic.id,
          title:    topic.title,
          content:  (topic.content_json?.text ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n'),
          laws:     topic.laws     ?? [],
          dates:    topic.dates    ?? [],
          keywords: topic.keywords ?? [],
        })
      }

      // 4. Estructura final
      const structured: StructuredBlock[] = typedBlocks.map(block => ({
        id:               block.id,
        label:            block.label,
        color:            block.color,
        bg:               block.color + '20',
        estimatedMinutes: 60,
        topics:           topicsByBlock[block.id] ?? [],
      }))

      setBlocks(structured)
      setLoading(false)
    }

    load()
  }, [academyId, subjectId])

  return { blocks, loading, error }
}