import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { CurrentUser } from '../types'

const EDGE_RESET_PASSWORD = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-password`

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
    inviteCode:  string,
    email:       string
  ): Promise<boolean> => {
    setError('')

    if (!displayName.trim() || !username.trim() || !password) {
      setError('Rellena todos los campos'); return false
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres'); return false
    }
    if (!inviteCode?.trim()) {
      setError('Necesitas un código de academia para registrarte'); return false
    }
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Introduce un email válido para poder recuperar tu contraseña'); return false
    }

    isRegisteringRef.current = true
    const cleanUsername = username.trim().toLowerCase()
    const realEmail     = email.trim().toLowerCase()

    // ── 1. Validar código de invitación ─────────────────────────────────
    const { data: codeData, error: codeErr } = await supabase
      .from('invite_codes')
      .select('id, academy_id, subject_id, used_by, expires_at, access_months, created_by')
      .eq('code', inviteCode.trim().toUpperCase())
      .maybeSingle()

    if (codeErr || !codeData) {
      isRegisteringRef.current = false
      setError('Código de academia inválido')
      return false
    }
    if (codeData.used_by) {
      isRegisteringRef.current = false
      setError('Este código ya ha sido utilizado')
      return false
    }
    if (new Date(codeData.expires_at) < new Date()) {
      isRegisteringRef.current = false
      setError('Este código ha expirado. Pide uno nuevo a tu profesor')
      return false
    }

    // ── 2. Validar username no duplicado ────────────────────────────────
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', cleanUsername)
      .maybeSingle()

    if (existingUser) {
      isRegisteringRef.current = false
      setError(`El nombre de usuario "${cleanUsername}" ya está en uso. Elige otro.`)
      return false
    }

    // ── 3. Validar email no duplicado ───────────────────────────────────
    // Comprueba en student_profiles y staff_profiles (no en auth.users,
    // que se comprobará al hacer signUp)
    const { data: emailAvailable } = await supabase
      .rpc('check_email_available', { p_email: realEmail, p_user_id: '00000000-0000-0000-0000-000000000000' })

    if (emailAvailable === false) {
      isRegisteringRef.current = false
      setError('Este email ya está en uso en la plataforma. Usa otro.')
      return false
    }

    // ── 4. Crear cuenta en auth.users con email REAL ────────────────────
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: realEmail,
      password,
    })

    if (signUpError) {
      isRegisteringRef.current = false
      setError(signUpError.message.includes('already registered')
        ? 'Este email ya tiene una cuenta asociada. Usa otro email o inicia sesión.'
        : signUpError.message)
      return false
    }
    if (!data.user) {
      isRegisteringRef.current = false
      setError('Error creando la cuenta')
      return false
    }

    // ── 5. Crear perfil ─────────────────────────────────────────────────
    const accessUntil = new Date()
    accessUntil.setMonth(accessUntil.getMonth() + (codeData.access_months || 3))

    const { error: profileErr } = await supabase.from('profiles').insert({
      id:           data.user.id,
      username:     cleanUsername,
      role:         'alumno',
      academy_id:   codeData.academy_id,
      subject_id:   codeData.subject_id ?? null,
      access_until: accessUntil.toISOString(),
    })

    if (profileErr) {
      isRegisteringRef.current = false
      const msg = profileErr.message || ''
      setError(msg.includes('duplicate') || msg.includes('unique')
        ? `El nombre de usuario "${cleanUsername}" ya está en uso. Elige otro.`
        : 'Error creando el perfil. Inténtalo de nuevo.')
      return false
    }

    // ── 6. Crear student_profiles vacío (wizard lo rellenará) ───────────
    await supabase.from('student_profiles').insert({
      id:                   data.user.id,
      email_contact:        realEmail,
      onboarding_completed: false,
    })

    // ── 7. Marcar código como usado (RPC segura) ────────────────────────
    await supabase.rpc('mark_invite_code_used', {
      p_code: inviteCode.trim().toUpperCase(),
    })

    // ── 8. Notificaciones al profesor y director (individuales) ─────────
    const uname = cleanUsername
    try {
      if (codeData.created_by) {
        await supabase.from('notifications').insert({
          user_id: codeData.created_by,
          type:    'nuevo_alumno',
          title:   `Nuevo alumno: ${uname}`,
          body:    'Se ha registrado con tu código de invitación.',
          link:    '/profesor',
        })
      }
    } catch (_) {}

    try {
      const { data: director } = await supabase
        .from('profiles')
        .select('id')
        .eq('academy_id', codeData.academy_id)
        .eq('role', 'director')
        .maybeSingle()

      if (director) {
        await supabase.from('notifications').insert({
          user_id: director.id,
          type:    'nuevo_alumno',
          title:   `Nuevo alumno en tu academia: ${uname}`,
          body:    'Un alumno acaba de registrarse con un código de invitación.',
          link:    '/direccion',
        })
      }
    } catch (_) {}

    // ── 9. Cargar perfil y entrar ───────────────────────────────────────
    isRegisteringRef.current = false
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) await loadProfile(session.user)

    return true
  }, [])

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    setError('')
    const cleanUsername = username.trim().toLowerCase()

    const { data: emailData } = await supabase
      .rpc('get_user_email_by_username', { p_username: cleanUsername })

    if (!emailData) {
      setError('Usuario o contraseña incorrectos')
      return false
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: emailData as string,
      password,
    })

    if (signInError) {
      setError('Usuario o contraseña incorrectos')
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

  const requestPasswordReset = useCallback(async (usernameInput: string): Promise<boolean> => {
    setError('')
    const cleanUsername = usernameInput.trim().toLowerCase()

    if (!cleanUsername) {
      setError('Introduce tu nombre de usuario')
      return false
    }

    try {
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string
      const res = await fetch(EDGE_RESET_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'apikey':         supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ username: cleanUsername }),
      })

      const result = await res.json()

      if (result.no_email) {
        setError('No tienes un email asociado a tu cuenta. Contacta con tu academia para recuperar tu contraseña.')
        return false
      }

      if (result.email_conflict) {
        setError('Hay un problema con el email de tu cuenta. Contacta con tu academia para resolverlo.')
        return false
      }

      // Siempre devolvemos true para no revelar si el username existe o no
      return true
    } catch (_) {
      setError('Error de conexión. Inténtalo de nuevo.')
      return false
    }
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