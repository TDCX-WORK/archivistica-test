import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ── Candado en memoria contra race conditions en notificaciones ──────────────
// JS es de un solo hilo: añadir a un Set es instantáneo e ininterrumpible.
// Si dos ejecuciones de load() corren "a la vez" (StrictMode, doble render),
// la primera añade la clave al Set de forma síncrona; la segunda ya la ve.
// localStorage solo como respaldo entre sesiones (el Set se resetea al recargar).
const _notifEnviadas = new Set()

function yaEnviadaHoy(cacheKey) {
  if (_notifEnviadas.has(cacheKey)) return true
  if (localStorage.getItem(cacheKey)) return true
  return false
}

function marcarEnviada(cacheKey) {
  _notifEnviadas.add(cacheKey)
  try { localStorage.setItem(cacheKey, '1') } catch (_) {}
}

export function useProfesor(currentUser) {
  const [alumnos,     setAlumnos]     = useState([])
  const [inviteCodes, setInviteCodes] = useState([])
  const [allSessions, setAllSessions] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)

  const isProfesor = currentUser?.role === 'profesor'
  const academyId  = currentUser?.academy_id

  // Limpieza de keys de localStorage con mas de 7 dias de antiguedad
  useEffect(() => {
    if (!currentUser?.id) return
    const hace7dias = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
    const prefijos  = [`notif_inactivo_${currentUser.id}_`, `notif_expira_${currentUser.id}_`]
    Object.keys(localStorage).forEach(key => {
      const prefijo = prefijos.find(p => key.startsWith(p))
      if (!prefijo) return
      const fecha = key.replace(prefijo, '')
      if (fecha < hace7dias) localStorage.removeItem(key)
    })
  }, [currentUser?.id])

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

      const alumnoIds = profiles.map(p => p.id)

      // Límite de 90 días para sesiones — suficiente para stats y gráficos
      const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)

      const [{ data: sessions }, { data: reads }, { data: wrongs }, { data: studentProfiles }] = await Promise.all([
        supabase.from('sessions').select('user_id, score, played_at, created_at, mode_id')
          .eq('academy_id', academyId).in('user_id', alumnoIds)
          .gte('played_at', ninetyDaysAgo)
          .order('created_at', { ascending: false }),
        supabase.from('study_read').select('user_id, topic_id')
          .eq('academy_id', academyId).in('user_id', alumnoIds),
        supabase.from('wrong_answers').select('user_id, question_id, fail_count, next_review')
          .eq('academy_id', academyId).in('user_id', alumnoIds),
        supabase.from('student_profiles').select('id, full_name, exam_date')
          .in('id', alumnoIds),
      ])

      const today     = new Date().toISOString().slice(0, 10)
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      const now       = new Date()

      const spMap = {}
      for (const sp of studentProfiles || []) spMap[sp.id] = sp

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

        const ultimaSesion    = sesionesAlumno[0]?.created_at ?? null
        const diasInactivo    = ultimaSesion ? Math.floor((now - new Date(ultimaSesion)) / 86400000) : null
        const accessUntil     = alumno.access_until ? new Date(alumno.access_until) : null
        const accesoExpirado  = accessUntil ? accessUntil < now : false
        const diasParaExpirar = accessUntil ? Math.ceil((accessUntil - now) / 86400000) : null
        const proximoAExpirar = diasParaExpirar !== null && diasParaExpirar > 0 && diasParaExpirar <= 14

        return {
          id: alumno.id, username: alumno.username, fullName: spMap[alumno.id]?.full_name || null, examDate: spMap[alumno.id]?.exam_date || null, createdAt: alumno.created_at,
          sesiones: sesionesAlumno.length, notaMedia,
          temasLeidos: leidos.length, fallos: fallos.length, pendientesHoy: pendientesHoy.length,
          racha, ultimaSesion, diasInactivo,
          enRiesgo: !accesoExpirado && diasInactivo !== null && diasInactivo >= 3,
          accessUntil: alumno.access_until, accesoExpirado, diasParaExpirar, proximoAExpirar,
        }
      })

      setAllSessions(sessions || [])
      setAlumnos(alumnosConStats)
      setLoading(false)

      const hoy = today

      // ── Notificacion: alumnos en riesgo (inactivos) ───────────────────────
      try {
        const enRiesgo = alumnosConStats.filter(a => a.enRiesgo)
        if (enRiesgo.length > 0 && currentUser?.id) {
          const cacheKey = `notif_inactivo_${currentUser.id}_${hoy}`
          // Comprobación + marcado síncrono — evita la race condition
          if (!yaEnviadaHoy(cacheKey)) {
            marcarEnviada(cacheKey) // síncrono: la siguiente ejecución ya lo verá
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
        }
      } catch (_) {}

      // ── Notificacion: alumnos con acceso proximo a expirar ────────────────
      try {
        const porExpirar = alumnosConStats.filter(a => a.proximoAExpirar)
        if (porExpirar.length > 0 && currentUser?.id) {
          const cacheKey = `notif_expira_${currentUser.id}_${hoy}`
          // Comprobación + marcado síncrono — evita la race condition
          if (!yaEnviadaHoy(cacheKey)) {
            marcarEnviada(cacheKey) // síncrono: la siguiente ejecución ya lo verá
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
        }
      } catch (_) {}

    }
    load()
  }, [isProfesor, academyId, currentUser?.subject_id, currentUser?.id])

  const loadCodes = useCallback(async () => {
    if (!isProfesor) return
    const { data } = await supabase
      .from('invite_codes').select('*').eq('academy_id', academyId)
      .order('created_at', { ascending: false }).limit(20)
    setInviteCodes(data || [])

    // ── Notificacion: codigos sin usar que caducan en menos de 48h ─────────
    try {
      const ahora     = new Date()
      const en48h     = new Date(ahora.getTime() + 48 * 3600000)
      const porCaducar = (data || []).filter(c =>
        !c.used_by &&
        c.created_by === currentUser?.id &&
        new Date(c.expires_at) > ahora &&
        new Date(c.expires_at) <= en48h
      )

      if (porCaducar.length > 0 && currentUser?.id) {
        const hoy = ahora.toISOString().slice(0, 10)
        for (const codigo of porCaducar) {
          const cacheKey = `notif_codigo_${currentUser.id}_${codigo.code}_${hoy}`
          // También aplicamos el candado en memoria aquí
          if (!yaEnviadaHoy(cacheKey)) {
            // Verificación extra en BD para este caso (el código específico)
            const { data: yaEnviada } = await supabase
              .from('notifications').select('id')
              .eq('user_id', currentUser.id)
              .eq('type', 'codigo_caduca')
              .like('body', `%${codigo.code}%`)
              .gte('created_at', hoy + 'T00:00:00Z')
              .maybeSingle()

            if (!yaEnviada) {
              marcarEnviada(cacheKey)
              const horas = Math.ceil((new Date(codigo.expires_at) - ahora) / 3600000)
              await supabase.from('notifications').insert({
                user_id: currentUser.id,
                type:    'codigo_caduca',
                title:   `El codigo ${codigo.code} caduca en ${horas}h`,
                body:    `El codigo ${codigo.code} no ha sido usado y caduca pronto. Genera uno nuevo si lo necesitas.`,
                link:    '/profesor',
              })
            }
          }
        }
      }
    } catch (_) {}
  }, [isProfesor, academyId, currentUser?.id])

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

  return { alumnos, inviteCodes, statsClase, allSessions, loading, error, generarCodigo, renovarAcceso, revocarAcceso, recargar: loadCodes }
}
