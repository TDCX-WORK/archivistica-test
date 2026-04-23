import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, FileText, Video, FileCheck, Loader2, Download,
  ExternalLink, ChevronUp, HardDrive, Upload, Link2, Trash2,
  FolderOpen, Users, User, CheckCircle2, AlertCircle, Filter, Inbox,
  Search, UserCircle, ArrowRight
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import GlassFolder, { type FolderColor } from './GlassFolder'
import { useDocuments, type AcademyDocument } from '../../hooks/useDocuments'
import type { CurrentUser } from '../../types'
import styles from './DocumentosPage.module.css'

interface Props {
  currentUser: CurrentUser | null
}

type FolderId = 'contrato' | 'material' | 'video' | 'alumnos'

interface FolderConfig {
  id:       FolderId
  label:    string
  sublabel: string
  color:    FolderColor
  icon:     React.ReactNode
  iconBg:   string
  emptyMsg: string
}

const BASE_FOLDERS: FolderConfig[] = [
  {
    id: 'contrato', label: 'Contrato', sublabel: 'Documentos oficiales',
    color: 'purple', icon: <FileCheck size={18} />,
    iconBg: 'linear-gradient(135deg, #6B46E0, #4F2FC0)',
    emptyMsg: 'No hay contratos subidos.',
  },
  {
    id: 'material', label: 'Material de estudio', sublabel: 'PDFs y apuntes',
    color: 'dark', icon: <FileText size={18} />,
    iconBg: 'linear-gradient(135deg, #2C2C2E, #1C1C1E)',
    emptyMsg: 'No hay material de estudio subido.',
  },
  {
    id: 'video', label: 'Videos', sublabel: 'Clases y recursos',
    color: 'blue', icon: <Video size={18} />,
    iconBg: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
    emptyMsg: 'No hay videos compartidos.',
  },
]

// 4ª carpeta: diferente según rol
const ALUMNO_FOLDER: FolderConfig = {
  id: 'alumnos', label: 'Mis documentos', sublabel: 'Archivos que has subido',
  color: 'greenPastel', icon: <User size={18} />,
  iconBg: 'linear-gradient(135deg, #059669, #047857)',
  emptyMsg: 'No has subido ningun documento todavia.',
}

const STAFF_FOLDER: FolderConfig = {
  id: 'alumnos', label: 'Docs de alumnos', sublabel: 'Archivos subidos por alumnos',
  color: 'amber', icon: <Users size={18} />,
  iconBg: 'linear-gradient(135deg, #D97706, #B45309)',
  emptyMsg: 'Ningun alumno ha subido documentos todavia.',
}

function formatSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function fmtFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

const STORAGE_LIMIT_DEFAULT = 5 // GB — fallback si no hay dato en BD

// ── Donut premium con icono en el centro ─────────────────────────────────
function StorageDonut({ usedBytes, limitBytes, color, icon }: {
  usedBytes:  number
  limitBytes: number
  color:      string
  icon:       React.ReactNode
}) {
  const size    = 64
  const stroke  = 5
  const r       = (size - stroke) / 2
  const circ    = 2 * Math.PI * r
  const pct     = limitBytes > 0 ? Math.min(100, (usedBytes / limitBytes) * 100) : 0
  const dash    = (pct / 100) * circ
  const bgAlpha = '18' // hex opacity for track

  return (
    <div className={styles.donut}>
      <svg width={size} height={size} className={styles.donutSvg}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={`${color}${bgAlpha}`} strokeWidth={stroke}
        />
        {pct > 0 && (
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={circ / 4}
            strokeLinecap="round"
            className={styles.donutArc}
          />
        )}
      </svg>
      <div className={styles.donutIcon} style={{ color }}>
        {icon}
      </div>
    </div>
  )
}

