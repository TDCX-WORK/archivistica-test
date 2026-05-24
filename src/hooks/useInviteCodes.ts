import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { generateInviteCode } from '../lib/inviteCodes'

export interface CodigoInvitacion {
  id:            string
  code:          string
  subject_id:    string | null
  access_months: number
  used_by:       string | null
  used_at:       string | null
  expires_at:    string
  created_at:    string | null
  created_by:    string | null
}

export interface UserMini {
  id:        string
  username:  string
  full_name: string | null
}

/**
 * Hook que gestiona la carga y generación de códigos de invitación.
 * Extraído de SeccionCodigos para centralizar el acceso a datos.
 */
export function useInviteCodes(academyId: string | null | undefined, academyName: string | null | undefined) {
  const [codigos, setCodigos] = useState<CodigoInvitacion[]>([])
  const [userMap, setUserMap] = useState<Record<string, UserMini>>({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!academyId) return
    setLoading(true)

    const { data } = await supabase
      .from('invite_codes')
      .select('id, code, subject_id, access_months, used_by, used_at, expires_at, created_at, created_by')
      .eq('academy_id', academyId)
      .order('created_at', { ascending: false })

    const codigosData = (data ?? []) as CodigoInvitacion[]
    setCodigos(codigosData)

    // Resolver nombres de creadores / consumidores
    const ids = new Set<string>()
    for (const c of codigosData) {
      if (c.created_by) ids.add(c.created_by)
      if (c.used_by)    ids.add(c.used_by)
    }

    if (ids.size > 0) {
      const idList = Array.from(ids)
      const [{ data: profs }, { data: sps }, { data: sfps }] = await Promise.all([
        supabase.from('profiles').select('id, username').in('id', idList),
        supabase.from('student_profiles').select('id, full_name').in('id', idList),
        supabase.from('staff_profiles').select('id, full_name').in('id', idList),
      ])
      const fullNameMap: Record<string, string | null> = {}
      for (const sp  of (sps  ?? []) as { id: string; full_name: string | null }[]) fullNameMap[sp.id]  = sp.full_name
      for (const sfp of (sfps ?? []) as { id: string; full_name: string | null }[]) fullNameMap[sfp.id] = sfp.full_name
      const map: Record<string, UserMini> = {}
      for (const p of (profs ?? []) as { id: string; username: string }[]) {
        map[p.id] = { id: p.id, username: p.username, full_name: fullNameMap[p.id] ?? null }
      }
      setUserMap(map)
    } else {
      setUserMap({})
    }

    setLoading(false)
  }, [academyId])

  useEffect(() => { load() }, [load])

  /** Generar un nuevo código de invitación */
  const generarCodigo = useCallback(async (
    subjectId: string,
    accessMonths: number,
  ): Promise<{ error: string | null }> => {
    if (!academyId) return { error: 'Sin academy_id' }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const code    = generateInviteCode(academyName)
    const expires = new Date()
    expires.setDate(expires.getDate() + 30)

    const { error } = await supabase.from('invite_codes').insert({
      academy_id:    academyId,
      subject_id:    subjectId,
      created_by:    user.id,
      code,
      access_months: accessMonths,
      expires_at:    expires.toISOString(),
    })

    if (error) return { error: `Error generando código: ${error.message}` }

    await load()
    return { error: null }
  }, [academyId, academyName, load])

  return { codigos, userMap, loading, reload: load, generarCodigo }
}