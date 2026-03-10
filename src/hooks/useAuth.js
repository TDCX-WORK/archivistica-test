import { useState, useCallback } from 'react'

const USERS_KEY  = 'arch_users'
const SESSION_KEY = 'arch_session'

function hashPassword(pw) {
  // Simple reversible obfuscation (no backend = no real crypto needed)
  return btoa(encodeURIComponent(pw))
}

function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]') } catch { return [] }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') } catch { return null }
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(() => getSession())
  const [error, setError] = useState('')

  const login = useCallback((username, password) => {
    setError('')
    const users = getUsers()
    const user  = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase())
    if (!user) { setError('Usuario no encontrado'); return false }
    if (user.passwordHash !== hashPassword(password)) { setError('Contraseña incorrecta'); return false }
    const session = { id: user.id, username: user.username, displayName: user.displayName }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    setCurrentUser(session)
    return true
  }, [])

  const register = useCallback((displayName, username, password) => {
    setError('')
    if (!displayName.trim() || !username.trim() || !password) { setError('Rellena todos los campos'); return false }
    if (password.length < 4) { setError('La contraseña debe tener al menos 4 caracteres'); return false }
    const users = getUsers()
    if (users.find(u => u.username.toLowerCase() === username.trim().toLowerCase())) {
      setError('Ese nombre de usuario ya existe'); return false
    }
    const newUser = {
      id: `u_${Date.now()}`,
      displayName: displayName.trim(),
      username: username.trim().toLowerCase(),
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString()
    }
    saveUsers([...users, newUser])
    const session = { id: newUser.id, username: newUser.username, displayName: newUser.displayName }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    setCurrentUser(session)
    return true
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    setCurrentUser(null)
    setError('')
  }, [])

  const clearError = useCallback(() => setError(''), [])

  return { currentUser, login, register, logout, error, clearError }
}

export default useAuth
