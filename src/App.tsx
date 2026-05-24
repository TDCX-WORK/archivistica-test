import { useSettings }    from './hooks/useSettings'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import useAuth            from './hooks/useAuth'
import useProgress        from './hooks/useProgress'
import useStudyProgress   from './hooks/useStudyProgress'
import SplashLoader       from './components/ui/SplashLoader'
import AuthPage           from './components/Auth/Auth'
import ForcePasswordChange from './components/Auth/ForcePasswordChange'
import Sidebar            from './components/Layout/Sidebar'
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
import DirectorPanel      from './components/Director/DirectorPanel/DirectorPanel'
import DocumentosPage     from './components/Documentos/DocumentosPage'
import SuperadminPanel    from './components/Superadmin/SuperadminPanel'
import Pipeline           from './components/Superadmin/Pipeline'
import OnboardingWizard   from './components/Onboarding/OnboardingWizard'
import GestionAcademia    from './components/Director/GestionAcademia/GestionAcademia'
import ForoPage           from './components/Foro/ForoPage'
import MensajesPage       from './components/Mensajes/MensajesPage'
import TareasPage         from './components/Tareas/TareasPage'
import TareasProfesorPage from './components/Tareas/TareasProfesorPage' 
import FacturacionDirector from './components/Director/FacturacionDirector/FacturacionDirector'
import SimulacroRunner     from './components/Simulacro/SimulacroRunner'
import ErrorBoundary from './components/ui/ErrorBoundary'
import AcademiaSuspendidaPage from './components/StatusPages/AcademiaSuspendidaPage'
import AccesoExpiradoPage     from './components/StatusPages/AccesoExpiradoPage'
import BillingWrapper         from './components/StatusPages/BillingWrapper'
import styles             from './App.module.css'
import type { CurrentUser, AppOverlay, Supuesto, ExamConfig } from './types'

const homeRoute = (user: CurrentUser | null): string => {
  const role = user?.role
  if (role === 'superadmin') return '/admin'
  if (role === 'director')   return '/direccion'
  if (role === 'profesor')   return '/profesor'
  return '/'
}


