import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { calcularRacha } from '../lib/helpers'
import { generateInviteCode } from '../lib/inviteCodes'
import type { CurrentUser, AlumnoConStats, StatsClase, InviteCode, Session } from '../types'

export function useProfesor(currentUser: CurrentUser | null) {
  const [alumnos,     setAlumnos]     = useState<AlumnoConStats[]>([])
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([])
  const [allSessions, setAllSessions] = useState<{ user_id: string; score: number; played_at: string; created_at: string; mode_id: string }[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)

  const isProfesor = currentUser?.role === 'profesor'
  const academyId  = currentUser?.academy_id

  useEffect(() => {
    if (!isProfesor || !academyId) return

    const load = async () => {
      setLoading(true)
      setError(null)

      const subjectId = currentUser?.subject_id
      let alumnosQuery = supabase
        .from('profiles')
        .select('id, username, role, created_at, access_until, subject_id')
        .eq('academy_id', academyId)
        .eq('role', 'alumno')
        .order('username')

      if (subjectId) alumnosQuery = alumnosQuery.eq('subject_id', subjectId)

      const { data: profiles, error: profErr } = await alumnosQuery

      if (profErr) { setError('Error cargando alumnos'); setLoading(false); return }
      if (!profiles?.length) { setAlumnos([]); setLoading(false); return }

      const typedProfiles = profiles as {
        id: string; username: string; role: string
        created_at: string; access_until: string | null; subject_id: string | null
      }[]

      const alumnoIds     = typedProfiles.map(p => p.id)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

      const [
        { data: sessions },
        { data: reads },
        { data: wrongs },
        { data: studentProfiles },
      ] = await Promise.all([
        supabase.from('sessions')
          .select('user_id, score, played_at, created_at, mode_id')
          .eq('academy_id', academyId).in('user_id', alumnoIds)
          .gte('played_at', thirtyDaysAgo)
          .order('created_at', { ascending: false }),
        supabase.from('study_read')
          .select('user_id, topic_id')
          .eq('academy_id', academyId).in('user_id', alumnoIds),
        supabase.from('wrong_answers')
          .select('user_id, question_id, fail_count, next_review')
          .eq('academy_id', academyId).in('user_id', alumnoIds),
        supabase.from('student_profiles')
          .select('id, full_name, exam_date')
          .in('id', alumnoIds),
      ])

      const today     = new Date().toISOString().slice(0, 10)
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      const now       = new Date()

      const typedSessions        = (sessions        ?? []) as { user_id: string; score: number; played_at: string; created_at: string; mode_id: string }[]
      const typedReads           = (reads           ?? []) as { user_id: string; topic_id: string }[]
      const typedWrongs          = (wrongs          ?? []) as { user_id: string; question_id: string; fail_count: number; next_review: string }[]
      const typedStudentProfiles = (studentProfiles ?? []) as { id: string; full_name: string | null; exam_date: string | null }[]

      const spMap: Record<string, { full_name: string | null; exam_date: string | null }> = {}
      for (const sp of typedStudentProfiles) spMap[sp.id] = sp

      // Pre-agrupar por user_id para evitar O(n×m)
      const sessionsByUser: Record<string, typeof typedSessions> = {}
      for (const s of typedSessions) {
        if (!sessionsByUser[s.user_id]) sessionsByUser[s.user_id] = []
        sessionsByUser[s.user_id]!.push(s)
      }
      const readsByUser: Record<string, typeof typedReads> = {}
      for (const r of typedReads) {
        if (!readsByUser[r.user_id]) readsByUser[r.user_id] = []
        readsByUser[r.user_id]!.push(r)
      }
      const wrongsByUser: Record<string, typeof typedWrongs> = {}
      for (const w of typedWrongs) {
        if (!wrongsByUser[w.user_id]) wrongsByUser[w.user_id] = []
        wrongsByUser[w.user_id]!.push(w)
      }

      const alumnosConStats: AlumnoConStats[] = typedProfiles.map(alumno => {
        const sesionesAlumno = sessionsByUser[alumno.id] ?? []
        const leidos         = readsByUser[alumno.id] ?? []
        const fallos         = wrongsByUser[alumno.id] ?? []
        const pendientesHoy  = fallos.filter(w => w.next_review <= today)

        const notaMedia = sesionesAlumno.length
          ? Math.round(sesionesAlumno.reduce((s, x) => s + x.score, 0) / sesionesAlumno.length)
          : null

        const racha = calcularRacha(sesionesAlumno.map(s => s.played_at))

        const ultimaSesion    = sesionesAlumno[0]?.created_at ?? null
        const diasInactivo    = ultimaSesion ? Math.floor((now.getTime() - new Date(ultimaSesion).getTime()) / 86400000) : null
        const diasDesdeRegistro = Math.floor((now.getTime() - new Date(alumno.created_at).getTime()) / 86400000)
        const accessUntil     = alumno.access_until ? new Date(alumno.access_until) : null
        const accesoExpirado  = accessUntil ? accessUntil < now : false
        const diasParaExpirar = accessUntil ? Math.ceil((accessUntil.getTime() - now.getTime()) / 86400000) : null
        const proximoAExpirar = diasParaExpirar !== null && diasParaExpirar > 0 && diasParaExpirar <= 14

        return {
          id:              alumno.id,
          username:        alumno.username,
          fullName:        spMap[alumno.id]?.full_name ?? null,
          examDate:        spMap[alumno.id]?.exam_date ?? null,
          createdAt:       alumno.created_at,
          sesiones:        sesionesAlumno.length,
          notaMedia,
          temasLeidos:     leidos.length,
          fallos:          fallos.length,
          pendientesHoy:   pendientesHoy.length,
          racha,
          ultimaSesion,
          diasInactivo,
          enRiesgo:        !accesoExpirado && (diasInactivo !== null ? diasInactivo >= 3 : diasDesdeRegistro >= 3),
          accessUntil:     alumno.access_until,
          accesoExpirado,
          diasParaExpirar,
          proximoAExpirar,
        }
      })

      setAllSessions(typedSessions)
      setAlumnos(alumnosConStats)
      setLoading(false)

      // Notificaciones — el índice único en BD evita duplicados automáticamente
      try {
        const enRiesgo = alumnosConStats.filter(a => a.enRiesgo)
        if (enRiesgo.length > 0 && currentUser?.id) {
          const nombres = enRiesgo.slice(0, 3).map(a => a.username).join(', ')
          const resto   = enRiesgo.length > 3 ? ` y ${enRiesgo.length - 3} mas` : ''
          await supabase.from('notifications').insert({
            user_id: currentUser.id,
            type:    'alumno_inactivo',
            title:   `${enRiesgo.length} alumno${enRiesgo.length !== 1 ? 's' : ''} sin actividad`,
            body:    `${nombres}${resto} llevan mas de 3 dias sin estudiar.`,
            link:    '/profesor',
          })
        }
      } catch (_) {}

      try {
        const porExpirar = alumnosConStats.filter(a => a.proximoAExpirar)
        if (porExpirar.length > 0 && currentUser?.id) {
          const nombres = porExpirar.slice(0, 3).map(a =>
            `${a.username} (${a.diasParaExpirar}d)`
          ).join(', ')
          const resto = porExpirar.length > 3 ? ` y ${porExpirar.length - 3} mas` : ''
          await supabase.from('notifications').insert({
            user_id: currentUser.id,
            type:    'alumno_expira',
            title:   `${porExpirar.length} alumno${porExpirar.length !== 1 ? 's' : ''} con acceso por expirar`,
            body:    `${nombres}${resto}. Renueva su acceso antes de que expire.`,
            link:    '/profesor',
          })
        }
      } catch (_) {}
    }

    load()
  }, [isProfesor, academyId, currentUser?.subject_id, currentUser?.id])

  const loadCodes = useCallback(async () => {
    if (!isProfesor || !academyId) return
    const { data } = await supabase
      .from('invite_codes').select('*').eq('academy_id', academyId)
      .order('created_at', { ascending: false }).limit(20)
    const codes = (data ?? []) as InviteCode[]
    setInviteCodes(codes)

    try {
      const ahora      = new Date()
      const en48h      = new Date(ahora.getTime() + 48 * 3600000)
      const porCaducar = codes.filter(c =>
        !c.used_by &&
        c.created_by === currentUser?.id &&
        new Date(c.expires_at) > ahora &&
        new Date(c.expires_at) <= en48h
      )

      if (porCaducar.length > 0 && currentUser?.id) {
        for (const codigo of porCaducar) {
          const horas = Math.ceil((new Date(codigo.expires_at).getTime() - ahora.getTime()) / 3600000)
          // El índice único en BD evita duplicados automáticamente
          await supabase.from('notifications').insert({
            user_id: currentUser.id,
            type:    'codigo_caduca',
            title:   `El codigo ${codigo.code} caduca en ${horas}h`,
            body:    `El codigo ${codigo.code} no ha sido usado y caduca pronto.`,
            link:    '/profesor',
          })
        }
      }
    } catch (_) {}
  }, [isProfesor, academyId, currentUser?.id])

  useEffect(() => { loadCodes() }, [loadCodes])

  const generarCodigo = useCallback(async (
    opcionDias:   number = 30,
    accessMonths: number = 3
  ): Promise<string | null> => {
    if (!isProfesor || !academyId || !currentUser) return null
    const code = generateInviteCode(currentUser.academyName)
    const { data, error: err } = await supabase.from('invite_codes').insert({
      code,
      academy_id:    academyId,
      subject_id:    currentUser.subject_id ?? null,
      created_by:    currentUser.id,
      expires_at:    new Date(Date.now() + opcionDias * 24 * 60 * 60 * 1000).toISOString(),
      access_months: accessMonths,
    }).select().maybeSingle()
    if (err) return null
    setInviteCodes(prev => [data as InviteCode, ...prev])
    return code
  }, [isProfesor, academyId, currentUser])

  const renovarAcceso = useCallback(async (alumnoId: string, meses: number): Promise<boolean> => {
    if (!isProfesor) return false
    const alumno = alumnos.find(a => a.id === alumnoId)
    const base   = alumno?.accessUntil && !alumno.accesoExpirado ? new Date(alumno.accessUntil) : new Date()
    const nuevaFecha = new Date(base)
    nuevaFecha.setMonth(nuevaFecha.getMonth() + meses)

    const { error } = await supabase.from('profiles')
      .update({ access_until: nuevaFecha.toISOString() }).eq('id', alumnoId)
    if (error) return false

    setAlumnos(prev => prev.map(a => {
      if (a.id !== alumnoId) return a
      const diasParaExpirar = Math.ceil((nuevaFecha.getTime() - new Date().getTime()) / 86400000)
      return { ...a, accessUntil: nuevaFecha.toISOString(), accesoExpirado: false, diasParaExpirar, proximoAExpirar: diasParaExpirar <= 14 }
    }))
    return true
  }, [isProfesor, alumnos])

  const revocarAcceso = useCallback(async (alumnoId: string): Promise<boolean> => {
    if (!isProfesor) return false
    const ayer = new Date(Date.now() - 86400000).toISOString()

    const { error } = await supabase.from('profiles')
      .update({ access_until: ayer }).eq('id', alumnoId)
    if (error) return false

    setAlumnos(prev => prev.map(a =>
      a.id !== alumnoId ? a : { ...a, accessUntil: ayer, accesoExpirado: true, diasParaExpirar: -1, proximoAExpirar: false }
    ))
    return true
  }, [isProfesor])

  const statsClase: StatsClase | null = alumnos.length ? {
    totalAlumnos:     alumnos.length,
    alumnosActivos:   alumnos.filter(a => !a.accesoExpirado && a.diasInactivo !== null && a.diasInactivo < 7).length,
    enRiesgo:         alumnos.filter(a => a.enRiesgo).length,
    proximosAExpirar: alumnos.filter(a => a.proximoAExpirar).length,
    accesoExpirado:   alumnos.filter(a => a.accesoExpirado).length,
    notaMediaClase:   Math.round(
      alumnos.filter(a => a.notaMedia !== null).reduce((s, a) => s + (a.notaMedia ?? 0), 0) /
      (alumnos.filter(a => a.notaMedia !== null).length || 1)
    ),
    mediaTemasLeidos: Math.round(alumnos.reduce((s, a) => s + a.temasLeidos, 0) / alumnos.length),
    sesiones30d:      allSessions.filter(s => s.played_at >= new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)).length,
  } : null

  return { alumnos, inviteCodes, statsClase, allSessions, loading, error, generarCodigo, renovarAcceso, revocarAcceso, recargar: loadCodes }
}