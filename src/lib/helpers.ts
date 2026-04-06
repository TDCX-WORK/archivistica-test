// ─────────────────────────────────────────────────────────────────────────────
// FrostFox Academy — Helpers compartidos
// ─────────────────────────────────────────────────────────────────────────────

/** Devuelve un color hex según la puntuación (0-100) */
export function scoreColor(s: number | null | undefined): string {
  if (s == null) return '#6B7280'
  if (s >= 80)   return '#059669'
  if (s >= 60)   return '#0891B2'
  if (s >= 40)   return '#B45309'
  return '#DC2626'
}

/** Etiqueta textual para una puntuación */
export function scoreLabel(s: number | null | undefined): string {
  if (s == null) return 'Sin datos'
  if (s >= 80)   return 'Sobresaliente'
  if (s >= 60)   return 'Notable'
  if (s >= 40)   return 'Mejorable'
  return 'Necesita refuerzo'
}

/** Formatea una fecha ISO a formato español corto: "12 ene 2025" */
export function fmt(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  })
}

/** Formatea días de inactividad en texto legible */
export function formatDias(n: number | null): string {
  if (n === null) return 'Nunca'
  if (n === 0)    return 'Hoy'
  if (n === 1)    return 'Ayer'
  return `Hace ${n} días`
}

/**
 * Calcula los días que faltan hasta una fecha de expiración.
 * Devuelve null si no hay fecha.
 * Devuelve un número negativo si ya expiró.
 */
export function diasHastaExpiracion(accessUntil: string | null | undefined): number | null {
  if (!accessUntil) return null
  const diff = new Date(accessUntil).getTime() - new Date().getTime()
  return Math.ceil(diff / 86400000)
}

/** Devuelve true si el acceso ya ha expirado */
export function accesoExpirado(accessUntil: string | null | undefined): boolean {
  if (!accessUntil) return false
  return new Date(accessUntil) < new Date()
}

/** Devuelve true si el acceso expira en menos de N días */
export function proximoAExpirar(accessUntil: string | null | undefined, dias = 14): boolean {
  if (!accessUntil) return false
  const d = diasHastaExpiracion(accessUntil)
  return d !== null && d >= 0 && d <= dias
}

/** Calcula la nota media de un array de puntuaciones */
export function calcularNotaMedia(scores: number[]): number | null {
  if (!scores.length) return null
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

/**
 * Calcula la racha de días consecutivos de estudio.
 * Recibe un array de fechas ISO (played_at) en cualquier orden.
 */
export function calcularRacha(fechas: string[]): number {
  if (!fechas.length) return 0
  const dias = [...new Set(fechas.map(f => f.slice(0, 10)))].sort().reverse()
  const hoy  = new Date().toISOString().slice(0, 10)
  const ayer = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  // La racha solo cuenta si estudió hoy o ayer
  if (dias[0] !== hoy && dias[0] !== ayer) return 0

  let racha = 1
  for (let i = 1; i < dias.length; i++) {
    const prev = new Date(dias[i - 1]!)
    const curr = new Date(dias[i]!)
    const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000)
    if (diff === 1) racha++
    else break
  }
  return racha
}