import { describe, it, expect } from 'vitest'

// ── calcStreak (extraída para testear) ─────────────────────────────────────
// Misma lógica que useProgress.calcStreak
function calcStreak(sessions: { played_at: string }[]): number {
  if (!sessions.length) return 0
  const days = [...new Set(sessions.map(s => s.played_at))].sort().reverse()
  const today     = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (days[0] !== today && days[0] !== yesterday) return 0
  let streak = 1
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]!)
    const curr = new Date(days[i]!)
    if ((prev.getTime() - curr.getTime()) / 86400000 === 1) streak++
    else break
  }
  return streak
}

// ── Lógica de spaced repetition (extraída de recordCorrectReview) ──────────
function calcNextReviewDays(correctStreak: number): number | null {
  const newStreak = correctStreak + 1
  if (newStreak === 1) return 3
  if (newStreak === 2) return 7
  if (newStreak === 3) return 30
  return null // >= 4: borrar la pregunta
}

// ── calcScore ──────────────────────────────────────────────────────────────
function calcScore(correct: number, total: number): number {
  return total > 0 ? Math.round((correct / total) * 100) : 0
}

// ─────────────────────────────────────────────────────────────────────────────

describe('calcStreak', () => {
  const hoy  = new Date().toISOString().slice(0, 10)
  const ayer = new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10)
  const ant  = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10)
  const hace5 = new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10)

  it('devuelve 0 para array vacío',                () => expect(calcStreak([])).toBe(0))
  it('devuelve 1 si solo estudió hoy',             () => expect(calcStreak([{ played_at: hoy }])).toBe(1))
  it('devuelve 1 si solo estudió ayer',            () => expect(calcStreak([{ played_at: ayer }])).toBe(1))
  it('devuelve 0 si última sesión fue hace 5 días',() => expect(calcStreak([{ played_at: hace5 }])).toBe(0))

  it('calcula racha de 3 días consecutivos', () => {
    const sessions = [hoy, ayer, ant].map(d => ({ played_at: d }))
    expect(calcStreak(sessions)).toBe(3)
  })

  it('rompe la racha si hay un hueco', () => {
    // hoy + hace 5 días — no son consecutivos
    const sessions = [hoy, hace5].map(d => ({ played_at: d }))
    expect(calcStreak(sessions)).toBe(1)
  })

  it('deduplica sesiones del mismo día', () => {
    // 3 sesiones hoy + 1 ayer = racha 2, no 4
    const sessions = [hoy, hoy, hoy, ayer].map(d => ({ played_at: d }))
    expect(calcStreak(sessions)).toBe(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('calcNextReviewDays (spaced repetition)', () => {
  it('primera vez bien → 3 días',      () => expect(calcNextReviewDays(0)).toBe(3))
  it('segunda vez bien → 7 días',      () => expect(calcNextReviewDays(1)).toBe(7))
  it('tercera vez bien → 30 días',     () => expect(calcNextReviewDays(2)).toBe(30))
  it('cuarta vez bien → eliminar (null)', () => expect(calcNextReviewDays(3)).toBeNull())
  it('quinta vez bien → eliminar (null)', () => expect(calcNextReviewDays(4)).toBeNull())
})

// ─────────────────────────────────────────────────────────────────────────────

describe('calcScore', () => {
  it('calcula porcentaje correctamente',    () => expect(calcScore(8, 10)).toBe(80))
  it('devuelve 0 si total es 0',            () => expect(calcScore(0, 0)).toBe(0))
  it('devuelve 100 si todo correcto',       () => expect(calcScore(10, 10)).toBe(100))
  it('devuelve 0 si todo incorrecto',       () => expect(calcScore(0, 10)).toBe(0))
  it('redondea al entero más cercano',      () => expect(calcScore(1, 3)).toBe(33))
  it('redondea hacia arriba correctamente', () => expect(calcScore(2, 3)).toBe(67))
})