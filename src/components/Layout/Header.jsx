import { BookOpen, BarChart2, Home, X, LogOut, User, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import styles from './Header.module.css'

export default function Header({ onGoHome, inTest, modeName, activeTab, onTabChange, currentUser, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <button className={styles.logo} onClick={onGoHome} aria-label="Inicio">
            <div className={styles.logoIcon}><BookOpen size={18} strokeWidth={1.6} /></div>
            <span className={styles.logoText}>Archivística</span>
          </button>
        </div>

        {!inTest && (
          <nav className={styles.nav}>
            <button className={[styles.navBtn, activeTab === 'inicio' ? styles.navActive : ''].join(' ')} onClick={() => onTabChange('inicio')}>
              <Home size={15} strokeWidth={1.8} /><span>Inicio</span>
            </button>
            <button className={[styles.navBtn, activeTab === 'estadisticas' ? styles.navActive : ''].join(' ')} onClick={() => onTabChange('estadisticas')}>
              <BarChart2 size={15} strokeWidth={1.8} /><span>Estadísticas</span>
            </button>
          </nav>
        )}

        {inTest && modeName && (
          <div className={styles.testLabel}>
            <span className={styles.testDot} />
            <span className={styles.testName}>{modeName}</span>
          </div>
        )}

        <div className={styles.right}>
          {inTest ? (
            <button className={styles.exitBtn} onClick={onGoHome}>
              <X size={17} strokeWidth={2} /><span>Salir</span>
            </button>
          ) : currentUser ? (
            <div className={styles.userMenu} ref={menuRef}>
              <button className={styles.userBtn} onClick={() => setMenuOpen(v => !v)}>
                <div className={styles.avatar}>{currentUser.displayName?.[0]?.toUpperCase() || '?'}</div>
                <span className={styles.userName}>{currentUser.displayName}</span>
                <ChevronDown size={13} className={[styles.chevron, menuOpen ? styles.chevronOpen : ''].join(' ')} />
              </button>
              {menuOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropUser}>
                    <span className={styles.dropName}>{currentUser.displayName}</span>
                    <span className={styles.dropUname}>@{currentUser.username}</span>
                  </div>
                  <div className={styles.dropDivider} />
                  <button className={styles.dropBtn} onClick={() => { setMenuOpen(false); onLogout() }}>
                    <LogOut size={14} />Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
