import { useState, useEffect } from 'react'
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
import supuestos         from './data/supuestos.json'
import styles            from './App.module.css'

export default function App() {
  const { currentUser, loading, login, register, logout, error, clearError } = useAuth()
  const progress      = useProgress(currentUser?.id)
  const studyProgress = useStudyProgress(currentUser?.id)

  const [view, setView] = useState({ type: 'home' })
  const [tab,  setTab]  = useState('inicio')

  useEffect(() => {
    if (view.type === 'home')   setTab('inicio')
    if (view.type === 'stats')  setTab('estadisticas')
    if (view.type === 'study')  setTab('estudio')
  }, [view.type])

  const handleTabChange = (t) => {
    setTab(t)
    if      (t === 'estadisticas') setView({ type: 'stats' })
    else if (t === 'estudio')      setView({ type: 'study' })
    else                           setView({ type: 'home' })
  }

  const goHome = () => setView({ type: 'home' })

  if (loading) return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingSpinner} />
    </div>
  )

  if (!currentUser) return (
    <AuthPage onLogin={login} onRegister={register} error={error} clearError={clearError} />
  )

  const isTestActive = ['test','supuesto','flashcards'].includes(view.type)

  const handleSelectMode = (modeId) => {
    const sup = supuestos.find(s => s.id === modeId)
    if (sup)                     return setView({ type: 'supuesto', supuesto: sup })
    if (modeId === 'flashcards') return setView({ type: 'flashcards' })
    setView({ type: 'test', modeId })
  }

  const testLabel =
    view.type === 'test'       ? view.modeId :
    view.type === 'supuesto'   ? view.supuesto?.title :
    view.type === 'flashcards' ? 'Flashcards' : ''

  const pageTitle =
    view.type === 'stats' ? 'Estadísticas' :
    view.type === 'study' ? 'Estudio' : 'Inicio'

  return (
    <div className={styles.shell}>
      {!isTestActive && (
        <Sidebar
          activeTab={tab}
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
        />

        <div className={styles.content}>
          {view.type === 'home' && (
            <Home onSelectMode={handleSelectMode} progress={progress} />
          )}
          {view.type === 'study' && (
            <StudyView
              currentUser={currentUser}
              onSelectMode={handleSelectMode}
            />
          )}
          {view.type === 'stats' && (
            <Stats
              progress={progress}
              studyReadTopics={studyProgress.readTopics}
              studyBookmarks={studyProgress.bookmarks}
            />
          )}
          {view.type === 'test' && (
            <TestRunner
              modeId={view.modeId}
              onGoHome={goHome}
              onRecordSession={progress.recordSession}
              onRecordWrong={progress.recordWrongAnswer}
              onRecordCorrectReview={progress.recordCorrectReview}
              wrongAnswers={progress.wrongAnswers}
            />
          )}
          {view.type === 'flashcards' && (
            <Flashcard onGoHome={goHome} />
          )}
          {view.type === 'supuesto' && (
            <SupuestoRunner supuesto={view.supuesto} onGoHome={goHome} />
          )}
        </div>
      </div>
    </div>
  )
}
