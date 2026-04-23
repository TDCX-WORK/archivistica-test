import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Home, BarChart2, BookOpen, LogOut, GraduationCap, User,
  Building2, ShieldCheck, Trash2, CreditCard, Settings2,
  Receipt, Target, Plus, X, MessageCircle, FolderOpen, Send,
  ClipboardList
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { CurrentUser } from '../../types'
import styles from './Sidebar.module.css'

interface NavItem {
  id:    string
  icon:  LucideIcon
  label: string
}

/* ── Alumno ──────────────────────────────────────────────────────── */
const NAV_ALUMNO_MAIN: NavItem[] = [
  { id: 'inicio',  icon: Home,     label: 'Inicio'  },
  { id: 'estudio', icon: BookOpen, label: 'Estudio' },
]
const NAV_ALUMNO_EXTRA: NavItem[] = [
  { id: 'estadisticas', icon: BarChart2,     label: 'Stats'      },
  { id: 'foro',         icon: MessageCircle, label: 'Foro'       },
  { id: 'documentos',   icon: FolderOpen,    label: 'Documentos' },
  { id: 'tareas',          icon: ClipboardList, label: 'Tareas' }, 
]
const NAV_ALUMNO_DESKTOP: NavItem[] = [
  { id: 'inicio',       icon: Home,          label: 'Inicio'     },
  { id: 'estudio',      icon: BookOpen,      label: 'Estudio'    },
  { id: 'estadisticas', icon: BarChart2,     label: 'Stats'      },
  { id: 'foro',         icon: MessageCircle, label: 'Foro'       },
  { id: 'documentos',   icon: FolderOpen,    label: 'Documentos' },
  { id: 'tareas',          icon: ClipboardList, label: 'Tareas' },
]

/* ── Profesor ────────────────────────────────────────────────────── */
const NAV_PROFESOR_MAIN: NavItem[] = [
  { id: 'inicio',       icon: Home,     label: 'Inicio' },
  { id: 'estadisticas', icon: BarChart2, label: 'Stats'  },
]
const NAV_PROFESOR_EXTRA: NavItem[] = [
  { id: 'profesor',   icon: GraduationCap, label: 'Mis alumnos' },
  { id: 'mensajes',   icon: Send,          label: 'Mensajes'    },
  { id: 'foro',       icon: MessageCircle, label: 'Foro'        },
  { id: 'documentos', icon: FolderOpen,    label: 'Documentos'  },
  { id: 'tareas-profesor', icon: ClipboardList, label: 'Tareas' },
]
const NAV_PROFESOR_DESKTOP: NavItem[] = [
  { id: 'profesor',    icon: GraduationCap, label: 'Mis alumnos'  },
  { id: 'stats-clase', icon: BarChart2,     label: 'Estadísticas' },
  { id: 'estudio',     icon: BookOpen,      label: 'Temario'      },
  { id: 'mensajes',    icon: Send,          label: 'Mensajes'     },
  { id: 'foro',        icon: MessageCircle, label: 'Foro'         },
  { id: 'documentos',  icon: FolderOpen,    label: 'Documentos'   },
  { id: 'tareas-profesor', icon: ClipboardList, label: 'Tareas' }
]

/* ── Director ──────────────────────────────────────────────────────── */
const NAV_DIRECTOR_MAIN: NavItem[] = [
  { id: 'direccion', icon: Building2, label: 'Academia' },
  { id: 'gestion',   icon: Settings2, label: 'Gestión'  },
]
const NAV_DIRECTOR_EXTRA: NavItem[] = [
  { id: 'facturacion-director', icon: Receipt,       label: 'Facturación' },
  { id: 'foro',                 icon: MessageCircle, label: 'Foro'        },
  { id: 'documentos',           icon: FolderOpen,    label: 'Documentos'  },
  { id: 'tareas-profesor',      icon: ClipboardList, label: 'Tareas'      },
]
const NAV_DIRECTOR_DESKTOP: NavItem[] = [
  { id: 'direccion',            icon: Building2,     label: 'Academia'    },
  { id: 'gestion',              icon: Settings2,     label: 'Gestión'     },
  { id: 'facturacion-director', icon: Receipt,       label: 'Facturación' },
  { id: 'foro',                 icon: MessageCircle, label: 'Foro'        },
  { id: 'documentos',           icon: FolderOpen,    label: 'Documentos'  },
  { id: 'tareas-profesor',      icon: ClipboardList, label: 'Tareas'      },
]

