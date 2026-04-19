import { useState, useEffect } from 'react'
import { Copy, Check } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { InviteCode } from '../../../types'
import styles from './CodigoCard.module.css'

// Hook que resuelve username + full_name a partir de un conjunto de user_ids
// Útil para mostrar "Usado por X" en los códigos de invitación
export function useUserInfoMap(userIds: string[]) {
  const [map, setMap] = useState<Record<string, { username: string; full_name: string | null }>>({})

  const key = [...new Set(userIds)].sort().join(',')

  useEffect(() => {
    const ids = key ? key.split(',') : []
    if (ids.length === 0) { setMap({}); return }

    let cancelled = false
    const load = async () => {
      const [{ data: profs }, { data: sps }] = await Promise.all([
        supabase.from('profiles').select('id, username').in('id', ids),
        supabase.from('student_profiles').select('id, full_name').in('id', ids),
      ])
      if (cancelled) return
      const fullNameMap: Record<string, string | null> = {}
      for (const sp of (sps ?? []) as { id: string; full_name: string | null }[]) fullNameMap[sp.id] = sp.full_name
      const out: Record<string, { username: string; full_name: string | null }> = {}
      for (const p of (profs ?? []) as { id: string; username: string }[]) {
        out[p.id] = { username: p.username, full_name: fullNameMap[p.id] ?? null }
      }
      setMap(out)
    }
    load()
    return () => { cancelled = true }
  }, [key])

  return map
}

interface CodigoCardProps {
  code:       InviteCode
  usedByInfo: { username: string; full_name: string | null } | null
  onCopy:     (c: string) => void
  copied:     string | null
}

export default function CodigoCard({ code, usedByInfo, onCopy, copied }: CodigoCardProps) {
  const isUsado   = !!code.used_by
  const isExpired = new Date(code.expires_at) < new Date()
  const estado    = isUsado ? 'usado' : isExpired ? 'expirado' : 'activo'
  const expDate   = new Date(code.expires_at).toLocaleDateString('es-ES')
  const usedDate  = code.used_at ? new Date(code.used_at).toLocaleDateString('es-ES') : null

  // Construir línea "Usado por X"
  let usedLine: string | null = null
  if (isUsado) {
    if (usedByInfo) {
      const who = usedByInfo.full_name
        ? `${usedByInfo.full_name} (@${usedByInfo.username})`
        : `@${usedByInfo.username}`
      usedLine = usedDate
        ? `Usado por ${who} · ${usedDate}`
        : `Usado por ${who}`
    } else {
      usedLine = usedDate
        ? `Usado por cuenta eliminada · ${usedDate}`
        : 'Usado por cuenta eliminada'
    }
  }

  return (
    <div className={[styles.codeCard, styles[`code_${estado}`]].join(' ')}>
      <div className={styles.codeLeft}>
        <span className={styles.codeText}>{code.code}</span>
        <span className={styles.codeExpiry}>
          {estado === 'activo'
            ? `Registro hasta ${expDate} · Acceso ${code.access_months === 12 ? '1 año' : `${code.access_months} meses`}`
            : estado === 'usado'
              ? (usedLine ?? 'Utilizado')
              : 'Expirado'}
        </span>
      </div>
      {estado === 'activo' && (
        <button className={styles.copyBtn} onClick={() => onCopy(code.code)}>
          {copied === code.code ? <Check size={14} /> : <Copy size={14} />}
        </button>
      )}
    </div>
  )
}
