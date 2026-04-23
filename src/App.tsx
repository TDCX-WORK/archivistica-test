import { useSettings }    from './hooks/useSettings'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ShieldOff, LogOut } from 'lucide-react'
import useAuth            from './hooks/useAuth'
import useProgress        from './hooks/useProgress'
import useStudyProgress   from './hooks/useStudyProgress'
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
import styles             from './App.module.css'
import { useSuperadmin }  from './hooks/useSuperadmin'
import ManualBillingTab   from './components/Superadmin/ManualBillingTab'
import type { CurrentUser, AppOverlay, Supuesto, ExamConfig } from './types'

const homeRoute = (user: CurrentUser | null): string => {
  const role = user?.role
  if (role === 'superadmin') return '/admin'
  if (role === 'director')   return '/direccion'
  if (role === 'profesor')   return '/profesor'
  return '/'
}

function AcademiaSuspendidaPage({ username, onLogout }: { username: string; onLogout: () => void }) {
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2rem', background:'var(--surface-off)', textAlign:'center' }}>
      <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🔒</div>
      <h1 style={{ fontSize:'1.4rem', fontWeight:800, color:'var(--ink)', margin:'0 0 0.5rem' }}>Academia suspendida</h1>
      <p style={{ fontSize:'0.9rem', color:'var(--ink-muted)', maxWidth:360, margin:'0 0 0.5rem' }}>
        Hola <strong>{username}</strong>, el acceso a tu academia está temporalmente suspendido.
      </p>
      <p style={{ fontSize:'0.85rem', color:'var(--ink-muted)', maxWidth:360, margin:'0 0 2rem' }}>
        Contacta con tu academia para más información.
      </p>
      <button onClick={onLogout} style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.65rem 1.25rem', background:'var(--ink)', color:'white', border:'none', borderRadius:'8px', fontSize:'0.88rem', fontWeight:700, cursor:'pointer' }}>
        Cerrar sesión
      </button>
    </div>
  )
}

function AccesoExpiradoPage({ username, onLogout }: { username: string; onLogout: () => void }) {
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2rem', background:'var(--surface-off)', textAlign:'center' }}>
      <ShieldOff size={48} strokeWidth={1.2} style={{ color:'#DC2626', marginBottom:'1rem' }} />
      <h1 style={{ fontSize:'1.4rem', fontWeight:800, color:'var(--ink)', margin:'0 0 0.5rem' }}>Tu acceso ha expirado</h1>
      <p style={{ fontSize:'0.9rem', color:'var(--ink-muted)', maxWidth:340, margin:'0 0 2rem' }}>
        Hola <strong>{username}</strong>, tu período de acceso ha finalizado. Contacta con tu academia para renovarlo.
      </p>
      <button onClick={onLogout} style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.65rem 1.25rem', background:'var(--ink)', color:'white', border:'none', borderRadius:'8px', fontSize:'0.88rem', fontWeight:700, cursor:'pointer' }}>
        <LogOut size={15} /> Cerrar sesión
      </button>
    </div>
  )
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
    location.pathname.startsWith('/admin')                ? 'superadmin'           : 'inicio'

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
              onRecordWrong={(questionId, blockId) => progress.recordWrongAnswer(questionId, blockId ?? '')}
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
              onRecordWrong={(questionId, blockId) => progress.recordWrongAnswer(questionId, blockId ?? '')}
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
  isProfesor
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

