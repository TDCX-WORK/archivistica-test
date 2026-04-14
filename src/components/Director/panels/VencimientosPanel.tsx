import { useState } from 'react'
import {
  Users, Zap, AlertTriangle, Shield, BarChart2, BookOpen,
  RefreshCw, TrendingUp, TrendingDown, GraduationCap,
  Clock, FileText, CheckCircle, X, Check, Key, Euro,
  UserPlus, Star, BookMarked, Rocket, ArrowUpDown, ArrowRight,
  MessageSquare, Send, Trash2, CornerDownLeft, Megaphone, RotateCcw,
  Phone, MapPin, Mail, Target, Calendar, Edit3,
  Save, ChevronLeft, ChevronUp
} from 'lucide-react'
import styles from './VencimientosPanel.module.css'

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


// ── VencimientosPanel ─────────────────────────────────────────────────────
function VencimientosPanel({ profiles, onRenovar }: {
  profiles:  ProfileSimple[]
  onRenovar: (id: string, username: string) => void
}) {
  const now     = new Date()
  const alumnos = profiles.filter(p => p.role === 'alumno')

  const enriquecidos = alumnos
    .filter(a => a.access_until)
    .map(a => ({
      id:          a.id,
      username:    a.username,
      accessUntil: a.access_until!,
      dias:        Math.ceil((new Date(a.access_until!).getTime() - now.getTime()) / 86400000),
    }))
    .sort((a, b) => a.dias - b.dias)

  const expirados  = enriquecidos.filter(a => a.dias <= 0)
  const esta_semana = enriquecidos.filter(a => a.dias > 0 && a.dias <= 7)
  const este_mes   = enriquecidos.filter(a => a.dias > 7 && a.dias <= 30)
  const proximos   = enriquecidos.filter(a => a.dias > 30 && a.dias <= 90)
  const sin_acceso = alumnos.filter(a => !a.access_until)

  const fmtFecha = (iso: string) =>
    new Date(iso).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' })

  const Grupo = ({ titulo, items, color, urgente }: {
    titulo: string; items: typeof enriquecidos; color: string; urgente?: boolean
  }) => {
    if (!items.length) return null
    return (
      <div className={styles.vencGrupo}>
        <div className={styles.vencGrupoTitulo} style={{color}}>
          <span className={styles.vencGrupoDot} style={{background:color}}/>
          {titulo}
          <span className={styles.vencGrupoCount}>{items.length}</span>
        </div>
        <div className={styles.vencCardsGrid}>
          {items.map(a => (
            <div key={a.id} className={styles.vencCard} style={{
              borderLeft: `3px solid ${color}`,
              boxShadow: urgente ? `0 4px 16px ${color}22` : undefined,
            }}>
              <div className={styles.vencCardHead}>
                <div className={styles.vencAvatar} style={{background:`${color}15`,color}}>
                  {a.username[0]!.toUpperCase()}
                </div>
                <div className={styles.vencInfo}>
                  <span className={styles.vencNombre}>{a.username}</span>
                  <span className={styles.vencFecha}>{a.dias <= 0 ? 'Expirado' : fmtFecha(a.accessUntil)}</span>
                </div>
                <div className={styles.vencDiasBadge} style={{background:`${color}15`,color}}>
                  {a.dias <= 0 ? `${Math.abs(a.dias)}d expirado` : `${a.dias}d`}
                </div>
              </div>
              <button className={styles.vencBtnRenovar} style={{'--vc':color} as React.CSSProperties}
                onClick={() => onRenovar(a.id, a.username)}>
                <RotateCcw size={11}/> Renovar acceso
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const totalAlertas = expirados.length + esta_semana.length

  return (
    <div className={styles.vencWrap}>
      {/* KPIs resumen */}
      <div className={styles.vencKpis}>
        <div className={styles.vencKpi} style={{borderColor: expirados.length>0?'rgba(220,38,38,0.3)':undefined}}>
          <span className={styles.vencKpiVal} style={{color:expirados.length>0?'#DC2626':'var(--ink)'}}>{expirados.length}</span>
          <span className={styles.vencKpiLabel}>Expirados</span>
        </div>
        <div className={styles.vencKpi} style={{borderColor: esta_semana.length>0?'rgba(217,119,6,0.3)':undefined}}>
          <span className={styles.vencKpiVal} style={{color:esta_semana.length>0?'#D97706':'var(--ink)'}}>{esta_semana.length}</span>
          <span className={styles.vencKpiLabel}>Esta semana</span>
        </div>
        <div className={styles.vencKpi}>
          <span className={styles.vencKpiVal} style={{color:este_mes.length>0?'#D97706':'var(--ink)'}}>{este_mes.length}</span>
          <span className={styles.vencKpiLabel}>Este mes</span>
        </div>
        <div className={styles.vencKpi}>
          <span className={styles.vencKpiVal}>{proximos.length}</span>
          <span className={styles.vencKpiLabel}>En 30–90 días</span>
        </div>
      </div>

      {totalAlertas === 0 && expirados.length === 0 && (
        <div className={styles.vencOk}>
          <CheckCircle size={32} strokeWidth={1.4} style={{color:'#059669'}}/>
          <p>No hay accesos urgentes esta semana</p>
        </div>
      )}

      <Grupo titulo="Expirados — acción inmediata" items={expirados} color="#DC2626" urgente />
      <Grupo titulo="Expiran esta semana" items={esta_semana} color="#D97706" urgente />
      <Grupo titulo="Expiran este mes" items={este_mes} color="#F59E0B" />
      <Grupo titulo="Expiran en 30–90 días" items={proximos} color="#0891B2" />

      {sin_acceso.length > 0 && (
        <div className={styles.vencGrupo}>
          <div className={styles.vencGrupoTitulo} style={{color:'var(--ink-subtle)'}}>
            <span className={styles.vencGrupoDot} style={{background:'var(--ink-subtle)'}}/>
            Sin fecha de acceso asignada
            <span className={styles.vencGrupoCount}>{sin_acceso.length}</span>
          </div>
          <div className={styles.vencCardsGrid}>
            {sin_acceso.map(a => (
              <div key={a.id} className={styles.vencCard} style={{borderLeft:'3px solid var(--line)'}}>
                <div className={styles.vencCardHead}>
                  <div className={styles.vencAvatar} style={{background:'var(--surface-off)',color:'var(--ink-muted)'}}>
                    {a.username[0]!.toUpperCase()}
                  </div>
                  <div className={styles.vencInfo}>
                    <span className={styles.vencNombre}>{a.username}</span>
                    <span className={styles.vencFecha}>Acceso indefinido</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


export { VencimientosPanel }
