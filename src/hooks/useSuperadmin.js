import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const EDGE_URL        = 'https://zazqejluzyqihqhzbrga.supabase.co/functions/v1/super-service'
const EDGE_GESTIONAR  = 'https://zazqejluzyqihqhzbrga.supabase.co/functions/v1/gestionar-academia'

export function useSuperadmin(currentUser) {
  const [academias, setAcademias] = useState([])
  const [stats,     setStats]     = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [saving,    setSaving]    = useState(false)

  const isSuperadmin = currentUser?.role === 'superadmin'

  const load = useCallback(async () => {
    if (!isSuperadmin) { setLoading(false); return }
    setLoading(true)
    setError(null)

    const { data: acads, error: acErr } = await supabase
      .from('academies')
      .select(`
        id, name, slug, plan, created_at, suspended, deleted_at,
        contact_email, contact_phone, city, province,
        billing_name, billing_nif, billing_address,
        notes, price_monthly, contract_start, contract_renews,
        payment_status, payment_method
      `)
      .order('created_at', { ascending: false })

    if (acErr) { setError('Error cargando academias'); setLoading(false); return }

    const acadIds = (acads || []).map(a => a.id)

    const [
      { data: subjects },
      { data: profiles },
      { data: sessions },
    ] = await Promise.all([
      supabase.from('subjects').select('id, academy_id, name, slug, color').in('academy_id', acadIds),
      supabase.from('profiles').select('id, username, role, academy_id, subject_id, created_at, access_until').in('academy_id', acadIds),
      supabase.from('sessions').select('id, user_id, academy_id, score, played_at').in('academy_id', acadIds),
    ])

    const now          = new Date()
    const sevenDaysAgo = new Date(now - 7  * 86400000).toISOString().slice(0, 10)
    const thirtyAgo    = new Date(now - 30 * 86400000).toISOString().slice(0, 10)

    const acadStats = (acads || []).map(ac => {
      const acSubjects = (subjects  || []).filter(s => s.academy_id === ac.id)
      const acProfiles = (profiles  || []).filter(p => p.academy_id === ac.id)
      const acSessions = (sessions  || []).filter(s => s.academy_id === ac.id)

      const alumnos    = acProfiles.filter(p => p.role === 'alumno')
      const profesores = acProfiles.filter(p => p.role === 'profesor')
      const directores = acProfiles.filter(p => p.role === 'director')

      const sesThisWeek    = acSessions.filter(s => s.played_at >= sevenDaysAgo)
      const ses30d         = acSessions.filter(s => s.played_at >= thirtyAgo)
      const alumnosActivos = new Set(sesThisWeek.map(s => s.user_id)).size

      const notaMedia = ses30d.length
        ? Math.round(ses30d.reduce((s, x) => s + x.score, 0) / ses30d.length)
        : null

      const porExpirar = alumnos.filter(a => {
        if (!a.access_until) return false
        const dias = Math.ceil((new Date(a.access_until) - now) / 86400000)
        return dias > 0 && dias <= 14
      }).length

      // Última actividad
      const ultimaActividad = acSessions.length
        ? acSessions.sort((a, b) => b.played_at?.localeCompare(a.played_at))[0]?.played_at
        : null

      return {
        ...ac,
        subjects:       acSubjects,
        totalAlumnos:   alumnos.length,
        totalProfes:    profesores.length,
        totalDirectors: directores.length,
        alumnosActivos,
        notaMedia,
        sesiones30d:    ses30d.length,
        porExpirar,
        ultimaActividad,
      }
    })

    // Stats globales + MRR
    const totalAcademias  = acads?.length || 0
    const acadActivas     = (acads || []).filter(a => !a.suspended).length
    const totalAlumnos    = (profiles || []).filter(p => p.role === 'alumno').length
    const totalProfes     = (profiles || []).filter(p => p.role === 'profesor').length
    const alumnosActivos  = new Set((sessions || []).filter(s => s.played_at >= sevenDaysAgo).map(s => s.user_id)).size
    const sesiones30d     = (sessions || []).filter(s => s.played_at >= thirtyAgo).length
    const mrr             = (acads || [])
      .filter(a => !a.suspended && a.payment_status === 'active')
      .reduce((sum, a) => sum + (parseFloat(a.price_monthly) || 0), 0)
    const pendientePago   = (acads || []).filter(a => a.payment_status === 'pending').length
    const morosos         = (acads || []).filter(a => a.payment_status === 'overdue').length

    setAcademias(acadStats)
    setStats({
      totalAcademias, acadActivas, totalAlumnos, totalProfes,
      alumnosActivos, sesiones30d, mrr, pendientePago, morosos,
    })
    setLoading(false)
  }, [isSuperadmin])

  useEffect(() => { load() }, [load])

  // ── Crear academia ───────────────────────────────────────────────────────
  const crearAcademia = useCallback(async (data) => {
    setSaving(true)
    const { data: result, error } = await supabase
      .from('academies')
      .insert({
        name:            data.name?.trim(),
        slug:            data.slug?.trim().toLowerCase(),
        plan:            data.plan || 'base',
        contact_email:   data.contact_email?.trim() || null,
        contact_phone:   data.contact_phone?.trim() || null,
        city:            data.city?.trim() || null,
        province:        data.province?.trim() || null,
        billing_name:    data.billing_name?.trim() || null,
        billing_nif:     data.billing_nif?.trim() || null,
        billing_address: data.billing_address?.trim() || null,
        price_monthly:   parseFloat(data.price_monthly) || 0,
        payment_method:  data.payment_method || 'transferencia',
        contract_start:  data.contract_start || null,
        contract_renews: data.contract_renews || null,
        notes:           data.notes?.trim() || null,
      })
      .select().maybeSingle()
    setSaving(false)
    if (error) return { error: error.message }
    await load()
    return { data: result }
  }, [load])

  // ── Actualizar academia ──────────────────────────────────────────────────
  const actualizarAcademia = useCallback(async (id, data) => {
    setSaving(true)
    const { error } = await supabase
      .from('academies')
      .update({
        name:            data.name?.trim(),
        plan:            data.plan,
        contact_email:   data.contact_email?.trim() || null,
        contact_phone:   data.contact_phone?.trim() || null,
        city:            data.city?.trim() || null,
        province:        data.province?.trim() || null,
        billing_name:    data.billing_name?.trim() || null,
        billing_nif:     data.billing_nif?.trim() || null,
        billing_address: data.billing_address?.trim() || null,
        price_monthly:   parseFloat(data.price_monthly) || 0,
        payment_method:  data.payment_method || 'transferencia',
        payment_status:  data.payment_status || 'active',
        contract_start:  data.contract_start || null,
        contract_renews: data.contract_renews || null,
        notes:           data.notes?.trim() || null,
      })
      .eq('id', id)
    setSaving(false)
    if (error) return { error: error.message }
    await load()
    return { ok: true }
  }, [load])

  // ── Llamar Edge Function gestionar-academia ─────────────────────────────
  const llamarGestionar = useCallback(async (action, academy_id) => {
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    const res = await fetch(EDGE_GESTIONAR, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': supabaseKey,
      },
      body: JSON.stringify({ action, academy_id }),
    })
    const result = await res.json()
    setSaving(false)
    if (!res.ok) return { error: result.error }
    await load()
    return { ok: true, affected: result.affected }
  }, [load])

  // ── Suspender / reactivar ─────────────────────────────────────────────────
  const toggleSuspender = useCallback(async (id, suspended) => {
    return llamarGestionar(suspended ? 'suspender' : 'reactivar', id)
  }, [llamarGestionar])

  // ── Eliminar (soft delete → papelera) ────────────────────────────────────
  const eliminarAcademia = useCallback(async (id) => {
    return llamarGestionar('eliminar', id)
  }, [llamarGestionar])

  // ── Restaurar desde papelera ──────────────────────────────────────────────
  const restaurarAcademia = useCallback(async (id) => {
    return llamarGestionar('restaurar', id)
  }, [llamarGestionar])

  // ── Crear asignatura ─────────────────────────────────────────────────────
  const crearAsignatura = useCallback(async ({ academyId, name, slug, color = '#0F766E' }) => {
    setSaving(true)
    const { data, error } = await supabase.from('subjects')
      .insert({ academy_id: academyId, name: name.trim(), slug: slug.trim().toLowerCase(), color })
      .select().maybeSingle()
    setSaving(false)
    if (error) return { error: error.message }
    await load()
    return { data }
  }, [load])

  // ── Crear usuario via Edge Function ─────────────────────────────────────
  const crearUsuario = useCallback(async ({ username, password, role, academyId, subjectId, academySlug, emailOverride }) => {
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    const res = await fetch(EDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': supabaseKey,
      },
      body: JSON.stringify({
        username:       username.trim().toLowerCase(),
        password,
        role,
        academy_id:     academyId,
        subject_id:     subjectId || null,
        academy_slug:   academySlug,
        email_override: emailOverride || null,
      }),
    })
    const result = await res.json()
    setSaving(false)
    if (!res.ok) return { error: result.error || 'Error creando usuario' }
    await load()
    return { data: result }
  }, [load])

  return {
    academias, stats, loading, error, saving,
    crearAcademia, actualizarAcademia,
    toggleSuspender, eliminarAcademia, restaurarAcademia,
    crearAsignatura, crearUsuario,
    recargar: load,
  }
}
