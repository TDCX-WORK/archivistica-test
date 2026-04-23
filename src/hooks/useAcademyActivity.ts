import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { subscribe } from '../lib/eventBus'

// ═════════════════════════════════════════════════════════════════════════════
// useAcademyActivity — Feed de actividad reciente derivado.
//
// Como no hay tabla activity_log unificada, derivamos el feed a partir de los
// timestamps que ya existen en BD:
//
//   · invite_codes.used_at       → "Código X usado por @alumno"
//   · invite_codes.created_at    → "Código X creado"   (solo si no usado)
//   · academy_payments.paid_at   → "Pago registrado · @alumno · mes"
//   · profiles.created_at        → "Alta de @alumno"   (solo alumnos)
//   · student_profiles.updated_at→ "Datos actualizados · @alumno"
//
// Se ordena por fecha descendente y se limita a los N últimos eventos.
// ═════════════════════════════════════════════════════════════════════════════

export type ActivityKind =
  | 'codigo_usado'
  | 'codigo_creado'
  | 'pago_registrado'
  | 'alumno_alta'
  | 'perfil_actualizado'

export interface ActivityItem {
  id:         string          // único por evento (kind + sourceId)
  kind:       ActivityKind
  timestamp:  string           // ISO
  title:      string           // línea principal ej: "Código ACME-X842 usado"
  subject?:   string           // ej: "Laura García"
  detail?:    string           // ej: "+12 meses" o "89€"
  entityId?:  string           // id del alumno/código relacionado
}

interface Options { limit?: number }

