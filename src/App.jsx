import { useSettings }    from './hooks/useSettings'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useState }       from 'react'
import { ShieldOff, LogOut } from 'lucide-react'
import useAuth            from './hooks/useAuth'
import useProgress        from './hooks/useProgress'
import useStudyProgress   from './hooks/useStudyProgress'
import AuthPage           from './components/Auth/Auth'
import ForcePasswordChange from './components/Auth/ForcePasswordChange'
import Sidebar            from './components/Layout/SideBar'
import Header             from './components/Layout/Header'
import Home               from './components/Home/Home'
import Stats              from './components/Stats/Stats'
import StudyView          from './components/Study/StudyView'
import TestRunner         from './components/TestRunner/TestRunner'
import Flashcard          from './components/Flashcard/Flashcard'
import SupuestoRunner     from './components/Supuesto/SupuestoRunner'
import Profile            from './components/Profile/Profile'
import ProfesorPanel      from './components/Profesor/ProfesorPanel/ProfesorPanel'
import StatsClase         from './components/Profesor/StatsClase/StatsClase'
import ProfesorProfile    from './components/Profesor/ProfesorProfile/ProfesorProfile'
import DirectorPanel      from './components/Profesor/DirectorPanel/DirectorPanel'
import SuperadminPanel    from './components/Superadmin/SuperadminPanel'
import StripeBillingPanel from './components/Superadmin/StripeBillingPanel'
import styles             from './App.module.css'

const homeRoute = (user) => {
  const role = user?.role
  if (role === 'superadmin') return '/admin'
  if (role === 'director')   return '/direccion'
  if (role === 'profesor')   return '/profesor'
  return '/'
}

function AcademiaSuspendidaPage({ username, onLogout }) {
  return (
    <div style={{
      minHeight:'100vh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      padding:'2rem', background:'var(--surface-off)', textAlign:'center',
    }}>
      <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🔒</div>
      <h1 style={{ fontSize:'1.4rem', fontWeight:800, color:'var(--ink)', margin:'0 0 0.5rem' }}>
        Academia suspendida
      </h1>
      <p style={{ fontSize:'0.9rem', color:'var(--ink-muted)', maxWidth:360, margin:'0 0 0.5rem' }}>
        Hola <strong>{username}</strong>, el acceso a tu academia está temporalmente suspendido.
      </p>
      <p style={{ fontSize:'0.85rem', color:'var(--ink-muted)', maxWidth:360, margin:'0 0 2rem' }}>
        Contacta con tu academia para más información.
      </p>
      <button onClick={onLogout} style={{
        display:'flex', alignItems:'center', gap:'0.5rem',
        padding:'0.65rem 1.25rem', background:'var(--ink)', color:'white',
        border:'none', borderRadius:'8px', fontSize:'0.88rem', fontWeight:700, cursor:'pointer',
      }}>Cerrar sesión</button>
    </div>
  )
}

function AccesoExpiradoPage({ username, onLogout }) {
  return (
    <div style={{
      minHeight:'100vh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      padding:'2rem', background:'var(--surface-off)', textAlign:'center',
    }}>
      <ShieldOff size={48} strokeWidth={1.2} style={{ color:'#DC2626', marginBottom:'1rem' }} />
      <h1 style={{ fontSize:'1.4rem', fontWeight:800, color:'var(--ink)', margin:'0 0 0.5rem' }}>
        Tu acceso ha expirado
      </h1>
      <p style={{ fontSize:'0.9rem', color:'var(--ink-muted)', maxWidth:340, margin:'0 0 2rem' }}>
        Hola <strong>{username}</strong>, tu período de acceso ha finalizado.
        Contacta con tu academia para renovarlo.
      </p>
      <button onClick={onLogout} style={{
        display:'flex', alignItems:'center', gap:'0.5rem',
        padding:'0.65rem 1.25rem', background:'var(--ink)', color:'white',
        border:'none', borderRadius:'8px', fontSize:'0.88rem', fontWeight:700, cursor:'pointer',
      }}>
        <LogOut size={15} /> Cerrar sesión
      </button>
    </div>
  )
}

