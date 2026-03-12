import { useEffect } from 'react'
import { useSettings } from './hooks/useSettings'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import useAuth           from './hooks/useAuth'
import useProgress       from './hooks/useProgress'
import useStudyProgress  from './hooks/useStudyProgress'
import AuthPage          from './components/Auth/Auth'
import Sidebar           from './components/Layout/SideBar'
import Header            from './components/Layout/Header'
import Home              from './components/Home/Home'
import Stats             from './components/Stats/Stats'
import StudyView         from './components/Study/StudyView'
import TestRunner        from './components/TestRunner/TestRunner'
import Flashcard         from './components/Flashcard/Flashcard'
import SupuestoRunner    from './components/Supuesto/SupuestoRunner'
import Profile           from './components/Profile/Profile'
import supuestos         from './data/supuestos.json'
import styles            from './App.module.css'
import { useState } from 'react'

// ── Rutas de tabs ──────────────────────────────────────────
const TAB_ROUTES = {
  inicio:       '/',
  estudio:      '/estudio',
  estadisticas: '/estadisticas',
  perfil:       '/perfil',
}

function AppShell({ currentUser, logout, progress, studyProgress }) {
  const { settings } = useSettings()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [overlay, setOverlay] = useState(null) // { type, modeId?, supuesto? }

  // Tab activo basado en la URL
  const activeTab =
    location.pathname.startsWith('/estudio')      ? 'estudio' :
    location.pathname.startsWith('/estadisticas') ? 'estadisticas' :
    location.pathname.startsWith('/perfil')       ? 'perfil' : 'inicio'

  const handleTabChange = (t) => {
    setOverlay(null)
    navigate(TAB_ROUTES[t] || '/')
  }

  const handleSelectMode = (modeId) => {
    const sup = supuestos.find(s => s.id === modeId)
    if (sup)                     return setOverlay({ type: 'supuesto', supuesto: sup })
    if (modeId === 'flashcards') return setOverlay({ type: 'flashcards' })
    setOverlay({ type: 'test', modeId })
  }

  const goHome = () => {
    setOverlay(null)
    navigate('/')
  }

  const isTestActive = overlay && ['test', 'supuesto', 'flashcards'].includes(overlay.type)

  const testLabel =
    overlay?.type === 'test'       ? overlay.modeId :
    overlay?.type === 'supuesto'   ? overlay.supuesto?.title :
    overlay?.type === 'flashcards' ? 'Flashcards' : ''

  const pageTitle =
    activeTab === 'estadisticas' ? 'Estadísticas' :
    activeTab === 'estudio'      ? 'Estudio' :
    activeTab === 'perfil'       ? 'Mi Perfil' : 'Inicio'

  return (
    <div className={styles.shell}>
      {!isTestActive && (
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          currentUser={currentUser}
          onLogout={logout}
        />
      )}

      <div className={[styles.main, isTestActive ? styles.mainFull : ''].join(' ')}>
        <Header
          currentUser={currentUser}
          inTest={isTestActive}
          modeName={testLabel}
          onGoHome={goHome}
          onLogout={logout}
          pageTitle={pageTitle}
          onGoProfile={() => navigate('/perfil')}
          onGoSettings={() => navigate('/perfil?tab=ajustes')}
        />

        <div className={styles.content}>
          {/* Overlays de test — se muestran encima de cualquier ruta */}
          {overlay?.type === 'test' && (
            <TestRunner
              modeId={overlay.modeId}
              penalizacion={settings.penalizacion}
              onGoHome={goHome}
              onRecordSession={progress.recordSession}
              onRecordWrong={progress.recordWrongAnswer}
              onRecordCorrectReview={progress.recordCorrectReview}
              wrongAnswers={progress.wrongAnswers}
            />
          )}
          {overlay?.type === 'flashcards' && (
            <Flashcard onGoHome={goHome} />
          )}
          {overlay?.type === 'supuesto' && (
            <SupuestoRunner supuesto={overlay.supuesto} onGoHome={goHome} />
          )}

          {/* Rutas normales — solo visibles cuando no hay overlay */}
          {!overlay && (
            <Routes>
              <Route path="/" element={
                <Home onSelectMode={handleSelectMode} progress={progress} />
              }/>
              <Route path="/estudio" element={
                <StudyView currentUser={currentUser} onSelectMode={handleSelectMode} />
              }/>
              <Route path="/estadisticas" element={
                <Stats
                  progress={progress}
                  studyReadTopics={studyProgress.readTopics}
                  studyBookmarks={studyProgress.bookmarks}
                />
              }/>
              <Route path="/perfil" element={
                <Profile
                  currentUser={currentUser}
                  progress={progress}
                  studyReadTopics={studyProgress.readTopics}
                  studyBookmarks={studyProgress.bookmarks}
                />
              }/>
              {/* Cualquier ruta desconocida → inicio */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const { currentUser, loading, login, register, logout, error, clearError } = useAuth()
  const progress      = useProgress(currentUser?.id)
  const studyProgress = useStudyProgress(currentUser?.id)

  if (loading) return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingSpinner} />
    </div>
  )

  if (!currentUser) return (
    <AuthPage onLogin={login} onRegister={register} error={error} clearError={clearError} />
  )

  return (
    <BrowserRouter>
      <AppShell
        currentUser={currentUser}
        logout={logout}
        progress={progress}
        studyProgress={studyProgress}
      />
    </BrowserRouter>
  )
}
