import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type ProspectEstado =
  'nueva' | 'llamar' | 'llamada' | 'visitar' | 'visitada' |
  'demo' | 'negociando' | 'cliente' | 'descartada'

export interface Zona {
  id:         string
  nombre:     string
  color:      string
  barrida:    boolean
  created_at: string
}

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
  zona_id:      string | null
  created_at:   string
  updated_at:   string
}

export function usePipeline() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [zonas,     setZonas]     = useState<Zona[]>([])
  const [loading,   setLoading]   = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: p }, { data: z }] = await Promise.all([
      supabase.from('prospects').select('*').order('created_at', { ascending: false }),
      supabase.from('pipeline_zonas').select('*').order('nombre'),
    ])
    setProspects((p ?? []) as Prospect[])
    setZonas((z ?? []) as Zona[])
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

  const crearZona = async (nombre: string, color: string) => {
    const { data, error } = await supabase
      .from('pipeline_zonas')
      .insert({ nombre: nombre.trim(), color })
      .select().single()
    if (!error && data) setZonas(prev => [...prev, data as Zona].sort((a,b) => a.nombre.localeCompare(b.nombre)))
    return { error: error?.message }
  }

  const eliminarZona = async (id: string) => {
    const { error } = await supabase.from('pipeline_zonas').delete().eq('id', id)
    if (!error) {
      setZonas(prev => prev.filter(z => z.id !== id))
      setProspects(prev => prev.map(p => p.zona_id === id ? { ...p, zona_id: null } : p))
    }
    return { error: error?.message }
  }

  const toggleBarrida = async (id: string, barrida: boolean) => {
    const { error } = await supabase.from('pipeline_zonas').update({ barrida }).eq('id', id)
    if (!error) setZonas(prev => prev.map(z => z.id === id ? { ...z, barrida } : z))
    return { error: error?.message }
  }

  return { prospects, zonas, loading, crear, actualizar, eliminar, crearZona, eliminarZona, toggleBarrida, reload: load }
}