// ─────────────────────────────────────────────────────────────────────────────
// FrostFox Academy — Generación de códigos de invitación
// ─────────────────────────────────────────────────────────────────────────────
// Función única y compartida. Usar SIEMPRE desde aquí — nunca generar códigos
// inline en componentes.
//
// Formato: PREFIX-SUFFIX
//   - PREFIX: primeras 4 letras alfanuméricas del nombre de la academia
//             (mayúsculas, sin espacios ni acentos). Si quedan menos de 4
//             caracteres, se rellena con 'X'.
//   - SUFFIX: 4 caracteres aleatorios alfanuméricos en mayúsculas.
//
// Ejemplos:
//   academyName "Totally Spies Academy" -> "TOTA-XYZW"
//   academyName "UNED"                  -> "UNED-A1B2"
//   academyName "3"                     -> "3XXX-K9P4"
//
// Capacidad: 36^4 = ~1.6M combinaciones por academia. Suficiente para
// 70 academias × 50 alumnos × varios años sin riesgo real de colisión.
// ─────────────────────────────────────────────────────────────────────────────

function buildPrefix(academyName: string | null | undefined): string {
  const clean = (academyName || 'ACAD')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // quitar acentos
    .replace(/[^A-Z0-9]/g, '')         // solo letras/números
  return clean.substring(0, 4).padEnd(4, 'X')
}

function buildSuffix(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase()
}

/**
 * Genera un código de invitación con formato "PREFIX-SUFFIX".
 *
 * @param academyName Nombre de la academia (para el prefijo).
 * @returns Código formateado listo para insertar en BD.
 */
export function generateInviteCode(academyName: string | null | undefined): string {
  return `${buildPrefix(academyName)}-${buildSuffix()}`
}