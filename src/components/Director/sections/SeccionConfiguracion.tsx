import { Mail, Building2, Hash, Shield } from 'lucide-react'
import type { CurrentUser } from '../../../types'
import styles from '../GestionAcademia/GestionAcademia.module.css'

interface Academy { id: string; name: string; plan: string; slug: string }

export function SeccionConfiguracion({
  currentUser,
  academy,
}: {
  currentUser: CurrentUser | null
  academy:     Academy | null
}) {
  const rows: { icon: JSX.Element; label: string; value: JSX.Element }[] = [
    {
      icon:  <Building2 size={13} />,
      label: 'Nombre de la academia',
      value: <span className={styles.configVal}>{academy?.name ?? currentUser?.academyName ?? '—'}</span>,
    },
    {
      icon:  <Shield size={13} />,
      label: 'Plan actual',
      value: <span className={styles.planChip}>{academy?.plan ?? '—'}</span>,
    },
    {
      icon:  <Hash size={13} />,
      label: 'Slug',
      value: <code className={styles.configMono}>{academy?.slug ?? '—'}</code>,
    },
    {
      icon:  <Hash size={13} />,
      label: 'ID de academia',
      value: <code className={styles.configMono}>{currentUser?.academy_id ?? '—'}</code>,
    },
  ]

  return (
    <div className={styles.seccion}>
      <div className={styles.seccionHead}>
        <div className={styles.seccionHeadLeft}>
          <h2 className={styles.seccionTitle}>Configuración</h2>
        </div>
      </div>

      <div className={styles.configCardSingle}>
        <div className={styles.configRows}>
          {rows.map((r, i) => (
            <div key={i} className={styles.configRow}>
              <div className={styles.configRowLeft}>
                <span className={styles.configIcon}>{r.icon}</span>
                <span className={styles.configLabel}>{r.label}</span>
              </div>
              {r.value}
            </div>
          ))}
        </div>

        <div className={styles.configCta}>
          <div className={styles.configCtaText}>
            <p className={styles.configCtaTitle}>¿Necesitas cambiar algo?</p>
            <p className={styles.configCtaDesc}>
              Plan, nombre o capacidad de alumnos los gestiona el administrador de FrostFox Academy.
              Escríbenos y te ayudamos.
            </p>
          </div>
          <a href="mailto:hola@frostfoxacademy.com" className={styles.configCtaBtn}>
            <Mail size={13} /> Contactar
          </a>
        </div>
      </div>
    </div>
  )
}