function AppShell({ currentUser, logout, progress, studyProgress }) {
  const { settings }   = useSettings()
  const navigate       = useNavigate()
  const location       = useLocation()
  const [overlay, setOverlay] = useState(null)

  const academyId    = currentUser?.academy_id
  const role         = currentUser?.role
  const isAlumno     = role === 'alumno' || !role
  const isProfesor   = role === 'profesor'
  const isDirector   = role === 'director'
  const isSuperadmin = role === 'superadmin'

  const activeTab =
    location.pathname.startsWith('/estudio')      ? 'estudio'      :
    location.pathname.startsWith('/estadisticas') ? 'estadisticas' :
    location.pathname.startsWith('/perfil')        ? 'perfil'       :
    location.pathname.startsWith('/stats-clase')   ? 'stats-clase'  :
    location.pathname.startsWith('/profesor')      ? 'profesor'     :
    location.pathname.startsWith('/direccion')     ? 'direccion'    :
    location.pathname.startsWith('/papelera')      ? 'papelera'     :
    location.pathname.startsWith('/billing')       ? 'billing'      :
    location.pathname.startsWith('/admin')         ? 'superadmin'   : 'inicio'

  const handleTabChange = (t) => {
    setOverlay(null)
    const routes = {
      inicio:        homeRoute(currentUser),
      estudio:       '/estudio',
      estadisticas:  '/estadisticas',
      perfil:        '/perfil',
      profesor:      '/profesor',
      'stats-clase': '/stats-clase',
      direccion:     '/direccion',
      superadmin:    '/admin',
      papelera:      '/papelera',
      billing:       '/billing',
    }
    navigate(routes[t] || homeRoute(currentUser))
  }

  const handleSelectMode = (modeId, modeLabel, thirdArg, fourthArg) => {
    if (thirdArg && typeof thirdArg === 'object' && thirdArg.questions) {
      return setOverlay({ type: 'supuesto', supuesto: thirdArg })
    }
    if (modeId === 'flashcards') {
      return setOverlay({ type: 'flashcards' })
    }
    if (thirdArg && typeof thirdArg === 'string') {
      return setOverlay({ type: 'test', modeId, modeLabel, topicId: thirdArg, topicLabel: fourthArg || '' })
    }
    setOverlay({ type: 'test', modeId, modeLabel })
  }

  const goHome = () => { setOverlay(null); navigate(homeRoute(currentUser)) }

  const isTestActive = overlay && ['test','supuesto','flashcards'].includes(overlay.type)

  const testLabel =
    overlay?.type === 'test'       ? (overlay.topicLabel || overlay.modeLabel || overlay.modeId) :
    overlay?.type === 'supuesto'   ? overlay.supuesto?.title :
    overlay?.type === 'flashcards' ? 'Flashcards' : ''

  const pageTitle =
    activeTab === 'estadisticas' ? 'Estadísticas'       :
    activeTab === 'estudio'      ? 'Temario'             :
    activeTab === 'perfil'       ? 'Mi Perfil'           :
    activeTab === 'profesor'     ? 'Panel Profesor'      :
    activeTab === 'stats-clase'  ? 'Stats de la clase'   :
    activeTab === 'direccion'    ? 'Panel de Dirección'  :
    activeTab === 'superadmin'   ? 'Superadmin'          :
    activeTab === 'papelera'     ? 'Papelera'            :
    activeTab === 'billing'      ? 'Facturación'         : 'Inicio'

  return (
    <div className={styles.shell}>
      {!isTestActive && (
        <Sidebar activeTab={activeTab} onTabChange={handleTabChange}
          currentUser={currentUser} onLogout={logout} />
      )}
      <div className={[styles.main, isTestActive ? styles.mainFull : ''].join(' ')}>
        <Header
  currentUser={currentUser} inTest={isTestActive} modeName={testLabel}
  onGoHome={goHome} onLogout={logout} pageTitle={pageTitle}
  onGoProfile={() => navigate('/perfil')}
  onGoSettings={() => navigate('/perfil?tab=ajustes')}
  onNavigate={navigate}
/>
        <div className={styles.content}>
          {overlay?.type === 'test' && (
            <TestRunner
              modeId={overlay.modeId}
              modeLabel={overlay.modeLabel}
              topicId={overlay.topicId || null}
              topicLabel={overlay.topicLabel || null}
              academyId={academyId}
              subjectId={currentUser?.subject_id}
              penalizacion={settings.penalizacion}
              onGoHome={goHome}
              onRecordSession={progress.recordSession}
              onRecordWrong={progress.recordWrongAnswer}
              onRecordCorrectReview={progress.recordCorrectReview}
              wrongAnswers={progress.wrongAnswers}
            />
          )}
          {overlay?.type === 'flashcards' && (
            <Flashcard academyId={academyId} subjectId={currentUser?.subject_id} onGoHome={goHome} />
          )}
          {overlay?.type === 'supuesto' && <SupuestoRunner supuesto={overlay.supuesto} onGoHome={goHome} />}

          {!overlay && (
            <Routes>
              <Route path="/" element={
                isSuperadmin ? <Navigate to="/admin"     replace /> :
                isDirector   ? <Navigate to="/direccion" replace /> :
                isProfesor   ? <Navigate to="/profesor"  replace /> :
                <Home onSelectMode={handleSelectMode} progress={progress} currentUser={currentUser} />
              } />
              <Route path="/estudio" element={
                <StudyView currentUser={currentUser} onSelectMode={handleSelectMode} />
              } />
              <Route path="/estadisticas" element={
                isAlumno
                  ? <Stats currentUser={currentUser} progress={progress} studyReadTopics={studyProgress.readTopics} studyBookmarks={studyProgress.bookmarks} />
                  : <Navigate to={homeRoute(currentUser)} replace />
              } />
              <Route path="/perfil" element={
                isSuperadmin
                  ? <Navigate to="/admin" replace />
                  : (isProfesor || isDirector)
                    ? <ProfesorProfile currentUser={currentUser} onLogout={logout} />
                    : <Profile currentUser={currentUser} progress={progress}
                        studyReadTopics={studyProgress.readTopics}
                        studyBookmarks={studyProgress.bookmarks} />
              } />
              <Route path="/profesor" element={
                isProfesor ? <ProfesorPanel currentUser={currentUser} /> : <Navigate to={homeRoute(currentUser)} replace />
              } />
              <Route path="/stats-clase" element={
                isProfesor ? <StatsClase currentUser={currentUser} /> : <Navigate to={homeRoute(currentUser)} replace />
              } />
              <Route path="/direccion" element={
                isDirector ? <DirectorPanel currentUser={currentUser} /> : <Navigate to={homeRoute(currentUser)} replace />
              } />
              <Route path="/admin" element={
                isSuperadmin ? <SuperadminPanel currentUser={currentUser} /> : <Navigate to={homeRoute(currentUser)} replace />
              } />
              <Route path="/papelera" element={
                isSuperadmin ? <SuperadminPanel currentUser={currentUser} modoPapelera /> : <Navigate to={homeRoute(currentUser)} replace />
              } />
              <Route path="/billing" element={
                isSuperadmin
                  ? <BillingWrapper currentUser={currentUser} />
                  : <Navigate to={homeRoute(currentUser)} replace />
              } />
              <Route path="*" element={<Navigate to={homeRoute(currentUser)} replace />} />
            </Routes>
          )}
        </div>
      </div>
    </div>
  )
}

