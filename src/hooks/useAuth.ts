import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { CurrentUser } from '../types'

async function generateLoginNotifications(userId: string, accessUntil: string | null): Promise<void> {
  try {
    const today = new Date().toISOString().slice(0, 10)

    const { count: pendientes } = await supabase
      .from('wrong_answers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .lte('next_review', today)

    if ((pendientes ?? 0) > 0) {
      // El índice único en BD evita duplicados automáticamente
      await supabase.from('notifications').insert({
        user_id: userId,
        type:    'repaso_pendiente',
        title:   `Tienes ${pendientes} pregunta${pendientes !== 1 ? 's' : ''} pendiente${pendientes !== 1 ? 's' : ''} de repasar`,
        body:    'Tu sesion de repaso espaciado esta lista. Dedica unos minutos antes de estudiar temario nuevo.',
        link:    '/',
      })
    }

    if (accessUntil) {
      const diasRestantes = Math.ceil((new Date(accessUntil).getTime() - new Date().getTime()) / 86400000)
      if (diasRestantes > 0 && diasRestantes <= 7) {
        await supabase.from('notifications').insert({
          user_id: userId,
          type:    'acceso_expira',
          title:   `Tu acceso expira en ${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''}`,
          body:    'Contacta con tu profesor para renovar el acceso antes de que expire.',
          link:    '/',
        })
      }
    }
  } catch (_) {
    // Las notificaciones no deben bloquear el login
  }
}


export function useAuth() {
  const [currentUser,  setCurrentUser]  = useState<CurrentUser | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [recoveryMode, setRecoveryMode] = useState(false)

  const isRegisteringRef = useRef(false)

  useEffect(() => {
    let loadingProfileId: string | null = null

    async function safeLoadProfile(user: { id: string }) {
      if (loadingProfileId === user.id) return
      loadingProfileId = user.id
      await loadProfile(user)
      loadingProfileId = null
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) safeLoadProfile(session.user)
      else { setCurrentUser(null); setLoading(false) }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true)
        setLoading(false)
        return
      }
      if (isRegisteringRef.current) return
      if (session?.user) safeLoadProfile(session.user)
      else { setCurrentUser(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(user: { id: string }) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, role, academy_id, subject_id, access_until, force_password_change, academies(name, suspended, deleted_at), subjects(name, exam_config)')
      .eq('id', user.id)
      .single()

    let onboardingCompleted = true
    if (profile?.role === 'alumno') {
      let sp: { onboarding_completed: boolean | null } | null = null
      for (let i = 0; i < 3; i++) {
        const { data } = await supabase
          .from('student_profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .maybeSingle()
        sp = data
        if (sp !== null) break
        await new Promise(r => setTimeout(r, 500))
      }
      onboardingCompleted = sp?.onboarding_completed === true
    }

    const accessUntil      = profile?.access_until ? new Date(profile.access_until) : null
    const accesoExpirado   = accessUntil ? accessUntil < new Date() : false
    const academySuspended = (profile?.academies as { suspended?: boolean } | null)?.suspended === true
    const academyDeleted   = !!(profile?.academies as { deleted_at?: string | null } | null)?.deleted_at

    setCurrentUser({
      id:                  user.id,
      username:            profile?.username ?? 'usuario',
      displayName:         profile?.username ?? 'usuario',
      role:                (profile?.role ?? 'alumno') as CurrentUser['role'],
      academy_id:          profile?.academy_id ?? null,
      subject_id:          profile?.subject_id ?? null,
      access_until:        profile?.access_until ?? null,
      academyName:         (profile?.academies as { name?: string } | null)?.name ?? null,
      academySuspended:    profile?.role === 'superadmin' ? false : academySuspended,
      academyDeleted:      profile?.role === 'superadmin' ? false : academyDeleted,
      subjectName:         (profile?.subjects as { name?: string } | null)?.name ?? null,
      accesoExpirado:      ['profesor','director','superadmin'].includes(profile?.role ?? '') ? false : accesoExpirado,
      forcePasswordChange: ['profesor','director'].includes(profile?.role ?? '') ? (profile?.force_password_change ?? false) : false,
      onboardingCompleted,
      examConfig:          (profile?.subjects as { exam_config?: import('../types').ExamConfig | null } | null)?.exam_config ?? null,
    })
    setLoading(false)

    if (profile?.role === 'alumno' && !accesoExpirado && !academySuspended && !academyDeleted) {
      generateLoginNotifications(user.id, profile?.access_until ?? null)
    }
  }

  const register = useCallback(async (
    displayName: string,
    username:    string,
    password:    string,
    inviteCode:  string
  ): Promise<boolean> => {
    setError('')

    if (!displayName.trim() || !username.trim() || !password) {
      setError('Rellena todos los campos'); return false
    }
    if (password.length < 4) {
      setError('La contrasena debe tener al menos 4 caracteres'); return false
    }
    if (!inviteCode?.trim()) {
      setError('Necesitas un codigo de academia para registrarte'); return false
    }

    isRegisteringRef.current = true

    const { data: codeData, error: codeErr } = await supabase
      .from('invite_codes')
      .select('id, academy_id, subject_id, used_by, expires_at, access_months, created_by')
      .eq('code', inviteCode.trim().toUpperCase())
      .maybeSingle()

    if (codeErr || !codeData) { setError('Codigo de academia invalido'); return false }
    if (codeData.used_by)     { setError('Este codigo ya ha sido utilizado'); return false }
    if (new Date(codeData.expires_at) < new Date()) {
      setError('Este codigo ha expirado. Pide uno nuevo a tu profesor'); return false
    }

    const uid       = Math.random().toString(36).substring(2, 8)
    const fakeEmail = `${username.trim().toLowerCase()}.${uid}@app.alumno`
    const { data, error: signUpError } = await supabase.auth.signUp({ email: fakeEmail, password })

    if (signUpError) {
      isRegisteringRef.current = false
      setError(signUpError.message.includes('already registered')
        ? `El nombre de usuario "${username.trim().toLowerCase()}" ya esta en uso.`
        : signUpError.message)
      return false
    }
    if (!data.user) { isRegisteringRef.current = false; setError('Error creando la cuenta'); return false }

    const accessUntil = new Date()
    accessUntil.setMonth(accessUntil.getMonth() + (codeData.access_months || 3))

    const { error: profileErr } = await supabase.from('profiles').insert({
      id:           data.user.id,
      username:     username.trim().toLowerCase(),
      role:         'alumno',
      academy_id:   codeData.academy_id,
      subject_id:   codeData.subject_id ?? null,
      access_until: accessUntil.toISOString(),
    })

    if (profileErr) {
      isRegisteringRef.current = false
      const msg = profileErr.message || ''
      setError(msg.includes('duplicate') || msg.includes('unique')
        ? `El nombre de usuario "${username.trim().toLowerCase()}" ya esta en uso. Elige otro.`
        : 'Error creando el perfil. Intentalo de nuevo.')
      return false
    }

    await supabase
      .from('invite_codes')
      .update({ used_by: data.user.id, used_at: new Date().toISOString() })
      .eq('id', codeData.id)

    try {
      const notifs: {
        user_id: string
        type:    string
        title:   string
        body:    string
        link:    string
      }[] = []
      const uname = username.trim().toLowerCase()

      if (codeData.created_by) {
        notifs.push({
          user_id: codeData.created_by,
          type:    'nuevo_alumno',
          title:   `Nuevo alumno: ${uname}`,
          body:    'Se ha registrado con tu codigo de invitacion.',
          link:    '/profesor',
        })
      }

      const { data: director } = await supabase
        .from('profiles')
        .select('id')
        .eq('academy_id', codeData.academy_id)
        .eq('role', 'director')
        .maybeSingle()

      if (director) {
        notifs.push({
          user_id: director.id,
          type:    'nuevo_alumno',
          title:   `Nuevo alumno en tu academia: ${uname}`,
          body:    'Un alumno acaba de registrarse con un codigo de invitacion.',
          link:    '/direccion',
        })
      }

      if (notifs.length > 0) {
        await supabase.from('notifications').insert(notifs)
      }
    } catch (_) {}

    isRegisteringRef.current = false
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) await loadProfile(session.user)

    return true
  }, [])

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    setError('')
    const cleanUsername = username.trim().toLowerCase()

    const emailsToTry: string[] = []
    const { data: emailData } = await supabase
      .rpc('get_user_email_by_username', { p_username: cleanUsername })
    if (emailData) emailsToTry.push(emailData as string)

    let success = false
    for (const email of emailsToTry) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (!signInError) { success = true; break }
    }

    if (!success) {
      setError('Usuario o contrasena incorrectos')
      return false
    }
    return true
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    await supabase.auth.signOut()
    setCurrentUser(null)
    setError('')
  }, [])

  const clearError = useCallback(() => setError(''), [])

  const clearForcePasswordChange = useCallback(async (): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from('profiles')
      .update({ force_password_change: false })
      .eq('id', user.id)
    setCurrentUser(u => u ? { ...u, forcePasswordChange: false } : u)
  }, [])

  const requestPasswordReset = useCallback(async (email: string): Promise<boolean> => {
    setError('')
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: window.location.origin }
    )
    if (resetErr) { setError(resetErr.message); return false }
    return true
  }, [])

  const confirmPasswordReset = useCallback(async (newPassword: string): Promise<boolean> => {
    setError('')
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword })
    if (updateErr) { setError(updateErr.message); return false }
    setRecoveryMode(false)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await loadProfile(user)
    return true
  }, [])

  const completeOnboarding = useCallback((): void => {
    setCurrentUser(u => u ? { ...u, onboardingCompleted: true } : u)
  }, [])

  const updateDisplayName = useCallback((name: string): void => {
    setCurrentUser(u => u ? { ...u, username: name, displayName: name } : u)
  }, [])

  return {
    currentUser, loading, login, register, logout, error, clearError,
    clearForcePasswordChange, completeOnboarding, updateDisplayName,
    recoveryMode, requestPasswordReset, confirmPasswordReset,
  }
}

export default useAuth