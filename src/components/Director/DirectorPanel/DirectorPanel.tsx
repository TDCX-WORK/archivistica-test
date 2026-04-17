import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Users, TrendingUp, AlertTriangle, BookOpen, Copy, Check, FileText,
  Plus, RefreshCw, ChevronDown, ChevronUp, Zap, Clock, UserX, BarChart2,
  Key, Calendar, Shield, ShieldOff, RotateCcw, XCircle, TrendingDown,
  CalendarDays, ExternalLink, Bell, CheckCircle2, ArrowRight, Megaphone,
  Trash2, BookOpen as BookIcon, MessageSquare, Send, X, CornerDownLeft,
  GraduationCap, Euro, Star, UserPlus, BookMarked, Rocket, ArrowUpDown,
  Phone, MapPin, Mail, Target, Edit3, CheckCircle, Download, AlertCircle
} from 'lucide-react'
import { useDirector }          from '../../../hooks/useDirector'
import { useAcademyProfiles }   from '../../../hooks/useStudentProfile'
import { useProfesorMessages }  from '../../../hooks/useDirectMessages'
import type { DirectMessage }   from '../../../hooks/useDirectMessages'
import { supabase }             from '../../../lib/supabase'
import { Ripple }               from '../../magicui/Ripple'
import { AnimatedGridPattern }  from '../../magicui/AnimatedGridPattern'
import type { CurrentUser }     from '../../../types'
import ErrorState               from '../../ui/ErrorState'
import { FinanzasPanel }        from '../panels/FinanzasPanel'
import { RetencionPanel }       from '../panels/RetencionPanel'
import { ComunicacionPanel }    from '../panels/ComunicacionPanel'
import { AlertasPanel, OnboardingChecklist, exportarInforme } from '../panels/AlertasPanel'
import { VencimientosPanel }    from '../panels/VencimientosPanel'
import { AsignaturasDetalle, AsignaturasCard } from '../panels/AsignaturasDetalle'
import { AlumnoDetallePanel, ProfesorDetallePanel } from '../components/AlumnoDetallePanel'
import { AlumnosTable }         from '../components/AlumnosTable'
import { ProfesoresTable }      from '../components/ProfesoresTable'
import styles from './DirectorPanel.module.css'

function scoreColor(s: number | null | undefined): string {
  if (s == null) return '#6B7280'
  if (s >= 80) return '#059669'
  if (s >= 60) return '#0891B2'
  if (s >= 40) return '#B45309'
  return '#DC2626'
}

