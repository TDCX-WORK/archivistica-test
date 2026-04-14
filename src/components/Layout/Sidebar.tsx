import { useState, useCallback } from 'react'
import { Home, BarChart2, BookOpen, LogOut, GraduationCap, User, Building2, ShieldCheck, Trash2, CreditCard, Settings2, Receipt, Target } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { CurrentUser } from '../../types'
import styles from './Sidebar.module.css'

interface NavItem {
  id:    string
  icon:  LucideIcon
  label: string
}

const NAV_ALUMNO: NavItem[] = [
  { id: 'inicio',       icon: Home,          label: 'Inicio'       },
  { id: 'estudio',      icon: BookOpen,      label: 'Estudio'      },
  { id: 'estadisticas', icon: BarChart2,     label: 'Stats'        },
]

const NAV_PROFESOR: NavItem[] = [
  { id: 'profesor',    icon: GraduationCap, label: 'Mis alumnos'  },
  { id: 'stats-clase', icon: BarChart2,     label: 'Estadísticas' },
  { id: 'estudio',     icon: BookOpen,      label: 'Temario'      },
]

const NAV_SUPERADMIN: NavItem[] = [
  { id: 'superadmin', icon: ShieldCheck, label: 'Admin'       },
  { id: 'pipeline',   icon: Target,      label: 'Prospección' },
  { id: 'billing',    icon: CreditCard,  label: 'Facturación' },
  { id: 'papelera',   icon: Trash2,      label: 'Papelera'    },
]

const NAV_DIRECTOR: NavItem[] = [
  { id: 'direccion',            icon: Building2, label: 'Academia'    },
  { id: 'gestion',              icon: Settings2, label: 'Gestión'     },
  { id: 'facturacion-director', icon: Receipt,   label: 'Facturación' },
  { id: 'perfil',               icon: User,      label: 'Perfil'      },
]

interface SidebarProps {
  activeTab:   string
  onTabChange: (id: string) => void
  currentUser: CurrentUser | null
  onLogout:    () => void
}

export default function Sidebar({ activeTab, onTabChange, currentUser, onLogout }: SidebarProps) {
  const isProfesor   = currentUser?.role === 'profesor'
  const isDirector   = currentUser?.role === 'director'
  const isSuperadmin = currentUser?.role === 'superadmin'
  const navItems     = isSuperadmin ? NAV_SUPERADMIN : isDirector ? NAV_DIRECTOR : isProfesor ? NAV_PROFESOR : NAV_ALUMNO

  const [expanded, setExpanded] = useState(false)

  const handleMouseEnter = useCallback(() => setExpanded(true),  [])
  const handleMouseLeave = useCallback(() => setExpanded(false), [])

  const handleNav = useCallback((id: string) => {
    setExpanded(false)
    onTabChange(id)
  }, [onTabChange])

  return (
    <aside
      className={[
        styles.sidebar,
        expanded ? styles.sidebarExpanded : '',
      ].join(' ')}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <BookOpen size={18} strokeWidth={1.8} />
        </div>
      </div>

      <nav className={styles.nav}>
        {navItems.map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              className={[styles.navItem, isActive ? styles.navActive : ''].join(' ')}
              onClick={() => handleNav(id)}
              data-label={label}
            >
              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} className={styles.navIcon} />
              <span className={styles.navLabel}>{label}</span>
            </button>
          )
        })}
      </nav>

      <div className={styles.footer}>
        {!isSuperadmin && (
          <button
            className={[styles.navItem, activeTab === 'perfil' ? styles.navActive : ''].join(' ')}
            onClick={() => handleNav('perfil')}
            data-label="Perfil"
            style={{ marginBottom: '0.5rem' }}
          >
            <User size={18} strokeWidth={activeTab === 'perfil' ? 2.2 : 1.8} className={styles.navIcon} />
            <span className={styles.navLabel}>Perfil</span>
          </button>
        )}
        <div className={styles.avatarWrap}>
          <div className={[styles.avatar, isProfesor ? styles.avatarProfesor : ''].join(' ')}>
            {currentUser?.displayName?.[0]?.toUpperCase() || '?'}
          </div>
        </div>
        <button className={styles.logoutBtn} onClick={onLogout}>
          <LogOut size={16} strokeWidth={1.8} />
        </button>
      </div>
    </aside>
  )
}
