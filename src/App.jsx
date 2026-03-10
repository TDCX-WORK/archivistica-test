import { useState, useEffect } from 'react'
import useAuth        from './hooks/useAuth'
import useProgress    from './hooks/useProgress'
import AuthPage       from './components/Auth/Auth'
import Header         from './components/Layout/Header'
import BottomNav      from './components/Layout/BottomNav'
import Home           from './components/Home/Home'
import Stats          from './components/Stats/Stats'
import TestRunner     from './components/TestRunner/TestRunner'
import Flashcard      from './components/Flashcard/Flashcard'
import SupuestoRunner from './components/Supuesto/SupuestoRunner'
import supuestos      from './data/supuestos.json'

export default function App() {
  const { currentUser, login, register, logout, error, clearError } = useAuth()
  const progress = useProgress(currentUser?.id)

  const [view, setView] = useState({ type: 'home' })
  const [tab,  setTab]  = useState('inicio')

  useEffect(() => {
    if (view.type === 'home')  setTab('inicio')
    if (view.type === 'stats') setTab('estadisticas')
  }, [view.type])

  const handleTabChange = (t) => {
    setTab(t)
    setView({ type: t === 'estadisticas' ? 'stats' : 'home' })
  }

  const goHome = () => setView({ type: 'home' })

  // FIX 3: pass error + clearError to Auth
  if (!currentUser) return (
    <AuthPage
      onLogin={login}
      onRegister={register}
      error={error}
      clearError={clearError}
    />
  )

  const isTestActive = view.type === 'test' || view.type === 'supuesto' || view.type === 'flashcards'

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

  return (
    <>
      {/* FIX 1 + 6: use the prop names Header actually expects */}
      <Header
        currentUser={currentUser}
        onLogout={logout}
        activeTab={tab}
        onTabChange={handleTabChange}
        onGoHome={goHome}
        inTest={isTestActive}
        modeName={testLabel}
      />

      <main>
        {view.type === 'home' && (
          <Home onSelectMode={handleSelectMode} progress={progress} />
        )}
        {view.type === 'stats' && (
          <Stats progress={progress} />
        )}
        {view.type === 'test' && (
          /* FIX 2: prop is onRecordSession, not recordSession */
          <TestRunner
            modeId={view.modeId}
            onGoHome={goHome}
            onRecordSession={progress.recordSession}
          />
        )}
        {view.type === 'flashcards' && (
          <Flashcard onGoHome={goHome} />
        )}
        {view.type === 'supuesto' && (
          <SupuestoRunner supuesto={view.supuesto} onGoHome={goHome} />
        )}
      </main>

      {!isTestActive && (
        <BottomNav activeTab={tab} onTabChange={handleTabChange} />
      )}
    </>
  )
}
