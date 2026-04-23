import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { subscribe } from '../lib/eventBus'
import type {
  CurrentUser, DirectorStats, SubjectStats, SemanaStats,
  AlumnoEnRiesgoDetalle, AlumnoPorExpirarDetalle, AlumnoConNota,
  ProfesorStats, Profile
} from '../types'

export function useDirector(currentUser: CurrentUser | null) {
  const [stats,       setStats]       = useState<DirectorStats | null>(null)
  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)

  const academyId  = currentUser?.academy_id
  const isDirector = currentUser?.role === 'director'

  const load = useCallback(async () => {
    if (!isDirector || !academyId) { setLoading(false); return }

    setLoading(true)
    setError(null)

      const now          = new Date()
      const sevenAgo     = new Date(now.getTime() - 7  * 86400000).toISOString().slice(0, 10)
      const thirtyAgo    = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10)
      const twoMonthsAgo = new Date(now.getTime() - 60 * 86400000).toISOString().slice(0, 10)

      // ── Paso 1: cargar profiles primero para saber qué alumnoIds filtrar ──
      const [
        { data: subs },
        { data: profiles },
        { data: sessions },
        { data: wrongs },
        { data: announcements },
      ] = await Promise.all([
        supabase.from('subjects').select('id, name, slug, color').eq('academy_id', academyId),
        supabase.from('profiles').select('id, username, role, subject_id, access_until, created_at, academy_id, force_password_change').eq('academy_id', academyId).in('role', ['alumno', 'profesor']),
        supabase.from('sessions').select('user_id, score, played_at, subject_id').eq('academy_id', academyId).gte('played_at', twoMonthsAgo),
        supabase.from('wrong_answers').select('user_id, question_id, fail_count, subject_id').eq('academy_id', academyId),
        supabase.from('announcements').select('id, author_id, created_at, title, subject_id').eq('academy_id', academyId).order('created_at', { ascending: false }),
      ])

      if (!subs) { setError('Error cargando datos'); setLoading(false); return }

      const typedProfiles = (profiles ?? []) as Profile[]

      // ── Paso 2: ahora sí pedir student_profiles solo de nuestros alumnos ──
      const alumnoIds = typedProfiles.filter(p => p.role === 'alumno').map(p => p.id)

      let studentProfs: { id: string; monthly_price: number | null; exam_date: string | null; full_name: string | null; city: string | null; onboarding_completed: boolean | null; payment_status: string }[] = []
      if (alumnoIds.length > 0) {
        const { data } = await supabase
          .from('student_profiles')
          .select('id, monthly_price, exam_date, full_name, city, onboarding_completed, payment_status')
          .in('id', alumnoIds)
        studentProfs = (data ?? []) as typeof studentProfs
      }

      const typedSubs     = subs as { id: string; name: string; slug: string | null; color: string | null }[]
      const typedSessions = (sessions ?? []) as { user_id: string; score: number; played_at: string; subject_id: string | null }[]
      const typedWrongs   = (wrongs   ?? []) as { user_id: string; question_id: string; fail_count: number; subject_id: string | null }[]

      // Map de student_profiles por id
      const spMap: Record<string, typeof studentProfs[0]> = {}
      for (const sp of studentProfs) spMap[sp.id] = sp

      // Pre-agrupar por subject_id y user_id para evitar O(n×m)
      const sessionsBySubject: Record<string, typeof typedSessions> = {}
      const sessionsByUser: Record<string, typeof typedSessions> = {}
      for (const s of typedSessions) {
        const subKey = s.subject_id ?? '__none__'
        if (!sessionsBySubject[subKey]) sessionsBySubject[subKey] = []
        sessionsBySubject[subKey]!.push(s)
        if (!sessionsByUser[s.user_id]) sessionsByUser[s.user_id] = []
        sessionsByUser[s.user_id]!.push(s)
      }
      const wrongsBySubject: Record<string, typeof typedWrongs> = {}
      for (const w of typedWrongs) {
        const subKey = w.subject_id ?? '__none__'
        if (!wrongsBySubject[subKey]) wrongsBySubject[subKey] = []
        wrongsBySubject[subKey]!.push(w)
      }
      // Profiles por rol y subject_id
      const profilesByRoleSubject: Record<string, typeof typedProfiles> = {}
      for (const p of typedProfiles) {
        const key = `${p.role}_${p.subject_id ?? '__none__'}`
        if (!profilesByRoleSubject[key]) profilesByRoleSubject[key] = []
        profilesByRoleSubject[key]!.push(p)
      }

      // Actividad de profesores — último aviso por autor
      type AnnRow = { id: string; author_id: string; created_at: string; title: string; subject_id: string | null }
      const typedAnn = (announcements ?? []) as AnnRow[]
      const lastAvisoByProfesor: Record<string, { created_at: string; title: string }> = {}
      for (const ann of typedAnn) {
        if (!lastAvisoByProfesor[ann.author_id]) {
          lastAvisoByProfesor[ann.author_id] = { created_at: ann.created_at, title: ann.title }
        }
      }
      const totalAvisosByProfesor: Record<string, number> = {}
      for (const ann of typedAnn) {
        totalAvisosByProfesor[ann.author_id] = (totalAvisosByProfesor[ann.author_id] ?? 0) + 1
      }

      // Finanzas: ingresos mensuales de la academia
      const alumnosConPrecio  = typedProfiles.filter(p => p.role === 'alumno' && spMap[p.id]?.monthly_price)
      const mrrAcademia       = alumnosConPrecio.reduce((sum, a) => sum + (spMap[a.id]?.monthly_price ?? 0), 0)
      const alumnosSinPrecio  = typedProfiles.filter(p => p.role === 'alumno' && !spMap[p.id]?.monthly_price).length
      const alumnosActivos30d = new Set(typedSessions.filter(s => s.played_at >= new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10)).map(s => s.user_id))
      const mrrActivos        = alumnosConPrecio.filter(a => alumnosActivos30d.has(a.id)).reduce((sum, a) => sum + (spMap[a.id]?.monthly_price ?? 0), 0)
      // Pagos del mes actual
      const alumnosPagados    = typedProfiles.filter(p => p.role === 'alumno' && spMap[p.id]?.payment_status === 'paid')
      const alumnosPendientes = typedProfiles.filter(p => p.role === 'alumno' && spMap[p.id]?.payment_status === 'pending')
      const alumnosVencidos   = typedProfiles.filter(p => p.role === 'alumno' && spMap[p.id]?.payment_status === 'overdue')
      const mrrCobrado        = alumnosPagados.reduce((sum, a) => sum + (spMap[a.id]?.monthly_price ?? 0), 0)
      const mrrPendiente      = alumnosPendientes.reduce((sum, a) => sum + (spMap[a.id]?.monthly_price ?? 0), 0)
      const mrrVencido        = alumnosVencidos.reduce((sum, a) => sum + (spMap[a.id]?.monthly_price ?? 0), 0)

      // Actividad por semana (últimas 8 semanas)
      const semanas: SemanaStats[] = []
      for (let i = 7; i >= 0; i--) {
        const ini = new Date(now.getTime() - (i + 1) * 7 * 86400000).toISOString().slice(0, 10)
        const fin = new Date(now.getTime() - i       * 7 * 86400000).toISOString().slice(0, 10)
        const sessSemana = typedSessions.filter(s => s.played_at >= ini && s.played_at < fin)
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

      // Stats por asignatura
      const subjectStats: SubjectStats[] = typedSubs.map(sub => {
        const subAlumnos  = profilesByRoleSubject[`alumno_${sub.id}`] ?? []
        const subProfes   = profilesByRoleSubject[`profesor_${sub.id}`] ?? []
        const subSessions = sessionsBySubject[sub.id] ?? []
        const subWrongs   = wrongsBySubject[sub.id] ?? []

        const sesThisWeek    = subSessions.filter(s => s.played_at >= sevenAgo)
        const ses30d         = subSessions.filter(s => s.played_at >= thirtyAgo)
        const alumnosActivos = new Set(sesThisWeek.map(s => s.user_id)).size

        // Pre-agrupar sesiones 30d por user_id para esta asignatura
        const ses30dByUser: Record<string, typeof ses30d> = {}
        for (const s of ses30d) {
          if (!ses30dByUser[s.user_id]) ses30dByUser[s.user_id] = []
          ses30dByUser[s.user_id]!.push(s)
        }

        // Media por alumno (no por sesión) — consistente con panel profesor
        const notasPorAlumno = subAlumnos
          .map(a => {
            const sesSub = ses30dByUser[a.id] ?? []
            return sesSub.length ? sesSub.reduce((acc, s) => acc + s.score, 0) / sesSub.length : null
          })
          .filter((n): n is number => n !== null)
        const notaMedia = notasPorAlumno.length
          ? Math.round(notasPorAlumno.reduce((a, b) => a + b, 0) / notasPorAlumno.length)
          : null

        const ultimaActividad: Record<string, string> = {}
        for (const s of subSessions) {
          if (!ultimaActividad[s.user_id] || s.played_at > ultimaActividad[s.user_id]!)
            ultimaActividad[s.user_id] = s.played_at
        }

        const alumnosEnRiesgo: AlumnoEnRiesgoDetalle[] = subAlumnos.filter(a => {
          const ultima = ultimaActividad[a.id]
          if (!ultima) {
            const diasDesdeRegistro = Math.floor((now.getTime() - new Date(a.created_at).getTime()) / 86400000)
            return diasDesdeRegistro >= 3
          }
          return Math.floor((now.getTime() - new Date(ultima).getTime()) / 86400000) > 3
        }).map(a => ({
          id:           a.id,
          username:     a.username,
          diasInactivo: ultimaActividad[a.id]
            ? Math.floor((now.getTime() - new Date(ultimaActividad[a.id]!).getTime()) / 86400000)
            : null,
          accessUntil: a.access_until,
        }))

        const alumnosPorExpirar: AlumnoPorExpirarDetalle[] = subAlumnos.filter(a => {
          if (!a.access_until) return false
          const dias = Math.ceil((new Date(a.access_until).getTime() - now.getTime()) / 86400000)
          return dias > 0 && dias <= 14
        }).map(a => ({
          id:            a.id,
          username:      a.username,
          diasRestantes: Math.ceil((new Date(a.access_until!).getTime() - now.getTime()) / 86400000),
        }))

        const fallosPorAlumno: Record<string, number> = {}
        for (const w of subWrongs) {
          fallosPorAlumno[w.user_id] = (fallosPorAlumno[w.user_id] ?? 0) + w.fail_count
        }

        const alumnoSubIds = new Set(subAlumnos.map(a => a.id))
        const profesoresStats: ProfesorStats[] = subProfes.map(prof => ({
          id:               prof.id,
          username:         prof.username,
          alumnos:          subAlumnos.length,
          sesionesThisWeek: sesThisWeek.filter(s => alumnoSubIds.has(s.user_id)).length,
          notaMedia,
        }))

        const alumnosConNota: AlumnoConNota[] = subAlumnos.map(a => {
          const sesSub = ses30dByUser[a.id] ?? []
          const nota   = sesSub.length
            ? Math.round(sesSub.reduce((acc, s) => acc + s.score, 0) / sesSub.length)
            : null
          return {
            id:       a.id,
            username: a.username,
            nota,
            sesiones: sesSub.length,
            fallos:   fallosPorAlumno[a.id] ?? 0,
          }
        }).sort((a, b) => (b.nota ?? -1) - (a.nota ?? -1))

        return {
          id:                sub.id,
          name:              sub.name,
          slug:              sub.slug,
          color:             sub.color,
          totalAlumnos:      subAlumnos.length,
          alumnosActivos,
          enRiesgo:          alumnosEnRiesgo.length,
          porExpirar:        alumnosPorExpirar.length,
          notaMedia,
          sesiones30d:       ses30d.length,
          profesores:        profesoresStats,
          alumnosEnRiesgo,
          alumnosPorExpirar,
          alumnosConNota,
        }
      })

      // Stats globales
      const alumnos       = typedProfiles.filter(p => p.role === 'alumno')
      const profesores    = typedProfiles.filter(p => p.role === 'profesor')
      const ses7d         = typedSessions.filter(s => s.played_at >= sevenAgo)
      const ses30d        = typedSessions.filter(s => s.played_at >= thirtyAgo)
      const totalActivos  = new Set(ses7d.map(s => s.user_id)).size
      const totalEnRiesgo = subjectStats.reduce((a, s) => a + s.enRiesgo, 0)
      const totalPorExpirar = subjectStats.reduce((a, s) => a + s.porExpirar, 0)
      // Media global por alumno — consistente con panel profesor
      const alumnos30d = typedProfiles.filter(p => p.role === 'alumno')
      const notasPorAlumnoGlobal = alumnos30d
        .map(a => {
          const sesA = (sessionsByUser[a.id] ?? []).filter(s => s.played_at >= thirtyAgo)
          return sesA.length ? sesA.reduce((acc, s) => acc + s.score, 0) / sesA.length : null
        })
        .filter((n): n is number => n !== null)
      const notaGlobal = notasPorAlumnoGlobal.length
        ? Math.round(notasPorAlumnoGlobal.reduce((a, b) => a + b, 0) / notasPorAlumnoGlobal.length)
        : null

      setAllProfiles(typedProfiles)
      setStats({
        totalAlumnos:    alumnos.length,
        totalProfesores: profesores.length,
        totalActivos,
        totalEnRiesgo,
        totalPorExpirar,
        notaGlobal,
        sesiones30d:     ses30d.length,
        bySubject:       subjectStats,
        semanas,
        profesorActivity: { lastAvisoByProfesor, totalAvisosByProfesor },
        finanzas: {
          mrrAcademia,
          mrrActivos,
          alumnosSinPrecio,
          totalAlumnosConPrecio: alumnosConPrecio.length,
          spMap,
          pagos: {
            pagados:    alumnosPagados.length,
            pendientes: alumnosPendientes.length,
            vencidos:   alumnosVencidos.length,
            mrrCobrado,
            mrrPendiente,
            mrrVencido,
          },
        },
      })
      setLoading(false)
  }, [isDirector, academyId, currentUser?.subject_id])

  useEffect(() => { load() }, [load])

  // Re-cargar cuando otros paneles emitan cambios (Facturación, Acciones, etc.)
  useEffect(() => subscribe('director-data-changed', load), [load])

  return { stats, allProfiles, loading, error, reload: load }
}