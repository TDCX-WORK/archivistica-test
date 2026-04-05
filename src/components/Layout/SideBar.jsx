import { Home, BarChart2, BookOpen, LogOut, GraduationCap, User, Building2, ShieldCheck, Trash2, CreditCard, Settings2, Receipt } from 'lucide-react'
import styles from './Sidebar.module.css'

const NAV_ALUMNO = [
  { id: 'inicio',       icon: Home,          label: 'Inicio'   },
  { id: 'estudio',      icon: BookOpen,      label: 'Estudio'  },
  { id: 'estadisticas', icon: BarChart2,     label: 'Stats'    },
]

const NAV_PROFESOR = [
  { id: 'profesor',    icon: GraduationCap, label: 'Mis alumnos'   },
  { id: 'stats-clase', icon: BarChart2,     label: 'Estadísticas'  },
  { id: 'estudio',     icon: BookOpen,      label: 'Temario'       },
]

const NAV_SUPERADMIN = [
  { id: 'superadmin', icon: ShieldCheck, label: 'Admin'        },
  { id: 'billing',    icon: CreditCard,  label: 'Facturación'  },
  { id: 'papelera',   icon: Trash2,      label: 'Papelera'     },
]

const NAV_DIRECTOR = [
  { id: 'direccion',             icon: Building2, label: 'Academia'     },
  { id: 'gestion',               icon: Settings2, label: 'Gestión'      },
  { id: 'facturacion-director',  icon: Receipt,   label: 'Facturación'  },
  { id: 'perfil',                icon: User,      label: 'Perfil'       },
]

export default function Sidebar({ activeTab, onTabChange, currentUser, onLogout }) {
  const isProfesor   = currentUser?.role === 'profesor'
  const isDirector   = currentUser?.role === 'director'
  const isSuperadmin = currentUser?.role === 'superadmin'
  const navItems     = isSuperadmin ? NAV_SUPERADMIN : isDirector ? NAV_DIRECTOR : isProfesor ? NAV_PROFESOR : NAV_ALUMNO

  return (
    <aside className={[styles.sidebar, isSuperadmin ? styles.sidebarDark : ''].join(' ')}>
      <div className={[styles.logo, isSuperadmin ? styles.logoDark : ''].join(' ')}>
        <div className={[styles.logoIcon, isSuperadmin ? styles.logoIconDark : ''].join(' ')}>
          <BookOpen size={18} strokeWidth={1.8} />
        </div>
      </div>

      <nav className={styles.nav}>
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className={[styles.navItem, activeTab === id ? styles.navActive : ''].join(' ')}
            onClick={() => onTabChange(id)}
            data-label={label}
          >
            <Icon size={18} strokeWidth={activeTab === id ? 2.2 : 1.8} />
          </button>
        ))}
      </nav>

      <div className={styles.footer}>
        {!isSuperadmin && (
          <button
            className={[styles.navItem, activeTab === 'perfil' ? styles.navActive : ''].join(' ')}
            onClick={() => onTabChange('perfil')}
            data-label="Perfil"
            style={{ marginBottom: '0.5rem' }}
          >
            <User size={18} strokeWidth={activeTab === 'perfil' ? 2.2 : 1.8} />
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
