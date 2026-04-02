import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/* ─── Hook para el perfil extendido del alumno ───────────────────────────── */
export function useStudentProfile(userId) {
  const [profile,  setProfile]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    setProfile(data || null)
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  const save = useCallback(async (fields) => {
    if (!userId) return false
    setSaving(true)
    const { error } = await supabase
      .from('student_profiles')
      .upsert({ id: userId, ...fields, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    if (!error) setProfile(prev => ({ ...prev, ...fields }))
    setSaving(false)
    return !error
  }, [userId])

  return { profile, loading, saving, save, reload: load }
}

/* ─── Hook para el perfil extendido del staff (profesor/director) ────────── */
export function useStaffProfile(userId) {
  const [profile,  setProfile]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('staff_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    setProfile(data || null)
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  const save = useCallback(async (fields) => {
    if (!userId) return false
    setSaving(true)
    const { error } = await supabase
      .from('staff_profiles')
      .upsert({ id: userId, ...fields, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    if (!error) setProfile(prev => ({ ...prev, ...fields }))
    setSaving(false)
    return !error
  }, [userId])

  return { profile, loading, saving, save, reload: load }
}

/* ─── Hook para que el director cargue perfiles de múltiples usuarios ─────── */
export function useAcademyProfiles(academyId) {
  const [studentProfiles, setStudentProfiles] = useState([])
  const [staffProfiles,   setStaffProfiles]   = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!academyId) { setLoading(false); return }
    setLoading(true)

    // Traer todos los profiles de la academia
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, role, subject_id, access_until, created_at')
      .eq('academy_id', academyId)
      .in('role', ['alumno', 'profesor', 'director'])

    const alumnoIds  = (profiles || []).filter(p => p.role === 'alumno').map(p => p.id)
    const staffIds   = (profiles || []).filter(p => ['profesor','director'].includes(p.role)).map(p => p.id)

    const [{ data: sps }, { data: sfps }] = await Promise.all([
      alumnoIds.length
        ? supabase.from('student_profiles').select('*').in('id', alumnoIds)
        : Promise.resolve({ data: [] }),
      staffIds.length
        ? supabase.from('staff_profiles').select('*').in('id', staffIds)
        : Promise.resolve({ data: [] }),
    ])

    // Combinar profiles con sus datos extendidos
    const spMap  = {}; for (const sp of sps  || []) spMap[sp.id]  = sp
    const sfpMap = {}; for (const sf of sfps || []) sfpMap[sf.id] = sf

    setStudentProfiles(
      (profiles || [])
        .filter(p => p.role === 'alumno')
        .map(p => ({ ...p, extended: spMap[p.id] || null }))
    )
    setStaffProfiles(
      (profiles || [])
        .filter(p => ['profesor','director'].includes(p.role))
        .map(p => ({ ...p, extended: sfpMap[p.id] || null }))
    )
    setLoading(false)
  }, [academyId])

  useEffect(() => { load() }, [load])

  const updateStudentProfile = useCallback(async (userId, fields) => {
    const { error } = await supabase
      .from('student_profiles')
      .upsert({ id: userId, ...fields, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    if (!error) {
      setStudentProfiles(prev => prev.map(p =>
        p.id === userId ? { ...p, extended: { ...p.extended, ...fields } } : p
      ))
    }
    return !error
  }, [])

  return { studentProfiles, staffProfiles, loading, reload: load, updateStudentProfile }
}
