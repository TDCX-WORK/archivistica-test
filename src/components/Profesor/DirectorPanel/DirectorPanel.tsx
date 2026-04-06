import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useDirector }        from '../../../hooks/useDirector'
import { useAcademyProfiles } from '../../../hooks/useStudentProfile'
import { supabase }           from '../../../lib/supabase'
import {
  Users, Zap, AlertTriangle, Shield, BarChart2, BookOpen,
  RefreshCw, TrendingUp, TrendingDown, GraduationCap,
  Clock, FileText, CheckCircle, X, Check, Key, Euro,
  UserPlus, BookMarked, Rocket, ArrowUpDown, ArrowRight,
  Phone, MapPin, Mail, Target, Calendar, Edit3,
  Save, ChevronLeft, ChevronUp
} from 'lucide-react'
import { Ripple }              from '../../magicui/Ripple'
import { AnimatedGridPattern } from '../../magicui/AnimatedGridPattern'
import type { CurrentUser } from '../../../types'
import styles from './DirectorPanel.module.css'

const MASCOTAS: Record<string, { emoji: string; nombre: string }> = {
  zorro:    { emoji: '🦊', nombre: 'Zorro'    },
  buho:     { emoji: '🦉', nombre: 'Búho'     },
  leon:     { emoji: '🦁', nombre: 'León'     },
  tortuga:  { emoji: '🐢', nombre: 'Tortuga'  },
  aguila:   { emoji: '🦅', nombre: 'Águila'   },
  dragon:   { emoji: '🐉', nombre: 'Dragón'   },
  lobo:     { emoji: '🐺', nombre: 'Lobo'     },
  mariposa: { emoji: '🦋', nombre: 'Mariposa' },
}

const scoreColor = (s: number | null | undefined): string => {
  if (s == null) return '#6B7280'
  if (s >= 80) return '#059669'
  if (s >= 60) return '#0891B2'
  if (s >= 40) return '#B45309'
  return '#DC2626'
}

const fmt = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

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

// ── Narrativa ──────────────────────────────────────────────────────────────
function NarrativaCard({ stats }: { stats: Stats }) {
  const semanas        = stats.semanas ?? []
  const semanasActivas = semanas.filter(s => s.sesiones > 0).length
  const notas          = semanas.filter(s => s.notaMedia !== null)
  const tendencia      = notas.length >= 2 ? (notas[notas.length-1]!.notaMedia! - notas[0]!.notaMedia!) : null

  let msg: string, color: string, Icon: React.ElementType
  if (stats.totalAlumnos === 0)                  { msg = 'Aún no hay alumnos. Comparte el código de invitación con tu primera clase.'; color = '#0891B2'; Icon = Rocket }
  else if (stats.totalActivos === 0)             { msg = 'Ningún alumno ha estudiado esta semana. Habla con tu profesor.';             color = '#DC2626'; Icon = AlertTriangle }
  else if (tendencia !== null && tendencia > 5)  { msg = `La nota media subió ${tendencia} puntos. ¡La clase va en la buena dirección!`; color = '#059669'; Icon = TrendingUp }
  else if (tendencia !== null && tendencia < -5) { msg = `La nota media bajó ${Math.abs(tendencia)} puntos. Revisa el plan de estudio.`; color = '#DC2626'; Icon = TrendingDown }
  else if (semanasActivas >= 6)                  { msg = `Tu academia lleva ${semanasActivas} semanas con actividad constante. ¡Buen ritmo!`; color = '#059669'; Icon = TrendingUp }
  else                                           { msg = `${stats.totalActivos} de ${stats.totalAlumnos} alumnos activos esta semana. Nota media: ${stats.notaGlobal ?? '—'}%.`; color = '#0891B2'; Icon = BarChart2 }

  return (
    <div className={styles.narrativa} style={{ ['--nc' as string]: color }}>
      <div className={styles.narrativaIcon}><Icon size={17} strokeWidth={1.8} /></div>
      <p className={styles.narrativaTexto}>{msg}</p>
    </div>
  )
}

// ── KPI Card ───────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, color, alert, sub }: {
  icon: React.ElementType; label: string; value: string | number | null | undefined; color: string; alert?: boolean; sub?: string
}) {
  return (
    <div className={styles.kpi} style={{ ['--c' as string]: color }}>
      {alert && <div className={styles.kpiAlert} />}
      <div className={styles.kpiGlow} />
      <Icon size={17} strokeWidth={1.8} className={styles.kpiIcon} />
      <div className={styles.kpiVal}>{value ?? '—'}</div>
      <div className={styles.kpiLabel}>{label}</div>
      {sub && <div className={styles.kpiSub}>{sub}</div>}
    </div>
  )
}

