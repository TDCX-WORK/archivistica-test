import { useState, useMemo } from 'react'
import {
  Users, Zap, AlertTriangle, Shield, BarChart2, BookOpen,
  RefreshCw, TrendingUp, TrendingDown, GraduationCap,
  Clock, FileText, CheckCircle, X, Check, Key, Euro,
  UserPlus, Star, BookMarked, Rocket, ArrowUpDown, ArrowRight,
  MessageSquare, Send, Trash2, CornerDownLeft, Megaphone, RotateCcw,
  Phone, MapPin, Mail, Target, Calendar, Edit3,
  Save, ChevronLeft, ChevronUp
} from 'lucide-react'
import { scoreColor, MASCOTAS } from '../DirectorTypes'
import styles from './AlumnosTable.module.css'

// ── Types ──────────────────────────────────────────────────────────────────
interface SubjectStats {
  id:               string
  slug:             string
  name:             string
  color:            string
  totalAlumnos:     number
  alumnosActivos:   number
  notaMedia:        number | null
  sesiones30d:      number
  enRiesgo:         number
  porExpirar:       number
  alumnosConNota:   { id: string; username: string; nota: number | null; sesiones: number }[]
  alumnosEnRiesgo:  { id: string; username: string; diasInactivo: number | null }[]
  alumnosPorExpirar:{ id: string; username: string; diasRestantes: number }[]
  profesores:       { id: string; username: string; alumnos: number; notaMedia: number | null; sesionesThisWeek: number }[]
}

interface Stats {
  totalAlumnos:    number
  totalActivos:    number
  totalProfesores: number
  totalEnRiesgo:   number
  totalPorExpirar: number
  notaGlobal:      number | null
  sesiones30d:     number
  bySubject:       SubjectStats[]
  semanas:         { label: string; sesiones: number; alumnosActivos: number; notaMedia: number | null }[]
  profesorActivity?: {
    lastAvisoByProfesor:  Record<string, { created_at: string; title: string }>
    totalAvisosByProfesor:Record<string, number>
  }
  finanzas?: {
    mrrAcademia:           number
    mrrActivos:            number
    alumnosSinPrecio:      number
    totalAlumnosConPrecio: number
    spMap:                 Record<string, { monthly_price: number | null; exam_date: string | null; full_name: string | null; city: string | null; payment_status: string }>
    pagos: {
      pagados:     number
      pendientes:  number
      vencidos:    number
      mrrCobrado:  number
      mrrPendiente:number
      mrrVencido:  number
    }
  }
}

interface ProfileSimple {
  id:           string
  username:     string
  role:         string
  access_until: string | null
  created_at:   string
}

interface StudentProfile {
  id:            string
  username:      string
  role:          string
  access_until:  string | null
  created_at:    string | null
  subject_name?: string | null
  extended:      Record<string, any> | null
}

interface AlumnoEnriquecido {
  id:            string
  username:      string
  nota:          number | null
  sesiones:      number
  subjectName:   string
  subjectColor:  string
  enRiesgo:      boolean
  diasInactivo:  number | null
  diasRestantes: number | null
  extended:      Record<string, any> | null
  access_until:  string | null
  created_at:    string | null
}

interface AlumnoDetalleForm {
  full_name:     string
  phone:         string
  email_contact: string
  city:          string
  exam_date:     string
  monthly_price: string
  access_until:  string
}


