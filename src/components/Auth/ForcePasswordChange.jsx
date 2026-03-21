import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Lock, Eye, EyeOff, ArrowRight, AlertCircle, Check } from 'lucide-react'
import styles from '../Auth/Auth.module.css'

export default function ForcePasswordChange({ currentUser, onDone, isRecovery = false }) {
  const [password,    setPassword]    = useState('')
  const [password2,   setPassword2]   = useState('')
  const [showPw,      setShowPw]      = useState(false)
  const [showPw2,     setShowPw2]     = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== password2) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    if (isRecovery) {
      // Modo recuperación: onDone hace el updateUser internamente
      const ok = await onDone(password)
      if (!ok) { setError('No se pudo cambiar la contraseña. El enlace puede haber expirado.'); setLoading(false) }
      return
    }

    // Modo primer login: cambiar contraseña y limpiar flag
    const { error: authErr } = await supabase.auth.updateUser({ password })
    if (authErr) {
      setError(authErr.message)
      setLoading(false)
      return
    }
    await onDone()
    setLoading(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'var(--surface-raised)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <Lock size={22} strokeWidth={1.8} style={{ color: 'var(--ink)' }} />
          </div>
          <h1 className={styles.title}>
            {isRecovery ? 'Nueva contraseña' : 'Cambia tu contraseña'}
          </h1>
          <p className={styles.subtitle}>
            {isRecovery
              ? 'Elige una contraseña nueva para tu cuenta.'
              : <>Hola <strong>{currentUser.username}</strong>, es tu primer acceso. Elige una contraseña nueva para continuar.</>
            }
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label}>Nueva contraseña</label>
            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                className={styles.input}
                type={showPw ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                autoFocus
                autoComplete="new-password"
              />
              <button type="button" className={styles.eyeBtn}
                onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Repite la contraseña</label>
            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                className={styles.input}
                type={showPw2 ? 'text' : 'password'}
                placeholder="Repite la contraseña"
                value={password2}
                onChange={e => { setPassword2(e.target.value); setError('') }}
                autoComplete="new-password"
              />
              <button type="button" className={styles.eyeBtn}
                onClick={() => setShowPw2(v => !v)} tabIndex={-1}>
                {showPw2 ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Indicador de coincidencia */}
          {password && password2 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              fontSize: '0.82rem', fontWeight: 500,
              color: password === password2 ? '#059669' : '#DC2626',
              marginTop: '-0.25rem',
            }}>
              {password === password2
                ? <><Check size={13} /> Las contraseñas coinciden</>
                : <><AlertCircle size={13} /> No coinciden</>
              }
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
            type="submit"
            disabled={loading || !password || !password2}
          >
            {loading
              ? <span className={styles.spinner} />
              : <><Check size={16} /> Guardar y entrar <ArrowRight size={16} /></>
            }
          </button>
        </form>
      </div>

      <p className={styles.note}>
        {isRecovery
          ? 'Tras guardar entrarás directamente a tu cuenta.'
          : 'Esta pantalla solo aparece una vez. Después entrarás directamente.'
        }
      </p>
    </div>
  )
}
