import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type ProspectEstado =
  'nueva' | 'llamar' | 'llamada' | 'visitar' | 'visitada' |
  'demo' | 'negociando' | 'cliente' | 'descartada'

export interface Prospect {
  id:           string
  nombre:       string
  ciudad:       string | null
  telefono:     string | null
  email:        string | null
  web:          string | null
  maps_url:     string | null
  estado:       ProspectEstado
  fecha_accion: string | null
  notas:        string | null
  created_at:   string
  updated_at:   string
}

export function usePipeline() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading,   setLoading]   = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('prospects')
      .select('*')
      .order('created_at', { ascending: false })
    setProspects((data ?? []) as Prospect[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const crear = async (fields: Omit<Prospect, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('prospects')
      .insert({ ...fields, updated_at: new Date().toISOString() })
      .select().single()
    if (!error && data) setProspects(prev => [data as Prospect, ...prev])
    return { error: error?.message }
  }

  const actualizar = async (id: string, fields: Partial<Prospect>) => {
    const { data, error } = await supabase
      .from('prospects')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (!error && data) setProspects(prev => prev.map(p => p.id === id ? data as Prospect : p))
    return { error: error?.message }
  }

  const eliminar = async (id: string) => {
    const { error } = await supabase.from('prospects').delete().eq('id', id)
    if (!error) setProspects(prev => prev.filter(p => p.id !== id))
    return { error: error?.message }
  }

  return { prospects, loading, crear, actualizar, eliminar, reload: load }
}