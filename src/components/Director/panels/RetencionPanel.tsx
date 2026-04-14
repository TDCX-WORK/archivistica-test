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
import styles from './RetencionPanel.module.css'

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


// ── RetencionPanel ────────────────────────────────────────────────────────
function RetencionPanel({ profiles }: { profiles: ProfileSimple[] }) {
  const now      = new Date()
  const alumnos  = profiles.filter(p => p.role === 'alumno')

  const fmtDias = (d: number) => d < 30 ? `${d}d` : d < 365 ? `${Math.round(d/30)}m` : `${(d/365).toFixed(1)}a`

  // Enriquecer cada alumno
  const enriquecidos = alumnos.map(a => {
    const inicio       = a.created_at ? new Date(a.created_at) : null
    const fin          = a.access_until ? new Date(a.access_until) : null
    const diasEnAcad   = inicio ? Math.floor((now.getTime() - inicio.getTime()) / 86400000) : null
    const diasRestantes= fin ? Math.ceil((fin.getTime() - now.getTime()) / 86400000) : null
    const expirado     = fin ? fin < now : false
    const mesAlta      = inicio ? `${inicio.getFullYear()}-${String(inicio.getMonth()+1).padStart(2,'0')}` : null
    return { ...a, diasEnAcad, diasRestantes, expirado, mesAlta, inicio, fin }
  })

  // KPIs
  const activos      = enriquecidos.filter(a => !a.expirado)
  const expirados    = enriquecidos.filter(a => a.expirado)
  const nuevos30d    = enriquecidos.filter(a => a.diasEnAcad !== null && a.diasEnAcad <= 30)
  const fieles       = enriquecidos.filter(a => a.diasEnAcad !== null && a.diasEnAcad >= 90 && !a.expirado)
  const mediaPerma   = activos.length
    ? Math.round(activos.reduce((s,a) => s + (a.diasEnAcad ?? 0), 0) / activos.length)
    : 0
  const vencen15d    = activos.filter(a => a.diasRestantes !== null && a.diasRestantes <= 15)
  const tasaActivos  = alumnos.length ? Math.round((activos.length / alumnos.length) * 100) : 0

  // Cohorts por mes de alta
  const cohorts = Array.from(
    enriquecidos.reduce((map, a) => {
      if (!a.mesAlta) return map
      const entry = map.get(a.mesAlta) ?? { mes: a.mesAlta, total: 0, activos: 0 }
      entry.total++
      if (!a.expirado) entry.activos++
      map.set(a.mesAlta, entry)
      return map
    }, new Map<string, {mes:string; total:number; activos:number}>())
  ).map(([,v]: [string, {mes:string;total:number;activos:number}]) => v).sort((a,b) => a.mes.localeCompare(b.mes))

  const MESES_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const fmtMes = (ym: string) => {
    const [y, m] = ym.split('-')
    return `${MESES_ES[parseInt(m!)-1]} ${y}`
  }

  return (
    <div className={styles.retencionWrap}>

      {/* KPIs */}
      <div className={styles.retencionKpis}>
        <div className={styles.retencionKpi}>
          <div className={styles.retencionKpiIcon} style={{background:'rgba(5,150,105,0.1)',color:'#059669'}}>
            <Users size={18} strokeWidth={1.8}/>
          </div>
          <div className={styles.retencionKpiVal} style={{color:'#059669'}}>{activos.length}</div>
          <div className={styles.retencionKpiLabel}>Alumnos activos</div>
          <div className={styles.retencionKpiSub}>{tasaActivos}% del total</div>
        </div>
        <div className={styles.retencionKpi}>
          <div className={styles.retencionKpiIcon} style={{background:'rgba(37,99,235,0.1)',color:'#2563EB'}}>
            <TrendingUp size={18} strokeWidth={1.8}/>
          </div>
          <div className={styles.retencionKpiVal}>{fmtDias(mediaPerma)}</div>
          <div className={styles.retencionKpiLabel}>Permanencia media</div>
          <div className={styles.retencionKpiSub}>Alumnos activos</div>
        </div>
        <div className={styles.retencionKpi}>
          <div className={styles.retencionKpiIcon} style={{background:'rgba(124,58,237,0.1)',color:'#7C3AED'}}>
            <Star size={18} strokeWidth={1.8}/>
          </div>
          <div className={styles.retencionKpiVal} style={{color:'#7C3AED'}}>{fieles.length}</div>
          <div className={styles.retencionKpiLabel}>Alumnos fieles</div>
          <div className={styles.retencionKpiSub}>Más de 3 meses activos</div>
        </div>
        <div className={styles.retencionKpi} style={nuevos30d.length > 0 ? {borderColor:'rgba(8,145,178,0.3)'} : {}}>
          <div className={styles.retencionKpiIcon} style={{background:'rgba(8,145,178,0.1)',color:'#0891B2'}}>
            <UserPlus size={18} strokeWidth={1.8}/>
          </div>
          <div className={styles.retencionKpiVal} style={{color:'#0891B2'}}>{nuevos30d.length}</div>
          <div className={styles.retencionKpiLabel}>Nuevos este mes</div>
          <div className={styles.retencionKpiSub}>Últimos 30 días</div>
        </div>
      </div>

      {/* Alerta vencen pronto */}
      {vencen15d.length > 0 && (
        <div className={styles.retencionAlerta}>
          <AlertTriangle size={14} style={{color:'#DC2626',flexShrink:0}}/>
          <span><strong>{vencen15d.length} alumno{vencen15d.length!==1?'s':''}</strong> pierde{vencen15d.length===1?'':'n'} acceso en menos de 15 días — {vencen15d.map(a=>a.username).join(', ')}</span>
        </div>
      )}

      {/* Cohorts por mes de alta */}
      <div className={styles.retencionSection}>
        <div className={styles.retencionSectionTitle}>
          <Calendar size={14}/> Cohortes de registro
        </div>
        <div className={styles.cohortGrid}>
          {cohorts.map((c, i) => {
            const pct = c.total ? Math.round((c.activos / c.total) * 100) : 0
            return (
              <div key={i} className={styles.cohortCard}>
                <div className={styles.cohortMes}>{fmtMes(c.mes)}</div>
                <div className={styles.cohortStats}>
                  <span className={styles.cohortNum}>{c.activos}<span>/{c.total}</span></span>
                  <span className={styles.cohortLabel}>activos</span>
                </div>
                <div className={styles.cohortBar}>
                  <div className={styles.cohortBarFill} style={{
                    width: `${pct}%`,
                    background: pct >= 80 ? 'linear-gradient(90deg,#059669,#34d399)' :
                                pct >= 50 ? 'linear-gradient(90deg,#D97706,#fbbf24)' :
                                            'linear-gradient(90deg,#DC2626,#f87171)',
                  }}/>
                </div>
                <div className={styles.cohortPct} style={{
                  color: pct >= 80 ? '#059669' : pct >= 50 ? '#D97706' : '#DC2626'
                }}>{pct}%</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Cards de alumnos con permanencia */}
      <div className={styles.retencionSection}>
        <div className={styles.retencionSectionTitle}>
          <Clock size={14}/> Tiempo en academia por alumno
        </div>
        <div className={styles.retencionCardsGrid}>
          {[...enriquecidos].sort((a,b) => (b.diasEnAcad??0) - (a.diasEnAcad??0)).map((a, i) => {
            const dias  = a.diasEnAcad ?? 0
            const pct   = Math.min(100, Math.round((dias / 365) * 100))
            const color = a.expirado ? '#DC2626' : dias >= 90 ? '#059669' : '#0891B2'
            const glow  = a.expirado ? 'rgba(220,38,38,0.13)' : dias >= 90 ? 'rgba(5,150,105,0.13)' : 'rgba(8,145,178,0.13)'
            const gradStart = a.expirado ? '#DC2626' : dias >= 90 ? '#059669' : '#0891B2'
            const gradEnd   = a.expirado ? '#f87171' : dias >= 90 ? '#34d399' : '#38bdf8'
            const etiqueta  = a.expirado ? 'Expirado' : dias >= 90 ? 'Fiel' : dias >= 30 ? 'Regular' : 'Nuevo'
            return (
              <div key={i} className={styles.retencionCard}
                style={{
                  border: `2px solid ${color}66`,
                  boxShadow: `0 4px 16px ${glow}, 0 1px 3px rgba(0,0,0,0.04)`
                }}>
                {/* Cabecera */}
                <div className={styles.retencionCardHead}>
                  <div className={styles.retencionCardAvatar} style={{background:`${color}18`, color}}>
                    {a.username[0]!.toUpperCase()}
                  </div>
                  <div className={styles.retencionCardInfo}>
                    <span className={styles.retencionCardNombre}>{a.username}</span>
                    <span className={styles.retencionCardEtiqueta} style={{color, background:`${color}12`}}>
                      {etiqueta}
                    </span>
                  </div>
                </div>
                {/* Permanencia */}
                <div className={styles.retencionCardDias} style={{color}}>
                  {fmtDias(dias)}
                  <span>en academia</span>
                </div>
                {/* Barra de progreso animada */}
                <div className={styles.retencionCardBar}>
                  <div className={styles.retencionCardBarFill} style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${gradStart}, ${gradEnd})`,
                    boxShadow: `0 0 6px ${color}88`,
                  }}/>
                </div>
                {/* Acceso restante */}
                <div className={styles.retencionCardExpira}>
                  {a.expirado
                    ? <span style={{color:'#DC2626', fontWeight:700}}>✕ Sin acceso</span>
                    : a.diasRestantes !== null
                      ? <><span style={{color, fontWeight:700}}>{a.diasRestantes}d</span> de acceso restante</>
                      : '—'
                  }
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}


export { RetencionPanel }
