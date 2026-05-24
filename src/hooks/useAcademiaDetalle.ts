import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { InviteCode } from '../types'

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface AcademiaProfile {
  id:           string
  username:     string
  role:         string
  subject_id:   string | null
  created_at:   string | null
  access_until: string | null
  banned?:      boolean
}

export interface AcademiaSesion {
  id:         string
  user_id:    string
  subject_id: string | null
  score:      number
  played_at:  string
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useAcademiaDetalle(academyId: string | null | undefined) {
  const [profiles,         setProfiles]         = useState<AcademiaProfile[]>([])
  const [sesiones,         setSesiones]         = useState<AcademiaSesion[]>([])
  const [emails,           setEmails]           = useState<Record<string, string>>({})
  const [extendedProfiles, setExtendedProfiles] = useState<Record<string, any>>({})
  const [codes,            setCodes]            = useState<InviteCode[]>([])
  const [loading,          setLoading]          = useState(true)

  const load = useCallback(async () => {
    if (!academyId) { setLoading(false); return }
    setLoading(true)

    const [{ data: profs }, { data: sess }, { data: emailData }, { data: codesData }] = await Promise.all([
      supabase.from('profiles').select('id, username, role, subject_id, created_at, access_until').eq('academy_id', academyId),
      supabase.from('sessions').select('id, user_id, subject_id, score, played_at').eq('academy_id', academyId).order('played_at', { ascending: false }),
      supabase.rpc('get_academy_user_emails', { p_academy_id: academyId }),
      supabase.from('invite_codes').select('*').eq('academy_id', academyId).order('created_at', { ascending: false }),
    ])

    const profsArr = (profs ?? []) as AcademiaProfile[]
    setProfiles(profsArr)
    setSesiones((sess ?? []) as AcademiaSesion[])
    setCodes((codesData ?? []) as InviteCode[])

    const emailMap: Record<string, string> = {}
    for (const row of (emailData ?? []) as any[]) emailMap[row.user_id] = row.email
    setEmails(emailMap)

    if (profsArr.length) {
      const alumnoIds = profsArr.filter(p => p.role === 'alumno').map(p => p.id)
      const staffIds  = profsArr.filter(p => ['profesor', 'director'].includes(p.role)).map(p => p.id)
      const [{ data: sps }, { data: sfps }] = await Promise.all([
        alumnoIds.length ? supabase.from('student_profiles').select('*').in('id', alumnoIds) : Promise.resolve({ data: [] }),
        staffIds.length  ? supabase.from('staff_profiles').select('*').in('id', staffIds)    : Promise.resolve({ data: [] }),
      ])
      const extMap: Record<string, any> = {}
      for (const sp of (sps  ?? []) as any[]) extMap[sp.id] = sp
      for (const sf of (sfps ?? []) as any[]) extMap[sf.id] = sf
      setExtendedProfiles(extMap)
    }

    setLoading(false)
  }, [academyId])

  useEffect(() => { load() }, [load])

  return { profiles, sesiones, emails, extendedProfiles, codes, loading, reload: load }
}