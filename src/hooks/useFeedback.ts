import { useState, useRef, useCallback, useEffect } from 'react'

interface Feedback {
  msg: string
  ok:  boolean
}

/**
 * Hook reutilizable para mensajes de feedback temporales.
 * Se limpia automáticamente al desmontar el componente,
 * evitando el warning "setState on unmounted component".
 *
 * Uso:
 *   const { feedback, showFeedback, clearFeedback } = useFeedback()
 *   showFeedback('Guardado correctamente', true)
 *   showFeedback('Error al guardar', false, 5000) // duración custom
 */
export function useFeedback(defaultDuration = 3000) {
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const showFeedback = useCallback((msg: string, ok: boolean, duration?: number) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setFeedback({ msg, ok })
    timerRef.current = setTimeout(() => {
      setFeedback(null)
      timerRef.current = null
    }, duration ?? defaultDuration)
  }, [defaultDuration])

  const clearFeedback = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setFeedback(null)
    timerRef.current = null
  }, [])

  return { feedback, showFeedback, clearFeedback }
}