function fmt(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' })
}

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

  const W = 600; const H = 120; const PAD = { top: 24, right: 24, bottom: 36, left: 24 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top  - PAD.bottom
  const maxSes = Math.max(...semanas.map(s => s.sesiones), 1)

  const points = semanas.map((s, i) => ({
    x: PAD.left + (i / Math.max(semanas.length - 1, 1)) * innerW,
    y: PAD.top  + (1 - s.sesiones / maxSes) * innerH,
    sesiones: s.sesiones,
    label: s.label,
    activos: s.alumnosActivos,
  }))

  const pathD = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`
    const prev = points[i-1]!
    const cpX  = (prev.x + pt.x) / 2
    return `${acc} C ${cpX} ${prev.y}, ${cpX} ${pt.y}, ${pt.x} ${pt.y}`
  }, '')

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length-1]!.x} ${PAD.top+innerH} L ${points[0]!.x} ${PAD.top+innerH} Z`
    : ''

  return (
    <div className={styles.chartWrap}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.chartSvg}>
        <defs>
          <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#0891B2" stopOpacity="0.22"/>
            <stop offset="100%" stopColor="#0891B2" stopOpacity="0.02"/>
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0.25,0.5,0.75,1].map((f,i) => (
          <line key={i}
            x1={PAD.left} y1={PAD.top + f*innerH}
            x2={PAD.left+innerW} y2={PAD.top + f*innerH}
            stroke="var(--line,#E5E7EB)" strokeWidth="1" strokeDasharray="4,4"/>
        ))}
        {/* Area */}
        <path d={areaD} fill="url(#actGrad)"/>
        {/* Line */}
        <path d={pathD} fill="none" stroke="#0891B2" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"/>
        {/* Points */}
        {points.map((pt, i) => {
          const isH = hover === i
          return (
            <g key={i} style={{cursor:'pointer'}}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}>
              {/* Hover area */}
              <rect x={pt.x-20} y={0} width={40} height={H} fill="transparent"/>
              {/* Dot glow */}
              <circle cx={pt.x} cy={pt.y} r={isH?7:4} fill="#0891B2" fillOpacity={isH?0.18:0.12}
                style={{transition:'r 0.15s ease'}}/>
              <circle cx={pt.x} cy={pt.y} r={isH?3:2.5} fill="white" stroke="#0891B2"
                strokeWidth={isH?2:1.5} style={{transition:'all 0.15s ease'}}/>
              {/* Value label */}
              {pt.sesiones > 0 && (
                <text x={pt.x} y={pt.y-10} textAnchor="middle"
                  fill={isH?'#0891B2':'var(--ink-muted,#6B7280)'}
                  fontSize="10" fontWeight={isH?'800':'600'}
                  fontFamily="var(--font-body)"
                  style={{transition:'all 0.15s'}}>
                  {pt.sesiones}
                </text>
              )}
              {/* Month label */}
              <text x={pt.x} y={H-4} textAnchor="middle"
                fill={isH?'#0891B2':'var(--ink-subtle,#9CA3AF)'}
                fontSize="9" fontWeight={isH?'700':'500'}
                fontFamily="var(--font-body)">
                {pt.label}
              </text>
              {/* Tooltip */}
              {isH && (
                <g>
                  <rect x={pt.x-30} y={pt.y-48} width={60} height={34}
                    rx={7} fill="var(--ink,#111)" opacity={0.9}/>
                  <text x={pt.x} y={pt.y-31} textAnchor="middle"
                    fontSize="10" fill="white" fontWeight="700"
                    fontFamily="var(--font-body)">
                    {pt.sesiones} ses.
                  </text>
                  <text x={pt.x} y={pt.y-17} textAnchor="middle"
                    fontSize="9" fill="#9CA3AF"
                    fontFamily="var(--font-body)">
                    {pt.activos} activos
                  </text>
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


function DirectorBentoNav({ tab, setTab, stats, nAlertas, studentProfiles, nMensajes, nRespuestas }: {
  tab: string; setTab: (t: string) => void; stats: Stats; nAlertas: number; studentProfiles: StudentProfile[]
  nMensajes: number; nRespuestas: number
}) {
  const preciosReales = studentProfiles.filter(p => p.extended?.monthly_price).map(p => parseFloat(String(p.extended!.monthly_price)))
  const mrr = preciosReales.length > 0 ? preciosReales.reduce((a, b) => a + b, 0) : null

  const cards = [
    { id:'overview',    label:'Actividad',    desc: stats.sesiones30d>0?`${stats.sesiones30d} sesiones este mes`:'Sin sesiones todavía',                                                      icon:TrendingUp,   color:'#0891B2', big:true,  isAsig:false, badge:null as number|null },
    { id:'alumnos',     label:'Alumnos',      desc: stats.totalAlumnos>0?`${stats.totalAlumnos} matriculados · ${stats.totalActivos} activos`:'Sin alumnos aún',                              icon:Users,        color:'#2563EB', big:false, isAsig:false, badge:null as number|null },
    { id:'alertas',     label:'Alertas',      desc: nAlertas>0?`${nAlertas} acción${nAlertas!==1?'es':''} pendiente${nAlertas!==1?'s':''}`:'Todo en orden',                                   icon:AlertTriangle,color:nAlertas>0?'#DC2626':'#059669', big:false, isAsig:false, badge:nAlertas>0?nAlertas:null as number|null },
    { id:'profesores',  label:'Profesores',   desc: stats.totalProfesores>0?`${stats.totalProfesores} profesor${stats.totalProfesores!==1?'es':''}`:'Sin profesores aún',                    icon:GraduationCap,color:'#7C3AED', big:false, isAsig:false, badge:null as number|null },
    { id:'finanzas',    label:'Finanzas',     desc: stats.finanzas ? `${new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(stats.finanzas.mrrAcademia)}/mes` : 'Ver ingresos', descExtra: null, icon:Euro, color:'#059669', big:false, isAsig:false, badge:null as number|null },
    { id:'comunicacion', label:'Comunicación', desc: nMensajes>0?`${nMensajes} mensaje${nMensajes!==1?'s':''} enviado${nMensajes!==1?'s':''}`:'Mensajes directos', descExtra: null, icon:MessageSquare, color:'#0891B2', big:false, isAsig:false, badge: nRespuestas > 0 ? nRespuestas : null as number|null },
    { id:'vencimientos', label:'Vencimientos', desc: (stats.totalPorExpirar>0?`${stats.totalPorExpirar} expiran pronto`:'Gestión de accesos'), descExtra: null, icon:Calendar, color:'#D97706', big:false, isAsig:false, badge: stats.totalPorExpirar>0?stats.totalPorExpirar:null as number|null },
    { id:'retencion',   label:'Retención',    desc: 'Permanencia y cohortes', descExtra: null, icon:TrendingUp, color:'#7C3AED', big:false, isAsig:false, badge:null as number|null },
    { id:'asignaturas', label:'Asignaturas',  desc: `${stats.bySubject?.length??0} asignatura${(stats.bySubject?.length??0)!==1?'s':''} activa${(stats.bySubject?.length??0)!==1?'s':''}`, icon:BookOpen,     color:'#D97706', big:false, isAsig:true,  badge:null as number|null },

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

  const { stats, allProfiles, loading, error } = useDirector(currentUser)
  const { sent: dmSent, sendMessage: dmSend, deleteSentMessage: dmDelete } = useProfesorMessages(
    currentUser?.id, currentUser?.academy_id, currentUser?.subject_id
  )
  const { studentProfiles, staffProfiles, loading: loadingProfiles, updateStudentProfile } = useAcademyProfiles(currentUser?.academy_id)

  const [tab,           setTab]           = useState('overview')
  const [alumnoDetalle, setAlumnoDetalle] = useState<AlumnoEnriquecido | null>(null)
  const [profDetalle,   setProfDetalle]   = useState<StudentProfile | null>(null)

  const bentoRef   = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!tab || !contentRef.current) return
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

    let newAccessUntil: string | null = null
    if (fields.access_until) {
      newAccessUntil = new Date(fields.access_until + 'T23:59:59').toISOString()
      await supabase.from('profiles').update({ access_until: newAccessUntil }).eq('id', userId)
    }

    // Refrescar la "foto" del alumno en pantalla de detalle con los datos nuevos
    setAlumnoDetalle(prev => {
      if (!prev || prev.id !== userId) return prev
      return {
        ...prev,
        extended: { ...(prev.extended ?? {}), ...spFields },
        access_until: newAccessUntil ?? prev.access_until,
      }
    })
  }, [updateStudentProfile])

  if (loading || loadingProfiles) return <div className={styles.state}><RefreshCw size={22} className={styles.spinner} /><p>Cargando datos…</p></div>
  if (error)  return <ErrorState message={error ?? 'Error cargando los datos del panel.'} onRetry={() => window.location.reload()} />
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
        <DirectorBentoNav tab={tab} setTab={setTab} stats={typedStats} nAlertas={nAlertas} studentProfiles={studentProfiles as StudentProfile[]} nMensajes={dmSent.length} nRespuestas={dmSent.filter((m: {reply_body:string|null}) => m.reply_body).length} />
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
        {tab==='retencion'   && <RetencionPanel profiles={(allProfiles ?? []) as ProfileSimple[]} />}
        {tab==='vencimientos' && <VencimientosPanel
          profiles={(allProfiles ?? []) as ProfileSimple[]}
          onRenovar={(id, username) => {
            const sp = studentProfiles.find((p: any) => p.id === id)
            if (sp) setAlumnoDetalle(enrichAlumno(sp as any))
          }}
        />}
        {tab==='comunicacion' && <ComunicacionPanel currentUser={currentUser} profiles={(allProfiles ?? []) as ProfileSimple[]} mensajes={dmSent} onDelete={dmDelete} />}
        {tab==='finanzas'    && <FinanzasPanel stats={typedStats} profiles={(allProfiles ?? []) as ProfileSimple[]} />}
        {tab && <button className={styles.scrollBackBtn} onClick={() => bentoRef.current?.scrollIntoView({ behavior:'smooth', block:'start' })} aria-label="Volver arriba"><ChevronUp size={18} strokeWidth={2.5} /></button>}
      </div>
    </div>
  )
}