// Wrapper que carga academias y las pasa al panel de billing
import { useSuperadmin } from './hooks/useSuperadmin'

function BillingWrapper({ currentUser }) {
  const { academias, loading, recargar } = useSuperadmin(currentUser)
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'5rem', color:'var(--ink-muted)' }}>
      Cargando…
    </div>
  )
  return <StripeBillingPanel academias={academias} onRecargar={recargar} />
}

export default function App() {
  const {
    currentUser, loading, login, register, logout, error, clearError,
    clearForcePasswordChange, recoveryMode, requestPasswordReset, confirmPasswordReset,
  } = useAuth()
  const progress      = useProgress(currentUser?.id, currentUser?.academy_id, currentUser?.subject_id)
  const studyProgress = useStudyProgress(currentUser?.id, currentUser?.academy_id, currentUser?.subject_id)

  if (loading) return <div className={styles.loadingScreen}><div className={styles.loadingSpinner} /></div>
  if (recoveryMode) return <ForcePasswordChange currentUser={{ username: '' }} onDone={confirmPasswordReset} isRecovery />
  if (!currentUser) return <AuthPage onLogin={login} onRegister={register} onRequestReset={requestPasswordReset} error={error} clearError={clearError} />
  if (currentUser.academyDeleted)      return <AcademiaSuspendidaPage username={currentUser.username} onLogout={logout} />
  if (currentUser.academySuspended)    return <AcademiaSuspendidaPage username={currentUser.username} onLogout={logout} />
  if (currentUser.accesoExpirado)      return <AccesoExpiradoPage     username={currentUser.username} onLogout={logout} />
  if (currentUser.forcePasswordChange) return <ForcePasswordChange    currentUser={currentUser}       onDone={clearForcePasswordChange} />

  return (
    <BrowserRouter>
      <AppShell currentUser={currentUser} logout={logout} progress={progress} studyProgress={studyProgress} />
    </BrowserRouter>
  )
}
