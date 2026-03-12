import { useState, useEffect } from 'react'

const DEFAULTS = {
  penalizacion:    false,
  preguntasRapido: 20,
  tema:            'claro',   // 'claro' | 'oscuro' | 'calido'
}

const KEY = 'arch_settings'

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(KEY)
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS
    } catch { return DEFAULTS }
  })

  // Guardar en localStorage
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(settings))
  }, [settings])

  // Aplicar tema al <html>
  useEffect(() => {
    const html = document.documentElement
    html.removeAttribute('data-theme')
    if (settings.tema !== 'claro') {
      html.setAttribute('data-theme', settings.tema)
    }
  }, [settings.tema])

  const updateSetting = (key, value) =>
    setSettings(prev => ({ ...prev, [key]: value }))

  return { settings, updateSetting }
}
