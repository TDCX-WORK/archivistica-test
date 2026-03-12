import { useState } from 'react'
import { BookOpen, User, Lock, ArrowRight, UserPlus, ChevronLeft, Eye, EyeOff, AlertCircle } from 'lucide-react'
import GobiernoLogo from '../ui/GobiernoLogo'
import styles from './Auth.module.css'

export default function AuthPage({ onLogin, onRegister, error, clearError }) {
  const [mode, setMode]           = useState('login') // 'login' | 'register'
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername]   = useState('')
  const [password, setPassword]   = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [loading, setLoading]     = useState(false)

  const switchMode = (m) => { setMode(m); clearError(); setUsername(''); setPassword(''); setDisplayName('') }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 200))
    if (mode === 'login')    onLogin(username, password)
    else                     onRegister(displayName, username, password)
    setLoading(false)
  }

  return (
    <div className={styles.page}>
      <GobiernoLogo size="md" className={styles.brand} />

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          {mode === 'register' && (
            <button className={styles.back} onClick={() => switchMode('login')}>
              <ChevronLeft size={16} /> Volver
            </button>
          )}
          <h1 className={styles.title}>
            {mode === 'login' ? 'Bienvenido de nuevo' : 'Crear cuenta'}
          </h1>
          <p className={styles.subtitle}>
            {mode === 'login'
              ? 'Accede a tu progreso de estudio'
              : 'Empieza a preparar tu oposición'}
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {mode === 'register' && (
            <div className={styles.field}>
              <label className={styles.label}>Nombre completo</label>
              <div className={styles.inputWrap}>
                <User size={16} className={styles.inputIcon} />
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Tu nombre"
                  value={displayName}
                  onChange={e => { setDisplayName(e.target.value); clearError() }}
                  autoComplete="name"
                  autoFocus
                />
              </div>
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Usuario</label>
            <div className={styles.inputWrap}>
              <User size={16} className={styles.inputIcon} />
              <input
                className={styles.input}
                type="text"
                placeholder={mode === 'login' ? 'Tu nombre de usuario' : 'Elige un usuario'}
                value={username}
                onChange={e => { setUsername(e.target.value); clearError() }}
                autoComplete="username"
                autoFocus={mode === 'login'}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Contraseña</label>
            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                className={styles.input}
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); clearError() }}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div className={styles.error}>
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <button
            className={[styles.submit, loading ? styles.submitLoading : ''].join(' ')}
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              <>
                {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className={styles.divider}><span>o</span></div>

        <button
          className={styles.switchBtn}
          onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? (
            <><UserPlus size={15} /> ¿Primera vez? Crear cuenta nueva</>
          ) : (
            <><User size={15} /> ¿Ya tienes cuenta? Entrar</>
          )}
        </button>
      </div>

      <p className={styles.note}>
        Los datos se guardan solo en este dispositivo
      </p>
    </div>
  )
}