export function useAcademyActivity(academyId: string | null | undefined, opts: Options = {}) {
  const limit = opts.limit ?? 25
  const [items,   setItems]   = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!academyId) { setLoading(false); return }
    setLoading(true)

    // Ventana: últimos 60 días (más allá suele ser ruido)
    const since = new Date(Date.now() - 60 * 86400000).toISOString()

    const [
      { data: codes },
      { data: pays },
      { data: profs },
    ] = await Promise.all([
      supabase.from('invite_codes')
        .select('id, code, created_at, used_at, used_by, created_by, access_months')
        .eq('academy_id', academyId)
        .or(`created_at.gte.${since},used_at.gte.${since}`)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('academy_payments')
        .select('id, alumno_id, amount, paid_at, month, status')
        .eq('academy_id', academyId)
        .not('paid_at', 'is', null)
        .gte('paid_at', since)
        .order('paid_at', { ascending: false })
        .limit(30),
      supabase.from('profiles')
        .select('id, username, role, created_at')
        .eq('academy_id', academyId)
        .eq('role', 'alumno')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(30),
    ])

    // student_profiles: solo los alumnos de esta academia
    const alumnoIds = (profs ?? []).map((p: any) => p.id)
    let sps: { id: string; full_name: string | null; updated_at: string | null; created_at: string }[] = []
    if (alumnoIds.length > 0) {
      const { data } = await supabase.from('student_profiles')
        .select('id, full_name, updated_at, created_at')
        .in('id', alumnoIds)
        .gte('updated_at', since)
        .order('updated_at', { ascending: false })
        .limit(40)
      sps = (data ?? []) as typeof sps
    }

    // Username map para resolver nombres
    const allIds = new Set<string>()
    for (const c of (codes ?? [])) { if (c.used_by) allIds.add(c.used_by); if (c.created_by) allIds.add(c.created_by) }
    for (const p of (pays ?? []))  { if (p.alumno_id) allIds.add(p.alumno_id) }
    for (const sp of sps)  { allIds.add(sp.id) }

    const nameMap: Record<string, { username: string; full_name: string | null }> = {}
    if (allIds.size) {
      const idList = Array.from(allIds)
      const [{ data: pIds }, { data: spIds }, { data: sfpIds }] = await Promise.all([
        supabase.from('profiles').select('id, username, academy_id').in('id', idList),
        supabase.from('student_profiles').select('id, full_name').in('id', idList),
        supabase.from('staff_profiles').select('id, full_name').in('id', idList),
      ])
      // solo de nuestra academia (evita leaks si el RLS está laxo)
      const mine = new Set((pIds ?? []).filter(p => p.academy_id === academyId).map(p => p.id))
      const fn: Record<string, string | null> = {}
      for (const r of (spIds  ?? [])) fn[r.id] = r.full_name
      for (const r of (sfpIds ?? [])) fn[r.id] = r.full_name
      for (const p of (pIds ?? [])) {
        if (mine.has(p.id)) nameMap[p.id] = { username: p.username, full_name: fn[p.id] ?? null }
      }
    }

    const displayName = (id: string | null | undefined): string => {
      if (!id) return 'alguien'
      const u = nameMap[id]
      if (!u) return 'alguien'
      return u.full_name ?? `@${u.username}`
    }

    const out: ActivityItem[] = []

    for (const c of (codes ?? [])) {
      if (c.used_at && c.used_by) {
        out.push({
          id:        `code_used_${c.id}`,
          kind:      'codigo_usado',
          timestamp: c.used_at,
          title:     `Código ${c.code} canjeado`,
          subject:   displayName(c.used_by),
          detail:    `${c.access_months} mes${c.access_months !== 1 ? 'es' : ''} de acceso`,
          entityId:  c.used_by,
        })
      } else if (c.created_at) {
        out.push({
          id:        `code_new_${c.id}`,
          kind:      'codigo_creado',
          timestamp: c.created_at,
          title:     `Código ${c.code} generado`,
          subject:   c.created_by ? displayName(c.created_by) : undefined,
          detail:    `${c.access_months} mes${c.access_months !== 1 ? 'es' : ''}`,
        })
      }
    }

    for (const p of (pays ?? [])) {
      if (!p.paid_at) continue
      out.push({
        id:        `pay_${p.id}`,
        kind:      'pago_registrado',
        timestamp: p.paid_at,
        title:     `Pago ${p.month} registrado`,
        subject:   displayName(p.alumno_id),
        detail:    p.amount ? `${Number(p.amount).toFixed(2)} €` : undefined,
        entityId:  p.alumno_id,
      })
    }

    for (const pr of (profs ?? [])) {
      out.push({
        id:        `alta_${pr.id}`,
        kind:      'alumno_alta',
        timestamp: pr.created_at,
        title:     'Alumno dado de alta',
        subject:   displayName(pr.id),
        entityId:  pr.id,
      })
    }

    for (const sp of sps) {
      // solo si updated_at > created_at + 30 min (evita duplicar "alta")
      if (!sp.updated_at) continue
      if (sp.created_at && new Date(sp.updated_at).getTime() - new Date(sp.created_at).getTime() < 30 * 60 * 1000) continue
      // y solo si el alumno es de nuestra academia (join implícito vía nameMap)
      if (!nameMap[sp.id]) continue
      out.push({
        id:        `upd_${sp.id}_${sp.updated_at}`,
        kind:      'perfil_actualizado',
        timestamp: sp.updated_at,
        title:     'Datos actualizados',
        subject:   displayName(sp.id),
        entityId:  sp.id,
      })
    }

    out.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    setItems(out.slice(0, limit))
    setLoading(false)
  }, [academyId, limit])

  useEffect(() => { load() }, [load])
  useEffect(() => subscribe('director-data-changed', load), [load])

  return { items, loading, reload: load }
}

// ── Helpers de formato para el feed ──────────────────────────────────────────

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1)      return 'ahora mismo'
  if (mins < 60)     return `hace ${mins} min`
  const hrs = Math.round(mins / 60)
  if (hrs < 24)      return `hace ${hrs}h`
  const days = Math.round(hrs / 24)
  if (days === 1)    return 'ayer'
  if (days < 7)      return `hace ${days}d`
  if (days < 30)     return `hace ${Math.round(days / 7)}sem`
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}