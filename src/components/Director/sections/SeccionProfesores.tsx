import { GraduationCap, Phone, Mail } from 'lucide-react'
import { fmt } from '../../../lib/helpers'
import type { StaffConExtended } from '../../../types'
import styles from '../GestionAcademia/GestionAcademia.module.css'

interface Subject { id: string; name: string; color: string; slug: string }

export function SeccionProfesores({
  staffProfiles,
  subjects,
}: {
  staffProfiles: StaffConExtended[]
  subjects:      Subject[]
}) {
  const profesores = staffProfiles.filter(p => p.role === 'profesor')
  const subMap: Record<string, Subject> = {}
  for (const s of subjects) subMap[s.id] = s

  if (!profesores.length) {
    return (
      <div className={styles.seccion}>
        <div className={styles.seccionHead}>
          <div className={styles.seccionHeadLeft}>
            <h2 className={styles.seccionTitle}>Profesores</h2>
            <span className={styles.seccionCount}>0</span>
          </div>
        </div>
        <div className={styles.emptyBlock}>
          <GraduationCap size={28} strokeWidth={1.3} />
          <p>No hay profesores registrados todavía</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.seccion}>
      <div className={styles.seccionHead}>
        <div className={styles.seccionHeadLeft}>
          <h2 className={styles.seccionTitle}>Profesores</h2>
          <span className={styles.seccionCount}>{profesores.length}</span>
        </div>
      </div>

      <div className={styles.profesoresGrid}>
        {profesores.map(p => {
          const ext = p.extended
          const sub = p.subject_id ? subMap[p.subject_id] : null
          const nombre = (ext?.full_name ?? '') || p.username

          return (
            <div key={p.id} className={styles.profCard}>
              <div className={styles.profHead}>
                <div className={styles.profAvatar}>{nombre[0]!.toUpperCase()}</div>
                <div className={styles.profInfo}>
                  <span className={styles.profNombre}>{nombre}</span>
                  <span className={styles.profUsername}>@{p.username}</span>
                </div>
              </div>

              {sub && (
                <div className={styles.profSub}>
                  <span className={styles.subDot} style={{ background: sub.color }} />
                  <span>{sub.name}</span>
                </div>
              )}

              <div className={styles.profContacto}>
                {ext?.phone         && <div className={styles.profContactoRow}><Phone size={11} />{ext.phone}</div>}
                {ext?.email_contact && <div className={styles.profContactoRow}><Mail  size={11} />{ext.email_contact}</div>}
                {!ext?.phone && !ext?.email_contact && <span className={styles.muted}>Perfil sin completar</span>}
              </div>

              <div className={styles.profAltaWrap}>
                <span className={styles.muted}>Alta · {fmt(p.created_at)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
