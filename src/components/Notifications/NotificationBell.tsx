import { useState, useRef, useEffect } from 'react'
import { Bell, Check, CheckCheck, X, Zap, AlertTriangle,
         Users, Calendar, TrendingDown, Trophy, Flame,
         Clock, MessageSquare, BookOpen, CreditCard, Trash2 } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications'
import type { Notification } from '../../types'
import type { CurrentUser } from '../../types'
import styles from './NotificationBell.module.css'

// ── Icono segun tipo de notificacion ──────────────────────────────────────────
function NotifIcon({ type }: { type: string }) {
  const map: Record<string, { icon: React.ElementType; color: string }> = {
    plan_semanal:      { icon: Calendar,      color: '#0891B2' },
    repaso_pendiente:  { icon: BookOpen,      color: '#D97706' },
    mejor_nota:        { icon: Trophy,        color: '#059669' },
    racha:             { icon: Flame,         color: '#DC2626' },
    acceso_expira:     { icon: Clock,         color: '#D97706' },
    mensaje_profesor:  { icon: MessageSquare, color: '#7C3AED' },
    nuevo_alumno:      { icon: Users,         color: '#059669' },
    alumno_inactivo:   { icon: AlertTriangle, color: '#D97706' },
    codigo_caduca:     { icon: Zap,           color: '#D97706' },
    alumno_supera:     { icon: Trophy,        color: '#059669' },
    alumno_expira:     { icon: Clock,         color: '#DC2626' },
    sin_plan:          { icon: Calendar,      color: '#D97706' },
    nueva_academia:    { icon: Users,         color: '#059669' },
    resumen_semanal:   { icon: TrendingDown,  color: '#0891B2' },
    nota_baja:         { icon: AlertTriangle, color: '#DC2626' },
    churn_risk:        { icon: AlertTriangle, color: '#DC2626' },
    pago_vencido:      { icon: CreditCard,    color: '#DC2626' },
    health_bajo:       { icon: TrendingDown,  color: '#DC2626' },
    actividad_record:  { icon: Trophy,        color: '#059669' },
  }
  const cfg  = map[type] ?? { icon: Bell, color: '#6B7280' }
  const Icon = cfg.icon
  return (
    <div className={styles.notifIcon} style={{ background: cfg.color + '18', color: cfg.color }}>
      <Icon size={13} strokeWidth={1.8} />
    </div>
  )
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'ahora mismo'
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7)  return `hace ${days}d`
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

interface NotifItemProps {
  notif:      Notification
  onRead:     (id: string) => void
  onDelete:   (id: string) => void
  onNavigate: (link: string) => void
}

function NotifItem({ notif, onRead, onDelete, onNavigate }: NotifItemProps) {
  const handleClick = () => {
    if (!notif.read) onRead(notif.id)
    if (notif.link && onNavigate) onNavigate(notif.link)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(notif.id)
  }

  return (
    <div className={[styles.item, !notif.read ? styles.itemUnread : ''].join(' ')}>
      <button className={styles.itemMain} onClick={handleClick}>
        <NotifIcon type={notif.type} />
        <div className={styles.itemBody}>
          <div className={styles.itemTitle}>{notif.title}</div>
          {notif.body && <div className={styles.itemDesc}>{notif.body}</div>}
          <div className={styles.itemTime}>{timeAgo(notif.created_at)}</div>
        </div>
        {!notif.read && <div className={styles.itemDot} />}
      </button>
      <button className={styles.itemDelete} onClick={handleDelete} title="Eliminar">
        <X size={12} />
      </button>
    </div>
  )
}

interface NotifPanelProps {
  notifications:  Notification[]
  unreadCount:    number
  loading:        boolean
  onRead:         (id: string) => void
  onMarkAll:      () => void
  onDelete:       (id: string) => void
  onDeleteAllRead: () => void
  onClose:        () => void
  onNavigate:     (link: string) => void
  isDark:         boolean
}

function NotifPanel({
  notifications, unreadCount, loading,
  onRead, onMarkAll, onDelete, onDeleteAllRead,
  onClose, onNavigate, isDark,
}: NotifPanelProps) {
  const hasRead = notifications.some(n => n.read)

  return (
    <div className={[styles.panel, isDark ? styles.panelDark : ''].join(' ')}>
      <div className={styles.panelHead}>
        <div className={styles.panelTitle}>
          Notificaciones
          {unreadCount > 0 && (
            <span className={styles.panelBadge}>{unreadCount}</span>
          )}
        </div>
        <div className={styles.panelActions}>
          {unreadCount > 0 && (
            <button className={styles.panelBtn} onClick={onMarkAll} title="Marcar todas como leídas">
              <CheckCheck size={13} /> Todas leídas
            </button>
          )}
          {hasRead && (
            <button className={styles.panelBtn} onClick={onDeleteAllRead} title="Eliminar leídas">
              <Trash2 size={13} /> Limpiar
            </button>
          )}
          <button className={styles.panelClose} onClick={onClose}>
            <X size={13} />
          </button>
        </div>
      </div>

      <div className={styles.panelList}>
        {loading && (
          <div className={styles.panelEmpty}>Cargando…</div>
        )}
        {!loading && notifications.length === 0 && (
          <div className={styles.panelEmpty}>
            <Bell size={24} strokeWidth={1.2} />
            <span>Sin notificaciones</span>
          </div>
        )}
        {!loading && notifications.map(n => (
          <NotifItem
            key={n.id}
            notif={n}
            onRead={onRead}
            onDelete={onDelete}
            onNavigate={(link) => { onNavigate(link); onClose() }}
          />
        ))}
      </div>
    </div>
  )
}

interface NotificationBellProps {
  currentUser: CurrentUser | null
  onNavigate:  (path: string) => void
  isDark?:     boolean
}

export default function NotificationBell({
  currentUser,
  onNavigate,
  isDark = false,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const ref             = useRef<HTMLDivElement>(null)

  const {
    notifications, unreadCount, loading,
    markRead, markAllRead,
    deleteNotification, deleteAllRead,
  } = useNotifications(currentUser?.id)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        className={[styles.bell, open ? styles.bellActive : ''].join(' ')}
        onClick={() => setOpen(v => !v)}
        title="Notificaciones"
      >
        <Bell size={16} strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span className={styles.badge}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotifPanel
          notifications={notifications}
          unreadCount={unreadCount}
          loading={loading}
          onRead={markRead}
          onMarkAll={markAllRead}
          onDelete={deleteNotification}
          onDeleteAllRead={deleteAllRead}
          onClose={() => setOpen(false)}
          onNavigate={onNavigate}
          isDark={isDark}
        />
      )}
    </div>
  )
}
