import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')

  // Escucha cambios de sesión (refresco, logout, etc.)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user)
      } else {
        setCurrentUser(null)
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user)
      } else {
        setCurrentUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()

    setCurrentUser({
      id:          user.id,
      username:    profile?.username ?? user.email?.split('@')[0] ?? 'usuario',
      displayName: profile?.username ?? user.email?.split('@')[0] ?? 'usuario',
    })
    setLoading(false)
  }

  // Registro: usuario + contraseña (usamos email falso internamente)
  const register = useCallback(async (displayName, username, password) => {
    setError('')
    if (!displayName.trim() || !username.trim() || !password) {
      setError('Rellena todos los campos'); return false
    }
    if (password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres'); return false
    }

    const fakeEmail = `${username.trim().toLowerCase()}@archivistica.app`

    const { data, error: signUpError } = await supabase.auth.signUp({
      email:    fakeEmail,
      password,
    })

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setError('Ese nombre de usuario ya existe')
      } else {
        setError(signUpError.message)
      }
      return false
    }

    // Guardar el username en profiles
    if (data.user) {
      await supabase.from('profiles').insert({
        id:       data.user.id,
        username: username.trim().toLowerCase(),
      })
    }

    return true
  }, [])

  // Login: usuario + contraseña
  const login = useCallback(async (username, password) => {
    setError('')
    const fakeEmail = `${username.trim().toLowerCase()}@archivistica.app`

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email:    fakeEmail,
      password,
    })

    if (signInError) {
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

  return { currentUser, loading, login, register, logout, error, clearError }
}

export default useAuth