/* ── Superadmin ────────────────────────────────────────────────────── */
const NAV_SUPERADMIN: NavItem[] = [
  { id: 'superadmin', icon: ShieldCheck, label: 'Admin'       },
  { id: 'pipeline',   icon: Target,      label: 'Prospección' },
  { id: 'billing',    icon: CreditCard,  label: 'Facturación' },
  { id: 'papelera',   icon: Trash2,      label: 'Papelera'    },
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
  const isAlumno     = !isProfesor && !isDirector && !isSuperadmin

  const desktopItems = isSuperadmin ? NAV_SUPERADMIN
    : isDirector  ? NAV_DIRECTOR_DESKTOP
    : isProfesor  ? NAV_PROFESOR_DESKTOP
    : NAV_ALUMNO_DESKTOP

  // El director ahora también usa el sistema main + extra como profesor
  const hasPlusMenu = isAlumno || isProfesor || isDirector

  const mobileMainItems = isAlumno   ? NAV_ALUMNO_MAIN
    : isProfesor ? NAV_PROFESOR_MAIN
    : isDirector ? NAV_DIRECTOR_MAIN
    : []

  const mobileExtraItems = isAlumno   ? NAV_ALUMNO_EXTRA
    : isProfesor ? NAV_PROFESOR_EXTRA
    : isDirector ? NAV_DIRECTOR_EXTRA
    : []

  const [expanded,   setExpanded]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = useCallback(() => setExpanded(true),  [])
  const handleMouseLeave = useCallback(() => setExpanded(false), [])

  const handleNav = useCallback((id: string) => {
    setExpanded(false)
    setMobileOpen(false)
    onTabChange(id)
  }, [onTabChange])

  useEffect(() => {
    if (!mobileOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [mobileOpen])

  return (
    <>
      {/* ── DESKTOP SIDEBAR ──────────────────────────────────────── */}
      <aside
        className={[styles.sidebar, expanded ? styles.sidebarExpanded : ''].join(' ')}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <BookOpen size={18} strokeWidth={1.8} />
          </div>
        </div>

        <nav className={styles.nav}>
          {desktopItems.map(({ id, icon: Icon, label }) => {
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
          {!isSuperadmin && !isDirector && (
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

      {/* ── MOBILE BOTTOM NAV ────────────────────────────────────── */}
      <nav className={styles.mobileNav} ref={menuRef}>

        {/* Menú expandido — alumno, profesor Y director */}
        {mobileOpen && hasPlusMenu && (
          <div className={styles.mobileMenu}>
            {mobileExtraItems.map(({ id, icon: Icon, label }) => {
              const isActive = activeTab === id
              return (
                <button
                  key={id}
                  className={[styles.mobileMenuItem, isActive ? styles.mobileMenuItemActive : ''].join(' ')}
                  onClick={() => handleNav(id)}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span>{label}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Barra fija */}
        <div className={styles.mobileBar}>
          {hasPlusMenu ? (
            <>
              {mobileMainItems.map(({ id, icon: Icon, label }) => {
                const isActive = activeTab === id
                return (
                  <button
                    key={id}
                    className={[styles.mobileBarBtn, isActive ? styles.mobileBarBtnActive : ''].join(' ')}
                    onClick={() => handleNav(id)}
                    aria-label={label}
                  >
                    <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                  </button>
                )
              })}
              <button
                className={[styles.mobileBarBtn, styles.mobileBarBtnPlus, mobileOpen ? styles.mobileBarBtnPlusOpen : ''].join(' ')}
                onClick={() => setMobileOpen(prev => !prev)}
                aria-label="Más opciones"
              >
                {mobileOpen ? <X size={22} strokeWidth={2} /> : <Plus size={22} strokeWidth={2} />}
              </button>
            </>
          ) : (
            desktopItems.map(({ id, icon: Icon, label }) => {
              const isActive = activeTab === id
              return (
                <button
                  key={id}
                  className={[styles.mobileBarBtn, isActive ? styles.mobileBarBtnActive : ''].join(' ')}
                  onClick={() => handleNav(id)}
                  aria-label={label}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                </button>
              )
            })
          )}
        </div>
      </nav>
    </>
  )
}