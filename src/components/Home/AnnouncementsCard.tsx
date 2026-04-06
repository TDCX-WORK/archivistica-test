import { Megaphone, AlertTriangle, Info, BookOpen, Bell, Clock } from 'lucide-react'
import type { Announcement } from '../../types'
import styles from './AnnouncementsCard.module.css'

interface TipoMeta {
  label: string
  color: string
  bg:    string
  Icon:  React.ElementType
}

const TIPO_META: Record<string, TipoMeta> = {
  info:         { label: 'Info',         color: '#0891B2', bg: '#EFF6FF', Icon: Info          },
  importante:   { label: 'Importante',   color: '#DC2626', bg: '#FEF2F2', Icon: AlertTriangle  },
  examen:       { label: 'Examen',       color: '#7C3AED', bg: '#F5F3FF', Icon: BookOpen       },
  recordatorio: { label: 'Recordatorio', color: '#D97706', bg: '#FFFBEB', Icon: Bell           },
}

function formatFecha(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

function diasRestantes(expiresAt: string | null | undefined): number | null {
  if (!expiresAt) return null
  return Math.ceil((new Date(expiresAt).getTime() - new Date().getTime()) / 86400000)
}

interface AnnouncementsCardProps {
  announcements?: Announcement[]
  loading?:       boolean
}

export default function AnnouncementsCard({ announcements = [], loading }: AnnouncementsCardProps) {
  if (loading) return null

  if (!announcements.length) {
    return (
      <div className={styles.card}>
        <div className={styles.empty}>
          <Megaphone size={22} strokeWidth={1.5} />
          <span className={styles.emptyTitle}>Tablón de avisos</span>
          <span className={styles.emptySub}>Tu profesor publicará avisos aquí</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Megaphone size={14} className={styles.headerIcon} />
        <span className={styles.headerTitle}>Tablón de avisos</span>
        <span className={styles.headerBadge}>{announcements.length}</span>
      </div>

      <div className={styles.list}>
        {announcements.map(a => {
          const meta = TIPO_META[a.tipo] ?? TIPO_META['info']!
          const Icon = meta.Icon
          const dias = diasRestantes(a.expires_at)

          return (
            <div key={a.id} className={styles.item}>
              <div className={styles.itemIcon} style={{ background: meta.bg, color: meta.color }}>
                <Icon size={13} strokeWidth={2} />
              </div>
              <div className={styles.itemBody}>
                <div className={styles.itemTop}>
                  <span className={styles.itemTipo} style={{ color: meta.color }}>{meta.label}</span>
                  <span className={styles.itemFecha}>{formatFecha(a.created_at)}</span>
                </div>
                <p className={styles.itemTitle}>{a.title}</p>
                {a.body && <p className={styles.itemBody2}>{a.body}</p>}
                {dias !== null && dias <= 3 && (
                  <span className={styles.itemExpira}>
                    <Clock size={10} />
                    {dias <= 0 ? 'Expira hoy' : `Expira en ${dias}d`}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
