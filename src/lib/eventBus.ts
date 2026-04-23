// ═════════════════════════════════════════════════════════════════════════
// Event bus ligero para sincronizar datos entre paneles del director.
//
// Problema: useDirector, useAcademyProfiles y useCobros viven en páginas
// distintas (/direccion, /facturacion-director). Cuando una muta, las otras
// no se enteran hasta remount (y a veces ni con remount por caching).
//
// Solución: cuando una página modifica academy_payments o student_profiles,
// emite un evento y el resto recarga si está montada.
// ═════════════════════════════════════════════════════════════════════════

type Listener = () => void

const listeners: Record<string, Set<Listener>> = {}

export type EventName = 'director-data-changed'

export function emit(event: EventName): void {
  const set = listeners[event]
  if (!set) return
  for (const fn of set) {
    try { fn() } catch (e) { /* evitar que un listener rompa al resto */ }
  }
}

export function subscribe(event: EventName, fn: Listener): () => void {
  if (!listeners[event]) listeners[event] = new Set()
  listeners[event]!.add(fn)
  return () => { listeners[event]?.delete(fn) }
}