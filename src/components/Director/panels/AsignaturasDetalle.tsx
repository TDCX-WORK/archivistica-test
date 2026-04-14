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
import styles from './AsignaturasDetalle.module.css'

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


// ── AsignaturasDetalle ─────────────────────────────────────────────────────
function AsignaturasDetalle({ stats, studentProfiles, onAlumnoClick }: {
  stats:           Stats
  studentProfiles: StudentProfile[]
  onAlumnoClick:   (a: AlumnoEnriquecido) => void
}) {
  const [subSel,  setSubSel]  = useState<string | null>(stats.bySubject?.[0]?.id ?? null)
  const [sortBy,  setSortBy]  = useState<'nota' | 'sesiones'>('nota')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const spMap: Record<string, StudentProfile> = {}
  for (const sp of studentProfiles) spMap[sp.id] = sp

  const sub     = stats.bySubject?.find(s => s.id === subSel)
  const alumnos = useMemo<AlumnoEnriquecido[]>(() => {
    if (!sub) return []
    return [...sub.alumnosConNota].map(a => ({
      ...a,
      subjectName:   sub.name,
      subjectColor:  sub.color ?? '#6B7280',
      enRiesgo:      sub.alumnosEnRiesgo.some(r => r.id === a.id),
      diasInactivo:  sub.alumnosEnRiesgo.find(r => r.id === a.id)?.diasInactivo ?? null,
      diasRestantes: sub.alumnosPorExpirar.find(r => r.id === a.id)?.diasRestantes ?? null,
      extended:      spMap[a.id]?.extended ?? null,
      access_until:  spMap[a.id]?.access_until ?? null,
      created_at:    spMap[a.id]?.created_at ?? null,
    })).sort((a, b) => {
      const va = (a as any)[sortBy] ?? -1, vb = (b as any)[sortBy] ?? -1
      return sortDir === 'desc' ? vb - va : va - vb
    })
  }, [sub, sortBy, sortDir, studentProfiles])

  const handleSort = (col: 'nota' | 'sesiones') => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortBy(col); setSortDir('desc') }
  }

  if (!stats.bySubject?.length) return null

  // Ranking comparativo
  const sorted       = [...stats.bySubject].sort((a,b) => (b.notaMedia??-1) - (a.notaMedia??-1))
  const maxNota      = Math.max(...stats.bySubject.map(s => s.notaMedia ?? 0), 1)
  const maxSesiones  = Math.max(...stats.bySubject.map(s => s.sesiones30d), 1)

  return (
    <div className={styles.asigDetalle}>

      {/* Comparativa ranking — solo si hay más de 1 asignatura */}
      {stats.bySubject.length > 1 && (
        <div className={styles.asigComparativa}>
          <div className={styles.asigComparativaTitulo}>
            <BarChart2 size={14}/> Comparativa entre asignaturas
          </div>
          <div className={styles.asigComparativaGrid}>
            {sorted.map((s, i) => (
              <div key={s.id} className={styles.asigComparativaRow}
                onClick={() => setSubSel(s.id)}
                style={{cursor:'pointer'}}>
                <div className={styles.asigComparativaRank}
                  style={{color: i===0?'#D97706':i===1?'#94A3B8':'#CD7C54'}}>
                  #{i+1}
                </div>
                <div className={styles.asigComparativaNombre}>
                  <div className={styles.alumnoDot} style={{background:s.color??'#6B7280'}}/>
                  <span>{s.name}</span>
                </div>
                <div className={styles.asigComparativaBarWrap}>
                  <div className={styles.asigComparativaBarLabel}>
                    <span style={{color: scoreColor(s.notaMedia), fontWeight:800}}>
                      {s.notaMedia!==null?`${s.notaMedia}%`:'—'}
                    </span>
                  </div>
                  <div className={styles.asigComparativaBar}>
                    <div className={styles.asigComparativaBarFill} style={{
                      width: `${s.notaMedia!==null ? (s.notaMedia/maxNota)*100 : 0}%`,
                      background: `linear-gradient(90deg, ${s.color??'#6B7280'}, ${s.color??'#6B7280'}88)`,
                      boxShadow: `0 0 8px ${s.color??'#6B7280'}44`,
                    }}/>
                  </div>
                </div>
                <div className={styles.asigComparativaMeta}>
                  <span>{s.totalAlumnos} alumnos</span>
                  <span>{s.sesiones30d} sesiones</span>
                  {s.enRiesgo > 0 && <span style={{color:'#DC2626'}}>⚠ {s.enRiesgo}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.asigCards}>
        {stats.bySubject.map(s => (
          <button key={s.id} className={[styles.asigDetailCard, subSel===s.id?styles.asigDetailCardActive:''].join(' ')} style={{ ['--sc' as string]: s.color }} onClick={() => setSubSel(s.id)}>
            <div className={styles.asigDetailBar} />
            <div className={styles.asigDetailContent}>
              <span className={styles.asigDetailName}>{s.name}</span>
              <div className={styles.asigDetailKpis}>
                <div className={styles.asigDetailKpi}><span className={styles.asigDetailKpiVal}>{s.totalAlumnos}</span><span className={styles.asigDetailKpiLabel}>Alumnos</span></div>
                <div className={styles.asigDetailKpi}><span className={styles.asigDetailKpiVal} style={{ color: '#059669' }}>{s.alumnosActivos}</span><span className={styles.asigDetailKpiLabel}>Activos</span></div>
                <div className={styles.asigDetailKpi}><span className={styles.asigDetailKpiVal} style={{ color: scoreColor(s.notaMedia) }}>{s.notaMedia!==null?`${s.notaMedia}%`:'—'}</span><span className={styles.asigDetailKpiLabel}>Nota media</span></div>
                <div className={styles.asigDetailKpi}><span className={styles.asigDetailKpiVal}>{s.sesiones30d}</span><span className={styles.asigDetailKpiLabel}>Sesiones 30d</span></div>
              </div>
            </div>
          </button>
        ))}
      </div>
      {sub && (
        <div className={styles.asigAlumnos}>
          <div className={styles.asigAlumnosHead}>
            <h3 className={styles.asigAlumnosTitle} style={{ color: sub.color }}><span className={styles.asigAlumnosDot} style={{ background: sub.color }} />{sub.name}</h3>
            <div className={styles.asigAlumnosStats}>
              {sub.enRiesgo > 0 && <span className={styles.asigBadgeRed}>⚠ {sub.enRiesgo} en riesgo</span>}
              {sub.porExpirar > 0 && <span className={styles.asigBadgeAmber}>🔒 {sub.porExpirar} expiran pronto</span>}
            </div>
          </div>
          {alumnos.length === 0 ? <p className={styles.empty}>Sin alumnos en esta asignatura</p> : (
            <div className={styles.alumnosTable}>
              <div className={styles.alumnosTableHead}>
                <span>Alumno</span>
                <button className={styles.sortBtn} onClick={() => handleSort('nota')}>Nota <ArrowUpDown size={10} style={{ opacity: sortBy==='nota'?1:0.4 }} /></button>
                <button className={styles.sortBtn} onClick={() => handleSort('sesiones')}>Sesiones <ArrowUpDown size={10} style={{ opacity: sortBy==='sesiones'?1:0.4 }} /></button>
                <span>Estado</span><span />
              </div>
              {alumnos.map(a => {
                const mascota = MASCOTAS[String(a.extended?.mascota ?? '')]
                const nombre  = String(a.extended?.full_name ?? '') || a.username
                const color   = scoreColor(a.nota)
                return (
                  <div key={a.id} className={styles.alumnoRow} style={{ gridTemplateColumns: '1.5fr 100px 100px 120px 32px' }} onClick={() => onAlumnoClick(a)}>
                    <div className={styles.alumnoNameCell}>
                      <div className={styles.alumnoAvatarSm} style={{ background: color+'22', color }}>{mascota?mascota.emoji:nombre[0]!.toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:'0.82rem', color:'var(--ink)' }}>{nombre}</div>
                        {a.extended?.full_name && <div style={{ fontSize:'0.68rem', color:'var(--ink-muted)' }}>@{a.username}</div>}
                      </div>
                    </div>
                    <span style={{ color, fontWeight:700, fontSize:'0.88rem' }}>{a.nota!==null?`${a.nota}%`:'—'}</span>
                    <span style={{ fontSize:'0.82rem', color:'var(--ink-muted)' }}>{a.sesiones}</span>
                    <span className={a.enRiesgo?styles.estadoRiesgo:styles.estadoOk}>{a.enRiesgo?`${a.diasInactivo??'?'}d inactivo`:'Activo'}</span>
                    <ArrowRight size={13} className={styles.alumnoArrow} />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── AsignaturasCard ────────────────────────────────────────────────────────
function AsignaturasCard({ stats }: { stats: Stats }) {
  const subs = stats.bySubject ?? []
  if (subs.length === 0) return <div className={styles.examEmpty}><BookOpen size={22} strokeWidth={1.4} /><p>Sin asignaturas configuradas</p></div>
  return (
    <div className={styles.asigList}>
      {subs.map(sub => (
        <div key={sub.id} className={styles.asigRow}>
          <div className={styles.asigDot} style={{ background: sub.color }} />
          <div className={styles.asigInfo}>
            <span className={styles.asigNombre}>{sub.name}</span>
            <span className={styles.asigMeta}>{sub.totalAlumnos} alumnos · {sub.alumnosActivos} activos</span>
          </div>
          {sub.notaMedia !== null && <span className={styles.asigNota} style={{ color: scoreColor(sub.notaMedia) }}>{sub.notaMedia}%</span>}
        </div>
      ))}
    </div>
  )
}


export { AsignaturasDetalle, AsignaturasCard }