function AppShell({ currentUser, logout, progress, studyProgress, updateDisplayName }: {
  currentUser:        CurrentUser
  logout:             () => void
  progress:           ReturnType<typeof useProgress>
  studyProgress:      ReturnType<typeof useStudyProgress>
  updateDisplayName:  (name: string) => void
}) {
  const { settings }  = useSettings()
  const navigate      = useNavigate()
  const location      = useLocation()
  const [overlay, setOverlay] = useState<AppOverlay | null>(null)

  const academyId    = currentUser?.academy_id
  const role         = currentUser?.role
  const isAlumno     = role === 'alumno' || !role
  const isProfesor   = role === 'profesor'
  const isDirector   = role === 'director'
  const isSuperadmin = role === 'superadmin'

  const activeTab =
  
    location.pathname.startsWith('/mensajes')              ? 'mensajes'             :
    location.pathname.startsWith('/foro')                 ? 'foro'                 :
    location.pathname.startsWith('/estudio')              ? 'estudio'              :
    location.pathname.startsWith('/estadisticas')         ? 'estadisticas'         :
    location.pathname.startsWith('/perfil')               ? 'perfil'               :
    location.pathname.startsWith('/stats-clase')          ? 'stats-clase'          :
    location.pathname.startsWith('/profesor')             ? 'profesor'             :
    location.pathname.startsWith('/direccion')            ? 'direccion'            :
    location.pathname.startsWith('/facturacion-director') ? 'facturacion-director' :
    location.pathname.startsWith('/papelera')             ? 'papelera'             :
    location.pathname.startsWith('/billing')              ? 'billing'              :
    location.pathname.startsWith('/pipeline')             ? 'pipeline'             :
    location.pathname.startsWith('/admin')                ? 'superadmin'           :
    location.pathname.startsWith('/gestion')              ? 'gestion'              :
    location.pathname.startsWith('/documentos')           ? 'documentos'           :
    location.pathname.startsWith('/tareas-profesor')      ? 'tareas-profesor'      :
    location.pathname.startsWith('/tareas')               ? 'tareas'               : 'inicio'

  const handleTabChange = (t: string) => {
    setOverlay(null)
    const routes: Record<string, string> = {
      inicio:                 homeRoute(currentUser),
      gestion:                '/gestion',
      estudio:                '/estudio',
      estadisticas:           '/estadisticas',
      perfil:                 '/perfil',
      profesor:               '/profesor',
      'stats-clase':          '/stats-clase',
      direccion:              '/direccion',
      'facturacion-director': '/facturacion-director',
      superadmin:             '/admin',
      papelera:               '/papelera',
      billing:                '/billing',
      pipeline:               '/pipeline',
       foro:                   '/foro',
  documentos:             '/documentos',
  mensajes:               '/mensajes',
  tareas:          '/tareas',
'tareas-profesor': '/tareas-profesor',
    }
    navigate(routes[t] ?? homeRoute(currentUser))
  }

  const handleSelectMode = (modeId: string, modeLabel: string = '', thirdArg?: unknown, fourthArg?: string) => {
    if (thirdArg && typeof thirdArg === 'object' && (thirdArg as any).questions) {
      return setOverlay({ type: 'supuesto', supuesto: thirdArg as Supuesto })
    }
    if (modeId === 'flashcards') {
      return setOverlay({ type: 'flashcards' })
    }
    if (modeId === 'simulacro' && thirdArg && typeof thirdArg === 'object') {
      return setOverlay({ type: 'simulacro', examConfig: thirdArg as ExamConfig })
    }
    if (thirdArg && typeof thirdArg === 'string') {
      return setOverlay({ type: 'test', modeId, modeLabel, topicId: thirdArg, topicLabel: fourthArg ?? '' })
    }
    setOverlay({ type: 'test', modeId, modeLabel })
  }

  const goHome = () => { setOverlay(null); navigate(homeRoute(currentUser)) }

  const isTestActive = overlay && ['test', 'supuesto', 'flashcards', 'simulacro'].includes(overlay.type)

  const testLabel =
    overlay?.type === 'test'       ? (overlay.topicLabel ?? overlay.modeLabel ?? overlay.modeId) :
    overlay?.type === 'supuesto'   ? overlay.supuesto?.title :
    overlay?.type === 'flashcards' ? 'Flashcards' :
    overlay?.type === 'simulacro'  ? 'Simulacro Oficial' : ''

  const pageTitle =
    activeTab === 'estadisticas'         ? 'Estadísticas'      :
    activeTab === 'estudio'              ? 'Temario'            :
    activeTab === 'perfil'               ? 'Mi Perfil'          :
    activeTab === 'profesor'             ? 'Panel Profesor'     :
    activeTab === 'stats-clase'          ? 'Stats de la clase'  :
    activeTab === 'direccion'            ? 'Panel de Dirección' :
    activeTab === 'facturacion-director' ? 'Facturación'        :
    activeTab === 'superadmin'           ? 'Superadmin'         :
    activeTab === 'papelera'             ? 'Papelera'           :
    activeTab === 'billing'              ? 'Facturación'        :
    activeTab === 'pipeline'             ? 'Prospección'        : 'Inicio'

  return (
    <div className={styles.shell}>
      {!isTestActive && (
        <Sidebar activeTab={activeTab} onTabChange={handleTabChange} currentUser={currentUser} onLogout={logout} />
      )}
      <div className={[styles.main, isTestActive ? styles.mainFull : ''].join(' ')}>
        <Header
          currentUser={currentUser} inTest={!!isTestActive} modeName={testLabel}
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
              topicId={overlay.topicId ?? null}
              topicLabel={overlay.topicLabel ?? null}
              academyId={academyId}
              subjectId={currentUser?.subject_id}
              userId={currentUser?.id}
              penalizacion={settings.penalizacion}
              onGoHome={goHome}
              onRecordSession={progress.recordSession}
              onRecordWrong={(questionId, blockId) => progress.recordWrongAnswer(questionId, blockId ?? 'unknown')}
              onRecordCorrectReview={progress.recordCorrectReview}
              wrongAnswers={progress.wrongAnswers}
            />
          )}
          {overlay?.type === 'flashcards' && (
            <Flashcard academyId={academyId} subjectId={currentUser?.subject_id} onGoHome={goHome} />
          )}
          {overlay?.type === 'simulacro' && (
            <SimulacroRunner
              examConfig={overlay.examConfig}
              academyId={academyId}
              subjectId={currentUser?.subject_id}
              userId={currentUser?.id}
              onGoHome={goHome}
              onRecordSession={progress.recordSession}
              onRecordWrong={(questionId, blockId) => progress.recordWrongAnswer(questionId, blockId ?? 'unknown')}
              onRecordCorrectReview={progress.recordCorrectReview}
              wrongAnswers={progress.wrongAnswers}
            />
          )}
          {overlay?.type === 'supuesto' && (
            <SupuestoRunner supuesto={overlay.supuesto} onGoHome={goHome} />
          )}

          {!overlay && (
            <Routes>
              <Route path="/" element={
                isSuperadmin ? <Navigate to="/admin"     replace /> :
                isDirector   ? <Navigate to="/direccion" replace /> :
                isProfesor   ? <Navigate to="/profesor"  replace /> :
                <Home onSelectMode={handleSelectMode} progress={progress} currentUser={currentUser} studyProgress={studyProgress} />
              } />
              <Route path="/estudio" element={
                <StudyViewWrapper currentUser={currentUser} onSelectMode={handleSelectMode} />
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
                        studyBookmarks={studyProgress.bookmarks}
                        onUpdateDisplayName={updateDisplayName} />
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
              <Route path="/gestion" element={
                isDirector ? <GestionAcademia currentUser={currentUser} /> : <Navigate to={homeRoute(currentUser)} replace />
              } />
              <Route path="/facturacion-director" element={
                isDirector ? <FacturacionDirector currentUser={currentUser} /> : <Navigate to={homeRoute(currentUser)} replace />
              } />
              <Route path="/admin" element={
                isSuperadmin ? <SuperadminPanel currentUser={currentUser} /> : <Navigate to={homeRoute(currentUser)} replace />
              } />
              <Route path="/documentos" element={
  currentUser?.role === 'alumno' || currentUser?.role === 'profesor' || currentUser?.role === 'director'
    ? <DocumentosPage currentUser={currentUser} />
    : <Navigate to={homeRoute(currentUser)} replace />
} />
              <Route path="/foro" element={
  currentUser?.role === 'alumno' || currentUser?.role === 'profesor' || currentUser?.role === 'director'
    ? <ForoPage currentUser={currentUser} />
    : <Navigate to={homeRoute(currentUser)} replace />
} />

<Route path="/mensajes" element={
  isProfesor || isDirector || isAlumno
    ? <MensajesPage currentUser={currentUser} />
    : <Navigate to={homeRoute(currentUser)} replace />
} />

<Route path="/tareas" element={
  isAlumno
    ? <TareasPage currentUser={currentUser} />
    : <Navigate to={homeRoute(currentUser)} replace />
} />
<Route path="/tareas-profesor" element={
  isProfesor || isDirector
    ? <TareasProfesorPage currentUser={currentUser} />
    : <Navigate to={homeRoute(currentUser)} replace />
} />

              <Route path="/pipeline" element={
                isSuperadmin ? <Pipeline /> : <Navigate to={homeRoute(currentUser)} replace />
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


function StudyViewWrapper({ currentUser, onSelectMode }: {
  currentUser:   CurrentUser
  onSelectMode:  (modeId: string, modeLabel?: string, third?: unknown, fourth?: string) => void
}) {
  const [searchParams] = useSearchParams()
  const initialBlockId = searchParams.get('block') ?? null
  return <StudyView currentUser={currentUser} onSelectMode={onSelectMode} initialBlockId={initialBlockId} />
}

function AppInner() {
  const {
    currentUser, loading, login, register, logout, error, clearError,
    clearForcePasswordChange, completeOnboarding, updateDisplayName,
    recoveryMode, requestPasswordReset, confirmPasswordReset,
  } = useAuth()
  const progress      = useProgress(currentUser?.id, currentUser?.academy_id, currentUser?.subject_id)
  const studyProgress = useStudyProgress(currentUser?.id, currentUser?.academy_id, currentUser?.subject_id)

  // Splash: visible mientras carga auth + datos, mínimo 800ms para cubrir también la carga de blocks
  const [minTimeReady, setMinTimeReady] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMinTimeReady(true), 800)
    return () => clearTimeout(t)
  }, [])

  const dataLoading = currentUser?.role === 'alumno' ? progress.loadingData : false
  const showSplash = !minTimeReady || loading || dataLoading

  // Si tarda más de 12s en cargar, Supabase probablemente no responde
  const [loadTimeout, setLoadTimeout] = useState(false)
  useEffect(() => {
    if (!showSplash) { setLoadTimeout(false); return }
    const t = setTimeout(() => setLoadTimeout(true), 12000)
    return () => clearTimeout(t)
  }, [showSplash])

  if (showSplash && loadTimeout) return (
    <div className={styles.timeoutPage}>
      <div className={styles.timeoutEmoji}>⚡</div>
      <h2 className={styles.timeoutTitle}>Tardando más de lo normal</h2>
      <p className={styles.timeoutText}>
        El servidor está tardando en responder. Comprueba tu conexión o inténtalo de nuevo.
      </p>
      <button onClick={() => window.location.reload()} className={styles.timeoutBtn}>
        Reintentar
      </button>
    </div>
  )

  if (showSplash) return <SplashLoader />
  if (recoveryMode) return <ForcePasswordChange currentUser={{ username: '' }} onDone={confirmPasswordReset} isRecovery />
  if (!currentUser) return <AuthPage onLogin={login} onRegister={register} onRequestReset={requestPasswordReset} error={error} clearError={clearError} />
  if (currentUser.academyDeleted)      return <AcademiaSuspendidaPage username={currentUser.username} onLogout={logout} />
  if (currentUser.academySuspended)    return <AcademiaSuspendidaPage username={currentUser.username} onLogout={logout} />
  if (currentUser.accesoExpirado)      return <AccesoExpiradoPage     username={currentUser.username} onLogout={logout} />
  if (currentUser.forcePasswordChange) return <ForcePasswordChange    currentUser={currentUser}       onDone={clearForcePasswordChange} />
  if (currentUser.role === 'alumno' && currentUser.onboardingCompleted === false) {
    return <OnboardingWizard currentUser={currentUser} onComplete={completeOnboarding} onLogout={logout} />
  }

  return <AppShell currentUser={currentUser} logout={logout} progress={progress} studyProgress={studyProgress} updateDisplayName={updateDisplayName} />
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
