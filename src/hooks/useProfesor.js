import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useProfesor(currentUser) {
  const [alumnos,     setAlumnos]     = useState([])
  const [inviteCodes, setInviteCodes] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)

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

      // Filtrar por asignatura del profesor — solo ve sus alumnos
      if (subjectId) alumnosQuery = alumnosQuery.eq('subject_id', subjectId)

      const { data: profiles, error: profErr } = await alumnosQuery

      if (profErr) { setError('Error cargando alumnos'); setLoading(false); return }
      if (!profiles?.length) { setAlumnos([]); setLoading(false); return }

      const alumnoIds = profiles.map(p => p.id)

      const [{ data: sessions }, { data: reads }, { data: wrongs }] = await Promise.all([
        supabase.from('sessions').select('user_id, score, played_at, created_at')
          .eq('academy_id', academyId).in('user_id', alumnoIds).order('created_at', { ascending: false }),
        supabase.from('study_read').select('user_id, topic_id')
          .eq('academy_id', academyId).in('user_id', alumnoIds),
        supabase.from('wrong_answers').select('user_id, question_id, fail_count, next_review')
          .eq('academy_id', academyId).in('user_id', alumnoIds),
      ])

      const today     = new Date().toISOString().slice(0, 10)
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      const now       = new Date()

      const alumnosConStats = profiles.map(alumno => {
        const sesionesAlumno = (sessions || []).filter(s => s.user_id === alumno.id)
        const leidos         = (reads    || []).filter(r => r.user_id === alumno.id)
        const fallos         = (wrongs   || []).filter(w => w.user_id === alumno.id)
        const pendientesHoy  = fallos.filter(w => w.next_review <= today)

        const notaMedia = sesionesAlumno.length
          ? Math.round(sesionesAlumno.reduce((s, x) => s + x.score, 0) / sesionesAlumno.length)
          : null

        const dias = [...new Set(sesionesAlumno.map(s => s.played_at))].sort().reverse()
        let racha = 0
        if (dias[0] === today || dias[0] === yesterday) {
          racha = 1
          for (let i = 1; i < dias.length; i++) {
            const prev = new Date(dias[i - 1]), curr = new Date(dias[i])
            if ((prev - curr) / 86400000 === 1) racha++
            else break
          }
        }

        const ultimaSesion   = sesionesAlumno[0]?.created_at ?? null
        const diasInactivo   = ultimaSesion ? Math.floor((now - new Date(ultimaSesion)) / 86400000) : null
        const accessUntil    = alumno.access_until ? new Date(alumno.access_until) : null
        const accesoExpirado = accessUntil ? accessUntil < now : false
        const diasParaExpirar = accessUntil ? Math.ceil((accessUntil - now) / 86400000) : null
        const proximoAExpirar = diasParaExpirar !== null && diasParaExpirar > 0 && diasParaExpirar <= 14

        return {
          id: alumno.id, username: alumno.username, createdAt: alumno.created_at,
          sesiones: sesionesAlumno.length, notaMedia,
          temasLeidos: leidos.length, fallos: fallos.length, pendientesHoy: pendientesHoy.length,
          racha, ultimaSesion, diasInactivo,
          enRiesgo: !accesoExpirado && diasInactivo !== null && diasInactivo >= 3,
          accessUntil: alumno.access_until, accesoExpirado, diasParaExpirar, proximoAExpirar,
        }
      })

      setAlumnos(alumnosConStats)
      setLoading(false)
    }
    load()
  }, [isProfesor, academyId, currentUser?.subject_id])

  const loadCodes = useCallback(async () => {
    if (!isProfesor) return
    const { data } = await supabase
      .from('invite_codes').select('*').eq('academy_id', academyId)
      .order('created_at', { ascending: false }).limit(20)
    setInviteCodes(data || [])
  }, [isProfesor, academyId])

  useEffect(() => { loadCodes() }, [loadCodes])

  const generarCodigo = useCallback(async (opcionDias = 30, accessMonths = 3) => {
    if (!isProfesor) return null
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase()
    const prefix = (currentUser?.academyName || 'ACAD').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 4).padEnd(4, 'X')
    const code   = `${prefix}-${suffix}`
    const { data, error: err } = await supabase.from('invite_codes').insert({
      code,
      academy_id:    academyId,
      subject_id:    currentUser.subject_id ?? null,
      created_by:    currentUser.id,
      expires_at:    new Date(Date.now() + opcionDias * 24 * 60 * 60 * 1000).toISOString(),
      access_months: accessMonths,
    }).select().maybeSingle()
    if (err) return null
    setInviteCodes(prev => [data, ...prev])
    return code
  }, [isProfesor, academyId, currentUser?.id])

  const renovarAcceso = useCallback(async (alumnoId, meses) => {
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
      const diasParaExpirar = Math.ceil((nuevaFecha - new Date()) / 86400000)
      return { ...a, accessUntil: nuevaFecha.toISOString(), accesoExpirado: false, diasParaExpirar, proximoAExpirar: diasParaExpirar <= 14 }
    }))
    return true
  }, [isProfesor, alumnos])

  // ── Revocar acceso inmediatamente ──────────────────────────────────────
  const revocarAcceso = useCallback(async (alumnoId) => {
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

  const statsClase = alumnos.length ? {
    totalAlumnos:     alumnos.length,
    alumnosActivos:   alumnos.filter(a => !a.accesoExpirado && a.diasInactivo !== null && a.diasInactivo < 7).length,
    enRiesgo:         alumnos.filter(a => a.enRiesgo).length,
    proximosAExpirar: alumnos.filter(a => a.proximoAExpirar).length,
    accesoExpirado:   alumnos.filter(a => a.accesoExpirado).length,
    notaMediaClase:   Math.round(
      alumnos.filter(a => a.notaMedia !== null).reduce((s, a) => s + a.notaMedia, 0) /
      (alumnos.filter(a => a.notaMedia !== null).length || 1)
    ),
    mediaTemasLeidos: Math.round(alumnos.reduce((s, a) => s + a.temasLeidos, 0) / alumnos.length),
  } : null

  return { alumnos, inviteCodes, statsClase, loading, error, generarCodigo, renovarAcceso, revocarAcceso, recargar: loadCodes }
}
