import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { CurrentUser, AcademiaConStats, SuperadminStats, Subject, Academy } from '../types'

const EDGE_URL       = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/super-service`
const EDGE_GESTIONAR = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gestionar-academia`

interface EdgeResult {
  ok?:      boolean
  affected?: number
  warning?:  string | null
  error?:    string
  data?:     unknown
}

interface CrearUsuarioParams {
  username:      string
  password:      string
  role:          string
  academyId:     string
  subjectId?:    string | null
  academySlug:   string
  emailOverride?: string | null
}

interface CrearAsignaturaParams {
  academyId: string
  name:      string
  slug:      string
  color?:    string
}

export function useSuperadmin(currentUser: CurrentUser | null) {
  const [academias, setAcademias] = useState<AcademiaConStats[]>([])
  const [stats,     setStats]     = useState<SuperadminStats | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
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
        payment_status, payment_method,
        stripe_customer_id, stripe_subscription_id, stripe_price_id,
        trial_ends_at, billing_cycle, setup_fee_paid, logo_url
      `)
      .order('created_at', { ascending: false })

    if (acErr) { setError('Error cargando academias'); setLoading(false); return }

    const typedAcads = (acads ?? []) as Academy[]
    const acadIds    = typedAcads.map(a => a.id)

    const now          = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7  * 86400000).toISOString().slice(0, 10)
    const thirtyAgo    = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10)
    const sixtyAgo     = new Date(now.getTime() - 60 * 86400000).toISOString().slice(0, 10)

    const [
      { data: subjects },
      { data: profiles },
      { data: sessions },
    ] = await Promise.all([
      supabase.from('subjects').select('id, academy_id, name, slug, color, created_at, exam_config').in('academy_id', acadIds),
      supabase.from('profiles').select('id, username, role, academy_id, subject_id, created_at, access_until, force_password_change').in('academy_id', acadIds),
      supabase.from('sessions').select('id, user_id, academy_id, score, played_at').in('academy_id', acadIds).gte('played_at', sixtyAgo),
    ])

    const typedSubjects  = (subjects  ?? []) as Subject[]
    const typedProfiles  = (profiles  ?? []) as { id: string; username: string; role: string; academy_id: string; subject_id: string | null; created_at: string; access_until: string | null; force_password_change: boolean }[]
    const typedSessions  = (sessions  ?? []) as { id: string; user_id: string; academy_id: string; score: number; played_at: string }[]

    const acadStats: AcademiaConStats[] = typedAcads.map(ac => {
      const acSubjects = typedSubjects.filter(s => s.academy_id === ac.id)
      const acProfiles = typedProfiles.filter(p => p.academy_id === ac.id)
      const acSessions = typedSessions.filter(s => s.academy_id === ac.id)

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
        const dias = Math.ceil((new Date(a.access_until).getTime() - now.getTime()) / 86400000)
        return dias > 0 && dias <= 14
      }).length

      const ultimaActividad = acSessions.length
        ? [...acSessions].sort((a, b) => b.played_at.localeCompare(a.played_at))[0]?.played_at ?? null
        : null

      // Health score 1-10
      const pctActivos  = alumnos.length > 0 ? alumnosActivos / alumnos.length : 0
      const ptsActivos  = pctActivos * 4
      const ptsNota     = ((notaMedia ?? 0) / 100) * 3
      const sesXAlumno  = alumnos.length > 0 ? sesThisWeek.length / alumnos.length : 0
      const ptsSesiones = Math.min(1, sesXAlumno) * 2
      const rawScore    = ptsActivos + ptsNota + ptsSesiones
      const healthScore = alumnos.length === 0
        ? null
        : Math.max(1, Math.min(10, Math.round((rawScore / 9) * 10)))

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
        healthScore,
      }
    })

    const totalAcademias = typedAcads.filter(a => !a.deleted_at).length
    const acadActivas    = typedAcads.filter(a => !a.suspended && !a.deleted_at).length
    // Excluir alumnos de academias eliminadas (en papelera)
    const acadIdsActivas  = typedAcads.filter(a => !a.deleted_at).map(a => a.id)
    const totalAlumnos   = typedProfiles.filter(p => p.role === 'alumno' && acadIdsActivas.includes(p.academy_id)).length
    const totalProfes    = typedProfiles.filter(p => p.role === 'profesor' && acadIdsActivas.includes(p.academy_id)).length
    const alumnosActivos = new Set(typedSessions.filter(s => s.played_at >= sevenDaysAgo).map(s => s.user_id)).size
    const sesiones30d    = typedSessions.filter(s => s.played_at >= thirtyAgo).length
    const mrr            = typedAcads
      .filter(a => !a.suspended && a.payment_status === 'active')
      .reduce((sum, a) => sum + (Number(a.price_monthly) || 0), 0)
    const pendientePago  = typedAcads.filter(a => a.payment_status === 'pending').length
    const morosos        = typedAcads.filter(a => a.payment_status === 'overdue').length

    setAcademias(acadStats)
    setStats({
      totalAcademias, acadActivas, totalAlumnos, totalProfes,
      alumnosActivos, sesiones30d, mrr, pendientePago, morosos,
    })
    setLoading(false)
  }, [isSuperadmin])

  useEffect(() => { load() }, [load])

  const crearAcademia = useCallback(async (data: Partial<Academy> & { name: string; slug: string }): Promise<{ error?: string; data?: unknown }> => {
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
        price_monthly:   Number(data.price_monthly) || 0,
        payment_method:  data.payment_method || 'transferencia',
        contract_start:  data.contract_start || null,
        contract_renews: data.contract_renews || null,
        notes:           data.notes?.trim() || null,
        trial_ends_at:   data.trial_ends_at || null,
      })
      .select().maybeSingle()
    setSaving(false)
    if (error) return { error: error.message }
    await load()
    return { data: result }
  }, [load])

  const actualizarAcademia = useCallback(async (id: string, data: Partial<Academy>): Promise<{ error?: string; ok?: boolean }> => {
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
        price_monthly:   Number(data.price_monthly) || 0,
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

  const llamarGestionar = useCallback(async (action: string, academy_id: string): Promise<EdgeResult> => {
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string
    const res = await fetch(EDGE_GESTIONAR, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
        'apikey':        supabaseKey,
      },
      body: JSON.stringify({ action, academy_id }),
    })
    const result = await res.json() as EdgeResult
    setSaving(false)
    if (!res.ok) return { error: result.error }
    await load()
    return {
      ok:       true,
      affected: result.affected,
      warning:  result.warning ?? null,
    }
  }, [load])

  const toggleSuspender = useCallback(async (id: string, suspended: boolean): Promise<EdgeResult> => {
    return llamarGestionar(suspended ? 'suspender' : 'reactivar', id)
  }, [llamarGestionar])

  const eliminarAcademia = useCallback(async (id: string): Promise<EdgeResult> => {
    return llamarGestionar('eliminar', id)
  }, [llamarGestionar])

  const restaurarAcademia = useCallback(async (id: string): Promise<EdgeResult> => {
    return llamarGestionar('restaurar', id)
  }, [llamarGestionar])

  const crearAsignatura = useCallback(async ({
    academyId, name, slug, color = '#0F766E',
  }: CrearAsignaturaParams): Promise<{ error?: string; data?: unknown }> => {
    setSaving(true)
    const { data, error } = await supabase.from('subjects')
      .insert({ academy_id: academyId, name: name.trim(), slug: slug.trim().toLowerCase(), color })
      .select().maybeSingle()
    setSaving(false)
    if (error) return { error: error.message }
    await load()
    return { data }
  }, [load])

  const crearUsuario = useCallback(async ({
    username, password, role, academyId, subjectId, academySlug, emailOverride,
  }: CrearUsuarioParams): Promise<{ error?: string; data?: unknown }> => {
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string
    const res = await fetch(EDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
        'apikey':        supabaseKey,
      },
      body: JSON.stringify({
        username:       username.trim().toLowerCase(),
        password,
        role,
        academy_id:     academyId,
        subject_id:     subjectId ?? null,
        academy_slug:   academySlug,
        email_override: emailOverride ?? null,
      }),
    })
    const result = await res.json() as EdgeResult
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