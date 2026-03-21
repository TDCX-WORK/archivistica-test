import { useState, useCallback } from 'react'
import {
  Users, TrendingUp, AlertTriangle, BookOpen, Copy, Check,
  Plus, RefreshCw, ChevronDown, ChevronUp, Zap, Clock,
  UserX, BarChart2, Key, Calendar, Shield, ShieldOff, RotateCcw, XCircle,
  TrendingDown, CalendarDays, ExternalLink
} from 'lucide-react'
import { useProfesor } from '../../../hooks/useProfesor'
import FallosClase   from '../FallosClase/FallosClase'
import PlanSemanal   from '../PlanSemanal/PlanSemanal'
import AlumnoDetalle from '../AlumnoDetalle/AlumnoDetalle'
import styles from './ProfesorPanel.module.css'

// ── Helpers ────────────────────────────────────────────────────────────────
function formatDias(n) {
  if (n === null) return 'Nunca'
  if (n === 0)    return 'Hoy'
  if (n === 1)    return 'Ayer'
  return `Hace ${n} días`
}

function formatFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Stat card ──────────────────────────────────────────────────────────────
function Stat({ icon: Icon, label, value, color, alert }) {
  return (
    <div className={[styles.statCard, alert ? styles.statAlert : ''].join(' ')} style={{ '--accent': color }}>
      <div className={styles.statIcon}><Icon size={18} strokeWidth={1.8} /></div>
      <div className={styles.statValue}>{value ?? '—'}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  )
}

