import { describe, it, expect } from 'vitest'

// ── Lógica extraída de loadProfile ────────────────────────────────────────
// Estas funciones replican exactamente las decisiones de useAuth.loadProfile

function calcAccesoExpirado(accessUntil: string | null, role: string): boolean {
  if (['profesor', 'director', 'superadmin'].includes(role)) return false
  if (!accessUntil) return false
  return new Date(accessUntil) < new Date()
}

function calcAcademySuspended(suspended: boolean | undefined, role: string): boolean {
  if (role === 'superadmin') return false
  return suspended === true
}

function calcAcademyDeleted(deletedAt: string | null | undefined, role: string): boolean {
  if (role === 'superadmin') return false
  return !!deletedAt
}

function calcForcePasswordChange(forcePasswordChange: boolean | undefined, role: string): boolean {
  if (!['profesor', 'director'].includes(role)) return false
  return forcePasswordChange ?? false
}

// ── Validación de registro ────────────────────────────────────────────────
function validateRegister(displayName: string, username: string, password: string, inviteCode: string): string | null {
  if (!displayName.trim() || !username.trim() || !password) return 'Rellena todos los campos'
  if (password.length < 4) return 'La contrasena debe tener al menos 4 caracteres'
  if (!inviteCode?.trim()) return 'Necesitas un codigo de academia para registrarte'
  return null
}

// ── Cálculo de días restantes de acceso ───────────────────────────────────
function calcDiasRestantes(accessUntil: string | null): number | null {
  if (!accessUntil) return null
  return Math.ceil((new Date(accessUntil).getTime() - new Date().getTime()) / 86400000)
}

// ─────────────────────────────────────────────────────────────────────────────

describe('calcAccesoExpirado', () => {
  const pasado = '2000-01-01'
  const futuro = '2099-01-01'

  it('alumno con acceso expirado → true',          () => expect(calcAccesoExpirado(pasado, 'alumno')).toBe(true))
  it('alumno con acceso vigente → false',           () => expect(calcAccesoExpirado(futuro, 'alumno')).toBe(false))
  it('alumno sin fecha de acceso → false',          () => expect(calcAccesoExpirado(null, 'alumno')).toBe(false))
  it('profesor con acceso expirado → false',        () => expect(calcAccesoExpirado(pasado, 'profesor')).toBe(false))
  it('director con acceso expirado → false',        () => expect(calcAccesoExpirado(pasado, 'director')).toBe(false))
  it('superadmin con acceso expirado → false',      () => expect(calcAccesoExpirado(pasado, 'superadmin')).toBe(false))
})

describe('calcAcademySuspended', () => {
  it('academia suspendida para alumno → true',      () => expect(calcAcademySuspended(true, 'alumno')).toBe(true))
  it('academia no suspendida para alumno → false',  () => expect(calcAcademySuspended(false, 'alumno')).toBe(false))
  it('academia suspendida para superadmin → false', () => expect(calcAcademySuspended(true, 'superadmin')).toBe(false))
  it('academia suspendida para director → true',    () => expect(calcAcademySuspended(true, 'director')).toBe(true))
  it('undefined → false',                           () => expect(calcAcademySuspended(undefined, 'alumno')).toBe(false))
})

describe('calcAcademyDeleted', () => {
  it('academia eliminada para alumno → true',       () => expect(calcAcademyDeleted('2024-01-01', 'alumno')).toBe(true))
  it('academia no eliminada → false',               () => expect(calcAcademyDeleted(null, 'alumno')).toBe(false))
  it('academia eliminada para superadmin → false',  () => expect(calcAcademyDeleted('2024-01-01', 'superadmin')).toBe(false))
})

describe('calcForcePasswordChange', () => {
  it('profesor con force=true → true',              () => expect(calcForcePasswordChange(true, 'profesor')).toBe(true))
  it('director con force=true → true',              () => expect(calcForcePasswordChange(true, 'director')).toBe(true))
  it('alumno con force=true → false',               () => expect(calcForcePasswordChange(true, 'alumno')).toBe(false))
  it('superadmin con force=true → false',           () => expect(calcForcePasswordChange(true, 'superadmin')).toBe(false))
  it('profesor con force=false → false',            () => expect(calcForcePasswordChange(false, 'profesor')).toBe(false))
  it('profesor con force=undefined → false',        () => expect(calcForcePasswordChange(undefined, 'profesor')).toBe(false))
})

describe('validateRegister', () => {
  it('todos los campos correctos → null',           () => expect(validateRegister('Ana García', 'ana', '1234', 'ABC123')).toBeNull())
  it('displayName vacío → error',                   () => expect(validateRegister('', 'ana', '1234', 'ABC123')).toBeTruthy())
  it('username vacío → error',                      () => expect(validateRegister('Ana', '', '1234', 'ABC123')).toBeTruthy())
  it('password vacío → error',                      () => expect(validateRegister('Ana', 'ana', '', 'ABC123')).toBeTruthy())
  it('password menos de 4 chars → error',           () => expect(validateRegister('Ana', 'ana', '12', 'ABC123')).toBeTruthy())
  it('sin código de academia → error',              () => expect(validateRegister('Ana', 'ana', '1234', '')).toBeTruthy())
  it('código solo espacios → error',                () => expect(validateRegister('Ana', 'ana', '1234', '   ')).toBeTruthy())
})

describe('calcDiasRestantes', () => {
  it('sin fecha → null',                            () => expect(calcDiasRestantes(null)).toBeNull())
  it('fecha futura → número positivo',              () => {
    const en10 = new Date(Date.now() + 10 * 86400000).toISOString()
    expect(calcDiasRestantes(en10)).toBeGreaterThan(0)
  })
  it('fecha pasada → número negativo',              () => {
    const hace5 = new Date(Date.now() - 5 * 86400000).toISOString()
    expect(calcDiasRestantes(hace5)).toBeLessThan(0)
  })
})