// ── Activity Chart ─────────────────────────────────────────────────────────
function ActivityChart({ semanas }: { semanas: Stats['semanas'] }) {
  const [hover, setHover] = useState<number | null>(null)
  if (!semanas?.length) return null
  const maxSes = Math.max(...semanas.map(s => s.sesiones), 1)
  const W = 560, H = 110, BAR_W = 38, GAP = 28
  const offsetX = (W - semanas.length * (BAR_W + GAP)) / 2
  return (
    <div className={styles.chartWrap}>
      <svg viewBox={`0 0 ${W} ${H + 36}`} className={styles.chartSvg}>
        {semanas.map((s, i) => {
          const x    = offsetX + i * (BAR_W + GAP)
          const barH = Math.max((s.sesiones / maxSes) * H, s.sesiones > 0 ? 4 : 0)
          const y    = H - barH
          const isH  = hover === i
          return (
            <g key={i} style={{ cursor: 'pointer' }} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={x} y={0} width={BAR_W} height={H} rx={6} fill="var(--surface-dim)" opacity={0.6} />
              <rect x={x} y={y} width={BAR_W} height={barH} rx={6} fill={isH ? 'var(--primary)' : '#0891B2'} opacity={isH ? 1 : 0.72} style={{ transition: 'all 0.18s' }} />
              {barH > 8 && <rect x={x+4} y={y+3} width={7} height={3} rx={2} fill="white" opacity={0.3} />}
              {s.sesiones > 0 && <text x={x+BAR_W/2} y={y-5} textAnchor="middle" fontSize="10" fill="var(--ink-muted)" fontWeight="600">{s.sesiones}</text>}
              <text x={x+BAR_W/2} y={H+16} textAnchor="middle" fontSize="9" fill="var(--ink-muted)">{s.label}</text>
              {isH && (
                <g>
                  <rect x={x+BAR_W/2-28} y={y-44} width={56} height={34} rx={6} fill="var(--ink)" opacity={0.92} />
                  <text x={x+BAR_W/2} y={y-28} textAnchor="middle" fontSize="10" fill="white" fontWeight="700">{s.sesiones} ses.</text>
                  <text x={x+BAR_W/2} y={y-14} textAnchor="middle" fontSize="9" fill="#9CA3AF">{s.alumnosActivos} activos</text>
                </g>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── InfoRow ────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className={styles.infoRow}>
      <Icon size={13} className={styles.infoIcon} />
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
  )
}

// ── AlumnoDetallePanel ─────────────────────────────────────────────────────
function AlumnoDetallePanel({ alumno, statsAlumno, onBack, onSave }: {
  alumno:      AlumnoEnriquecido
  statsAlumno: { nota: number | null; sesiones: number; fallos: number; enRiesgo: boolean; diasInactivo: number | null } | undefined
  onBack:      () => void
  onSave:      (id: string, fields: AlumnoDetalleForm) => Promise<void>
}) {
  const ext     = alumno.extended ?? {}
  const mascota = MASCOTAS[ext.mascota as string] ?? null
  const [editando, setEditando] = useState(false)
  const [form,     setForm]     = useState<AlumnoDetalleForm>({
    full_name:     String(ext.full_name     ?? ''),
    phone:         String(ext.phone         ?? ''),
    email_contact: String(ext.email_contact ?? ''),
    city:          String(ext.city          ?? ''),
    exam_date:     String(ext.exam_date     ?? ''),
    monthly_price: String(ext.monthly_price ?? ''),
    access_until:  alumno.access_until?.slice(0, 10) ?? '',
  })
  const [saving, setSaving] = useState(false)
  const handleSave = async () => { setSaving(true); await onSave(alumno.id, form); setSaving(false); setEditando(false) }

  return (
    <div className={styles.detallePanel}>
      <div className={styles.detallePanelHead}>
        <button className={styles.btnBack} onClick={onBack}><ChevronLeft size={16} /> Volver</button>
        <div className={styles.detalleAvatar} style={{ background: scoreColor(statsAlumno?.nota) + '22', color: scoreColor(statsAlumno?.nota) }}>
          {mascota ? mascota.emoji : alumno.username[0]!.toUpperCase()}
        </div>
        <div className={styles.detalleTitleWrap}>
          <h2 className={styles.detalleTitle}>{String(ext.full_name ?? alumno.username)}</h2>
          <div className={styles.detalleMeta}>
            <span className={styles.detalleUsername}>@{alumno.username}</span>
            {mascota && <span className={styles.detalleMascota}>{mascota.emoji} {mascota.nombre}</span>}
          </div>
        </div>
        <button className={styles.btnEditarPerfil} onClick={() => setEditando(v => !v)}>
          <Edit3 size={13} /> {editando ? 'Cancelar' : 'Editar'}
        </button>
      </div>

      <div className={styles.detalleLayout}>
        <div className={styles.detalleLeft}>
          <div className={styles.detalleCard}>
            <h3 className={styles.detalleCardTitle}>Datos personales</h3>
            {editando ? (
              <div className={styles.editForm}>
                {([
                  { key: 'full_name',     label: 'Nombre completo',   type: 'text',   placeholder: 'Nombre y apellidos' },
                  { key: 'phone',         label: 'Teléfono',           type: 'tel',    placeholder: '612 345 678' },
                  { key: 'email_contact', label: 'Email',              type: 'email',  placeholder: 'email@ejemplo.com' },
                  { key: 'city',          label: 'Ciudad',             type: 'text',   placeholder: 'Madrid' },
                  { key: 'exam_date',     label: 'Fecha del examen',   type: 'date',   placeholder: '' },
                  { key: 'monthly_price', label: 'Precio mensual (€)', type: 'number', placeholder: '89' },
                  { key: 'access_until',  label: 'Acceso hasta',       type: 'date',   placeholder: '' },
                ] as { key: keyof AlumnoDetalleForm; label: string; type: string; placeholder: string }[]).map(({ key, label, type, placeholder }) => (
                  <div key={key} className={styles.editCampo}>
                    <label className={styles.editLabel}>{label}</label>
                    <input className={styles.editInput} type={type} placeholder={placeholder} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
                  </div>
                ))}
                <button className={styles.btnGuardar} onClick={handleSave} disabled={saving}>
                  <Save size={13} /> {saving ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            ) : (
              <div className={styles.infoList}>
                <InfoRow icon={Users}    label="Usuario"      value={alumno.username} />
                <InfoRow icon={Users}    label="Nombre"       value={String(ext.full_name ?? '')} />
                <InfoRow icon={Phone}    label="Teléfono"     value={String(ext.phone ?? '')} />
                <InfoRow icon={Mail}     label="Email"        value={String(ext.email_contact ?? '')} />
                <InfoRow icon={MapPin}   label="Ciudad"       value={String(ext.city ?? '')} />
                <InfoRow icon={Calendar} label="Alta"         value={fmt(alumno.created_at)} />
                <InfoRow icon={Shield}   label="Acceso hasta" value={fmt(alumno.access_until)} />
                <InfoRow icon={Target}   label="Fecha examen" value={ext.exam_date ? fmt(String(ext.exam_date) + 'T12:00:00') : null} />
                <InfoRow icon={Euro}     label="Precio/mes"   value={ext.monthly_price ? `${ext.monthly_price} €` : null} />
              </div>
            )}
          </div>
        </div>

        <div className={styles.detalleRight}>
          <div className={styles.detalleKpisGrid}>
            <div className={styles.detalleKpi}>
              <span className={styles.detalleKpiVal} style={{ color: scoreColor(statsAlumno?.nota) }}>
                {statsAlumno?.nota != null ? `${statsAlumno.nota}%` : '—'}
              </span>
              <span className={styles.detalleKpiLabel}>Nota media</span>
            </div>
            <div className={styles.detalleKpi}><span className={styles.detalleKpiVal}>{statsAlumno?.sesiones ?? 0}</span><span className={styles.detalleKpiLabel}>Sesiones</span></div>
            <div className={styles.detalleKpi}><span className={styles.detalleKpiVal}>{statsAlumno?.fallos ?? 0}</span><span className={styles.detalleKpiLabel}>Fallos</span></div>
            <div className={styles.detalleKpi}>
              <span className={styles.detalleKpiVal} style={{ color: statsAlumno?.enRiesgo ? '#DC2626' : '#059669' }}>
                {statsAlumno?.enRiesgo ? 'En riesgo' : 'Activo'}
              </span>
              <span className={styles.detalleKpiLabel}>Estado</span>
            </div>
          </div>
          {statsAlumno?.enRiesgo && (
            <div className={styles.detalleAlerta}><AlertTriangle size={14} /> Lleva {statsAlumno.diasInactivo ?? '?'} días sin estudiar.</div>
          )}
          {ext.exam_date && (() => {
            const dias = Math.ceil((new Date(String(ext.exam_date)).getTime() - new Date().getTime()) / 86400000)
            if (dias < 0) return null
            return (
              <div className={styles.detalleExamen}>
                <Target size={14} />
                <div><span className={styles.detalleExamenNum}>{dias}</span><span className={styles.detalleExamenLabel}> días para el examen</span></div>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

// ── ProfesorDetallePanel ───────────────────────────────────────────────────
function ProfesorDetallePanel({ profesor, onBack }: { profesor: StudentProfile; onBack: () => void }) {
  const ext = profesor.extended ?? {}
  return (
    <div className={styles.detallePanel}>
      <div className={styles.detallePanelHead}>
        <button className={styles.btnBack} onClick={onBack}><ChevronLeft size={16} /> Volver</button>
        <div className={styles.detalleAvatar} style={{ background: '#7C3AED22', color: '#7C3AED' }}>
          {(String(ext.full_name ?? '') || profesor.username)[0]!.toUpperCase()}
        </div>
        <div className={styles.detalleTitleWrap}>
          <h2 className={styles.detalleTitle}>{String(ext.full_name ?? '') || profesor.username}</h2>
          <span className={styles.detalleUsername}>@{profesor.username} · {profesor.role}</span>
        </div>
      </div>
      <div className={styles.detalleCard} style={{ maxWidth: 480 }}>
        <h3 className={styles.detalleCardTitle}>Datos de contacto</h3>
        <div className={styles.infoList}>
          <InfoRow icon={Users}    label="Usuario"   value={profesor.username} />
          <InfoRow icon={Users}    label="Nombre"    value={String(ext.full_name    ?? '')} />
          <InfoRow icon={Phone}    label="Teléfono"  value={String(ext.phone        ?? '')} />
          <InfoRow icon={Mail}     label="Email"     value={String(ext.email_contact ?? '')} />
          <InfoRow icon={BookOpen} label="Bio"       value={String(ext.bio          ?? '')} />
          <InfoRow icon={Calendar} label="Alta"      value={fmt(profesor.created_at)} />
        </div>
        {!ext.full_name && !ext.phone && !ext.email_contact && (
          <p className={styles.emptyExtended}>Este profesor aún no ha completado su perfil.</p>
        )}
      </div>
    </div>
  )
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

  return (
    <div className={styles.alumnosTable}>
      <div className={styles.alumnosTableHead} style={{ gridTemplateColumns: '1.5fr 1.2fr 100px 100px 32px' }}>
        <span>Profesor</span><span>Asignatura</span><span>Alumnos</span><span>Nota media</span><span />
      </div>
      {profesores.map(p => {
        const ext = p.extended ?? {}, nombre = String(ext.full_name ?? '') || p.username
        return (
          <div key={p.id} className={styles.alumnoRow} style={{ gridTemplateColumns: '1.5fr 1.2fr 100px 100px 32px' }} onClick={() => onProfesorClick(p)}>
            <div className={styles.alumnoNameCell}>
              <div className={styles.alumnoAvatarSm} style={{ background: '#7C3AED22', color: '#7C3AED' }}>{nombre[0]!.toUpperCase()}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--ink)' }}>{nombre}</div>
                {ext.full_name && <div style={{ fontSize: '0.68rem', color: 'var(--ink-muted)' }}>@{p.username}</div>}
              </div>
            </div>
            <div className={styles.alumnoSubCell}>
              {p.stats ? (<><div className={styles.alumnoDot} style={{ background: p.stats.subjectColor }} /><span>{p.stats.subjectName}</span></>) : <span style={{ color: 'var(--ink-subtle)' }}>—</span>}
            </div>
            <span style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>{p.stats?.alumnos ?? '—'}</span>
            <span style={{ color: scoreColor(p.stats?.notaMedia), fontWeight: 700, fontSize: '0.88rem' }}>
              {p.stats?.notaMedia != null ? `${p.stats.notaMedia}%` : '—'}
            </span>
            <ArrowRight size={13} className={styles.alumnoArrow} />
          </div>
        )
      })}
    </div>
  )
}

// ── RentabilidadCard ───────────────────────────────────────────────────────
function RentabilidadCard({ stats, studentProfiles }: { stats: Stats; studentProfiles: StudentProfile[] }) {
  const preciosReales = studentProfiles.filter(p => p.extended?.monthly_price).map(p => parseFloat(String(p.extended!.monthly_price)))
  const mrrReal   = preciosReales.length > 0 ? preciosReales.reduce((a, b) => a + b, 0) : null
  const sinPrecio = studentProfiles.filter(p => !p.extended?.monthly_price).length
  const [precioBase,  setPrecioBase]  = useState('')
  const [editando,    setEditando]    = useState(false)
  const [inputPrecio, setInputPrecio] = useState('')
  const mrr       = mrrReal ?? (precioBase ? stats.totalAlumnos * parseFloat(precioBase) : null)
  const mrrRiesgo = precioBase ? stats.totalEnRiesgo * parseFloat(precioBase) : null

  return (
    <div className={styles.rentCard}>
      <div className={styles.rentHeader}>
        <h3 className={styles.rentTitle}><Euro size={14} /> Rentabilidad estimada</h3>
        <button className={styles.rentEditBtn} onClick={() => { setEditando(v => !v); setInputPrecio(precioBase) }}>
          {editando ? 'Cancelar' : '+ Precio base'}
        </button>
      </div>
      {mrrReal !== null && (
        <div className={styles.rentInfo}>
          <strong>{mrrReal.toLocaleString('es-ES', { minimumFractionDigits: 0 })} €/mes</strong> calculados desde los precios individuales de {preciosReales.length} alumno{preciosReales.length !== 1 ? 's' : ''}.
          {sinPrecio > 0 && ` ${sinPrecio} alumno${sinPrecio !== 1 ? 's' : ''} sin precio asignado.`}
        </div>
      )}
      {editando && (
        <div className={styles.rentForm}>
          <span className={styles.rentFormLabel}>Precio base para alumnos sin precio individual (€/mes)</span>
          <input type="number" className={styles.rentInput} value={inputPrecio} onChange={e => setInputPrecio(e.target.value)} placeholder="ej: 89" min="0" autoFocus />
          <button className={styles.rentGuardar} onClick={() => { setPrecioBase(inputPrecio); setEditando(false) }}>Aplicar</button>
        </div>
      )}
      {mrr !== null && (
        <div className={styles.rentKpis}>
          <div className={styles.rentKpi}><span className={styles.rentKpiVal} style={{ color: '#059669' }}>{mrr.toLocaleString('es-ES')} €</span><span className={styles.rentKpiLabel}>MRR</span></div>
          <div className={styles.rentKpi}><span className={styles.rentKpiVal}>{stats.totalAlumnos}</span><span className={styles.rentKpiLabel}>Alumnos</span></div>
          <div className={styles.rentKpi}>
            <span className={styles.rentKpiVal} style={{ color: '#DC2626' }}>
              -{((mrrRiesgo ?? 0) + (sinPrecio > 0 && precioBase ? sinPrecio * parseFloat(precioBase) : 0)).toLocaleString('es-ES')} €
            </span>
            <span className={styles.rentKpiLabel}>En riesgo</span>
          </div>
          <div className={styles.rentKpi}><span className={styles.rentKpiVal} style={{ color: '#059669' }}>{(mrr * 12).toLocaleString('es-ES')} €</span><span className={styles.rentKpiLabel}>ARR estimado</span></div>
        </div>
      )}
      {mrr === null && !editando && <p className={styles.rentSub}>Asigna precios individuales desde el perfil de cada alumno, o introduce un precio base para todos.</p>}
    </div>
  )
}

// ── AlertasPanel ───────────────────────────────────────────────────────────
function AlertasPanel({ stats, onAlumnoClick }: { stats: Stats; onAlumnoClick: (a: any) => void }) {
  const todos   = stats.bySubject.flatMap(sub => sub.alumnosEnRiesgo.map(a => ({ ...a, subjectName: sub.name, subjectColor: sub.color }))).sort((a, b) => (b.diasInactivo ?? 0) - (a.diasInactivo ?? 0))
  const expiran = stats.bySubject.flatMap(sub => sub.alumnosPorExpirar.map(a => ({ ...a, subjectName: sub.name, subjectColor: sub.color }))).sort((a, b) => a.diasRestantes - b.diasRestantes)

  if (!todos.length && !expiran.length) return (
    <div className={styles.riesgoOk}><CheckCircle size={18} style={{ color: '#059669' }} /><span>Sin alertas activas — todo en orden</span></div>
  )

  const Item = ({ a, badge }: { a: any; badge: React.ReactNode }) => (
    <div className={styles.riesgoItem} onClick={() => onAlumnoClick({ ...a, enRiesgo: true })}>
      <div className={styles.riesgoAvatar}>{String(a.username)[0]!.toUpperCase()}</div>
      <div className={styles.riesgoBody}>
        <span className={styles.riesgoUsername}>{a.username}</span>
        <span className={styles.riesgoSub} style={{ color: a.subjectColor }}>{a.subjectName}</span>
      </div>
      {badge}
      <ArrowRight size={13} className={styles.alumnoArrow} />
    </div>
  )

  return (
    <div className={styles.riesgoWrap}>
      {todos.length > 0 && (
        <div className={styles.riesgoGrupo}>
          <div className={styles.riesgoGrupoTitle}><AlertTriangle size={13} style={{ color: '#DC2626' }} />{todos.length} alumno{todos.length !== 1 ? 's' : ''} sin actividad</div>
          {todos.map(a => <Item key={a.id} a={a} badge={<span className={styles.riesgoBadgeRed}>{a.diasInactivo ?? '?'}d inactivo</span>} />)}
        </div>
      )}
      {expiran.length > 0 && (
        <div className={styles.riesgoGrupo}>
          <div className={styles.riesgoGrupoTitle}><Clock size={13} style={{ color: '#D97706' }} />{expiran.length} acceso{expiran.length !== 1 ? 's' : ''} próximos a expirar</div>
          {expiran.map(a => <Item key={a.id} a={a} badge={<span className={styles.riesgoBadgeAmber}>Expira en {a.diasRestantes}d</span>} />)}
        </div>
      )}
    </div>
  )
}

// ── OnboardingChecklist ────────────────────────────────────────────────────
function OnboardingChecklist({ currentUser, stats }: { currentUser: CurrentUser | null; stats: Stats }) {
  const [dismissed, setDismissed] = useState(!!localStorage.getItem(`onboarding_dismissed_${currentUser?.id}`))
  const [hasCodigo, setHasCodigo] = useState(false)

  useEffect(() => {
    if (dismissed || !currentUser?.academy_id) return
    supabase.from('invite_codes').select('id', { count: 'exact', head: true }).eq('academy_id', currentUser.academy_id)
      .then(({ count }) => setHasCodigo((count ?? 0) > 0))
  }, [dismissed, currentUser?.academy_id])

  if (dismissed) return null

  const pasos = [
    { id: 'academia',   label: 'Academia creada',               done: true,                            icon: Rocket },
    { id: 'asignatura', label: 'Primera asignatura',            done: (stats?.bySubject?.length??0)>0, icon: BookMarked },
    { id: 'profesor',   label: 'Primer profesor',               done: (stats?.totalProfesores??0)>0,   icon: GraduationCap },
    { id: 'codigo',     label: 'Código de invitación generado', done: hasCodigo,                       icon: Key },
    { id: 'alumno',     label: 'Primer alumno registrado',      done: (stats?.totalAlumnos??0)>0,      icon: UserPlus },
    { id: 'sesion',     label: 'Primera sesión completada',     done: (stats?.sesiones30d??0)>0,       icon: Zap },
  ]
  const completados = pasos.filter(p => p.done).length
  if (completados === pasos.length) return null

  return (
    <div className={styles.onboarding}>
      <div className={styles.onboardingHead}>
        <div className={styles.onboardingTitle}><Rocket size={14} /> Configura tu academia <span className={styles.onboardingPct}>{completados}/{pasos.length}</span></div>
        <button className={styles.onboardingDismiss} onClick={() => { localStorage.setItem(`onboarding_dismissed_${currentUser?.id}`, '1'); setDismissed(true) }}><X size={13} /></button>
      </div>
      <div className={styles.onboardingBar}><div className={styles.onboardingBarFill} style={{ width: `${Math.round(completados/pasos.length*100)}%` }} /></div>
      <div className={styles.onboardingSteps}>
        {pasos.map(paso => {
          const Icon = paso.icon
          return (
            <div key={paso.id} className={[styles.onboardingStep, paso.done ? styles.onboardingStepDone : ''].join(' ')}>
              <div className={styles.onboardingStepIcon}>{paso.done ? <Check size={11} strokeWidth={2.5} /> : <Icon size={11} />}</div>
              <span className={styles.onboardingStepLabel}>{paso.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── exportarInforme ────────────────────────────────────────────────────────
function exportarInforme(stats: Stats, academyName: string | null | undefined, studentProfiles: StudentProfile[]) {
  const fecha         = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
  const preciosReales = studentProfiles.filter(p => p.extended?.monthly_price).map(p => parseFloat(String(p.extended!.monthly_price)))
  const mrr           = preciosReales.length > 0 ? preciosReales.reduce((a, b) => a + b, 0) : null
  const enRiesgo      = stats.bySubject.flatMap(s => s.alumnosEnRiesgo)
  const porExpirar    = stats.bySubject.flatMap(s => s.alumnosPorExpirar)
  const spMap: Record<string, StudentProfile> = {}
  for (const sp of studentProfiles) spMap[sp.id] = sp
  const todosAlumnos = stats.bySubject.flatMap(sub =>
    sub.alumnosConNota.map(a => ({
      ...a,
      subjectName: sub.name,
      enRiesgo:    sub.alumnosEnRiesgo.some(r => r.id === a.id),
      examDate:    spMap[a.id]?.extended?.exam_date ?? null,
      fullName:    spMap[a.id]?.extended?.full_name ?? null,
    }))
  ).sort((a, b) => (b.nota ?? -1) - (a.nota ?? -1))
  const nc     = (n: number) => n >= 70 ? '#059669' : n >= 50 ? '#B45309' : '#DC2626'
  const maxSes = Math.max(...stats.semanas.map(s => s.sesiones), 1)
  const semanasHtml = stats.semanas.map(s => {
    const h = Math.round((s.sesiones/maxSes)*50)
    return `<div class="sem-bar-wrap">${s.sesiones>0?`<div class="sem-val">${s.sesiones}</div>`:''}<div class="sem-bar" style="height:${Math.max(h,2)}px"></div><div class="sem-label">${s.label}</div></div>`
  }).join('')

  const css = `*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,'Segoe UI',sans-serif;color:#111;padding:2.5rem;max-width:860px;margin:0 auto;font-size:13px}.header{display:flex;justify-content:space-between;margin-bottom:2rem;padding-bottom:1.5rem;border-bottom:2px solid #111}.header-left h1{font-size:1.5rem;font-weight:800}h2{font-size:.7rem;font-weight:800;color:#6B7280;text-transform:uppercase;letter-spacing:.08em;margin:1.75rem 0 .75rem}.kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:.6rem;margin-bottom:.5rem}.kpi{border:1px solid #E5E7EB;border-radius:10px;padding:.75rem .5rem;text-align:center}.kv{font-size:1.4rem;font-weight:800}.kl{font-size:.62rem;color:#6B7280;margin-top:.3rem;text-transform:uppercase}table{width:100%;border-collapse:collapse;margin-bottom:1rem}th{background:#F9FAFB;font-size:.7rem;font-weight:700;text-align:left;padding:.5rem .75rem;border-bottom:2px solid #E5E7EB;text-transform:uppercase;color:#374151}td{padding:.5rem .75rem;border-bottom:1px solid #F3F4F6;font-size:.78rem}.tag{display:inline-block;border-radius:4px;padding:.15rem .45rem;font-size:.65rem;font-weight:700}.tag-red{background:#FEF2F2;color:#DC2626}.tag-green{background:#ECFDF5;color:#059669}.tag-amber{background:#FFFBEB;color:#B45309}.alert-section{border:1px solid #FEE2E2;border-radius:10px;padding:1rem;background:#FFF5F5;margin-bottom:.5rem}.alert-title{font-size:.7rem;font-weight:800;color:#DC2626;text-transform:uppercase;margin-bottom:.5rem}.alert-row{display:flex;justify-content:space-between;padding:.3rem 0;border-bottom:1px solid #FEE2E2;font-size:.75rem}.alert-row:last-child{border:none}.semanas{display:grid;grid-template-columns:repeat(8,1fr);gap:.4rem;align-items:flex-end;height:60px;margin-bottom:.3rem}.sem-bar-wrap{display:flex;flex-direction:column;align-items:center;gap:.2rem;height:100%;justify-content:flex-end}.sem-bar{width:100%;border-radius:3px;background:#0891B2;min-height:2px}.sem-label{font-size:.55rem;color:#9CA3AF;text-align:center}.sem-val{font-size:.6rem;color:#374151;font-weight:700}.rent{display:grid;grid-template-columns:repeat(3,1fr);gap:.6rem}.rent-kpi{border:1px solid #E5E7EB;border-radius:10px;padding:.75rem 1rem}footer{margin-top:2.5rem;padding-top:1rem;border-top:1px solid #E5E7EB;display:flex;justify-content:space-between;color:#9CA3AF;font-size:.7rem}@media print{body{padding:1rem}@page{margin:1.5cm}}`

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Informe ${academyName??'Academia'}</title><style>${css}</style></head><body>
  <div class="header"><div class="header-left"><h1>${academyName??'Academia'}</h1><p style="color:#6B7280;font-size:.8rem">Informe de dirección · Últimos 30 días</p></div><div style="text-align:right;color:#6B7280;font-size:.75rem"><strong>Generado el</strong> ${fecha}</div></div>
  <h2>Resumen</h2><div class="kpis"><div class="kpi"><div class="kv">${stats.totalAlumnos}</div><div class="kl">Alumnos</div></div><div class="kpi"><div class="kv" style="color:#059669">${stats.totalActivos}</div><div class="kl">Activos 7d</div></div><div class="kpi"><div class="kv">${stats.notaGlobal!==null?stats.notaGlobal+'%':'—'}</div><div class="kl">Nota media</div></div><div class="kpi"><div class="kv">${stats.sesiones30d}</div><div class="kl">Sesiones 30d</div></div><div class="kpi"><div class="kv" style="color:#DC2626">${stats.totalEnRiesgo}</div><div class="kl">En riesgo</div></div><div class="kpi"><div class="kv" style="color:#B45309">${stats.totalPorExpirar}</div><div class="kl">Expiran pronto</div></div></div>
  <h2>Actividad</h2><div class="semanas">${semanasHtml}</div>
  <h2>Por asignatura</h2><table><tr><th>Asignatura</th><th>Alumnos</th><th>Activos 7d</th><th>Nota media</th><th>Sesiones 30d</th><th>En riesgo</th><th>Expiran pronto</th></tr>${stats.bySubject.map(s=>`<tr><td><strong>${s.name}</strong></td><td>${s.totalAlumnos}</td><td>${s.alumnosActivos}</td><td style="font-weight:700;color:${nc(s.notaMedia??0)}">${s.notaMedia!==null?s.notaMedia+'%':'—'}</td><td>${s.sesiones30d}</td><td>${s.enRiesgo>0?`<span class="tag tag-red">${s.enRiesgo}</span>`:'—'}</td><td>${s.porExpirar>0?`<span class="tag tag-amber">${s.porExpirar}</span>`:'—'}</td></tr>`).join('')}</table>
  <h2>Alumnos</h2><table><tr><th>Alumno</th><th>Asignatura</th><th>Nota media</th><th>Sesiones</th><th>Estado</th><th>Fecha examen</th></tr>${todosAlumnos.map(a=>`<tr><td><strong>${a.fullName||a.username}</strong>${a.fullName?`<br><span style="color:#9CA3AF;font-size:.68rem">@${a.username}</span>`:''}</td><td>${a.subjectName}</td><td style="font-weight:700;color:${nc(a.nota??0)}">${a.nota!==null?a.nota+'%':'—'}</td><td>${a.sesiones}</td><td>${a.enRiesgo?'<span class="tag tag-red">En riesgo</span>':'<span class="tag tag-green">Activo</span>'}</td><td style="color:#6B7280">${a.examDate?new Date(String(a.examDate)).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'}):'—'}</td></tr>`).join('')}</table>
  ${enRiesgo.length>0?`<h2>Alertas</h2><div class="alert-section"><div class="alert-title">⚠ ${enRiesgo.length} sin actividad</div>${enRiesgo.map(a=>`<div class="alert-row"><span>${a.username}</span><span style="color:#DC2626">${a.diasInactivo??'?'} días inactivo</span></div>`).join('')}</div>`:''}
  ${mrr!==null?`<h2>Rentabilidad</h2><div class="rent"><div class="rent-kpi"><div class="kv">${mrr.toLocaleString('es-ES')} €</div><div class="kl">MRR</div></div><div class="rent-kpi"><div class="kv">${(mrr*12).toLocaleString('es-ES')} €</div><div class="kl">ARR estimado</div></div><div class="rent-kpi"><div class="kv">${preciosReales.length}</div><div class="kl">Alumnos con precio</div></div></div>`:''}
  <footer><span>FrostFox Academy · Informe de dirección</span><span>${fecha}</span></footer></body></html>`

  const w = window.open('', '_blank'); if (!w) return
  w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500)
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

  return (
    <div className={styles.asigDetalle}>
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

// ── DirectorBentoNav ───────────────────────────────────────────────────────
function DirectorBentoNav({ tab, setTab, stats, nAlertas, studentProfiles }: {
  tab: string; setTab: (t: string) => void; stats: Stats; nAlertas: number; studentProfiles: StudentProfile[]
}) {
  const preciosReales = studentProfiles.filter(p => p.extended?.monthly_price).map(p => parseFloat(String(p.extended!.monthly_price)))
  const mrr = preciosReales.length > 0 ? preciosReales.reduce((a, b) => a + b, 0) : null

  const cards = [
    { id:'overview',    label:'Actividad',    desc: stats.sesiones30d>0?`${stats.sesiones30d} sesiones este mes`:'Sin sesiones todavía',                                                      icon:TrendingUp,   color:'#0891B2', big:true,  isAsig:false, badge:null as number|null },
    { id:'alumnos',     label:'Alumnos',      desc: stats.totalAlumnos>0?`${stats.totalAlumnos} matriculados · ${stats.totalActivos} activos`:'Sin alumnos aún',                              icon:Users,        color:'#2563EB', big:false, isAsig:false, badge:null as number|null },
    { id:'alertas',     label:'Alertas',      desc: nAlertas>0?`${nAlertas} acción${nAlertas!==1?'es':''} pendiente${nAlertas!==1?'s':''}`:'Todo en orden',                                   icon:AlertTriangle,color:nAlertas>0?'#DC2626':'#059669', big:false, isAsig:false, badge:nAlertas>0?nAlertas:null as number|null },
    { id:'profesores',  label:'Profesores',   desc: stats.totalProfesores>0?`${stats.totalProfesores} profesor${stats.totalProfesores!==1?'es':''}`:'Sin profesores aún',                    icon:GraduationCap,color:'#7C3AED', big:false, isAsig:false, badge:null as number|null },
    { id:'asignaturas', label:'Asignaturas',  desc: `${stats.bySubject?.length??0} asignatura${(stats.bySubject?.length??0)!==1?'s':''} activa${(stats.bySubject?.length??0)!==1?'s':''}`, icon:BookOpen,     color:'#D97706', big:false, isAsig:true,  badge:null as number|null },
    { id:'finanzas',    label:'Rentabilidad', desc: mrr!==null?`${mrr.toLocaleString('es-ES')} €/mes · ${(mrr*12).toLocaleString('es-ES')} € ARR`:'Sin precios asignados',                  icon:Euro,         color:'#059669', big:true,  isAsig:false, badge:null as number|null },
  ]

  return (
    <div className={styles.bentoGrid}>
      {cards.map(card => {
        const Icon = card.icon, active = tab===card.id
        return (
          <button key={card.id}
            className={[styles.bentoCard, card.big?styles.bentoBig:'', active&&!card.isAsig?styles.bentoActive:'', card.isAsig?styles.bentoExam:''].join(' ')}
            style={{ ['--bento-color' as string]: card.color }}
            onClick={() => setTab(card.isAsig?'asignaturas':card.id)}>
            {card.big && !card.isAsig && <AnimatedGridPattern numSquares={18} maxOpacity={active?0.12:0.06} duration={4} color={card.color} lineColor={card.color+'20'} />}
            {!card.isAsig && <Ripple mainCircleSize={card.big?60:40} mainCircleOpacity={active?0.25:0.12} numCircles={card.big?5:3} color={card.color} duration={card.big?3:3.5} />}
            {card.isAsig ? (
              <div className={styles.bentoContent}>
                <div className={styles.bentoExamHeader}>
                  <div className={styles.bentoIconWrap} style={{ background:card.color+'18', color:card.color }}><Icon size={16} strokeWidth={1.8} /></div>
                  <span className={styles.bentoLabel}>{card.label}</span>
                </div>
                <AsignaturasCard stats={stats} />
              </div>
            ) : (
              <div className={styles.bentoContent}>
                <div className={styles.bentoIconWrap} style={{ background:card.color+'18', color:card.color }}><Icon size={card.big?20:16} strokeWidth={1.8} /></div>
                <div className={styles.bentoText}><span className={styles.bentoLabel}>{card.label}</span><span className={styles.bentoDesc}>{card.desc}</span></div>
                {card.badge!=null&&card.badge>0&&<span className={styles.bentoBadge} style={{ background:card.color }}>{card.badge}</span>}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Panel principal ────────────────────────────────────────────────────────
export default function DirectorPanel({ currentUser }: { currentUser: CurrentUser | null }) {
  const { stats, loading, error }                                                           = useDirector(currentUser)
  const { studentProfiles, staffProfiles, loading: loadingProfiles, updateStudentProfile } = useAcademyProfiles(currentUser?.academy_id)

  const [tab,           setTab]           = useState('overview')
  const [alumnoDetalle, setAlumnoDetalle] = useState<AlumnoEnriquecido | null>(null)
  const [profDetalle,   setProfDetalle]   = useState<StudentProfile | null>(null)

  const bentoRef   = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!tab || !contentRef.current || window.innerWidth > 900) return
    setTimeout(() => contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }, [tab])

  const handleSaveAlumno = useCallback(async (userId: string, fields: AlumnoDetalleForm) => {
    const spFields = {
      full_name:     fields.full_name     || null,
      phone:         fields.phone         || null,
      email_contact: fields.email_contact || null,
      city:          fields.city          || null,
      exam_date:     fields.exam_date     || null,
      monthly_price: fields.monthly_price ? parseFloat(fields.monthly_price) : null,
    }
    await updateStudentProfile(userId, spFields)
    if (fields.access_until) {
      await supabase.from('profiles').update({ access_until: new Date(fields.access_until + 'T23:59:59').toISOString() }).eq('id', userId)
    }
  }, [updateStudentProfile])

  if (loading || loadingProfiles) return <div className={styles.state}><RefreshCw size={22} className={styles.spinner} /><p>Cargando datos…</p></div>
  if (error)  return <div className={styles.state}><AlertTriangle size={22} /><p>{error}</p></div>
  if (!stats) return null

  const typedStats = stats as unknown as Stats

  const spMap: Record<string, StudentProfile> = {}
  for (const sp of studentProfiles as StudentProfile[]) spMap[sp.id] = sp

  const enrichAlumno = (a: any): AlumnoEnriquecido => {
    const sp = spMap[a.id]
    return {
      ...a,
      extended:      sp?.extended      ?? null,
      access_until:  sp?.access_until  ?? null,
      created_at:    sp?.created_at    ?? null,
      subjectName:   a.subjectName     ?? '',
      subjectColor:  a.subjectColor    ?? '#6B7280',
      enRiesgo:      a.enRiesgo        ?? false,
      diasInactivo:  a.diasInactivo    ?? null,
      diasRestantes: a.diasRestantes   ?? null,
    }
  }

  if (alumnoDetalle) {
    const statsAlumno = typedStats.bySubject.flatMap(sub => sub.alumnosConNota.map(a => ({
      ...a,
      enRiesgo:    sub.alumnosEnRiesgo.some(r => r.id === a.id),
      diasInactivo: sub.alumnosEnRiesgo.find(r => r.id === a.id)?.diasInactivo ?? null,
      fallos:      0,
    }))).find(a => a.id === alumnoDetalle.id)
    return <AlumnoDetallePanel alumno={alumnoDetalle} statsAlumno={statsAlumno} onBack={() => setAlumnoDetalle(null)} onSave={handleSaveAlumno} />
  }

  if (profDetalle) return <ProfesorDetallePanel profesor={profDetalle} onBack={() => setProfDetalle(null)} />

  const nAlertas              = typedStats.totalEnRiesgo + typedStats.totalPorExpirar
  const academyProfilesForTable = { studentProfiles: studentProfiles as StudentProfile[], staffProfiles: staffProfiles as StudentProfile[] }

  return (
    <div className={styles.page}>
      <OnboardingChecklist currentUser={currentUser} stats={typedStats} />

      <div className={styles.pageHeader}>
        <div><h1 className={styles.pageTitle}>Panel de Dirección</h1><p className={styles.pageSubtitle}>{currentUser?.academyName ?? 'Tu academia'}</p></div>
        <button className={styles.btnExport} onClick={() => exportarInforme(typedStats, currentUser?.academyName, studentProfiles as StudentProfile[])}>
          <FileText size={14} /> Exportar PDF
        </button>
      </div>

      <NarrativaCard stats={typedStats} />

      <div className={styles.kpisRow}>
        <KpiCard icon={Users}         label="Alumnos"        value={typedStats.totalAlumnos}    color="#0891B2" />
        <KpiCard icon={GraduationCap} label="Profesores"     value={typedStats.totalProfesores} color="#7C3AED" />
        <KpiCard icon={Zap}           label="Activos 7d"     value={typedStats.totalActivos}    color="#059669" sub={`${typedStats.totalAlumnos>0?Math.round(typedStats.totalActivos/typedStats.totalAlumnos*100):0}% del total`} />
        <KpiCard icon={BarChart2}     label="Nota media 30d" value={typedStats.notaGlobal!==null?`${typedStats.notaGlobal}%`:'—'} color={scoreColor(typedStats.notaGlobal)} />
        <KpiCard icon={AlertTriangle} label="En riesgo"      value={typedStats.totalEnRiesgo}   color="#DC2626" alert={typedStats.totalEnRiesgo>0} />
        <KpiCard icon={Shield}        label="Expiran pronto" value={typedStats.totalPorExpirar} color="#B45309" alert={typedStats.totalPorExpirar>0} />
      </div>

      <div ref={bentoRef}>
        <DirectorBentoNav tab={tab} setTab={setTab} stats={typedStats} nAlertas={nAlertas} studentProfiles={studentProfiles as StudentProfile[]} />
      </div>

      <div ref={contentRef} className={styles.contentArea}>
        {tab==='asignaturas' && <AsignaturasDetalle stats={typedStats} studentProfiles={studentProfiles as StudentProfile[]} onAlumnoClick={a => setAlumnoDetalle(enrichAlumno(a))} />}
        {tab==='overview' && (
          <div className={styles.section}>
            <div className={styles.chartCard}>
              <div className={styles.chartCardHead}><h3 className={styles.chartCardTitle}>Sesiones por semana</h3><span className={styles.chartCardSub}>Últimas 8 semanas</span></div>
              <ActivityChart semanas={typedStats.semanas} />
              {typedStats.sesiones30d===0 && <p className={styles.empty}>Sin sesiones todavía</p>}
            </div>
            <div className={styles.subList}>
              {typedStats.bySubject.map(sub => (
                <div key={sub.id} className={styles.subCard} style={{ ['--sc' as string]: sub.color }}>
                  <div className={styles.subCardBar} />
                  <div className={styles.subCardInfo}>
                    <span className={styles.subCardName}>{sub.name}</span>
                    <div className={styles.subCardMeta}>
                      <span><Users size={11} /> {sub.totalAlumnos} alumnos</span>
                      <span><Zap size={11} /> {sub.alumnosActivos} activos</span>
                      <span><BarChart2 size={11} /> {sub.sesiones30d} sesiones 30d</span>
                    </div>
                  </div>
                  {sub.notaMedia!==null && <span className={styles.subCardNota} style={{ color: scoreColor(sub.notaMedia) }}>{sub.notaMedia}%</span>}
                </div>
              ))}
            </div>
          </div>
        )}
        {tab==='alumnos'     && <AlumnosTable stats={typedStats} academyProfiles={academyProfilesForTable} onAlumnoClick={a => setAlumnoDetalle(enrichAlumno(a))} />}
        {tab==='profesores'  && <ProfesoresTable staffProfiles={staffProfiles as StudentProfile[]} stats={typedStats} onProfesorClick={setProfDetalle} />}
        {tab==='alertas'     && <AlertasPanel stats={typedStats} onAlumnoClick={a => setAlumnoDetalle(enrichAlumno(a))} />}
        {tab==='finanzas'    && <RentabilidadCard stats={typedStats} studentProfiles={studentProfiles as StudentProfile[]} />}
        {tab && <button className={styles.scrollBackBtn} onClick={() => bentoRef.current?.scrollIntoView({ behavior:'smooth', block:'start' })} aria-label="Volver arriba"><ChevronUp size={18} strokeWidth={2.5} /></button>}
      </div>
    </div>
  )
}
