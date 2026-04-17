import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { StudentProfile, StaffProfile, Profile, AlumnoConExtended, StaffConExtended } from '../types'

/* ─── Hook para el perfil extendido del alumno ───────────────────────────── */
export function useStudentProfile(userId: string | null | undefined) {
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (err) { setError('Error cargando perfil'); setLoading(false); return }
    setProfile(data as StudentProfile | null)
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  const save = useCallback(async (fields: Partial<StudentProfile>): Promise<boolean> => {
    if (!userId) return false
    setSaving(true)
    const { error } = await supabase
      .from('student_profiles')
      .upsert({ id: userId, ...fields, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    if (!error) setProfile(prev => prev ? { ...prev, ...fields } : prev)
    setSaving(false)
    return !error
  }, [userId])

  return { profile, loading, saving, error, save, reload: load }
}

/* ─── Hook para el perfil extendido del staff ────────────────────────────── */
export function useStaffProfile(userId: string | null | undefined) {
  const [profile, setProfile] = useState<StaffProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('staff_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    setProfile(data as StaffProfile | null)
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  const save = useCallback(async (fields: Partial<StaffProfile>): Promise<boolean> => {
    if (!userId) return false
    setSaving(true)
    const { error } = await supabase
      .from('staff_profiles')
      .upsert({ id: userId, ...fields, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    if (!error) setProfile(prev => prev ? { ...prev, ...fields } : prev)
    setSaving(false)
    return !error
  }, [userId])

  return { profile, loading, saving, save, reload: load }
}

/* ─── Hook para que el director cargue perfiles de múltiples usuarios ─────── */
export function useAcademyProfiles(academyId: string | null | undefined) {
  const [studentProfiles, setStudentProfiles] = useState<AlumnoConExtended[]>([])
  const [staffProfiles,   setStaffProfiles]   = useState<StaffConExtended[]>([])
  const [loading,         setLoading]         = useState(true)

  const load = useCallback(async () => {
    if (!academyId) { setLoading(false); return }
    setLoading(true)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, role, subject_id, access_until, created_at, academy_id, force_password_change')
      .eq('academy_id', academyId)
      .in('role', ['alumno', 'profesor', 'director'])

    const typedProfiles = (profiles ?? []) as Profile[]
    const alumnoIds = typedProfiles.filter(p => p.role === 'alumno').map(p => p.id)
    const staffIds  = typedProfiles.filter(p => ['profesor', 'director'].includes(p.role)).map(p => p.id)

    const [{ data: sps }, { data: sfps }] = await Promise.all([
      alumnoIds.length
        ? supabase.from('student_profiles').select('*').in('id', alumnoIds)
        : Promise.resolve({ data: [] }),
      staffIds.length
        ? supabase.from('staff_profiles').select('*').in('id', staffIds)
        : Promise.resolve({ data: [] }),
    ])

    const spMap:  Record<string, StudentProfile> = {}
    const sfpMap: Record<string, StaffProfile>   = {}
    for (const sp  of (sps  ?? []) as StudentProfile[]) spMap[sp.id]  = sp
    for (const sfp of (sfps ?? []) as StaffProfile[])   sfpMap[sfp.id] = sfp

    setStudentProfiles(
      typedProfiles
        .filter(p => p.role === 'alumno')
        .map(p => ({ ...p, extended: spMap[p.id] ?? null }))
    )
    setStaffProfiles(
      typedProfiles
        .filter(p => ['profesor', 'director'].includes(p.role))
        .map(p => ({ ...p, extended: sfpMap[p.id] ?? null }))
    )
    setLoading(false)
  }, [academyId])

  useEffect(() => { load() }, [load])

  const updateStudentProfile = useCallback(async (
    userId: string,
    fields: Partial<StudentProfile>
  ): Promise<boolean> => {
    const { error } = await supabase
      .from('student_profiles')
      .upsert({ id: userId, ...fields, updated_at: new Date().toISOString() }, { onConflict: 'id' })

    if (error) return false

    // Releer el perfil recién guardado para tener el estado real de BD
    const { data: fresh } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    setStudentProfiles(prev => prev.map(p =>
      p.id === userId ? { ...p, extended: (fresh as StudentProfile) ?? p.extended } : p
    ))

    return true
  }, [])

  return { studentProfiles, staffProfiles, loading, reload: load, updateStudentProfile }
}