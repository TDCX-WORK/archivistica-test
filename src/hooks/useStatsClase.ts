import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { calcularRacha } from '../lib/helpers'
import { calcAlumnoStats, calcStatsClase } from '../lib/statsHelpers'
import type { CurrentUser, StatsClase } from '../types'

/**
 * Hook ligero que calcula estadísticas de clase.
 * Usado por ProfesorProfile y StatsClase para evitar instanciar
 * el pesado useProfesor completo (sin invite_codes, sin student_profiles,
 * sin generar notificaciones).
 * La lógica de cálculo vive en lib/statsHelpers.ts (fuente única).
 */
export function useStatsClase(currentUser: CurrentUser | null) {
  const academyId = currentUser?.academy_id
  const isStaff   = currentUser?.role === 'profesor' || currentUser?.role === 'director'

  const [alumnos,     setAlumnos]     = useState<{
    id: string; username: string; sesiones: number; notaMedia: number | null
    temasLeidos: number; fallos: number; racha: number; diasInactivo: number | null
    accesoExpirado: boolean; diasParaExpirar: number | null
    proximoAExpirar: boolean; enRiesgo: boolean; createdAt: string
  }[]>([])
  const [sesiones30d, setSesiones30d] = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)

  useEffect(() => {
    if (!isStaff || !academyId) { setLoading(false); return }

    const load = async () => {
      setLoading(true)
      setError(null)

      const subjectId = currentUser?.subject_id

      let alumnosQuery = supabase
        .from('profiles')
        .select('id, username, created_at, access_until')
        .eq('academy_id', academyId)
        .eq('role', 'alumno')

      if (subjectId) alumnosQuery = alumnosQuery.eq('subject_id', subjectId)

      const { data: profiles, error: profErr } = await alumnosQuery
      if (profErr) { setError('Error cargando datos'); setLoading(false); return }
      if (!profiles?.length) { setAlumnos([]); setLoading(false); return }

      const typedProfiles = profiles as { id: string; username: string; created_at: string; access_until: string | null }[]
      const alumnoIds     = typedProfiles.map(p => p.id)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

      const [{ data: sessions }, { data: reads }, { data: wrongs }] = await Promise.all([
        supabase.from('sessions')
          .select('user_id, score, played_at, created_at')
          .eq('academy_id', academyId).in('user_id', alumnoIds)
          .gte('played_at', thirtyDaysAgo)
          .order('created_at', { ascending: false }),
        supabase.from('study_read')
          .select('user_id')
          .eq('academy_id', academyId).in('user_id', alumnoIds),
        supabase.from('wrong_answers')
          .select('user_id, question_id')
          .eq('academy_id', academyId).in('user_id', alumnoIds),
      ])

      const typedSessions = (sessions ?? []) as { user_id: string; score: number; played_at: string; created_at: string }[]
      const typedReads    = (reads ?? []) as { user_id: string }[]
      const typedWrongs   = (wrongs ?? []) as { user_id: string; question_id: string }[]

      setSesiones30d(typedSessions.length)

      // Pre-agrupar
      const sessionsByUser: Record<string, typeof typedSessions> = {}
      for (const s of typedSessions) {
        if (!sessionsByUser[s.user_id]) sessionsByUser[s.user_id] = []
        sessionsByUser[s.user_id]!.push(s)
      }
      const readCountByUser: Record<string, number> = {}
      for (const r of typedReads) {
        readCountByUser[r.user_id] = (readCountByUser[r.user_id] ?? 0) + 1
      }
      const wrongCountByUser: Record<string, number> = {}
      for (const w of typedWrongs) {
        wrongCountByUser[w.user_id] = (wrongCountByUser[w.user_id] ?? 0) + 1
      }

      const now = new Date()
      const result = typedProfiles.map(alumno => {
        const ses   = sessionsByUser[alumno.id] ?? []
        const stats = calcAlumnoStats(alumno, ses, readCountByUser[alumno.id] ?? 0, now)
        const racha = calcularRacha(ses.map(s => s.played_at))
        return {
          id:        alumno.id,
          username:  alumno.username,
          createdAt: alumno.created_at,
          fallos:    wrongCountByUser[alumno.id] ?? 0,
          racha,
          ...stats,
        }
      })

      setAlumnos(result)
      setLoading(false)
    }

    load()
  }, [isStaff, academyId, currentUser?.subject_id])

  const statsClase: StatsClase | null = useMemo(
    () => calcStatsClase(alumnos, sesiones30d),
    [alumnos, sesiones30d]
  )

  return { alumnos, statsClase, loading, error }
}