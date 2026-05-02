import { useState } from 'react'
import { useSuperadmin } from '../../hooks/useSuperadmin'
import ManualBillingTab  from '../Superadmin/ManualBillingTab'
import type { CurrentUser } from '../../types'
import styles from './BillingWrapper.module.css'

interface Props {
  currentUser: CurrentUser
}

export default function BillingWrapper({ currentUser }: Props) {
  const { academias, loading } = useSuperadmin(currentUser)
  const [tab, setTab] = useState('manual')

  if (loading) return (
    <div className={styles.loading}>Cargando…</div>
  )

  const tabs = [
    { id: 'manual', label: 'Facturación manual', badge: 'Activo' },
    { id: 'stripe', label: 'Stripe',             badge: 'Próximamente' },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.tabBar}>
        {tabs.map(t => (
          <button
            key={t.id}
            className={[styles.tab, tab === t.id ? styles.tabActive : ''].join(' ')}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            <span className={[styles.tabBadge, tab === t.id ? styles.tabBadgeActive : ''].join(' ')}>
              {t.badge}
            </span>
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {tab === 'manual' && <ManualBillingTab academias={academias} />}
        {tab === 'stripe' && (
          <div className={styles.stripePlaceholder}>
            <div className={styles.stripeEmoji}>⚡</div>
            <div className={styles.stripeTitle}>Stripe · Próximamente</div>
            <div className={styles.stripeText}>
              La integración con Stripe está lista pero se activará con el primer cliente real. Hasta entonces, usa la facturación manual.
            </div>
            <button className={styles.stripeBtn} onClick={() => setTab('manual')}>
              Ir a facturación manual
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
