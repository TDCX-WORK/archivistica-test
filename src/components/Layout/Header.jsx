import { useState } from 'react'
import { Search, X, LogOut, User, Settings } from 'lucide-react'
import NotificationBell from '../Notifications/NotificationBell'
import styles from './Header.module.css'

function UserMenu({ currentUser, onLogout, onClose, onGoProfile, onGoSettings }) {
  return (
    <div className={styles.userMenuOverlay} onClick={onClose}>
      <div className={styles.userMenu} onClick={e => e.stopPropagation()}>
        <div className={styles.userMenuTop}>
          <div className={styles.userMenuAvatar}>
            {currentUser?.displayName?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className={styles.userMenuName}>{currentUser?.displayName}</p>
            <p className={styles.userMenuSub}>
              {currentUser?.role === 'profesor'   ? 'Profesor/a'  :
               currentUser?.role === 'director'   ? 'Director/a'  :
               currentUser?.role === 'superadmin' ? 'Superadmin'  : 'Opositor/a'}
            </p>
          </div>
        </div>
        <div className={styles.userMenuDivider} />
        <button className={styles.userMenuItem} onClick={() => { onGoProfile(); onClose() }}>
          <User size={14} /> Mi perfil
        </button>
        <button className={styles.userMenuItem} onClick={() => { onGoSettings(); onClose() }}>
          <Settings size={14} /> Ajustes
        </button>
        <div className={styles.userMenuDivider} />
        <button className={[styles.userMenuItem, styles.userMenuLogout].join(' ')} onClick={onLogout}>
          <LogOut size={14} /> Cerrar sesión
        </button>
      </div>
    </div>
  )
}

export default function Header({
  currentUser, inTest, modeName, onGoHome,
  pageTitle, onLogout, onGoProfile, onGoSettings,
  onNavigate,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const isSuperadmin = currentUser?.role === 'superadmin'

  return (
    <>
      <header className={[styles.header, isSuperadmin ? styles.headerDark : ''].join(' ')}>
        {/* Left */}
        <div className={styles.left}>
          {inTest ? (
            <div className={styles.testLabel}>
              <span className={styles.testDot} />
              <span className={styles.testName}>{modeName}</span>
            </div>
          ) : (
            <>
              {!isSuperadmin && (
                <>
                  <div className={styles.pageTitle}>{pageTitle || 'Inicio'}</div>
                  <div className={styles.pageTitleInstitutional}>
                    {currentUser?.academyName || 'Plataforma de Oposiciones'}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Center */}
        {!inTest && !isSuperadmin && (
          <div className={styles.center}>
            <span className={styles.centerTitle}>
              {currentUser?.academyName || 'Plataforma de Oposiciones'}
            </span>
            <span className={styles.centerSub}>{currentUser?.subjectName || ''}</span>
          </div>
        )}
        {!inTest && isSuperadmin && (
          <div className={styles.centerDark}>
            <span className={styles.centerDarkTitle}>FrostFox Academy</span>
            <span className={styles.centerDarkSub}>Control Center</span>
          </div>
        )}

        {/* Right */}
        <div className={styles.right}>
          {inTest ? (
            <button className={styles.exitBtn} onClick={onGoHome}>
              <X size={15} strokeWidth={2} /> Salir
            </button>
          ) : (
            <>
              <div className={styles.searchWrap}>
                <Search size={13} className={styles.searchIcon} />
                <input className={styles.searchInput} placeholder="Buscar tema…" readOnly />
              </div>

              {/* Campanita de notificaciones — funcional para todos los roles */}
              <NotificationBell
                currentUser={currentUser}
                onNavigate={onNavigate}
              />

              <button
                className={styles.avatarPill}
                onClick={() => setMenuOpen(v => !v)}
                title="Mi cuenta"
              >
                <div className={styles.avatar}>
                  {currentUser?.displayName?.[0]?.toUpperCase() || '?'}
                </div>
                <span className={styles.avatarName}>{currentUser?.displayName}</span>
              </button>
            </>
          )}
        </div>
      </header>

      {menuOpen && (
        <UserMenu
          currentUser={currentUser}
          onLogout={onLogout}
          onClose={() => setMenuOpen(false)}
          onGoProfile={onGoProfile}
          onGoSettings={onGoSettings}
        />
      )}
    </>
  )
}
