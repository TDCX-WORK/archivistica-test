import { useMemo } from 'react'
import {
  Users, Zap, AlertTriangle, Shield, BarChart2, BookOpen,
  RefreshCw, TrendingUp, TrendingDown, GraduationCap,
  Clock, FileText, CheckCircle, X, Check, Key, Euro,
  UserPlus, Star, BookMarked, Rocket, ArrowUpDown, ArrowRight,
  MessageSquare, Send, Trash2, CornerDownLeft, Megaphone, RotateCcw,
  Phone, MapPin, Mail, Target, Calendar, Edit3,
  Save, ChevronLeft, ChevronUp
} from 'lucide-react'
import { scoreColor } from '../DirectorTypes'
import styles from './ProfesoresTable.module.css'

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


// ── ProfesoresTable ────────────────────────────────────────────────────────
function ProfesoresTable({ staffProfiles, stats, onProfesorClick }: {
  staffProfiles:   StudentProfile[]
  stats:           Stats
  onProfesorClick: (p: StudentProfile) => void
}) {
  const profesores = useMemo(() => {
    const profStats = stats.bySubject.flatMap(sub => sub.profesores.map(p => ({ ...p, subjectName: sub.name, subjectColor: sub.color })))
    return staffProfiles.filter(p => p.role === 'profesor').map(p => ({ ...p, stats: profStats.find(s => s.id === p.id) ?? null }))
  }, [staffProfiles, stats])

  if (!profesores.length) return <p className={styles.empty}>No hay profesores registrados en esta academia.</p>

  const now    = new Date()
  const act    = stats.profesorActivity
  const fmtDias = (iso: string) => {
    const dias = Math.floor((now.getTime() - new Date(iso).getTime()) / 86400000)
    if (dias === 0) return 'Hoy'
    if (dias === 1) return 'Ayer'
    if (dias < 30)  return `Hace ${dias}d`
    return `Hace ${Math.round(dias/30)}m`
  }

  return (
    <div className={styles.profesoresGrid}>
      {profesores.map(p => {
        const ext        = p.extended ?? {}
        const nombre     = String(ext.full_name ?? '') || p.username
        const lastAviso  = act?.lastAvisoByProfesor[p.id]
        const totalAvisos= act?.totalAvisosByProfesor[p.id] ?? 0
        const nAlumnos   = p.stats?.alumnos ?? 0
        const nota       = p.stats?.notaMedia ?? null
        const sinActividad = lastAviso
          ? Math.floor((now.getTime() - new Date(lastAviso.created_at).getTime()) / 86400000) > 14
          : true

        return (
          <div key={p.id} className={styles.profeCard}
            style={{
              borderTop: `3px solid ${sinActividad ? '#DC2626' : '#7C3AED'}`,
              boxShadow: sinActividad
                ? '0 4px 16px rgba(220,38,38,0.1)'
                : '0 4px 16px rgba(124,58,237,0.1)',
            }}
            onClick={() => onProfesorClick(p)}>

            {/* Cabecera */}
            <div className={styles.profeCardHead}>
              <div className={styles.profeAvatar} style={{
                background: sinActividad ? 'rgba(220,38,38,0.1)' : 'rgba(124,58,237,0.1)',
                color:      sinActividad ? '#DC2626' : '#7C3AED',
              }}>
                {nombre[0]!.toUpperCase()}
              </div>
              <div className={styles.profeInfo}>
                <span className={styles.profeNombre}>{nombre}</span>
                {ext.full_name && <span className={styles.profeUsername}>@{p.username}</span>}
              </div>
              {sinActividad && (
                <span className={styles.profeAlerta}>Sin actividad</span>
              )}
            </div>

            {/* Asignatura */}
            {p.stats && (
              <div className={styles.profeAsig}>
                <div className={styles.alumnoDot} style={{background: p.stats.subjectColor}}/>
                <span>{p.stats.subjectName}</span>
              </div>
            )}

            {/* KPIs */}
            <div className={styles.profeKpis}>
              <div className={styles.profeKpi}>
                <span className={styles.profeKpiVal}>{nAlumnos}</span>
                <span className={styles.profeKpiLabel}>Alumnos</span>
              </div>
              <div className={styles.profeKpi}>
                <span className={styles.profeKpiVal} style={{color: scoreColor(nota)}}>{nota !== null ? `${nota}%` : '—'}</span>
                <span className={styles.profeKpiLabel}>Nota media</span>
              </div>
              <div className={styles.profeKpi}>
                <span className={styles.profeKpiVal}>{totalAvisos}</span>
                <span className={styles.profeKpiLabel}>Avisos</span>
              </div>
            </div>

            {/* Último aviso */}
            <div className={styles.profeUltimoAviso}>
              <Megaphone size={11} style={{flexShrink:0, color: sinActividad ? '#DC2626' : 'var(--ink-subtle)'}}/>
              {lastAviso ? (
                <span style={{color: sinActividad ? '#DC2626' : 'var(--ink-muted)'}}>
                  {fmtDias(lastAviso.created_at)} — <em>{lastAviso.title.slice(0,40)}{lastAviso.title.length>40?'…':''}</em>
                </span>
              ) : (
                <span style={{color:'#DC2626'}}>Sin avisos publicados</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}


export { ProfesoresTable }
