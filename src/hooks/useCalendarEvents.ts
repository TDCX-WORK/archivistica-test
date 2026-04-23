import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import type { CurrentUser } from '../types'

export interface CalendarEvent {
  id:          string
  academy_id:  string | null
  created_by:  string | null
  title:       string
  event_date:  string
  type:        'clase' | 'hito' | 'evento' | 'examen' | 'tarea'
  description: string | null
  created_at:  string
}

export function useCalendarEvents(currentUser: CurrentUser | null) {
  const [events,  setEvents]  = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!currentUser?.academy_id || !currentUser?.id) return
    setLoading(true)

    // 1. Eventos manuales del profesor
    const { data: evData } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('academy_id', currentUser.academy_id)
      .order('event_date', { ascending: true })

    const manual = (evData ?? []) as CalendarEvent[]

    // 2. Fechas de examen del alumno (desde student_profiles via academy)
    let examEvents: CalendarEvent[] = []
    if (currentUser.role === 'alumno') {
      const { data: spData } = await supabase
        .from('student_profiles')
        .select('exam_date')
        .eq('id', currentUser.id)
        .maybeSingle()
      const examDate = (spData as any)?.exam_date
      if (examDate) {
        examEvents = [{
          id:          `exam-${currentUser.id}`,
          academy_id:  currentUser.academy_id,
          created_by:  null,
          title:       'Fecha de examen',
          event_date:  examDate,
          type:        'examen',
          description: null,
          created_at:  new Date().toISOString(),
        }]
      }
    }

    // 3. Entregas de tareas pendientes del alumno
    let tareaEvents: CalendarEvent[] = []
    if (currentUser.role === 'alumno') {
      const { data: aData } = await supabase
        .from('assignments')
        .select('id, title, due_date')
        .eq('academy_id', currentUser.academy_id)
        .order('due_date', { ascending: true })

      tareaEvents = (aData ?? []).map((a: any) => ({
        id:          `tarea-${a.id}`,
        academy_id:  currentUser.academy_id,
        created_by:  null,
        title:       `Entrega: ${a.title}`,
        event_date:  a.due_date,
        type:        'tarea' as const,
        description: null,
        created_at:  new Date().toISOString(),
      }))
    }

    setEvents([...manual, ...examEvents, ...tareaEvents].sort(
      (a, b) => a.event_date.localeCompare(b.event_date)
    ))
    setLoading(false)
  }, [currentUser?.academy_id, currentUser?.id, currentUser?.role])

  useEffect(() => { load() }, [load])

  // Eventos por fecha (para el heatmap) — memoizado
  const byDate = useMemo(() => events.reduce<Record<string, CalendarEvent[]>>((acc, ev) => {
    if (!acc[ev.event_date]) acc[ev.event_date] = []
    acc[ev.event_date]!.push(ev)
    return acc
  }, {}), [events])

  // Próximos eventos (desde hoy) — memoizado
  const upcoming = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]!
    return events.filter(e => e.event_date >= today).slice(0, 8)
  }, [events])

  const crearEvento = useCallback(async (params: {
    title:       string
    event_date:  string
    type:        'clase' | 'hito' | 'evento'
    description: string | null
  }) => {
    if (!currentUser?.academy_id || !currentUser?.id) return { error: 'Sin sesión' }

    const { data, error: err } = await supabase
      .from('calendar_events')
      .insert({
        academy_id:  currentUser.academy_id,
        created_by:  currentUser.id,
        title:       params.title.trim(),
        event_date:  params.event_date,
        type:        params.type,
        description: params.description?.trim() ?? null,
      })
      .select()
      .single()

    if (err) return { error: err.message }
    setEvents(prev => [...prev, data as CalendarEvent].sort(
      (a, b) => a.event_date.localeCompare(b.event_date)
    ))
    return { ok: true }
  }, [currentUser?.academy_id, currentUser?.id])

  const borrarEvento = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id)
    if (!err) setEvents(prev => prev.filter(e => e.id !== id))
    return err ? { error: err.message } : { ok: true }
  }, [])

  return { events, byDate, upcoming, loading, crearEvento, borrarEvento, reload: load }
}