// ── AlumnosTable ───────────────────────────────────────────────────────────
function AlumnosTable({ stats, academyProfiles, onAlumnoClick }: {
  stats:           Stats
  academyProfiles: { studentProfiles: StudentProfile[]; staffProfiles: StudentProfile[] }
  onAlumnoClick:   (a: AlumnoEnriquecido) => void
}) {
  const [sortBy,  setSortBy]  = useState<'nota' | 'sesiones'>('nota')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [filtro,  setFiltro]  = useState('todos')

  const todos = useMemo<AlumnoEnriquecido[]>(() => {
    const spMap: Record<string, StudentProfile> = {}
    for (const sp of academyProfiles.studentProfiles) spMap[sp.id] = sp
    return stats.bySubject.flatMap(sub =>
      sub.alumnosConNota.map(a => ({
        ...a,
        subjectName:   sub.name,
        subjectColor:  sub.color ?? '#6B7280',
        enRiesgo:      sub.alumnosEnRiesgo.some(r => r.id === a.id),
        diasInactivo:  sub.alumnosEnRiesgo.find(r => r.id === a.id)?.diasInactivo ?? null,
        diasRestantes: sub.alumnosPorExpirar.find(r => r.id === a.id)?.diasRestantes ?? null,
        extended:      spMap[a.id]?.extended ?? null,
        access_until:  spMap[a.id]?.access_until ?? null,
        created_at:    spMap[a.id]?.created_at ?? null,
      }))
    )
  }, [stats, academyProfiles])

  const filtrados = useMemo(() => {
    const arr = filtro === 'riesgo'  ? todos.filter(a => a.enRiesgo)
              : filtro === 'activos' ? todos.filter(a => !a.enRiesgo && a.sesiones > 0)
              : [...todos]
    return arr.sort((a, b) => {
      const va = (a as any)[sortBy] ?? -1, vb = (b as any)[sortBy] ?? -1
      return sortDir === 'desc' ? vb - va : va - vb
    })
  }, [todos, sortBy, sortDir, filtro])

  const handleSort = (col: 'nota' | 'sesiones') => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortBy(col); setSortDir('desc') }
  }

  const SortBtn = ({ col, label }: { col: 'nota' | 'sesiones'; label: string }) => (
    <button className={styles.sortBtn} onClick={() => handleSort(col)}>
      {label} <ArrowUpDown size={10} style={{ opacity: sortBy === col ? 1 : 0.4 }} />
    </button>
  )

  return (
    <div className={styles.alumnosSection}>
      <div className={styles.alumnosFiltros}>
        {[
          { id: 'todos',   label: `Todos (${todos.length})` },
          { id: 'riesgo',  label: `⚠ Riesgo (${todos.filter(a => a.enRiesgo).length})` },
          { id: 'activos', label: `Activos (${todos.filter(a => a.sesiones > 0).length})` },
        ].map(f => (
          <button key={f.id} className={[styles.filtroBtn, filtro === f.id ? styles.filtroBtnActive : ''].join(' ')} onClick={() => setFiltro(f.id)}>{f.label}</button>
        ))}
      </div>
      <div className={styles.alumnosTable}>
        <div className={styles.alumnosTableHead}>
          <span>Alumno</span><span>Asignatura</span>
          <SortBtn col="nota"     label="Nota" />
          <SortBtn col="sesiones" label="Sesiones" />
          <span>Estado</span><span />
        </div>
        {filtrados.length === 0 ? <p className={styles.empty}>Sin alumnos</p> : filtrados.map(a => {
          const mascota = MASCOTAS[String(a.extended?.mascota ?? '')]
          const nombre  = String(a.extended?.full_name ?? '') || a.username
          const color   = scoreColor(a.nota)
          return (
            <div key={a.id} className={styles.alumnoRow} onClick={() => onAlumnoClick(a)}>
              <div className={styles.alumnoNameCell}>
                <div className={styles.alumnoAvatarSm} style={{ background: color + '22', color }}>
                  {mascota ? mascota.emoji : nombre[0]!.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--ink)' }}>{nombre}</div>
                  {a.extended?.full_name && <div style={{ fontSize: '0.68rem', color: 'var(--ink-muted)' }}>@{a.username}</div>}
                </div>
              </div>
              <div className={styles.alumnoSubCell}>
                <div className={styles.alumnoDot} style={{ background: a.subjectColor }} />
                <span>{a.subjectName}</span>
              </div>
              <span style={{ color, fontWeight: 700, fontSize: '0.88rem' }}>{a.nota !== null ? `${a.nota}%` : '—'}</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>{a.sesiones}</span>
              <span className={a.enRiesgo ? styles.estadoRiesgo : styles.estadoOk}>{a.enRiesgo ? `${a.diasInactivo ?? '?'}d inactivo` : 'Activo'}</span>
              <ArrowRight size={13} className={styles.alumnoArrow} />
            </div>
          )
        })}
      </div>
    </div>
  )
}


export { AlumnosTable }