// ── Modal renovar acceso ───────────────────────────────────────────────────
function RenovarModal({ alumno, onRenovar, onClose }) {
  const [meses,   setMeses]   = useState(3)
  const [loading, setLoading] = useState(false)

  const handleRenovar = async () => {
    setLoading(true)
    await onRenovar(alumno.id, meses)
    setLoading(false)
    onClose()
  }

  const base = alumno.accessUntil && !alumno.accesoExpirado
    ? new Date(alumno.accessUntil) : new Date()
  const nueva = new Date(base)
  nueva.setMonth(nueva.getMonth() + meses)

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>Renovar acceso — {alumno.username}</h3>
        <p className={styles.modalSub}>
          {alumno.accesoExpirado
            ? 'El acceso de este alumno ha expirado.'
            : `Acceso actual hasta: ${formatFecha(alumno.accessUntil)}`}
        </p>
        <div className={styles.modalField}>
          <label className={styles.modalLabel}>Meses a añadir</label>
          <div className={styles.pillarBtns}>
            {[1, 2, 3, 6, 12].map(m => (
              <button key={m}
                className={[styles.pillarBtn, meses === m ? styles.pillarBtnActive : ''].join(' ')}
                onClick={() => setMeses(m)}>
                {m === 12 ? '1 año' : `${m} mes${m > 1 ? 'es' : ''}`}
              </button>
            ))}
          </div>
        </div>
        <p className={styles.modalPreview}>
          Acceso hasta: <strong>{nueva.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
        </p>
        <div className={styles.modalActions}>
          <button className={styles.btnCancelar} onClick={onClose}>Cancelar</button>
          <button className={styles.btnRenovarModal} onClick={handleRenovar} disabled={loading}>
            {loading ? <RefreshCw size={14} className={styles.spinner} /> : <RotateCcw size={14} />}
            Renovar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal generar código ───────────────────────────────────────────────────
function GenerarCodigoModal({ onGenerar, onClose }) {
  const [diasCodigo,   setDiasCodigo]   = useState(30)
  const [accessMonths, setAccessMonths] = useState(3)
  const [loading,      setLoading]      = useState(false)
  const [codigoCreado, setCodigoCreado] = useState(null)
  const [copied,       setCopied]       = useState(false)

  const handleGenerar = async () => {
    setLoading(true)
    const code = await onGenerar(diasCodigo, accessMonths)
    setCodigoCreado(code)
    setLoading(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(codigoCreado)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (codigoCreado) return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>Código generado ✓</h3>
        <div className={styles.codigoGenerado}>
          <span className={styles.codigoTexto}>{codigoCreado}</span>
          <button className={styles.copyBtn} onClick={handleCopy}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
        <p className={styles.modalPreview}>
          Registro: <strong>{diasCodigo} días</strong> · Acceso: <strong>{accessMonths === 12 ? '1 año' : `${accessMonths} meses`}</strong>
        </p>
        <button className={styles.btnRenovarModal} onClick={onClose}>Cerrar</button>
      </div>
    </div>
  )

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>Nuevo código de invitación</h3>

        <div className={styles.modalField}>
          <label className={styles.modalLabel}>Tiempo para registrarse</label>
          <div className={styles.pillarBtns}>
            {[7, 15, 30].map(d => (
              <button key={d}
                className={[styles.pillarBtn, diasCodigo === d ? styles.pillarBtnActive : ''].join(' ')}
                onClick={() => setDiasCodigo(d)}>
                {d} días
              </button>
            ))}
          </div>
        </div>

        <div className={styles.modalField}>
          <label className={styles.modalLabel}>Duración del acceso</label>
          <div className={styles.pillarBtns}>
            {[1, 2, 3, 6, 12].map(m => (
              <button key={m}
                className={[styles.pillarBtn, accessMonths === m ? styles.pillarBtnActive : ''].join(' ')}
                onClick={() => setAccessMonths(m)}>
                {m === 12 ? '1 año' : `${m} mes${m > 1 ? 'es' : ''}`}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.btnCancelar} onClick={onClose}>Cancelar</button>
          <button className={styles.btnRenovarModal} onClick={handleGenerar} disabled={loading}>
            {loading ? <RefreshCw size={14} className={styles.spinner} /> : <Key size={14} />}
            Generar código
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Fila de alumno (acordeón) ──────────────────────────────────────────────
function AlumnoRow({ alumno, expanded, onToggle, onRenovar, onRevocar, onDetalle }) {
  const [revocando, setRevocando] = useState(false)

  const handleRevocar = async () => {
    if (!window.confirm(`¿Revocar acceso de ${alumno.username}? Dejará de poder entrar inmediatamente.`)) return
    setRevocando(true)
    await onRevocar(alumno.id)
    setRevocando(false)
  }

  const getEstadoAcceso = () => {
    if (alumno.accesoExpirado)  return { text: 'Acceso expirado',                       cls: styles.badgeExpirado }
    if (alumno.proximoAExpirar) return { text: `Expira en ${alumno.diasParaExpirar}d`,  cls: styles.badgeExpirando }
    if (alumno.accessUntil)     return { text: `Hasta ${formatFecha(alumno.accessUntil)}`, cls: styles.badgeAccesoOk }
    return null
  }
  const estadoAcceso = getEstadoAcceso()

  return (
    <div className={[
      styles.alumnoCard,
      alumno.enRiesgo      ? styles.enRiesgo  : '',
      alumno.accesoExpirado ? styles.expirado : '',
      alumno.proximoAExpirar ? styles.expirando : '',
    ].filter(Boolean).join(' ')}>

      <button className={styles.alumnoHeader} onClick={onToggle}>
        <div className={styles.alumnoLeft}>
          <div className={styles.alumnoAvatar}>
            {alumno.accesoExpirado ? <ShieldOff size={14} /> : alumno.username[0].toUpperCase()}
          </div>
          <div className={styles.alumnoInfo}>
            <span className={styles.alumnoName}>{alumno.username}</span>
            <div className={styles.alumnoBadges}>
              <span className={[styles.badge,
                alumno.accesoExpirado ? styles.badgeExpirado :
                alumno.enRiesgo       ? styles.badgeRiesgo :
                alumno.diasInactivo === 0 ? styles.badgeActivo : styles.badgeNormal
              ].join(' ')}>
                {alumno.accesoExpirado    ? '✕ Expirado' :
                 alumno.enRiesgo          ? '⚠ En riesgo' :
                 alumno.diasInactivo === 0 ? '● Activo hoy' :
                 formatDias(alumno.diasInactivo)}
              </span>
              {estadoAcceso && !alumno.accesoExpirado && (
                <span className={[styles.badge, estadoAcceso.cls].join(' ')}>
                  {estadoAcceso.text}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className={styles.alumnoRight}>
          <span className={styles.alumnoNota}>
            {alumno.notaMedia !== null ? `${alumno.notaMedia}%` : '—'}
          </span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {expanded && (
        <div className={styles.alumnoDetail}>
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}><Zap size={13} /><span>{alumno.sesiones} sesiones</span></div>
            <div className={styles.detailItem}><BookOpen size={13} /><span>{alumno.temasLeidos} temas leídos</span></div>
            <div className={styles.detailItem}><TrendingUp size={13} /><span>Racha: {alumno.racha}d</span></div>
            <div className={styles.detailItem}><AlertTriangle size={13} /><span>{alumno.fallos} preguntas falladas</span></div>
            <div className={styles.detailItem}><Clock size={13} /><span>{alumno.pendientesHoy} pendientes hoy</span></div>
            <div className={styles.detailItem}><Calendar size={13} /><span>Acceso hasta: {formatFecha(alumno.accessUntil)}</span></div>
          </div>
          <div className={styles.detailActions}>
            <button className={styles.btnRevocarSmall} onClick={handleRevocar} disabled={revocando}>
              {revocando ? <RefreshCw size={12} className={styles.spinner} /> : <XCircle size={12} />}
              Revocar acceso
            </button>
            <button className={styles.btnRenovarSmall2} onClick={() => onRenovar(alumno)}>
              <RotateCcw size={12} /> Renovar acceso
            </button>
            <button className={styles.btnDetalleSmall} onClick={() => onDetalle && onDetalle(alumno)}>
              <ExternalLink size={12} /> Ver detalle
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Card de código ─────────────────────────────────────────────────────────
function CodigoCard({ code, onCopy, copied }) {
  const isUsado   = !!code.used_by
  const isExpired = new Date(code.expires_at) < new Date()
  const estado    = isUsado ? 'usado' : isExpired ? 'expirado' : 'activo'
  const expDate   = new Date(code.expires_at).toLocaleDateString('es-ES')

  return (
    <div className={[styles.codeCard, styles[`code_${estado}`]].join(' ')}>
      <div className={styles.codeLeft}>
        <span className={styles.codeText}>{code.code}</span>
        <span className={styles.codeExpiry}>
          {estado === 'activo'
            ? `Registro hasta ${expDate} · Acceso ${code.access_months === 12 ? '1 año' : `${code.access_months} meses`}`
            : estado === 'usado' ? 'Utilizado' : 'Expirado'}
        </span>
      </div>
      {estado === 'activo' && (
        <button className={styles.copyBtn} onClick={() => onCopy(code.code)}>
          {copied === code.code ? <Check size={14} /> : <Copy size={14} />}
        </button>
      )}
    </div>
  )
}

// ── Panel principal ────────────────────────────────────────────────────────
export default function ProfesorPanel({ currentUser }) {
  const {
    alumnos, inviteCodes, statsClase, loading, error,
    generarCodigo, renovarAcceso, revocarAcceso,
  } = useProfesor(currentUser)

  const [tab,          setTab]          = useState('clase')
  const [alumnoDetalle, setAlumnoDetalle] = useState(null) // alumno seleccionado para detalle
  const [expandedId,   setExpandedId]   = useState(null)
  const [filtro,       setFiltro]       = useState('todos')
  const [modalCodigo,  setModalCodigo]  = useState(false)
  const [modalRenovar, setModalRenovar] = useState(null)
  const [copied,       setCopied]       = useState(null)

  const handleCopy = useCallback((code) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }, [])

  const nExpirando = alumnos.filter(a => a.proximoAExpirar || a.accesoExpirado).length

  const alumnosFiltrados = alumnos.filter(a => {
    if (filtro === 'riesgo')    return a.enRiesgo
    if (filtro === 'expirando') return a.proximoAExpirar || a.accesoExpirado
    if (filtro === 'activos')   return !a.enRiesgo && !a.accesoExpirado && a.diasInactivo !== null && a.diasInactivo < 3
    return true
  })

  if (loading) return (
    <div className={styles.loading}>
      <RefreshCw size={22} className={styles.spinner} />
      <p>Cargando datos de la clase…</p>
    </div>
  )

  if (error) return (
    <div className={styles.errorState}>
      <AlertTriangle size={22} /><p>{error}</p>
    </div>
  )

  // Vista de detalle de alumno — reemplaza todo el panel
  if (alumnoDetalle) return (
    <AlumnoDetalle
      alumno={alumnoDetalle}
      onBack={() => setAlumnoDetalle(null)}
      academyId={currentUser?.academy_id}
    />
  )

  return (
    <div className={styles.page}>

      {/* Modales */}
      {modalCodigo && (
        <GenerarCodigoModal onGenerar={generarCodigo} onClose={() => setModalCodigo(false)} />
      )}
      {modalRenovar && (
        <RenovarModal
          alumno={modalRenovar}
          onRenovar={renovarAcceso}
          onClose={() => setModalRenovar(null)}
        />
      )}

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Panel del Profesor</h1>
          <p className={styles.pageSubtitle}>Seguimiento de tu clase en tiempo real</p>
        </div>
        <button className={styles.btnGenerar} onClick={() => setModalCodigo(true)}>
          <Plus size={15} /> Nuevo código
        </button>
      </div>

      {/* Alerta expiraciones */}
      {nExpirando > 0 && (
        <div className={styles.alertaBanner}>
          <Shield size={15} />
          <span>
            {nExpirando === 1 ? '1 alumno' : `${nExpirando} alumnos`} con acceso expirado o próximo a expirar
          </span>
          <button className={styles.alertaBtn}
            onClick={() => { setTab('clase'); setFiltro('expirando') }}>
            Ver alumnos
          </button>
        </div>
      )}

      {/* Stats rápidas */}
      {statsClase && (
        <div className={styles.statsRow}>
          <Stat icon={Users}     label="Alumnos"             value={statsClase.totalAlumnos}     color="var(--primary)" />
          <Stat icon={Zap}       label="Activos esta semana" value={statsClase.alumnosActivos}   color="#059669" />
          <Stat icon={UserX}     label="En riesgo"           value={statsClase.enRiesgo}         color="#DC2626" />
          <Stat icon={Shield}    label="Accesos por expirar" value={statsClase.proximosAExpirar} color="#B45309" alert={statsClase.proximosAExpirar > 0} />
          <Stat icon={BarChart2} label="Nota media"          value={`${statsClase.notaMediaClase ?? 0}%`} color="#7C3AED" />
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button className={[styles.tab, tab === 'clase' ? styles.tabActive : ''].join(' ')} onClick={() => setTab('clase')}>
          <Users size={14} /> Clase ({alumnos.length})
        </button>
        <button className={[styles.tab, tab === 'fallos' ? styles.tabActive : ''].join(' ')} onClick={() => setTab('fallos')}>
          <TrendingDown size={14} /> Fallos clase
        </button>
        <button className={[styles.tab, tab === 'plan' ? styles.tabActive : ''].join(' ')} onClick={() => setTab('plan')}>
          <CalendarDays size={14} /> Plan semanal
        </button>
        <button className={[styles.tab, tab === 'codigos' ? styles.tabActive : ''].join(' ')} onClick={() => setTab('codigos')}>
          <Key size={14} /> Códigos de invitación
        </button>
      </div>

      {/* Tab: Clase */}
      {tab === 'clase' && (
        <div className={styles.tabContent}>
          <div className={styles.filtros}>
            {[
              { id: 'todos',     label: `Todos (${alumnos.length})` },
              { id: 'riesgo',    label: `⚠ En riesgo (${alumnos.filter(a => a.enRiesgo).length})` },
              { id: 'expirando', label: `🔒 Acceso (${nExpirando})` },
              { id: 'activos',   label: `Activos (${alumnos.filter(a => !a.enRiesgo && !a.accesoExpirado && a.diasInactivo !== null && a.diasInactivo < 3).length})` },
            ].map(f => (
              <button key={f.id}
                className={[styles.filtroBtn, filtro === f.id ? styles.filtroActive : ''].join(' ')}
                onClick={() => setFiltro(f.id)}>
                {f.label}
              </button>
            ))}
          </div>

          {alumnosFiltrados.length === 0 ? (
            <div className={styles.emptyState}>
              <Users size={32} strokeWidth={1.2} />
              <p>
                {filtro === 'riesgo'    ? 'Ningún alumno en riesgo. ¡Bien!' :
                 filtro === 'expirando' ? 'Ningún acceso próximo a expirar.' :
                 'No hay alumnos en este filtro.'}
              </p>
            </div>
          ) : (
            <div className={styles.alumnosList}>
              {alumnosFiltrados.map(alumno => (
                <AlumnoRow
                  key={alumno.id}
                  alumno={alumno}
                  expanded={expandedId === alumno.id}
                  onToggle={() => setExpandedId(prev => prev === alumno.id ? null : alumno.id)}
                  onRenovar={setModalRenovar}
                  onRevocar={revocarAcceso}
                  onDetalle={setAlumnoDetalle}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Fallos clase */}
      {tab === 'fallos' && (
        <div className={styles.tabContent}>
          <FallosClase currentUser={currentUser} />
        </div>
      )}

      {/* Tab: Plan semanal */}
      {tab === 'plan' && (
        <div className={styles.tabContent}>
          <PlanSemanal currentUser={currentUser} />
        </div>
      )}

      {/* Tab: Códigos */}
      {tab === 'codigos' && (
        <div className={styles.tabContent}>
          {inviteCodes.length === 0 ? (
            <div className={styles.emptyState}>
              <Key size={32} strokeWidth={1.2} />
              <p>No hay códigos. Pulsa "Nuevo código" para crear uno.</p>
            </div>
          ) : (
            <div className={styles.codesList}>
              {inviteCodes.map(code => (
                <CodigoCard key={code.id} code={code} onCopy={handleCopy} copied={copied} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
