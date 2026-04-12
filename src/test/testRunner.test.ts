import { describe, it, expect } from 'vitest'

// ── Lógica extraída de TestRunner ─────────────────────────────────────────

/** Calcula la puntuación efectiva con o sin penalización */
function calcEffectiveScore(correct: number, wrong: number, penalizacion: boolean): number {
  if (!penalizacion) return correct
  return Math.round(Math.max(0, correct - wrong * 0.25))
}

/** Calcula el porcentaje final sobre el total de preguntas respondidas */
function calcFinalScore(effectiveCorrect: number, answered: number): number {
  if (answered === 0) return 0
  return Math.round((effectiveCorrect / answered) * 100)
}

/** Determina si el modo es de repaso (sin límite de tiempo) */
function isFailMode(modeId: string): boolean {
  return ['review_due', 'all_fails', 'quick_review'].includes(modeId)
}

/** Determina si el modeId es un UUID de bloque temático */
function isUUID(modeId: string): boolean {
  const knownModes = ['beginner','advanced','exam','simulacro','quick_review','review_due','all_fails']
  return !!modeId && modeId.includes('-') && !knownModes.includes(modeId)
}

/** Formatea segundos a MM:SS */
function formatTimer(secs: number): string {
  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

// ─────────────────────────────────────────────────────────────────────────────

describe('calcEffectiveScore', () => {
  describe('sin penalización', () => {
    it('devuelve los aciertos directamente',         () => expect(calcEffectiveScore(8, 2, false)).toBe(8))
    it('devuelve 0 si no hay aciertos',              () => expect(calcEffectiveScore(0, 10, false)).toBe(0))
    it('no penaliza los fallos',                     () => expect(calcEffectiveScore(5, 5, false)).toBe(5))
  })

  describe('con penalización (-0.25 por fallo)', () => {
    it('resta 0.25 por cada fallo',                  () => expect(calcEffectiveScore(8, 4, true)).toBe(7))
    it('no baja de 0',                               () => expect(calcEffectiveScore(0, 10, true)).toBe(0))
    it('todo correcto → mismo resultado',            () => expect(calcEffectiveScore(10, 0, true)).toBe(10))
    it('todo incorrecto → 0',                        () => expect(calcEffectiveScore(0, 20, true)).toBe(0))
    it('4 bien, 4 mal → 4 - 1 = 3',                 () => expect(calcEffectiveScore(4, 4, true)).toBe(3))
    it('redondea correctamente',                     () => expect(calcEffectiveScore(3, 2, true)).toBe(3)) // 3 - 0.5 = 2.5 → 3
  })
})

describe('calcFinalScore', () => {
  it('0 respondidas → 0%',                          () => expect(calcFinalScore(0, 0)).toBe(0))
  it('10/10 → 100%',                                () => expect(calcFinalScore(10, 10)).toBe(100))
  it('0/10 → 0%',                                   () => expect(calcFinalScore(0, 10)).toBe(0))
  it('8/10 → 80%',                                  () => expect(calcFinalScore(8, 10)).toBe(80))
  it('7/10 → 70%',                                  () => expect(calcFinalScore(7, 10)).toBe(70))
  it('redondea al entero más cercano',               () => expect(calcFinalScore(1, 3)).toBe(33))
})

describe('isFailMode', () => {
  it('review_due es modo repaso',                    () => expect(isFailMode('review_due')).toBe(true))
  it('all_fails es modo repaso',                     () => expect(isFailMode('all_fails')).toBe(true))
  it('quick_review es modo repaso',                  () => expect(isFailMode('quick_review')).toBe(true))
  it('beginner NO es modo repaso',                   () => expect(isFailMode('beginner')).toBe(false))
  it('advanced NO es modo repaso',                   () => expect(isFailMode('advanced')).toBe(false))
  it('exam NO es modo repaso',                       () => expect(isFailMode('exam')).toBe(false))
  it('UUID de bloque NO es modo repaso',             () => expect(isFailMode('550e8400-e29b-41d4-a716-446655440000')).toBe(false))
})

describe('isUUID', () => {
  it('UUID válido → true',                           () => expect(isUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true))
  it('beginner → false',                             () => expect(isUUID('beginner')).toBe(false))
  it('advanced → false',                             () => expect(isUUID('advanced')).toBe(false))
  it('exam → false',                                 () => expect(isUUID('exam')).toBe(false))
  it('review_due → false',                           () => expect(isUUID('review_due')).toBe(false))
  it('string sin guión → false',                     () => expect(isUUID('sinGuion')).toBe(false))
  it('simulacro → false',                              () => expect(isUUID('simulacro')).toBe(false))
})

describe('formatTimer', () => {
  it('0 segundos → 00:00',                          () => expect(formatTimer(0)).toBe('00:00'))
  it('60 segundos → 01:00',                         () => expect(formatTimer(60)).toBe('01:00'))
  it('90 segundos → 01:30',                         () => expect(formatTimer(90)).toBe('01:30'))
  it('25 minutos → 25:00',                          () => expect(formatTimer(1500)).toBe('25:00'))
  it('119 segundos → 01:59',                        () => expect(formatTimer(119)).toBe('01:59'))
  it('9 segundos → 00:09',                          () => expect(formatTimer(9)).toBe('00:09'))
})