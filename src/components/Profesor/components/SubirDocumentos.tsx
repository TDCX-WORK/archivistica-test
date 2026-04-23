import { useState, useRef, useEffect } from 'react'
import {
  Upload, Link2, Trash2, Loader2, FileText,
  FileCheck, Video, Inbox, FolderOpen, Users, User,
  CheckCircle2, AlertCircle
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { CurrentUser, AlumnoConStats } from '../../../types'
import styles from './SubirDocumentos.module.css'

interface Props {
  currentUser: CurrentUser | null
  alumnos:     AlumnoConStats[]
}

type Category = 'contrato' | 'material' | 'video'

interface DocSubido {
  id:           string
  title:        string
  category:     Category
  url:          string
  alumno_id:    string | null
  created_at:   string
  uploaded_by:  string | null
}

const CAT_META: Record<Category, { label: string; iconClass: string; Icon: React.ElementType }> = {
  contrato: { label: 'Contrato',  iconClass: styles.docIconContrato ?? '', Icon: FileCheck },
  material: { label: 'Material',  iconClass: styles.docIconMaterial ?? '', Icon: FileText  },
  video:    { label: 'Vídeo',     iconClass: styles.docIconVideo    ?? '', Icon: Video     },
}

function fmtFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

export default function SubirDocumentos({ currentUser, alumnos }: Props) {
  const [categoria,   setCategoria]   = useState<Category>('material')
  const [destino,     setDestino]     = useState<string>('clase')
  const [archivos,    setArchivos]    = useState<File[]>([])
  const [urlVideo,    setUrlVideo]    = useState('')
  const [cargando,    setCargando]    = useState(false)
  const [progreso,    setProgreso]    = useState<string | null>(null)
  const [feedback,    setFeedback]    = useState<{ msg: string; ok: boolean } | null>(null)
  const [docs,        setDocs]        = useState<DocSubido[]>([])
  const [loadingDocs, setLoadingDocs] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  const isDirector = currentUser?.role === 'director' || currentUser?.role === 'superadmin'

  useEffect(() => {
    const load = async () => {
      if (!currentUser?.academy_id) return
      const { data } = await supabase
        .from('academy_documents')
        .select('id, title, category, url, alumno_id, created_at, uploaded_by')
        .eq('academy_id', currentUser.academy_id)
        .order('created_at', { ascending: false })
      setDocs((data ?? []) as DocSubido[])
      setLoadingDocs(false)
    }
    load()
  }, [currentUser?.academy_id])

  const mostrarFeedback = (msg: string, ok: boolean) => {
    setFeedback({ msg, ok })
    setTimeout(() => setFeedback(null), 3500)
  }

  const handleSubir = async () => {
    if (categoria !== 'video' && archivos.length === 0)
      return mostrarFeedback('Selecciona al menos un archivo', false)
    if (categoria === 'video' && !urlVideo.trim())
      return mostrarFeedback('Pega el enlace del vídeo', false)
    if (!currentUser?.academy_id || !currentUser?.id) return

    setCargando(true)

    // --- Vídeo: un solo insert con la URL ---
    if (categoria === 'video') {
      const { data: inserted, error: dbErr } = await supabase
        .from('academy_documents')
        .insert({
          academy_id:  currentUser.academy_id,
          uploaded_by: currentUser.id,
          alumno_id:   destino === 'clase' ? null : destino,
          category:    'video',
          title:       urlVideo.trim(),
          url:         urlVideo.trim(),
          file_size:   null,
        })
        .select()
        .single()

      setCargando(false)
      setProgreso(null)
      if (dbErr) return mostrarFeedback('Error al guardar el vídeo', false)
      setDocs(prev => [inserted as DocSubido, ...prev])
      setUrlVideo('')
      return mostrarFeedback('Vídeo añadido correctamente', true)
    }

    // --- Archivos: subida múltiple ---
    const insertados: DocSubido[] = []
    let errores = 0

    for (let i = 0; i < archivos.length; i++) {
      const archivo = archivos[i]!
      setProgreso(`Subiendo ${i + 1} de ${archivos.length}…`)

      const ext      = archivo.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const path     = `${currentUser.academy_id}/${fileName}`

      const { error: uploadErr } = await supabase.storage
        .from('academy-documents')
        .upload(path, archivo)

      if (uploadErr) { errores++; continue }

      // Título = nombre del archivo sin extensión
      const titulo = archivo.name.replace(/\.[^/.]+$/, '')

      const { data: inserted, error: dbErr } = await supabase
        .from('academy_documents')
        .insert({
          academy_id:  currentUser.academy_id,
          uploaded_by: currentUser.id,
          alumno_id:   destino === 'clase' ? null : destino,
          category:    categoria,
          title:       titulo,
          url:         path,
          file_size:   archivo.size,
        })
        .select()
        .single()

      if (dbErr) { errores++; continue }
      insertados.push(inserted as DocSubido)
    }

    setCargando(false)
    setProgreso(null)
    setArchivos([])
    setDocs(prev => [...insertados, ...prev])

    if (errores === 0) {
      mostrarFeedback(
        archivos.length === 1
          ? 'Archivo subido correctamente'
          : `${archivos.length} archivos subidos correctamente`,
        true
      )
    } else {
      mostrarFeedback(`${insertados.length} subidos, ${errores} con error`, false)
    }
  }

  const handleEliminar = async (doc: DocSubido) => {
    // Profesor solo borra los suyos, director borra todo
    if (!isDirector && doc.uploaded_by !== currentUser?.id) return

    const { error } = await supabase
      .from('academy_documents')
      .delete()
      .eq('id', doc.id)

    if (!error) setDocs(prev => prev.filter(d => d.id !== doc.id))
  }

  const puedeEliminar = (doc: DocSubido) =>
    isDirector || doc.uploaded_by === currentUser?.id

  const nombreDestino = (id: string | null) => {
    if (!id) return 'Toda la clase'
    return alumnos.find(a => a.id === id)?.fullName
        ?? alumnos.find(a => a.id === id)?.username
        ?? 'Alumno'
  }

  return (
    <div className={styles.wrap}>

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>Documentos</h2>
          <p className={styles.subtitle}>Sube material, contratos y vídeos para tu clase</p>
        </div>
      </div>

      <div className={styles.form}>
        <p className={styles.formTitle}>Nuevo documento</p>

        <div className={styles.selectRow}>
          <div className={styles.selectWrap}>
            <FileText size={14} className={styles.selectIcon} />
            <select
              className={styles.select}
              value={categoria}
              onChange={e => setCategoria(e.target.value as Category)}
            >
              <option value="material">Material de estudio</option>
              <option value="contrato">Contrato</option>
              <option value="video">Vídeo</option>
            </select>
          </div>

          <div className={styles.selectWrap}>
            <Users size={14} className={styles.selectIcon} />
            <select
              className={styles.select}
              value={destino}
              onChange={e => setDestino(e.target.value)}
            >
              <option value="clase">Toda la clase</option>
              {alumnos.map(a => (
                <option key={a.id} value={a.id}>
                  {a.fullName ?? a.username}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Archivos o URL */}
        {categoria !== 'video' ? (
          <div
            className={[styles.dropZone, archivos.length > 0 ? styles.dropZoneActive : ''].join(' ')}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              className={styles.dropZoneInput}
              accept=".pdf,audio/*,image/*"
              onChange={e => setArchivos(Array.from(e.target.files ?? []))}
            />
            <div className={styles.dropZoneIcon}><FolderOpen size={18} /></div>
            {archivos.length > 0
              ? <span className={styles.dropZoneFile}>
                  {archivos.length === 1
                    ? archivos[0]!.name
                    : `${archivos.length} archivos seleccionados`}
                </span>
              : <span className={styles.dropZoneText}>
                  Haz clic para seleccionar · Puedes elegir varios a la vez
                </span>
            }
          </div>
        ) : (
          <div className={styles.urlWrap}>
            <Link2 size={14} className={styles.urlIcon} />
            <input
              className={styles.urlInput}
              placeholder="https://youtube.com/watch?v=..."
              value={urlVideo}
              onChange={e => setUrlVideo(e.target.value)}
            />
          </div>
        )}

        {feedback && (
          <div className={[styles.feedback, feedback.ok ? styles.feedbackOk : styles.feedbackError].join(' ')}>
            {feedback.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {feedback.msg}
          </div>
        )}

        <button className={styles.btnSubir} onClick={handleSubir} disabled={cargando}>
          {cargando
            ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> {progreso ?? 'Subiendo...'}</>
            : <><Upload size={14} /> Subir documento{archivos.length > 1 ? 's' : ''}</>
          }
        </button>
      </div>

      {/* Lista */}
      <div className={styles.listSection}>
        <div className={styles.listHeader}>
          <Inbox size={13} />
          Subidos ({docs.length})
        </div>

        {loadingDocs ? (
          <div className={styles.empty}>
            <Loader2 size={20} className={styles.emptyIcon} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : docs.length === 0 ? (
          <div className={styles.empty}>
            <Inbox size={28} className={styles.emptyIcon} />
            <p className={styles.emptyText}>Aún no hay documentos subidos</p>
            <p className={styles.emptySub}>Los documentos que subas aparecerán aquí</p>
          </div>
        ) : (
          <div className={styles.docList}>
            {docs.map(doc => {
              const meta = CAT_META[doc.category]
              const Icon = meta.Icon
              return (
                <div key={doc.id} className={styles.docItem}>
                  <div className={[styles.docIcon, meta.iconClass].join(' ')}>
                    <Icon size={15} />
                  </div>
                  <div className={styles.docInfo}>
                    <span className={styles.docName}>{doc.title}</span>
                    <span className={styles.docMeta}>
                      <span>{meta.label}</span>
                      <span className={styles.docMetaDot} />
                      {!doc.alumno_id
                        ? <><Users size={10} /> Toda la clase</>
                        : <><User  size={10} /> {nombreDestino(doc.alumno_id)}</>
                      }
                      <span className={styles.docMetaDot} />
                      <span>{fmtFecha(doc.created_at)}</span>
                    </span>
                  </div>
                  {puedeEliminar(doc) && (
                    <button
                      className={styles.docDelete}
                      onClick={() => handleEliminar(doc)}
                      title="Eliminar documento"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
