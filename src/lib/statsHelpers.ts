/**
 * Lógica de cálculo de stats compartida entre useProfesor y useStatsClase.
 * Fuente única de verdad para: enRiesgo, accesoExpirado, proximoAExpirar,
 * diasInactivo, notaMedia, statsClase.
 */
import type { StatsClase } from '../types'

// ── Datos mínimos de un alumno para calcular stats ───────────────────────────
export interface AlumnoBase {
  id:            string
  username:      string
  created_at:    string
  access_until:  string | null
}

export interface AlumnoStats {
  sesiones:        number
  notaMedia:       number | null
  temasLeidos:     number
  diasInactivo:    number | null
  accesoExpirado:  boolean
  diasParaExpirar: number | null
  proximoAExpirar: boolean
  enRiesgo:        boolean
}

// ── Cálculo de stats base de un alumno ───────────────────────────────────────
export function calcAlumnoStats(
  alumno:      AlumnoBase,
  sesiones:    { score: number; created_at: string }[],
  temasLeidos: number,
  now:         Date = new Date()
): AlumnoStats {
  const accessUntil       = alumno.access_until ? new Date(alumno.access_until) : null
  const accesoExpirado    = accessUntil ? accessUntil < now : false
  const diasParaExpirar   = accessUntil ? Math.ceil((accessUntil.getTime() - now.getTime()) / 86400000) : null
  const proximoAExpirar   = diasParaExpirar !== null && diasParaExpirar > 0 && diasParaExpirar <= 14
  const ultimaSesion      = sesiones[0]?.created_at ?? null
  const diasInactivo      = ultimaSesion ? Math.floor((now.getTime() - new Date(ultimaSesion).getTime()) / 86400000) : null
  const diasDesdeRegistro = Math.floor((now.getTime() - new Date(alumno.created_at).getTime()) / 86400000)
  const notaMedia         = sesiones.length
    ? Math.round(sesiones.reduce((s, x) => s + x.score, 0) / sesiones.length)
    : null

  return {
    sesiones:        sesiones.length,
    notaMedia,
    temasLeidos,
    diasInactivo,
    accesoExpirado,
    diasParaExpirar,
    proximoAExpirar,
    enRiesgo: !accesoExpirado && (diasInactivo !== null ? diasInactivo >= 3 : diasDesdeRegistro >= 3),
  }
}

// ── Cálculo de StatsClase a partir de array de alumnos con stats ─────────────
export function calcStatsClase(
  alumnos:     (AlumnoStats & { id: string })[],
  sesiones30d: number
): StatsClase | null {
  if (!alumnos.length) return null

  const conNota = alumnos.filter(a => a.notaMedia !== null)

  return {
    totalAlumnos:     alumnos.length,
    alumnosActivos:   alumnos.filter(a => !a.accesoExpirado && a.diasInactivo !== null && a.diasInactivo < 7).length,
    enRiesgo:         alumnos.filter(a => a.enRiesgo).length,
    proximosAExpirar: alumnos.filter(a => a.proximoAExpirar).length,
    accesoExpirado:   alumnos.filter(a => a.accesoExpirado).length,
    notaMediaClase:   Math.round(
      conNota.reduce((s, a) => s + (a.notaMedia ?? 0), 0) / (conNota.length || 1)
    ),
    mediaTemasLeidos: Math.round(alumnos.reduce((s, a) => s + a.temasLeidos, 0) / alumnos.length),
    sesiones30d,
  }
}