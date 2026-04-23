import { Activity, Key, Euro, UserPlus, Edit3, CheckCircle2 } from 'lucide-react'
import { useAcademyActivity, formatRelative, type ActivityKind } from '../../../hooks/useAcademyActivity'
import styles from '../GestionAcademia/GestionAcademia.module.css'

const KIND_META: Record<ActivityKind, { icon: JSX.Element; tone: string }> = {
  codigo_usado:      { icon: <CheckCircle2 size={12} />, tone: 'accent' },
  codigo_creado:     { icon: <Key         size={12} />,  tone: 'neutral' },
  pago_registrado:   { icon: <Euro        size={12} />,  tone: 'info' },
  alumno_alta:       { icon: <UserPlus    size={12} />,  tone: 'accent' },
  perfil_actualizado:{ icon: <Edit3       size={12} />,  tone: 'muted' },
}

export function ActividadFeed({ academyId }: { academyId: string | null | undefined }) {
  const { items, loading } = useAcademyActivity(academyId, { limit: 20 })

  return (
    <aside className={styles.feedAside}>
      <div className={styles.feedHead}>
        <div className={styles.feedHeadLeft}>
          <span className={styles.feedHeadIcon}><Activity size={12} /></span>
          <h3 className={styles.feedTitle}>Actividad reciente</h3>
        </div>
        {items.length > 0 && <span className={styles.feedCount}>{items.length}</span>}
      </div>

      <div className={styles.feedBody}>
        {loading ? (
          <div className={styles.feedEmpty}>
            <div className={styles.feedSkeleton} />
            <div className={styles.feedSkeleton} />
            <div className={styles.feedSkeleton} />
          </div>
        ) : items.length === 0 ? (
          <div className={styles.feedEmpty}>
            <p>Sin actividad reciente</p>
            <span>Los movimientos de alumnos, códigos y pagos aparecerán aquí.</span>
          </div>
        ) : (
          <ol className={styles.feedList}>
            {items.map(it => {
              const meta = KIND_META[it.kind]
              return (
                <li key={it.id} className={styles.feedItem}>
                  <span className={[styles.feedDot, styles[`feedDot_${meta.tone}`]].join(' ')}>
                    {meta.icon}
                  </span>
                  <div className={styles.feedItemBody}>
                    <div className={styles.feedItemTitle}>
                      <span className={styles.feedItemMain}>{it.title}</span>
                      {it.detail && <span className={styles.feedItemDetail}>· {it.detail}</span>}
                    </div>
                    <div className={styles.feedItemMeta}>
                      {it.subject && <span className={styles.feedItemSubject}>{it.subject}</span>}
                      <span className={styles.feedItemTime}>{formatRelative(it.timestamp)}</span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </aside>
  )
}
