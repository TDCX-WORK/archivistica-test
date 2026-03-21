import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useDirector(currentUser) {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const academyId  = currentUser?.academy_id
  const isDirector = currentUser?.role === 'director'

  useEffect(() => {
    if (!isDirector || !academyId) { setLoading(false); return }

    const load = async () => {
      setLoading(true)
      setError(null)

      const now          = new Date()
      const sevenAgo     = new Date(now - 7  * 86400000).toISOString().slice(0, 10)
      const thirtyAgo    = new Date(now - 30 * 86400000).toISOString().slice(0, 10)
      const twoMonthsAgo = new Date(now - 60 * 86400000).toISOString().slice(0, 10)

      // Cargar todo en paralelo
      const [
        { data: subs },
        { data: profiles },
        { data: sessions },
        { data: wrongs },
      ] = await Promise.all([
        supabase.from('subjects').select('id, name, slug, color').eq('academy_id', academyId),
        supabase.from('profiles').select('id, username, role, subject_id, access_until, created_at').eq('academy_id', academyId).in('role', ['alumno', 'profesor']),
        supabase.from('sessions').select('user_id, score, played_at, subject_id').eq('academy_id', academyId).gte('played_at', twoMonthsAgo),
        supabase.from('wrong_answers').select('user_id, question_id, fail_count, subject_id').eq('academy_id', academyId),
      ])

      if (!subs) { setError('Error cargando datos'); setLoading(false); return }

      // ── Actividad por semana (últimas 8 semanas) ─────────────────────
      const semanas = []
      for (let i = 7; i >= 0; i--) {
        const ini = new Date(now - (i + 1) * 7 * 86400000).toISOString().slice(0, 10)
        const fin = new Date(now - i       * 7 * 86400000).toISOString().slice(0, 10)
        const sessSemana = (sessions || []).filter(s => s.played_at >= ini && s.played_at < fin)
        const label = new Date(fin).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
        semanas.push({
          label,
          sesiones:       sessSemana.length,
          alumnosActivos: new Set(sessSemana.map(s => s.user_id)).size,
          notaMedia:      sessSemana.length
            ? Math.round(sessSemana.reduce((a, s) => a + s.score, 0) / sessSemana.length)
            : null,
        })
      }

      // ── Stats por asignatura ─────────────────────────────────────────
      const subjectStats = (subs || []).map(sub => {
        const subAlumnos  = (profiles || []).filter(p => p.role === 'alumno'   && p.subject_id === sub.id)
        const subProfes   = (profiles || []).filter(p => p.role === 'profesor' && p.subject_id === sub.id)
        const subSessions = (sessions || []).filter(s => s.subject_id === sub.id)
        const subWrongs   = (wrongs  || []).filter(w => w.subject_id === sub.id)

        const sesThisWeek = subSessions.filter(s => s.played_at >= sevenAgo)
        const ses30d      = subSessions.filter(s => s.played_at >= thirtyAgo)
        const alumnosActivos = new Set(sesThisWeek.map(s => s.user_id)).size

        const notaMedia = ses30d.length
          ? Math.round(ses30d.reduce((a, s) => a + s.score, 0) / ses30d.length)
          : null

        // Última actividad por alumno
        const ultimaActividad = {}
        for (const s of subSessions) {
          if (!ultimaActividad[s.user_id] || s.played_at > ultimaActividad[s.user_id])
            ultimaActividad[s.user_id] = s.played_at
        }

        // Alumnos en riesgo con detalle
        const alumnosEnRiesgo = subAlumnos.filter(a => {
          const ultima = ultimaActividad[a.id]
          if (!ultima) return true
          return Math.floor((now - new Date(ultima)) / 86400000) > 3
        }).map(a => ({
          id:       a.id,
          username: a.username,
          diasInactivo: ultimaActividad[a.id]
            ? Math.floor((now - new Date(ultimaActividad[a.id])) / 86400000)
            : null,
          accessUntil: a.access_until,
        }))

        // Accesos próximos a expirar con detalle
        const alumnosPorExpirar = subAlumnos.filter(a => {
          if (!a.access_until) return false
          const dias = Math.ceil((new Date(a.access_until) - now) / 86400000)
          return dias > 0 && dias <= 14
        }).map(a => ({
          id:       a.id,
          username: a.username,
          diasRestantes: Math.ceil((new Date(a.access_until) - now) / 86400000),
        }))

        // Fallos por alumno
        const fallosPorAlumno = {}
        for (const w of subWrongs) {
          fallosPorAlumno[w.user_id] = (fallosPorAlumno[w.user_id] || 0) + w.fail_count
        }

        // Stats por profesor
        const profesoresStats = subProfes.map(prof => {
          const profSessions = sesThisWeek.filter(s =>
            subAlumnos.some(a => a.id === s.user_id)
          )
          return {
            id:              prof.id,
            username:        prof.username,
            alumnos:         subAlumnos.length,
            sesionesThisWeek: profSessions.length,
            notaMedia,
          }
        })

        // Top alumnos (mejor nota)
        const alumnosConNota = subAlumnos.map(a => {
          const sesSub = ses30d.filter(s => s.user_id === a.id)
          const nota = sesSub.length
            ? Math.round(sesSub.reduce((acc, s) => acc + s.score, 0) / sesSub.length)
            : null
          return { id: a.id, username: a.username, nota, sesiones: sesSub.length, fallos: fallosPorAlumno[a.id] || 0 }
        }).sort((a, b) => (b.nota ?? -1) - (a.nota ?? -1))

        return {
          id: sub.id, name: sub.name, slug: sub.slug, color: sub.color,
          totalAlumnos: subAlumnos.length,
          alumnosActivos,
          enRiesgo:     alumnosEnRiesgo.length,
          porExpirar:   alumnosPorExpirar.length,
          notaMedia,
          sesiones30d:  ses30d.length,
          profesores:   profesoresStats,
          // Detalle para alertas
          alumnosEnRiesgo,
          alumnosPorExpirar,
          alumnosConNota,
        }
      })

      // ── Stats globales ───────────────────────────────────────────────
      const alumnos       = (profiles || []).filter(p => p.role === 'alumno')
      const profesores    = (profiles || []).filter(p => p.role === 'profesor')
      const ses7d         = (sessions || []).filter(s => s.played_at >= sevenAgo)
      const ses30d        = (sessions || []).filter(s => s.played_at >= thirtyAgo)
      const totalActivos  = new Set(ses7d.map(s => s.user_id)).size
      const totalEnRiesgo = subjectStats.reduce((a, s) => a + s.enRiesgo, 0)
      const totalPorExpirar = subjectStats.reduce((a, s) => a + s.porExpirar, 0)
      const notaGlobal    = ses30d.length
        ? Math.round(ses30d.reduce((a, s) => a + s.score, 0) / ses30d.length)
        : null

      setStats({
        totalAlumnos:   alumnos.length,
        totalProfesores: profesores.length,
        totalActivos,
        totalEnRiesgo,
        totalPorExpirar,
        notaGlobal,
        sesiones30d:    ses30d.length,
        bySubject:      subjectStats,
        semanas,
      })
      setLoading(false)
    }

    load()
  }, [isDirector, academyId])

  return { stats, loading, error }
}
