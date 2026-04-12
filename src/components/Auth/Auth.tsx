import { useState } from 'react'
import { BookOpen, User, Lock, ArrowRight, UserPlus, ChevronLeft, Eye, EyeOff, AlertCircle, Key, Mail, Check } from 'lucide-react'
import FrostFoxLogo from '../ui/FrostFoxLogo'
import styles from './Auth.module.css'

interface AuthPageProps {
  onLogin:        (username: string, password: string) => Promise<boolean>
  onRegister:     (displayName: string, username: string, password: string, inviteCode: string) => Promise<boolean>
  onRequestReset: (email: string) => Promise<boolean>
  error:          string
  clearError:     () => void
}

type AuthMode = 'login' | 'register' | 'forgot'

export default function AuthPage({ onLogin, onRegister, onRequestReset, error, clearError }: AuthPageProps) {
  const [mode,        setMode]        = useState<AuthMode>('login')
  const [displayName, setDisplayName] = useState('')
  const [username,    setUsername]    = useState('')
  const [password,    setPassword]    = useState('')
  const [inviteCode,  setInviteCode]  = useState('')
  const [resetEmail,  setResetEmail]  = useState('')
  const [resetSent,   setResetSent]   = useState(false)
  const [showPw,      setShowPw]      = useState(false)
  const [loading,     setLoading]     = useState(false)

  const switchMode = (m: AuthMode) => {
    setMode(m)
    clearError()
    setUsername('')
    setPassword('')
    setDisplayName('')
    setInviteCode('')
    setResetEmail('')
    setResetSent(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 200))
    if (mode === 'login') {
      await onLogin(username, password)
    } else if (mode === 'register') {
      await onRegister(displayName, username, password, inviteCode)
    } else if (mode === 'forgot') {
      const ok = await onRequestReset(resetEmail)
      if (ok) setResetSent(true)
    }
    setLoading(false)
  }

  return (
    <div className={styles.page}>
      <FrostFoxLogo size="md" className={styles.brand} />

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          {(mode === 'register' || mode === 'forgot') && (
            <button className={styles.back} onClick={() => switchMode('login')}>
              <ChevronLeft size={16} /> Volver
            </button>
          )}
          <h1 className={styles.title}>
            {mode === 'login'    ? 'Bienvenido de nuevo'       :
             mode === 'register' ? 'Crear cuenta'              :
                                   'Recuperar contraseña'}
          </h1>
          <p className={styles.subtitle}>
            {mode === 'login'    ? 'Accede a tu progreso de estudio'                      :
             mode === 'register' ? 'Necesitas un código de tu academia para registrarte'  :
                                   'Te enviaremos un enlace a tu email para restablecerla'}
          </p>
        </div>

        {mode === 'forgot' && resetSent ? (
          <div style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', background: '#D1FAE5',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <Check size={22} style={{ color: '#059669' }} />
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--ink)', fontWeight: 600, margin: '0 0 0.5rem' }}>
              Email enviado
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', margin: '0 0 1.5rem' }}>
              Revisa la bandeja de <strong>{resetEmail}</strong>.<br />
              Si no lo ves, mira la carpeta de spam.
            </p>
            <button className={styles.switchBtn} onClick={() => switchMode('login')}>
              <ChevronLeft size={15} /> Volver al login
            </button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>

            {mode === 'register' && (
              <div className={styles.field}>
                <label className={styles.label}>Nombre completo</label>
                <div className={styles.inputWrap}>
                  <User size={16} className={styles.inputIcon} />
                  <input className={styles.input} type="text" placeholder="Tu nombre"
                    value={displayName} onChange={e => { setDisplayName(e.target.value); clearError() }}
                    autoComplete="name" autoFocus />
                </div>
              </div>
            )}

            {mode !== 'forgot' && (
              <div className={styles.field}>
                <label className={styles.label}>
                  {mode === 'login' ? 'Usuario o email' : 'Usuario'}
                </label>
                <div className={styles.inputWrap}>
                  <User size={16} className={styles.inputIcon} />
                  <input className={styles.input} type="text"
                    placeholder={mode === 'login' ? 'Tu usuario o email' : 'Elige un usuario'}
                    value={username} onChange={e => { setUsername(e.target.value); clearError() }}
                    autoComplete="username" autoFocus={mode === 'login'} />
                </div>
              </div>
            )}

            {mode === 'forgot' && (
              <div className={styles.field}>
                <label className={styles.label}>Tu email</label>
                <div className={styles.inputWrap}>
                  <Mail size={16} className={styles.inputIcon} />
                  <input className={styles.input} type="email"
                    placeholder="el@email.que.pusiste"
                    value={resetEmail} onChange={e => { setResetEmail(e.target.value); clearError() }}
                    autoFocus autoComplete="email" />
                </div>
              </div>
            )}

            {mode !== 'forgot' && (
              <div className={styles.field}>
                <label className={styles.label}>Contraseña</label>
                <div className={styles.inputWrap}>
                  <Lock size={16} className={styles.inputIcon} />
                  <input className={styles.input} type={showPw ? 'text' : 'password'}
                    placeholder="••••••••" value={password}
                    onChange={e => { setPassword(e.target.value); clearError() }}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                  <button type="button" className={styles.eyeBtn}
                    onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {mode === 'login' && (
                  <button type="button"
                    onClick={() => switchMode('forgot')}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '0.8rem', color: 'var(--ink-muted)', padding: '0.25rem 0',
                      textAlign: 'right', width: '100%', marginTop: '0.25rem',
                    }}>
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
            )}

            {mode === 'register' && (
              <div className={styles.field}>
                <label className={styles.label}>Código de academia</label>
                <div className={styles.inputWrap}>
                  <Key size={16} className={styles.inputIcon} />
                  <input className={styles.input} type="text" placeholder="ARCH-XXXX"
                    value={inviteCode}
                    onChange={e => { setInviteCode(e.target.value.toUpperCase()); clearError() }}
                    autoComplete="off" maxLength={9}
                    style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'monospace' }} />
                </div>
              </div>
            )}

            {error && (
              <div className={styles.error}>
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <button
              className={[styles.submit, loading ? styles.submitLoading : ''].join(' ')}
              type="submit" disabled={loading}>
              {loading ? (
                <span className={styles.spinner} />
              ) : mode === 'forgot' ? (
                <><Mail size={16} /> Enviar enlace de recuperación</>
              ) : mode === 'login' ? (
                <>Entrar <ArrowRight size={16} /></>
              ) : (
                <>Crear cuenta <ArrowRight size={16} /></>
              )}
            </button>
          </form>
        )}

        {mode === 'login' && (
          <>
            <div className={styles.divider}><span>o</span></div>
            <button className={styles.switchBtn} onClick={() => switchMode('register')}>
              <UserPlus size={15} /> ¿Primera vez? Crear cuenta nueva
            </button>
          </>
        )}
      </div>

      <p className={styles.note}>
        Plataforma de preparación de oposiciones
      </p>
    </div>
  )
}
