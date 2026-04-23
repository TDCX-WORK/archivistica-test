import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { emit } from '../lib/eventBus'

export interface AcademyPayment {
  id:         string
  academy_id: string
  alumno_id:  string
  amount:     number
  month:      string   // 'YYYY-MM'
  status:     'paid' | 'pending' | 'overdue'
  paid_at:    string | null
  notes:      string | null
  created_at: string
}

export interface AlumnoCobro {
  id:             string
  username:       string
  full_name:      string | null
  monthly_price:  number | null
  access_until:   string | null   // ← necesario para calcular MRR en riesgo
  payment:        AcademyPayment | null  // null = no hay registro aún
}

export function useCobros(academyId: string | null | undefined, month: string) {
  const [alumnos,  setAlumnos]  = useState<AlumnoCobro[]>([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState<Record<string, boolean>>({})

  const load = useCallback(async (currentMonth: string) => {
    if (!academyId || !currentMonth) return
    setLoading(true)

    const { data: profiles } = await supabase
      .from('profiles').select('id, username, access_until').eq('academy_id', academyId).eq('role', 'alumno')

    const alumnoIds = (profiles ?? []).map((p: any) => p.id)

    const [{ data: sps }, { data: payments }] = await Promise.all([
      alumnoIds.length > 0
        ? supabase.from('student_profiles').select('id, monthly_price, full_name').in('id', alumnoIds)
        : Promise.resolve({ data: [] }),
      supabase.from('academy_payments').select('*').eq('academy_id', academyId).eq('month', currentMonth),
    ])

    const spMap: Record<string, { monthly_price: number | null; full_name: string | null }> = {}
    for (const sp of (sps ?? [])) spMap[(sp as any).id] = sp as any

    const payMap: Record<string, AcademyPayment> = {}
    for (const p of (payments ?? [])) payMap[(p as AcademyPayment).alumno_id] = p as AcademyPayment

    const result: AlumnoCobro[] = (profiles ?? []).map((p: any) => ({
      id:            p.id,
      username:      p.username,
      full_name:     spMap[p.id]?.full_name ?? null,
      monthly_price: spMap[p.id]?.monthly_price ?? null,
      access_until:  p.access_until ?? null,
      payment:       payMap[p.id] ?? null,
    }))

    setAlumnos(result)
    setLoading(false)
  }, [academyId])

  // Reload whenever month changes — pass month directly to avoid stale closure
  useEffect(() => { load(month) }, [load, month])

  // NOTA: useCobros NO se suscribe al bus. Emite (desde updateStatus) para que
  // otros paneles (useDirector, useAcademyProfiles, useHistoricoCobros) reaccionen,
  // pero si se suscribiera a sí mismo habría un reload redundante en cada click.

  // Upsert payment status for an alumno
  const updateStatus = async (alumnoId: string, status: AcademyPayment['status'], notes?: string, currentMonth?: string) => {
    const effectiveMonth = currentMonth ?? month
    if (!academyId) return
    setSaving(prev => ({ ...prev, [alumnoId]: true }))
    try {
      const alumno = alumnos.find(a => a.id === alumnoId)
      const amount = alumno?.monthly_price ?? 0

      const payload = {
        academy_id: academyId,
        alumno_id:  alumnoId,
        amount,
        month: effectiveMonth,
        status,
        paid_at:    status === 'paid' ? new Date().toISOString() : null,
        notes:      notes ?? alumnos.find(a => a.id === alumnoId)?.payment?.notes ?? null,
      }

      const existing = alumnos.find(a => a.id === alumnoId)?.payment

      let newPayment: AcademyPayment
      if (existing) {
        const { data } = await supabase.from('academy_payments')
          .update(payload).eq('id', existing.id).select().single()
        newPayment = data as AcademyPayment
      } else {
        const { data } = await supabase.from('academy_payments')
          .insert(payload).select().single()
        newPayment = data as AcademyPayment
      }

      // Also sync student_profiles.payment_status for current month
      const now = new Date()
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
      if (effectiveMonth === thisMonth) {
        await supabase.from('student_profiles').update({ payment_status: status }).eq('id', alumnoId)
      }

      setAlumnos(prev => prev.map(a => a.id === alumnoId ? { ...a, payment: newPayment } : a))

      // Notificar a Finanzas y al resto de paneles que hubo cambios
      emit('director-data-changed')
    } finally {
      setSaving(prev => ({ ...prev, [alumnoId]: false }))
    }
  }

  const updateNotes = async (alumnoId: string, notes: string) => {
    if (!academyId) return
    const existing = alumnos.find(a => a.id === alumnoId)?.payment
    if (!existing) return
    await supabase.from('academy_payments').update({ notes }).eq('id', existing.id)
    setAlumnos(prev => prev.map(a =>
      a.id === alumnoId ? { ...a, payment: { ...a.payment!, notes } } : a
    ))
  }

  // Generate payments for month from student_profiles if none exist
  const generarMes = async () => {
    if (!academyId) return
    setLoading(true)
    const now = new Date()
    const toCreate = alumnos.filter(a =>
      (a.monthly_price ?? 0) > 0
      && !a.payment
      && (!a.access_until || new Date(a.access_until) >= now)
    )
    if (toCreate.length === 0) { setLoading(false); return }
    await supabase.from('academy_payments').insert(
      toCreate.map(a => ({
        academy_id: academyId,
        alumno_id:  a.id,
        amount:     a.monthly_price!,
        month,
        status:     'pending',
      }))
    )
    await load(month)
    emit('director-data-changed')
  }

  // Export CSV
  const exportarCSV = () => {
    const rows = [
      ['Alumno', 'Nombre', 'Precio/mes', 'Estado', 'Fecha pago', 'Notas'],
      ...alumnos.filter(a => a.monthly_price).map(a => [
        a.username,
        a.full_name ?? '',
        a.monthly_price?.toFixed(2) ?? '',
        a.payment?.status ?? 'sin registro',
        a.payment?.paid_at ? new Date(a.payment.paid_at).toLocaleDateString('es-ES') : '',
        a.payment?.notes ?? '',
      ])
    ]
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `cobros-${month}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return { alumnos, loading, saving, updateStatus, updateNotes, generarMes, exportarCSV, reload: () => load(month) }
}