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
  const [documents,      setDocuments]      = useState<AcademyDocument[]>([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState<string | null>(null)
  const [storageLimitGb, setStorageLimitGb] = useState(1)

  const academyId = currentUser?.academy_id
  const userId    = currentUser?.id
  const isStaff   = currentUser?.role ? ['profesor', 'director', 'superadmin'].includes(currentUser.role) : false

  // ── Cargar documentos ──────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!userId || !academyId) { setLoading(false); return }
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
      .eq('academy_id', academyId)
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
  }, [userId, academyId])

  useEffect(() => { load() }, [load])

  // ── Cargar storage limit ───────────────────────────────────────────────
  useEffect(() => {
    if (!academyId) return
    supabase
      .from('academies')
      .select('storage_limit_gb')
      .eq('id', academyId)
      .single()
      .then(({ data }) => {
        if (data?.storage_limit_gb) setStorageLimitGb(data.storage_limit_gb)
      })
  }, [academyId])

  // ── Filtros memoizados ─────────────────────────────────────────────────
  const byCategory = useCallback((cat: AcademyDocument['category']) =>
    documents.filter(d => d.category === cat)
  , [documents])

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

  const targetAlumnos = useMemo(() => {
    const ids = new Set<string>()
    for (const doc of documents) {
      if (doc.alumno_id) ids.add(doc.alumno_id)
    }
    return ids
  }, [documents])

  // ── Operaciones de escritura ───────────────────────────────────────────

  /** Subir archivos al bucket y registrar en BD */
  const uploadFiles = useCallback(async (
    archivos: File[],
    categoria: 'contrato' | 'material' | 'video',
    onProgress?: (msg: string) => void,
    alumnoId?: string | null,
  ): Promise<{ uploaded: number; errors: number }> => {
    if (!academyId || !userId) return { uploaded: 0, errors: 0 }

    let errors = 0
    let uploaded = 0
    for (let i = 0; i < archivos.length; i++) {
      const archivo = archivos[i]!
      onProgress?.(`Subiendo ${i + 1} de ${archivos.length}...`)

      const ext = archivo.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const path = `${academyId}/${fileName}`

      const { error: uploadErr } = await supabase.storage
        .from('academy-documents')
        .upload(path, archivo)
      if (uploadErr) { errors++; continue }

      const titulo = archivo.name.replace(/\.[^/.]+$/, '')
      const { error: dbErr } = await supabase
        .from('academy_documents')
        .insert({
          academy_id: academyId,
          uploaded_by: userId,
          alumno_id:   alumnoId !== undefined ? alumnoId : (isStaff ? null : userId),
          category:    categoria,
          title:       titulo,
          url:         path,
          file_size:   archivo.size,
        })
      if (dbErr) errors++
      else uploaded++
    }

    await load()
    return { uploaded, errors }
  }, [academyId, userId, isStaff, load])

  /** Añadir un enlace de video (sin subir archivo) */
  const addVideoUrl = useCallback(async (url: string, alumnoId?: string | null): Promise<{ error: string | null }> => {
    if (!academyId || !userId) return { error: 'Sin sesión' }

    const { error: dbErr } = await supabase
      .from('academy_documents')
      .insert({
        academy_id: academyId,
        uploaded_by: userId,
        alumno_id:   alumnoId !== undefined ? alumnoId : (isStaff ? null : userId),
        category:    'video',
        title:       url.trim(),
        url:         url.trim(),
        file_size:   null,
      })

    if (dbErr) return { error: 'Error al guardar el video' }
    await load()
    return { error: null }
  }, [academyId, userId, isStaff, load])

  /** Borrar un documento (storage + BD) */
  const deleteDocument = useCallback(async (doc: AcademyDocument): Promise<{ error: string | null }> => {
    if (doc.category !== 'video' && doc.url && !doc.url.startsWith('http')) {
      await supabase.storage.from('academy-documents').remove([doc.url])
    }
    const { error: err } = await supabase.from('academy_documents').delete().eq('id', doc.id)
    if (err) return { error: err.message }
    await load()
    return { error: null }
  }, [load])

  /** Descargar un documento vía edge function */
  const downloadDocument = useCallback(async (docId: string): Promise<Blob | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/descargar-documento`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ document_id: docId }),
      }
    )
    if (!res.ok) return null
    return res.blob()
  }, [])

  return {
    documents, byCategory, loading, error,
    storageStats, storageLimitGb, uploaders, targetAlumnos,
    reload: load,
    uploadFiles, addVideoUrl, deleteDocument, downloadDocument,
  }
}