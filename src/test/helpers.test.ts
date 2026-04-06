import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  scoreColor, scoreLabel, fmt, formatDias,
  diasHastaExpiracion, accesoExpirado, proximoAExpirar,
  calcularNotaMedia, calcularRacha,
} from '../lib/helpers'

// ── scoreColor ────────────────────────────────────────────────────────────────
describe('scoreColor', () => {
  it('devuelve gris para null',      () => expect(scoreColor(null)).toBe('#6B7280'))
  it('devuelve gris para undefined', () => expect(scoreColor(undefined)).toBe('#6B7280'))
  it('devuelve verde para 80',       () => expect(scoreColor(80)).toBe('#059669'))
  it('devuelve verde para 100',      () => expect(scoreColor(100)).toBe('#059669'))
  it('devuelve azul para 60',        () => expect(scoreColor(60)).toBe('#0891B2'))
  it('devuelve azul para 79',        () => expect(scoreColor(79)).toBe('#0891B2'))
  it('devuelve naranja para 40',     () => expect(scoreColor(40)).toBe('#B45309'))
  it('devuelve naranja para 59',     () => expect(scoreColor(59)).toBe('#B45309'))
  it('devuelve rojo para 0',         () => expect(scoreColor(0)).toBe('#DC2626'))
  it('devuelve rojo para 39',        () => expect(scoreColor(39)).toBe('#DC2626'))
})

// ── scoreLabel ────────────────────────────────────────────────────────────────
describe('scoreLabel', () => {
  it('devuelve "Sin datos" para null',        () => expect(scoreLabel(null)).toBe('Sin datos'))
  it('devuelve "Sobresaliente" para 80+',     () => expect(scoreLabel(95)).toBe('Sobresaliente'))
  it('devuelve "Notable" para 60-79',         () => expect(scoreLabel(70)).toBe('Notable'))
  it('devuelve "Mejorable" para 40-59',       () => expect(scoreLabel(50)).toBe('Mejorable'))
  it('devuelve "Necesita refuerzo" para <40', () => expect(scoreLabel(20)).toBe('Necesita refuerzo'))
})

// ── fmt ───────────────────────────────────────────────────────────────────────
describe('fmt', () => {
  it('devuelve "—" para null',      () => expect(fmt(null)).toBe('—'))
  it('devuelve "—" para undefined', () => expect(fmt(undefined)).toBe('—'))
  it('formatea fecha ISO correctamente', () => {
    // La fecha exacta depende del locale, verificamos que contiene el año
    expect(fmt('2025-01-15T00:00:00Z')).toContain('2025')
  })
})

// ── formatDias ────────────────────────────────────────────────────────────────
describe('formatDias', () => {
  it('devuelve "Nunca" para null',     () => expect(formatDias(null)).toBe('Nunca'))
  it('devuelve "Hoy" para 0',          () => expect(formatDias(0)).toBe('Hoy'))
  it('devuelve "Ayer" para 1',         () => expect(formatDias(1)).toBe('Ayer'))
  it('devuelve "Hace N días" para 5',  () => expect(formatDias(5)).toBe('Hace 5 días'))
  it('devuelve "Hace N días" para 30', () => expect(formatDias(30)).toBe('Hace 30 días'))
})

// ── accesoExpirado ────────────────────────────────────────────────────────────
describe('accesoExpirado', () => {
  it('devuelve false para null',            () => expect(accesoExpirado(null)).toBe(false))
  it('devuelve false para fecha futura',    () => expect(accesoExpirado('2099-01-01')).toBe(false))
  it('devuelve true para fecha pasada',     () => expect(accesoExpirado('2000-01-01')).toBe(true))
})

// ── proximoAExpirar ───────────────────────────────────────────────────────────
describe('proximoAExpirar', () => {
  it('devuelve false para null',            () => expect(proximoAExpirar(null)).toBe(false))
  it('devuelve false para fecha lejana',    () => expect(proximoAExpirar('2099-01-01')).toBe(false))
  it('devuelve true para fecha en 7 días', () => {
    const en7 = new Date(Date.now() + 7 * 86400000).toISOString()
    expect(proximoAExpirar(en7)).toBe(true)
  })
  it('devuelve false para fecha ya expirada', () => {
    expect(proximoAExpirar('2000-01-01')).toBe(false)
  })
})

// ── diasHastaExpiracion ───────────────────────────────────────────────────────
describe('diasHastaExpiracion', () => {
  it('devuelve null para null',          () => expect(diasHastaExpiracion(null)).toBeNull())
  it('devuelve número positivo futuro', () => {
    const en10 = new Date(Date.now() + 10 * 86400000).toISOString()
    const dias  = diasHastaExpiracion(en10)
    expect(dias).toBeGreaterThan(0)
  })
  it('devuelve número negativo si expiró', () => {
    const hace5 = new Date(Date.now() - 5 * 86400000).toISOString()
    const dias  = diasHastaExpiracion(hace5)
    expect(dias).toBeLessThan(0)
  })
})

// ── calcularNotaMedia ─────────────────────────────────────────────────────────
describe('calcularNotaMedia', () => {
  it('devuelve null para array vacío',    () => expect(calcularNotaMedia([])).toBeNull())
  it('calcula media correctamente',       () => expect(calcularNotaMedia([80, 60, 40])).toBe(60))
  it('redondea al entero más cercano',    () => expect(calcularNotaMedia([75, 76])).toBe(76))
  it('funciona con un solo valor',        () => expect(calcularNotaMedia([90])).toBe(90))
})

// ── calcularRacha ─────────────────────────────────────────────────────────────
describe('calcularRacha', () => {
  it('devuelve 0 para array vacío', () => expect(calcularRacha([])).toBe(0))

  it('devuelve 1 si solo estudió hoy', () => {
    const hoy = new Date().toISOString().slice(0, 10)
    expect(calcularRacha([hoy])).toBe(1)
  })

  it('devuelve 0 si la última sesión fue hace más de 1 día', () => {
    const hace3 = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10)
    expect(calcularRacha([hace3])).toBe(0)
  })

  it('calcula racha de días consecutivos', () => {
    const hoy  = new Date().toISOString().slice(0, 10)
    const ayer = new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10)
    const ant  = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10)
    expect(calcularRacha([hoy, ayer, ant])).toBe(3)
  })

  it('no cuenta días no consecutivos', () => {
    const hoy   = new Date().toISOString().slice(0, 10)
    const hace3 = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10)
    expect(calcularRacha([hoy, hace3])).toBe(1)
  })

  it('deduplica fechas repetidas del mismo día', () => {
    const hoy  = new Date().toISOString().slice(0, 10)
    const ayer = new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10)
    // Estudió 3 veces hoy y 2 veces ayer — racha debe ser 2, no 5
    expect(calcularRacha([hoy, hoy, hoy, ayer, ayer])).toBe(2)
  })
})