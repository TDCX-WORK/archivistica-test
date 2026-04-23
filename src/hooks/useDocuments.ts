import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import type { CurrentUser } from '../types'

export interface AcademyDocument {
  id:              string
  category:        'contrato' | 'material' | 'video'
  title:           string
  url:             string
  file_size:       number | null
  created_at:      string
  alumno_id:       string | null
  uploaded_by:     string | null
  uploader_name:   string | null
  uploader_role:   string | null
}

export interface StorageStats {
  totalBytes:    number
  totalFiles:    number
  byCategory:    Record<string, { bytes: number; count: number }>
}

export function useDocuments(currentUser: CurrentUser | null) {
  const [documents, setDocuments] = useState<AcademyDocument[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!currentUser?.id) { setLoading(false); return }
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('academy_documents')
      .select(`
        id,
        category,
        title,
        url,
        file_size,
        created_at,
        alumno_id,
        uploaded_by,
        uploader:profiles!academy_documents_uploaded_by_fkey (
          username,
          role
        )
      `)
      .order('created_at', { ascending: false })

    if (err) {
      setError('No se pudieron cargar los documentos')
      setLoading(false)
      return
    }

    const docs = (data ?? []).map((d: any) => ({
      id:            d.id,
      category:      d.category,
      title:         d.title,
      url:           d.url,
      file_size:     d.file_size,
      created_at:    d.created_at,
      alumno_id:     d.alumno_id,
      uploaded_by:   d.uploaded_by,
      uploader_name: d.uploader?.username ?? null,
      uploader_role: d.uploader?.role     ?? null,
    })) as AcademyDocument[]

    setDocuments(docs)
    setLoading(false)
  }, [currentUser?.id])

  useEffect(() => { load() }, [load])

  const byCategory = useCallback((cat: AcademyDocument['category']) =>
    documents.filter(d => d.category === cat)
  , [documents])

  // Stats de almacenamiento — memoizado
  const storageStats = useMemo<StorageStats>(() => {
    const byCategory: Record<string, { bytes: number; count: number }> = {}
    let totalBytes = 0
    let totalFiles = 0

    for (const doc of documents) {
      const cat = doc.category
      if (!byCategory[cat]) byCategory[cat] = { bytes: 0, count: 0 }
      const size = doc.file_size ?? 0
      byCategory[cat]!.bytes += size
      byCategory[cat]!.count += 1
      totalBytes += size
      totalFiles += 1
    }

    return { totalBytes, totalFiles, byCategory }
  }, [documents])

  // Uploaders únicos (para filtro por alumno en staff view)
  const uploaders = useMemo(() => {
    const map: Record<string, { id: string; name: string; role: string }> = {}
    for (const doc of documents) {
      if (doc.uploaded_by && doc.uploader_name && !map[doc.uploaded_by]) {
        map[doc.uploaded_by] = {
          id:   doc.uploaded_by,
          name: doc.uploader_name,
          role: doc.uploader_role ?? 'alumno',
        }
      }
    }
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name))
  }, [documents])

  // Alumnos que tienen documentos asignados (alumno_id)
  const targetAlumnos = useMemo(() => {
    const ids = new Set<string>()
    for (const doc of documents) {
      if (doc.alumno_id) ids.add(doc.alumno_id)
    }
    return ids
  }, [documents])

  return { documents, byCategory, loading, error, storageStats, uploaders, targetAlumnos, reload: load }
}