// ── FileItem ─────────────────────────────────────────────────────────────
function FileItem({ doc, canDelete, onDelete }: {
  doc: AcademyDocument
  canDelete: boolean
  onDelete?: () => void
}) {
  const [downloading, setDownloading] = useState(false)
  const isVideo = doc.category === 'video'

  const handleClick = async () => {
    if (isVideo) {
      window.open(doc.url, '_blank', 'noopener,noreferrer')
      return
    }
    setDownloading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/descargar-documento`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ document_id: doc.id }),
        }
      )
      if (!res.ok) throw new Error('Error al descargar')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.title
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('No se pudo descargar el archivo. Intentalo de nuevo.')
    } finally {
      setDownloading(false)
    }
  }

  const Icon = isVideo ? Video : doc.category === 'contrato' ? FileCheck : FileText

  return (
    <div className={styles.fileItem}>
      <button onClick={handleClick} disabled={downloading} className={styles.fileItemBtn}>
        <span className={styles.fileItemIcon}><Icon size={16} /></span>
        <span className={styles.fileItemName}>{doc.title}</span>
        {doc.file_size ? <span className={styles.fileItemSize}>{formatSize(doc.file_size)}</span> : null}
        {doc.uploader_name && (
          <span className={styles.fileItemUploader}>
            {doc.uploader_name}
            {doc.uploader_role === 'director' ? ' · Dir' : doc.uploader_role === 'profesor' ? ' · Prof' : doc.uploader_role === 'alumno' ? ' · Alum' : ''}
          </span>
        )}
        <span className={styles.fileItemDate}>{fmtFecha(doc.created_at)}</span>
        <span className={styles.fileItemAction}>
          {downloading
            ? <Loader2 size={14} className={styles.spinIcon} />
            : isVideo ? <ExternalLink size={14} /> : <Download size={14} />
          }
        </span>
      </button>
      {canDelete && onDelete && (
        <button className={styles.fileDeleteBtn} onClick={onDelete} title="Eliminar">
          <Trash2 size={13} />
        </button>
      )}
    </div>
  )
}

// ── Upload section (for staff and alumnos) ───────────────────────────────
function UploadSection({ currentUser, onUploaded, storageLimitBytes, currentUsageBytes }: {
  currentUser: CurrentUser
  onUploaded: () => void
  storageLimitBytes: number
  currentUsageBytes: number
}) {
  const [categoria, setCategoria] = useState<'contrato' | 'material' | 'video'>('material')
  const [archivos, setArchivos] = useState<File[]>([])
  const [urlVideo, setUrlVideo] = useState('')
  const [cargando, setCargando] = useState(false)
  const [progreso, setProgreso] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isStaff = ['profesor', 'director', 'superadmin'].includes(currentUser.role)

  const mostrarFeedback = (msg: string, ok: boolean) => {
    setFeedback({ msg, ok })
    setTimeout(() => setFeedback(null), 3500)
  }

  // Alumnos solo pueden subir 'material' (sus propios apuntes/entregas)
  const categorias: { value: 'contrato' | 'material' | 'video'; label: string }[] = isStaff
    ? [
        { value: 'material', label: 'Material de estudio' },
        { value: 'contrato', label: 'Contrato' },
        { value: 'video', label: 'Video' },
      ]
    : [{ value: 'material', label: 'Mis apuntes / entregas' }]

  const handleSubir = async () => {
    // Verificar límite de almacenamiento
    if (currentUsageBytes >= storageLimitBytes) {
      return mostrarFeedback('Has alcanzado el limite de almacenamiento. Contacta con ventas para ampliarlo.', false)
    }

    if (categoria !== 'video' && archivos.length === 0)
      return mostrarFeedback('Selecciona al menos un archivo', false)
    if (categoria === 'video' && !urlVideo.trim())
      return mostrarFeedback('Pega el enlace del video', false)
    if (!currentUser.academy_id || !currentUser.id) return

    setCargando(true)

    if (categoria === 'video') {
      const { error: dbErr } = await supabase
        .from('academy_documents')
        .insert({
          academy_id: currentUser.academy_id,
          uploaded_by: currentUser.id,
          alumno_id: isStaff ? null : currentUser.id,
          category: 'video',
          title: urlVideo.trim(),
          url: urlVideo.trim(),
          file_size: null,
        })
      setCargando(false)
      if (dbErr) return mostrarFeedback('Error al guardar el video', false)
      setUrlVideo('')
      mostrarFeedback('Video anadido', true)
      onUploaded()
      return
    }

    let errores = 0
    for (let i = 0; i < archivos.length; i++) {
      const archivo = archivos[i]!
      setProgreso(`Subiendo ${i + 1} de ${archivos.length}...`)

      const ext = archivo.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const path = `${currentUser.academy_id}/${fileName}`

      const { error: uploadErr } = await supabase.storage
        .from('academy-documents')
        .upload(path, archivo)

      if (uploadErr) { errores++; continue }

      const titulo = archivo.name.replace(/\.[^/.]+$/, '')

      const { error: dbErr } = await supabase
        .from('academy_documents')
        .insert({
          academy_id: currentUser.academy_id,
          uploaded_by: currentUser.id,
          alumno_id: isStaff ? null : currentUser.id,
          category: categoria,
          title: titulo,
          url: path,
          file_size: archivo.size,
        })

      if (dbErr) errores++
    }

    setCargando(false)
    setProgreso(null)
    setArchivos([])

    if (errores === 0) {
      mostrarFeedback(archivos.length === 1 ? 'Archivo subido' : `${archivos.length} archivos subidos`, true)
    } else {
      mostrarFeedback(`${archivos.length - errores} subidos, ${errores} con error`, false)
    }
    onUploaded()
  }

  return (
    <div className={styles.uploadSection}>
      <div className={styles.uploadHeader}>
        <Upload size={15} />
        <span>{isStaff ? 'Subir documento' : 'Subir archivo'}</span>
      </div>

      <div className={styles.uploadForm}>
        <div className={styles.uploadSelects}>
          <select
            className={styles.uploadSelect}
            value={categoria}
            onChange={e => setCategoria(e.target.value as 'contrato' | 'material' | 'video')}
          >
            {categorias.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

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
            <FolderOpen size={16} className={styles.dropZoneIcon} />
            {archivos.length > 0
              ? <span>{archivos.length === 1 ? archivos[0]!.name : `${archivos.length} archivos`}</span>
              : <span>Seleccionar archivos</span>
            }
          </div>
        ) : (
          <div className={styles.urlWrap}>
            <Link2 size={14} />
            <input
              className={styles.urlInput}
              placeholder="https://youtube.com/watch?v=..."
              value={urlVideo}
              onChange={e => setUrlVideo(e.target.value)}
            />
          </div>
        )}

        {feedback && (
          <div className={[styles.feedback, feedback.ok ? styles.feedbackOk : styles.feedbackErr].join(' ')}>
            {feedback.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
            {feedback.msg}
          </div>
        )}

        <button className={styles.uploadBtn} onClick={handleSubir} disabled={cargando}>
          {cargando
            ? <><Loader2 size={14} className={styles.spinIcon} /> {progreso ?? 'Subiendo...'}</>
            : <><Upload size={14} /> Subir</>
          }
        </button>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────
export default function DocumentosPage({ currentUser }: Props) {
  const navigate = useNavigate()
  const { documents, byCategory, loading, error, storageStats, uploaders, reload } = useDocuments(currentUser)
  const [openFolder, setOpenFolder] = useState<FolderId | null>(null)
  const [storageLimitGb, setStorageLimitGb] = useState<number>(STORAGE_LIMIT_DEFAULT)
  const [alumnoSearch, setAlumnoSearch] = useState('')
  const [selectedAlumno, setSelectedAlumno] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const foldersRef = useRef<HTMLDivElement>(null)

  const isStaff = currentUser?.role === 'profesor' || currentUser?.role === 'director' || currentUser?.role === 'superadmin'
  const STORAGE_LIMIT = storageLimitGb * 1024 * 1024 * 1024

  // Carpetas según rol
  const folders = useMemo(() => [
    ...BASE_FOLDERS,
    isStaff ? STAFF_FOLDER : ALUMNO_FOLDER,
  ], [isStaff])

  // Docs subidos por alumnos (uploader_role === 'alumno')
  const alumnoDocs = useMemo(() =>
    documents.filter(d => d.uploader_role === 'alumno')
  , [documents])

  // Mis propios docs (para alumno)
  const myDocs = useMemo(() =>
    documents.filter(d => d.uploaded_by === currentUser?.id)
  , [documents, currentUser?.id])

  // Alumnos que han subido docs (para staff)
  const alumnosConDocs = useMemo(() => {
    const map: Record<string, { id: string; name: string; docCount: number }> = {}
    for (const doc of alumnoDocs) {
      if (!doc.uploaded_by || !doc.uploader_name) continue
      if (!map[doc.uploaded_by]) {
        map[doc.uploaded_by] = { id: doc.uploaded_by, name: doc.uploader_name, docCount: 0 }
      }
      map[doc.uploaded_by]!.docCount++
    }
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name))
  }, [alumnoDocs])

  // Filtrado por búsqueda
  const filteredAlumnos = useMemo(() => {
    if (!alumnoSearch.trim()) return alumnosConDocs
    const q = alumnoSearch.toLowerCase()
    return alumnosConDocs.filter(a => a.name.toLowerCase().includes(q))
  }, [alumnosConDocs, alumnoSearch])

  // Docs del alumno seleccionado
  const docsDelAlumno = useMemo(() =>
    selectedAlumno ? alumnoDocs.filter(d => d.uploaded_by === selectedAlumno) : []
  , [alumnoDocs, selectedAlumno])

  // Conteo por carpeta
  const folderCount = (id: FolderId) => {
    if (id === 'alumnos') return isStaff ? alumnoDocs.length : myDocs.length
    return byCategory(id as 'contrato' | 'material' | 'video').length
  } // convertir GB a bytes

  // Cargar el límite de almacenamiento de la academia
  useEffect(() => {
    if (!currentUser?.academy_id) return
    supabase
      .from('academies')
      .select('storage_limit_gb')
      .eq('id', currentUser.academy_id)
      .single()
      .then(({ data }) => {
        if (data?.storage_limit_gb) setStorageLimitGb(data.storage_limit_gb)
      })
  }, [currentUser?.academy_id])

  const handleFolder = (id: FolderId) => {
    const isOpening = openFolder !== id
    setOpenFolder(prev => prev === id ? null : id)
    if (isOpening) {
      setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    }
  }

  const scrollToTop = () => foldersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const handleDelete = async (doc: AcademyDocument) => {
    const canDelete = currentUser?.role === 'director' || currentUser?.role === 'superadmin' || doc.uploaded_by === currentUser?.id
    if (!canDelete) return
    const { error: err } = await supabase.from('academy_documents').delete().eq('id', doc.id)
    if (!err) reload()
  }

  const canDeleteDoc = (doc: AcademyDocument) =>
    currentUser?.role === 'director' || currentUser?.role === 'superadmin' || doc.uploaded_by === currentUser?.id

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <Loader2 size={18} className={styles.spinIcon} />
          Cargando documentos...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>{error}</div>
      </div>
    )
  }

  const activeFolder = folders.find(f => f.id === openFolder)

  const activeDocs = openFolder && openFolder !== 'alumnos'
    ? byCategory(openFolder as 'contrato' | 'material' | 'video')
    : []

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          Volver
        </button>
        <h1 className={styles.title}>Documentos</h1>
      </div>

      {/* Stats de almacenamiento — donas premium */}
      {isStaff && (
        <div className={styles.statsGrid}>
          {/* Dona principal — uso total */}
          <div className={styles.statCard}>
            <div className={styles.donutWrap}>
              <StorageDonut
                usedBytes={storageStats.totalBytes}
                limitBytes={STORAGE_LIMIT}
                color="#2563EB"
                icon={<HardDrive size={18} strokeWidth={1.8} />}
              />
            </div>
            <div className={styles.statCardInfo}>
              <span className={styles.statCardValue}>{formatSize(storageStats.totalBytes)}</span>
              <span className={styles.statCardLabel}>de {formatSize(STORAGE_LIMIT)}</span>
            </div>
          </div>

          {/* Dona — Material */}
          <div className={styles.statCard}>
            <div className={styles.donutWrap}>
              <StorageDonut
                usedBytes={storageStats.byCategory['material']?.bytes ?? 0}
                limitBytes={STORAGE_LIMIT}
                color="#1C1C1E"
                icon={<FileText size={16} strokeWidth={1.8} />}
              />
            </div>
            <div className={styles.statCardInfo}>
              <span className={styles.statCardValue}>{storageStats.byCategory['material']?.count ?? 0} docs</span>
              <span className={styles.statCardLabel}>{formatSize(storageStats.byCategory['material']?.bytes ?? 0)}</span>
            </div>
          </div>

          {/* Dona — Contratos */}
          <div className={styles.statCard}>
            <div className={styles.donutWrap}>
              <StorageDonut
                usedBytes={storageStats.byCategory['contrato']?.bytes ?? 0}
                limitBytes={STORAGE_LIMIT}
                color="#7C3AED"
                icon={<FileCheck size={16} strokeWidth={1.8} />}
              />
            </div>
            <div className={styles.statCardInfo}>
              <span className={styles.statCardValue}>{storageStats.byCategory['contrato']?.count ?? 0} contratos</span>
              <span className={styles.statCardLabel}>{formatSize(storageStats.byCategory['contrato']?.bytes ?? 0)}</span>
            </div>
          </div>

          {/* Dona — Videos */}
          <div className={styles.statCard}>
            <div className={styles.donutWrap}>
              <StorageDonut
                usedBytes={storageStats.byCategory['video']?.bytes ?? 0}
                limitBytes={STORAGE_LIMIT}
                color="#2563EB"
                icon={<Video size={16} strokeWidth={1.8} />}
              />
            </div>
            <div className={styles.statCardInfo}>
              <span className={styles.statCardValue}>{storageStats.byCategory['video']?.count ?? 0} videos</span>
              <span className={styles.statCardLabel}>enlaces</span>
            </div>
          </div>
        </div>
      )}

      {/* Aviso de limite */}
      {isStaff && storageStats.totalBytes > STORAGE_LIMIT * 0.8 && (
        <div className={styles.limitWarning}>
          <AlertCircle size={15} />
          <span>
            {storageStats.totalBytes >= STORAGE_LIMIT
              ? 'Has alcanzado el limite de almacenamiento. Contacta con ventas para ampliarlo.'
              : `Estas usando mas del 80% del almacenamiento. Contacta con ventas si necesitas mas espacio.`
            }
          </span>
        </div>
      )}

      {/* Upload section */}
      {currentUser && (
        <UploadSection
          currentUser={currentUser}
          onUploaded={reload}
          storageLimitBytes={STORAGE_LIMIT}
          currentUsageBytes={storageStats.totalBytes}
        />
      )}

      {/* Filtro por usuario — eliminado, ahora está dentro de la 4ª carpeta */}

      {/* Carpetas */}
      <div ref={foldersRef} className={styles.foldersRow}>
        {folders.map(folder => (
          <GlassFolder
            key={folder.id}
            label={folder.label}
            sublabel={folder.sublabel}
            count={folderCount(folder.id)}
            color={folder.color}
            isOpen={openFolder === folder.id}
            onClick={() => handleFolder(folder.id)}
          />
        ))}
      </div>

      {/* Panel de archivos — carpetas normales */}
      {activeFolder && openFolder !== 'alumnos' && (
        <div ref={panelRef} className={styles.filesPanel}>
          <div className={styles.filesPanelHeader}>
            <div className={styles.filesPanelIcon} style={{ background: activeFolder.iconBg, color: '#fff' }}>
              {activeFolder.icon}
            </div>
            <div>
              <p className={styles.filesPanelTitle}>{activeFolder.label}</p>
              <p className={styles.filesPanelCount}>
                {activeDocs.length} archivo{activeDocs.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {activeDocs.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}><Inbox size={28} /></span>
              {activeFolder.emptyMsg}
            </div>
          ) : (
            <div className={styles.fileList}>
              {activeDocs.map(doc => (
                <FileItem
                  key={doc.id}
                  doc={doc}
                  canDelete={canDeleteDoc(doc)}
                  onDelete={() => handleDelete(doc)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Panel especial — 4ª carpeta: Mis documentos (alumno) */}
      {openFolder === 'alumnos' && !isStaff && (
        <div ref={panelRef} className={styles.filesPanel}>
          <div className={styles.filesPanelHeader}>
            <div className={styles.filesPanelIcon} style={{ background: activeFolder?.iconBg, color: '#fff' }}>
              <User size={18} />
            </div>
            <div>
              <p className={styles.filesPanelTitle}>Mis documentos</p>
              <p className={styles.filesPanelCount}>
                {myDocs.length} archivo{myDocs.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {myDocs.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}><Inbox size={28} /></span>
              No has subido ningun documento todavia.
            </div>
          ) : (
            <div className={styles.fileList}>
              {myDocs.map(doc => (
                <FileItem
                  key={doc.id}
                  doc={doc}
                  canDelete={canDeleteDoc(doc)}
                  onDelete={() => handleDelete(doc)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Panel especial — 4ª carpeta: Docs de alumnos (staff) */}
      {openFolder === 'alumnos' && isStaff && (
        <div ref={panelRef} className={styles.filesPanel}>
          <div className={styles.filesPanelHeader}>
            <div className={styles.filesPanelIcon} style={{ background: activeFolder?.iconBg, color: '#fff' }}>
              <Users size={18} />
            </div>
            <div>
              <p className={styles.filesPanelTitle}>Documentos de alumnos</p>
              <p className={styles.filesPanelCount}>
                {alumnoDocs.length} archivo{alumnoDocs.length !== 1 ? 's' : ''} de {alumnosConDocs.length} alumno{alumnosConDocs.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Buscador */}
          <div className={styles.alumnoSearch}>
            <Search size={15} />
            <input
              className={styles.alumnoSearchInput}
              placeholder="Buscar alumno..."
              value={alumnoSearch}
              onChange={e => { setAlumnoSearch(e.target.value); setSelectedAlumno(null) }}
            />
          </div>

          {!selectedAlumno ? (
            /* Lista de alumnos */
            alumnosConDocs.length === 0 ? (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}><Inbox size={28} /></span>
                Ningun alumno ha subido documentos todavia.
              </div>
            ) : (
              <div className={styles.alumnoList}>
                {filteredAlumnos.map(a => (
                  <button
                    key={a.id}
                    className={styles.alumnoCard}
                    onClick={() => setSelectedAlumno(a.id)}
                  >
                    <div className={styles.alumnoAvatar} style={{ background: `hsl(${a.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360}, 60%, 88%)`, color: `hsl(${a.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360}, 50%, 35%)` }}>
                      {a.name[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className={styles.alumnoInfo}>
                      <span className={styles.alumnoName}>{a.name}</span>
                      <span className={styles.alumnoDocCount}>{a.docCount} archivo{a.docCount !== 1 ? 's' : ''}</span>
                    </div>
                    <ArrowRight size={14} className={styles.alumnoArrow} />
                  </button>
                ))}
              </div>
            )
          ) : (
            /* Docs del alumno seleccionado */
            <>
              <button className={styles.alumnoBackBtn} onClick={() => setSelectedAlumno(null)}>
                <ArrowLeft size={14} />
                Volver a la lista
              </button>
              <div className={styles.fileList}>
                {docsDelAlumno.map(doc => (
                  <FileItem
                    key={doc.id}
                    doc={doc}
                    canDelete={canDeleteDoc(doc)}
                    onDelete={() => handleDelete(doc)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Volver arriba */}
      {openFolder && (
        <button className={styles.scrollUpBtn} onClick={scrollToTop} aria-label="Volver a carpetas">
          <ChevronUp size={18} strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}
