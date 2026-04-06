import { useState, useEffect } from 'react'

interface Settings {
  penalizacion:    boolean
  preguntasRapido: number
  tema:            'claro' | 'oscuro' | 'calido'
}

const DEFAULTS: Settings = {
  penalizacion:    false,
  preguntasRapido: 20,
  tema:            'claro',
}

const KEY = 'arch_settings'

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem(KEY)
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS
    } catch { return DEFAULTS }
  })

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    const html = document.documentElement
    html.removeAttribute('data-theme')
    if (settings.tema !== 'claro') {
      html.setAttribute('data-theme', settings.tema)
    }
  }, [settings.tema])

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings(prev => ({ ...prev, [key]: value }))

  return { settings, updateSetting }
}