function BillingWrapper({ currentUser }: { currentUser: CurrentUser }) {
  const { academias, loading } = useSuperadmin(currentUser)
  const [tab, setTab] = useState('manual')

  if (loading) return (
    <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', color:'var(--ink-subtle)', fontSize:'var(--fs-4)' }}>
      Cargando…
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', color:'var(--ink)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'1.5rem 2rem 0', maxWidth:'1100px', margin:'0 auto' }}>
        {[
          { id:'manual', label:'Facturación manual', badge:'Activo' },
          { id:'stripe', label:'Stripe',             badge:'Próximamente' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display:'inline-flex', alignItems:'center', gap:'0.45rem', padding:'0.5rem 1.1rem',
            background: tab===t.id ? 'rgba(37,99,235,0.10)' : 'var(--surface-off)',
            border:     tab===t.id ? '1px solid rgba(37,99,235,0.40)' : '1px solid var(--line)',
            borderRadius:'999px', fontSize:'var(--fs-5)', fontWeight: tab===t.id ? 700 : 500,
            color: tab===t.id ? '#2563EB' : 'var(--ink-muted)',
          }}>
            {t.label}
            <span style={{
              fontSize:'9px', fontWeight:800, padding:'1px 6px',
             background: tab===t.id ? 'rgba(37,99,235,0.15)' : 'var(--surface-dim)',
              border: `1px solid ${tab===t.id ? 'rgba(37,99,235,0.30)' : 'var(--line)'}`,
              borderRadius:'999px', color: tab===t.id ? '#2563EB' : 'var(--ink-subtle)',
              
              letterSpacing:'0.05em', textTransform:'uppercase' as const,
            }}>{t.badge}</span>
          </button>
        ))}
      </div>

      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'1.5rem 2rem 4rem' }}>
        {tab === 'manual' && <ManualBillingTab academias={academias} />}
        {tab === 'stripe' && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1rem', padding:'5rem', textAlign:'center', background:'var(--surface)', border:'1px solid rgba(93,228,255,0.20)', borderRadius:'20px', boxShadow:'0 0 0 3px rgba(93,228,255,0.06)' }}>
            <div style={{ fontSize:'2.5rem' }}>⚡</div>
            <div style={{ fontSize:'var(--fs-2)', fontWeight:700, color:'var(--ink)' }}>Stripe · Próximamente</div>
            <div style={{ fontSize:'var(--fs-5)', color:'var(--ink-muted)', maxWidth:400, lineHeight:1.6 }}>
              La integración con Stripe está lista pero se activará con el primer cliente real. Hasta entonces, usa la facturación manual.
            </div>
            <button onClick={() => setTab('manual')} style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', padding:'0.55rem 1.1rem', background:'var(--ink)', border:'none', borderRadius:'999px', fontSize:'var(--fs-5)', fontWeight:700, color:'#fff', cursor:'pointer', marginTop:'0.5rem' }}>
              Ir a facturación manual
            </button>
          </div>
        )}
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

  // Si tarda más de 12s en cargar, Supabase probablemente no responde
  const [loadTimeout, setLoadTimeout] = useState(false)
  useEffect(() => {
    if (!loading) { setLoadTimeout(false); return }
    const t = setTimeout(() => setLoadTimeout(true), 12000)
    return () => clearTimeout(t)
  }, [loading])

  if (loading && loadTimeout) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1rem', padding:'2rem', background:'var(--surface-off)', textAlign:'center' }}>
      <div style={{ fontSize:'2.5rem' }}>⚡</div>
      <h2 style={{ fontSize:'1.2rem', fontWeight:800, color:'var(--ink)', margin:0 }}>Tardando más de lo normal</h2>
      <p style={{ fontSize:'0.9rem', color:'var(--ink-muted)', maxWidth:320, margin:0, lineHeight:1.5 }}>
        El servidor está tardando en responder. Comprueba tu conexión o inténtalo de nuevo.
      </p>
      <button onClick={() => window.location.reload()} style={{ marginTop:'0.5rem', padding:'0.6rem 1.4rem', background:'var(--ink)', color:'#fff', border:'none', borderRadius:'8px', fontSize:'0.88rem', fontWeight:700, cursor:'pointer' }}>
        Reintentar
      </button>
    </div>
  )

  if (loading) return <div className={styles.loadingScreen}><div className={styles.loadingSpinner} /></div>
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
