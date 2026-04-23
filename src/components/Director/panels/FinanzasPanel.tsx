import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
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
import styles from './FinanzasPanel.module.css'

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


// ── PagosSection — selector de mes + cards por alumno ────────────────────────
const STATUS_META_PAGOS: Record<string, {label:string; color:string; bg:string; icon:React.ElementType}> = {
  paid:    { label:'Pagado',    color:'#059669', bg:'rgba(5,150,105,0.08)',  icon:CheckCircle  },
  pending: { label:'Pendiente', color:'#D97706', bg:'rgba(217,119,6,0.08)',  icon:Clock        },
  overdue: { label:'Vencido',   color:'#DC2626', bg:'rgba(220,38,38,0.08)',  icon:AlertTriangle},
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function PagosSection({ alumnos, spMap, fmtEur }: {
  alumnos: ProfileSimple[]
  spMap:   Record<string, { monthly_price: number | null; payment_status: string; exam_date: string | null; full_name: string | null; city: string | null }>
  fmtEur:  (n: number) => string
}) {
  const now        = new Date()
  const [mes, setMes]               = useState(now.getMonth())
  const [ano, setAno]               = useState(now.getFullYear())
  const [localStatus, setLocalStatus] = useState<Record<string, string>>({})
  const [confirmado,  setConfirmado]  = useState<Record<string, string>>({})
  const [guardando,   setGuardando]   = useState<Record<string, boolean>>({})

  const alumnosConPrecio = alumnos.filter(a => spMap[a.id]?.monthly_price)

  const getStatus = (id: string) => localStatus[id] ?? spMap[id]?.payment_status ?? 'pending'

  // KPIs reactivos al estado local
  const kpiPagados    = alumnosConPrecio.filter(a => getStatus(a.id) === 'paid')
  const kpiPendientes = alumnosConPrecio.filter(a => getStatus(a.id) === 'pending')
  const kpiVencidos   = alumnosConPrecio.filter(a => getStatus(a.id) === 'overdue')
  const mrrCobrado    = kpiPagados.reduce((s, a) => s + (spMap[a.id]?.monthly_price ?? 0), 0)
  const mrrPendiente  = kpiPendientes.reduce((s, a) => s + (spMap[a.id]?.monthly_price ?? 0), 0)
  const mrrVencido    = kpiVencidos.reduce((s, a) => s + (spMap[a.id]?.monthly_price ?? 0), 0)

  const handleChange = async (alumnoId: string, newStatus: string) => {
    setGuardando(prev => ({ ...prev, [alumnoId]: true }))
    try {
      const { supabase: sb } = await import('../../../lib/supabase')
      const { error } = await sb.from('student_profiles').update({ payment_status: newStatus }).eq('id', alumnoId)
      if (!error) {
        setLocalStatus(prev => ({ ...prev, [alumnoId]: newStatus }))
        setConfirmado(prev => ({ ...prev, [alumnoId]: newStatus }))
        setTimeout(() => setConfirmado(prev => { const n = {...prev}; delete n[alumnoId]; return n }), 2200)
      }
    } finally {
      setGuardando(prev => ({ ...prev, [alumnoId]: false }))
    }
  }

  const prevMes = () => { if (mes === 0) { setMes(11); setAno(a => a - 1) } else setMes(m => m - 1) }
  const nextMes = () => { if (mes === 11) { setMes(0); setAno(a => a + 1) } else setMes(m => m + 1) }
  const isCurrentMonth = mes === now.getMonth() && ano === now.getFullYear()
  const isFuture = ano > now.getFullYear() || (ano === now.getFullYear() && mes > now.getMonth())

  return (
    <div className={styles.finanzasSection}>
      {/* Header con selector de mes */}
      <div className={styles.pagosSectionHeader}>
        <div className={styles.pagosSectionTitle}>
          <Euro size={14}/> Cobros
        </div>
        <div className={styles.pagosMesSelector}>
          <button className={styles.pagosMesBtn} onClick={prevMes}>‹</button>
          <span className={styles.pagosMesLabel}>
            {MESES[mes]} {ano}
            {isCurrentMonth && <span className={styles.pagosMesActual}>Actual</span>}
          </span>
          <button className={styles.pagosMesBtn} onClick={nextMes} disabled={isFuture}>›</button>
        </div>
      </div>

      {/* KPIs reactivos */}
      <div className={styles.pagosKpisRow}>
        <div className={[styles.pagosKpiCard, styles.pagosCardPaid].join(' ')}>
          <div className={styles.pagosKpiTop}>
            <span className={styles.pagosKpiNum} style={{color:'#059669'}}>{kpiPagados.length}</span>
            <span className={styles.pagosKpiImporte}>{fmtEur(mrrCobrado)}</span>
          </div>
          <span className={styles.pagosKpiNombre}>Pagados</span>
          <div className={styles.pagosKpiBar}>
            <div className={styles.pagosKpiBarFill} style={{width:`${alumnosConPrecio.length ? (kpiPagados.length/alumnosConPrecio.length)*100 : 0}%`, background:'#059669'}}/>
          </div>
        </div>
        <div className={[styles.pagosKpiCard, styles.pagosCardPending].join(' ')}>
          <div className={styles.pagosKpiTop}>
            <span className={styles.pagosKpiNum} style={{color:'#D97706'}}>{kpiPendientes.length}</span>
            <span className={styles.pagosKpiImporte}>{fmtEur(mrrPendiente)}</span>
          </div>
          <span className={styles.pagosKpiNombre}>Pendientes</span>
          <div className={styles.pagosKpiBar}>
            <div className={styles.pagosKpiBarFill} style={{width:`${alumnosConPrecio.length ? (kpiPendientes.length/alumnosConPrecio.length)*100 : 0}%`, background:'#D97706'}}/>
          </div>
        </div>
        <div className={[styles.pagosKpiCard, styles.pagosCardOverdue].join(' ')}>
          <div className={styles.pagosKpiTop}>
            <span className={styles.pagosKpiNum} style={{color:'#DC2626'}}>{kpiVencidos.length}</span>
            <span className={styles.pagosKpiImporte}>{fmtEur(mrrVencido)}</span>
          </div>
          <span className={styles.pagosKpiNombre}>Vencidos</span>
          <div className={styles.pagosKpiBar}>
            <div className={styles.pagosKpiBarFill} style={{width:`${alumnosConPrecio.length ? (kpiVencidos.length/alumnosConPrecio.length)*100 : 0}%`, background:'#DC2626'}}/>
          </div>
        </div>
      </div>

      {/* Cards por alumno */}
      <div className={styles.pagosAlumnosGrid}>
        {alumnosConPrecio.map((a) => {
          const sp      = spMap[a.id]!
          const status  = getStatus(a.id)
          const meta    = STATUS_META_PAGOS[status] ?? STATUS_META_PAGOS['pending']!
          const saving  = guardando[a.id] ?? false
          const conf    = confirmado[a.id]
          const confMeta= conf ? STATUS_META_PAGOS[conf] : null
          const StatusIcon = meta.icon

          return (
            <div key={a.id}
              className={[styles.pagosAlumnoCard,
                status==='paid'    ? styles.pagosCardPaid    :
                status==='overdue' ? styles.pagosCardOverdue :
                styles.pagosCardPending
              ].join(' ')}>
              {/* Cabecera */}
              <div className={styles.pagosAlumnoHead}>
                <div className={styles.pagosAlumnoAvatar} style={{background:meta.bg, color:meta.color}}>
                  {a.username[0]!.toUpperCase()}
                </div>
                <div className={styles.pagosAlumnoInfo}>
                  <span className={styles.pagosAlumnoNombre}>{a.username}</span>
                  <span className={styles.pagosAlumnoPrecio}>{fmtEur(sp.monthly_price!)}<span>/mes</span></span>
                </div>
                {/* Badge estado */}
                {conf && confMeta ? (
                  <span className={[styles.pagosEstadoBadge, styles.pagosBadgeConfirm].join(' ')}
                    style={{color:confMeta.color, background:confMeta.bg}}>
                    <Check size={10} strokeWidth={3}/>{confMeta.label}
                  </span>
                ) : (
                  <span className={styles.pagosEstadoBadge} style={{color:meta.color, background:meta.bg}}>
                    {saving
                      ? <RefreshCw size={10} className={styles.spinnerSmall}/>
                      : <StatusIcon size={10} strokeWidth={2.5}/>
                    }
                    {saving ? 'Guardando…' : meta.label}
                  </span>
                )}
              </div>
              {/* Botones de cambio */}
              <div className={styles.pagosAlumnoBtns}>
                {(['paid','pending','overdue'] as const).filter(s => s !== status).map(s => {
                  const m = STATUS_META_PAGOS[s]!
                  const BtnIcon = m.icon
                  return (
                    <button key={s} className={styles.pagosAlumnoBtn}
                      style={{'--btn-c': m.color} as React.CSSProperties}
                      disabled={saving}
                      onClick={() => handleChange(a.id, s)}>
                      <BtnIcon size={11} strokeWidth={2}/>{m.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── FinanzasPanel ──────────────────────────────────────────────────────────
function FinanzasPanel({ stats, profiles, onRefresh }: { stats: Stats; profiles: ProfileSimple[]; onRefresh?: () => Promise<void> | void }) {
  const fin = stats.finanzas
  const [precioBase,  setPrecioBase]  = useState('')
  const [editando,    setEditando]    = useState(false)
  const [inputPrecio, setInputPrecio] = useState('')
  const [refreshing,  setRefreshing]  = useState(false)

  const handleRefresh = async () => {
    if (!onRefresh || refreshing) return
    setRefreshing(true)
    try { await onRefresh() } finally { setRefreshing(false) }
  }

  if (!fin) return null

  const now     = new Date()
  const alumnos = profiles.filter(p => p.role === 'alumno')
  const fmtEur  = (n: number) => new Intl.NumberFormat('es-ES', { style:'currency', currency:'EUR', maximumFractionDigits: 0 }).format(n)

  // MRR con precio base para alumnos sin precio individual
  const precioBaseNum  = precioBase ? parseFloat(precioBase) : 0
  const mrrConBase     = fin.mrrAcademia + (fin.alumnosSinPrecio * precioBaseNum)
  const arrEstimado    = mrrConBase * 12

  // MRR en riesgo — alumnos inactivos o con acceso a punto de expirar
  const mrrRiesgo = alumnos
    .filter(a => {
      const sp = fin.spMap[a.id]
      if (!sp?.monthly_price) return false
      const diasRestantes = a.access_until
        ? Math.ceil((new Date(a.access_until).getTime() - now.getTime()) / 86400000)
        : null
      return diasRestantes !== null && diasRestantes <= 30
    })
    .reduce((sum, a) => sum + (fin.spMap[a.id]?.monthly_price ?? 0), 0)

  // Vencimientos próximos (30 días)
  const vencen30 = alumnos
    .filter(a => a.access_until)
    .map(a => ({
      username:    a.username,
      accessUntil: a.access_until!,
      dias:        Math.ceil((new Date(a.access_until!).getTime() - now.getTime()) / 86400000),
      precio:      fin.spMap[a.id]?.monthly_price ?? null,
    }))
    .filter(a => a.dias > 0 && a.dias <= 30)
    .sort((a, b) => a.dias - b.dias)

  // Alumnos sin precio asignado
  const sinPrecio = alumnos
    .filter(a => !fin.spMap[a.id]?.monthly_price)
    .map(a => ({ username: a.username, accessUntil: a.access_until }))

  return (
    <div className={styles.finanzasWrap}>

      {/* Toolbar con botón de refresco — los datos dependen de stats del director,
          que no se refrescan automáticamente al mutar desde otros paneles */}
      {onRefresh && (
        <div className={styles.finanzasToolbar}>
          <div className={styles.finanzasToolbarLeft}>
            <span className={styles.finanzasToolbarTitle}>Finanzas · tiempo real</span>
            <span className={styles.finanzasToolbarHint}>Si acabas de cambiar un precio o un pago, pulsa Refrescar</span>
          </div>
          <button className={styles.finanzasRefreshBtn} onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={12} className={refreshing ? styles.spinning : ''} />
            {refreshing ? 'Actualizando…' : 'Refrescar'}
          </button>
        </div>
      )}

      {/* KPIs financieros */}
      <div className={styles.finanzasKpis}>
        <div className={styles.finanzasKpi}>
          <div className={styles.finanzasKpiIcon} style={{background:'rgba(5,150,105,0.1)',color:'#059669'}}>
            <Euro size={18} strokeWidth={1.8}/>
          </div>
          <div className={styles.finanzasKpiVal}>{fmtEur(mrrConBase)}</div>
          <div className={styles.finanzasKpiLabel}>MRR Academia</div>
          <div className={styles.finanzasKpiSub}>{fin.totalAlumnosConPrecio} alumnos con precio</div>
        </div>
        <div className={styles.finanzasKpi}>
          <div className={styles.finanzasKpiIcon} style={{background:'rgba(37,99,235,0.1)',color:'#2563EB'}}>
            <TrendingUp size={18} strokeWidth={1.8}/>
          </div>
          <div className={styles.finanzasKpiVal}>{fmtEur(arrEstimado)}</div>
          <div className={styles.finanzasKpiLabel}>ARR estimado</div>
          <div className={styles.finanzasKpiSub}>MRR × 12 meses</div>
        </div>
        <div className={styles.finanzasKpi}>
          <div className={styles.finanzasKpiIcon} style={{background:'rgba(220,38,38,0.1)',color:'#DC2626'}}>
            <TrendingDown size={18} strokeWidth={1.8}/>
          </div>
          <div className={styles.finanzasKpiVal} style={{color:'#DC2626'}}>-{fmtEur(mrrRiesgo)}</div>
          <div className={styles.finanzasKpiLabel}>MRR en riesgo</div>
          <div className={styles.finanzasKpiSub}>Accesos que vencen en 30d</div>
        </div>
        <div className={styles.finanzasKpi} style={fin.alumnosSinPrecio > 0 ? {borderColor:'rgba(220,38,38,0.3)'} : {}}>
          <div className={styles.finanzasKpiIcon} style={{background:'rgba(220,38,38,0.1)',color:'#DC2626'}}>
            <AlertTriangle size={18} strokeWidth={1.8}/>
          </div>
          <div className={styles.finanzasKpiVal} style={fin.alumnosSinPrecio > 0 ? {color:'#DC2626'} : {}}>{fin.alumnosSinPrecio}</div>
          <div className={styles.finanzasKpiLabel}>Sin precio asignado</div>
          <div className={styles.finanzasKpiSub}>No cuentan en el MRR</div>
        </div>
      </div>

      <PagosSection alumnos={alumnos} spMap={fin.spMap} fmtEur={fmtEur} />

      {/* Precio base para alumnos sin precio individual */}
      <div className={styles.finanzasPrecioBase}>
        <div className={styles.finanzasPrecioBaseInfo}>
          <Euro size={13} style={{color:'var(--ink-muted)'}}/>
          <span>Precio base para alumnos sin precio individual</span>
          {precioBase && <span className={styles.finanzasPrecioBaseActivo}>{precioBase} €/mes aplicado</span>}
        </div>
        {editando ? (
          <div className={styles.finanzasPrecioBaseForm}>
            <input type="number" className={styles.finanzasPrecioInput}
              value={inputPrecio} onChange={e => setInputPrecio(e.target.value)}
              placeholder="ej: 89" min="0" autoFocus />
            <button className={styles.finanzasPrecioBtn} onClick={() => { setPrecioBase(inputPrecio); setEditando(false) }}>Aplicar</button>
            <button className={styles.finanzasPrecioBtnCancel} onClick={() => setEditando(false)}>Cancelar</button>
          </div>
        ) : (
          <button className={styles.finanzasPrecioEditBtn} onClick={() => { setEditando(true); setInputPrecio(precioBase) }}>
            {precioBase ? 'Cambiar' : '+ Añadir precio base'}
          </button>
        )}
      </div>

      {/* Próximos vencimientos */}
      {vencen30.length > 0 && (
        <div className={styles.finanzasSection}>
          <div className={styles.finanzasSectionTitle}><Clock size={14}/> Accesos que vencen en 30 días</div>
          <div className={styles.finanzasTable}>
            <div className={styles.finanzasTableHead}>
              <span>Alumno</span><span>Vence en</span><span>Fecha</span><span>Precio/mes</span>
            </div>
            {vencen30.map((a, i) => (
              <div key={i} className={styles.finanzasTableRow}>
                <span className={styles.finanzasUsername}>{a.username}</span>
                <span className={[styles.finanzasDias, a.dias <= 7 ? styles.finanzasDiasRed : a.dias <= 14 ? styles.finanzasDiasAmber : styles.finanzasDiasGreen].join(' ')}>{a.dias}d</span>
                <span className={styles.finanzasFecha}>{new Date(a.accessUntil).toLocaleDateString('es-ES',{day:'2-digit',month:'short'})}</span>
                <span className={styles.finanzasPrecio}>{a.precio ? fmtEur(a.precio) : <span style={{color:'var(--ink-subtle)'}}>Sin precio</span>}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alumnos sin precio */}
      {sinPrecio.length > 0 && (
        <div className={styles.finanzasSection}>
          <div className={styles.finanzasSectionTitle} style={{color:'#DC2626'}}><AlertTriangle size={14}/> Sin precio asignado — no contabilizan en el MRR</div>
          <div className={styles.finanzasAlertList}>
            {sinPrecio.map((a, i) => (
              <div key={i} className={styles.finanzasAlertRow}>
                <span>{a.username}</span>
                <span style={{color:'var(--ink-subtle)',fontSize:'var(--fs-6)'}}>{a.accessUntil ? `Acceso hasta ${new Date(a.accessUntil).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'})}` : 'Sin fecha de acceso'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


export { FinanzasPanel }
