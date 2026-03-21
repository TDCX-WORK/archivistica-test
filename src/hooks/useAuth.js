import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [recoveryMode, setRecoveryMode] = useState(false) // token de recuperación detectado

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadProfile(session.user)
      else { setCurrentUser(null); setLoading(false) }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Detectar cuando Supabase redirige con un token de recuperación
      if (_event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true)
        setLoading(false)
        return
      }
      if (session?.user) loadProfile(session.user)
      else { setCurrentUser(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, role, academy_id, subject_id, access_until, force_password_change, academies(name, suspended, deleted_at), subjects(name)')
      .eq('id', user.id)
      .single()

    const accessUntil    = profile?.access_until ? new Date(profile.access_until) : null
    const accesoExpirado = accessUntil ? accessUntil < new Date() : false

    const academySuspended = profile?.academies?.suspended === true
    const academyDeleted   = !!profile?.academies?.deleted_at

    setCurrentUser({
      id:                   user.id,
      username:             profile?.username ?? user.email?.split('@')[0] ?? 'usuario',
      displayName:          profile?.username ?? user.email?.split('@')[0] ?? 'usuario',
      role:                 profile?.role ?? 'alumno',
      academy_id:           profile?.academy_id ?? null,
      subject_id:           profile?.subject_id ?? null,
      access_until:         profile?.access_until ?? null,
      academyName:          profile?.academies?.name ?? null,
      academySuspended:     profile?.role === 'superadmin' ? false : academySuspended,
      academyDeleted:       profile?.role === 'superadmin' ? false : academyDeleted,
      subjectName:          profile?.subjects?.name ?? null,
      accesoExpirado:       ['profesor','director','superadmin'].includes(profile?.role) ? false : accesoExpirado,
      forcePasswordChange:  ['profesor','director'].includes(profile?.role) ? (profile?.force_password_change ?? false) : false,
    })
    setLoading(false)
  }

  const register = useCallback(async (displayName, username, password, inviteCode) => {
    setError('')

    if (!displayName.trim() || !username.trim() || !password) {
      setError('Rellena todos los campos'); return false
    }
    if (password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres'); return false
    }
    if (!inviteCode?.trim()) {
      setError('Necesitas un código de academia para registrarte'); return false
    }

    // 1. Validar código
    const { data: codeData, error: codeErr } = await supabase
      .from('invite_codes')
      .select('id, academy_id, subject_id, used_by, expires_at, access_months')
      .eq('code', inviteCode.trim().toUpperCase())
      .maybeSingle()

    if (codeErr || !codeData) { setError('Código de academia inválido'); return false }
    if (codeData.used_by)     { setError('Este código ya ha sido utilizado'); return false }
    if (new Date(codeData.expires_at) < new Date()) {
      setError('Este código ha expirado. Pide uno nuevo a tu profesor'); return false
    }

    // 2. Crear usuario
    const fakeEmail = `${username.trim().toLowerCase()}@archivistica.test`
    const { data, error: signUpError } = await supabase.auth.signUp({ email: fakeEmail, password })

    if (signUpError) {
      setError(signUpError.message.includes('already registered')
        ? 'Ese nombre de usuario ya existe'
        : signUpError.message)
      return false
    }
    if (!data.user) { setError('Error creando la cuenta'); return false }

    // 3. Calcular fecha de expiración de acceso
    const accessUntil = new Date()
    accessUntil.setMonth(accessUntil.getMonth() + (codeData.access_months || 3))

    // 4. Crear perfil con fecha de acceso
    const { error: profileErr } = await supabase.from('profiles').insert({
      id:           data.user.id,
      username:     username.trim().toLowerCase(),
      role:         'alumno',
      academy_id:   codeData.academy_id,
      subject_id:   codeData.subject_id ?? null,
      access_until: accessUntil.toISOString(),
    })

    if (profileErr) { setError('Error creando el perfil'); return false }

    // 5. Marcar código como usado
    await supabase
      .from('invite_codes')
      .update({ used_by: data.user.id, used_at: new Date().toISOString() })
      .eq('id', codeData.id)

    return true
  }, [])

  const login = useCallback(async (username, password) => {
    setError('')
    const cleanUsername = username.trim().toLowerCase()

    // Buscar el email real del usuario — puede ser cualquier formato @slug.rol
    // Supabase no permite buscar users por email sin autenticarse,
    // pero podemos buscar en profiles y luego construir el email
    // Para superadmin (cris@archivistica.test) intentamos primero el formato viejo
    const emailsToTry = [
      // Formato superadmin legacy
      `${cleanUsername}@archivistica.test`,
    ]

    // Buscar en la tabla auth.users via RPC para obtener el email real
    const { data: emailData } = await supabase
      .rpc('get_user_email_by_username', { p_username: cleanUsername })

    if (emailData) emailsToTry.unshift(emailData)

    let success = false
    for (const email of emailsToTry) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (!signInError) { success = true; break }
    }

    if (!success) {
      // Supabase devuelve 'User is banned' si el usuario está baneado
      setError('Usuario o contraseña incorrectos')
      return false
    }
    return true
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setCurrentUser(null)
    setError('')
  }, [])

  const clearError = useCallback(() => setError(''), [])

  const clearForcePasswordChange = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from('profiles')
      .update({ force_password_change: false })
      .eq('id', user.id)
    setCurrentUser(u => u ? { ...u, forcePasswordChange: false } : u)
  }, [])

  // Solicitar email de recuperación de contraseña
  const requestPasswordReset = useCallback(async (email) => {
    setError('')
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: window.location.origin }
    )
    if (resetErr) { setError(resetErr.message); return false }
    return true
  }, [])

  // Confirmar nueva contraseña tras recuperación (desde el enlace del email)
  const confirmPasswordReset = useCallback(async (newPassword) => {
    setError('')
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword })
    if (updateErr) { setError(updateErr.message); return false }
    setRecoveryMode(false)
    // Recargar el perfil del usuario tras el cambio
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await loadProfile(user)
    return true
  }, [])

  return {
    currentUser, loading, login, register, logout, error, clearError,
    clearForcePasswordChange,
    recoveryMode, requestPasswordReset, confirmPasswordReset,
  }
}

export default useAuth
