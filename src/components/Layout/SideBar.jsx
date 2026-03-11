import { Home, BarChart2, BookOpen, LogOut } from 'lucide-react'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { id: 'inicio',       icon: Home,      label: 'Inicio' },
  { id: 'estudio',      icon: BookOpen,  label: 'Estudio' },
  { id: 'estadisticas', icon: BarChart2, label: 'Estadísticas' },
]

export default function Sidebar({ activeTab, onTabChange, currentUser, onLogout }) {
  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <BookOpen size={18} strokeWidth={1.8} />
        </div>
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className={[styles.navItem, activeTab === id ? styles.navActive : ''].join(' ')}
            onClick={() => onTabChange(id)}
            title={label}
          >
            <Icon size={18} strokeWidth={activeTab === id ? 2.2 : 1.8} />
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.avatarWrap} title={currentUser?.displayName}>
          <div className={styles.avatar}>
            {currentUser?.displayName?.[0]?.toUpperCase() || '?'}
          </div>
        </div>
        <button className={styles.logoutBtn} onClick={onLogout} title="Cerrar sesión">
          <LogOut size={16} strokeWidth={1.8} />
        </button>
      </div>
    </aside>
  )
}
