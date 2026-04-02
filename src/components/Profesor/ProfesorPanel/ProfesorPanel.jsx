import { useState, useCallback } from 'react'
import {
  Users, TrendingUp, AlertTriangle, BookOpen, Copy, Check,
  Plus, RefreshCw, ChevronDown, ChevronUp, Zap, Clock,
  UserX, BarChart2, Key, Calendar, Shield, ShieldOff, RotateCcw, XCircle,
  TrendingDown, CalendarDays, ExternalLink, Bell, CheckCircle2, ArrowRight,
  Megaphone, Trash2, AlertTriangle as AlertIcon, Info, BookOpen as BookIcon
} from 'lucide-react'
import { useProfesor }        from '../../../hooks/useProfesor'
import { useAnnouncements }   from '../../../hooks/useAnnouncements'
import FallosClase   from '../FallosClase/FallosClase'
import PlanSemanal   from '../PlanSemanal/PlanSemanal'
import AlumnoDetalle from '../AlumnoDetalle/AlumnoDetalle'
import ClaseEvolucionChart from '../ClaseEvolucionChart/ClaseEvolucionChart'
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

// ── Tablón de avisos — panel del profesor ──────────────────────────────────
const TIPOS_AVISO = [
  { id: 'info',         label: 'Info',         color: '#0891B2', bg: '#EFF6FF' },
  { id: 'importante',   label: 'Importante',   color: '#DC2626', bg: '#FEF2F2' },
  { id: 'examen',       label: 'Examen',       color: '#7C3AED', bg: '#F5F3FF' },
  { id: 'recordatorio', label: 'Recordatorio', color: '#D97706', bg: '#FFFBEB' },
]

function formatFechaAviso(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function TablonPanel({ announcements, onAdd, onDelete, currentUser }) {
  const [titulo,    setTitulo]    = useState('')
  const [cuerpo,    setCuerpo]    = useState('')
  const [tipo,      setTipo]      = useState('info')
  const [expira,    setExpira]    = useState('')
  const [enviando,  setEnviando]  = useState(false)
  const [enviado,   setEnviado]   = useState(false)

  const handlePublicar = async () => {
    if (!titulo.trim()) return
    setEnviando(true)
    await onAdd({
      authorId:  currentUser?.id,
      tipo,
      title:     titulo.trim(),
      body:      cuerpo.trim() || null,
      expiresAt: expira ? new Date(expira + 'T23:59:59').toISOString() : null,
    })
    setTitulo(''); setCuerpo(''); setTipo('info'); setExpira('')
    setEnviando(false); setEnviado(true)
    setTimeout(() => setEnviado(false), 2000)
  }

  const tipoMeta = TIPOS_AVISO.find(t => t.id === tipo) || TIPOS_AVISO[0]

  return (
    <div className={styles.tablonPage}>
      {/* Formulario */}
      <div className={styles.tablonForm}>
        <h3 className={styles.tablonFormTitle}><Megaphone size={15} /> Publicar nuevo aviso</h3>

        {/* Selector de tipo */}
        <div className={styles.tipoRow}>
          {TIPOS_AVISO.map(t => (
            <button key={t.id}
              className={[styles.tipoBtn, tipo === t.id ? styles.tipoBtnActive : ''].join(' ')}
              style={tipo === t.id ? { background: t.bg, color: t.color, borderColor: t.color + '40' } : {}}
              onClick={() => setTipo(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        <input
          className={styles.tablonInput}
          placeholder="Título del aviso *"
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          maxLength={120}
        />
        <textarea
          className={styles.tablonTextarea}
          placeholder="Descripción (opcional)"
          value={cuerpo}
          onChange={e => setCuerpo(e.target.value)}
          rows={3}
        />

        <div className={styles.tablonFooter}>
          <div className={styles.expiraWrap}>
            <label className={styles.expiraLabel}>Expira el</label>
            <input type="date" className={styles.expiraInput} value={expira}
              onChange={e => setExpira(e.target.value)}
              min={new Date().toISOString().slice(0,10)}
            />
            {expira && <button className={styles.expiraClear} onClick={() => setExpira('')}>×</button>}
          </div>
          <button
            className={styles.tablonPublicar}
            onClick={handlePublicar}
            disabled={!titulo.trim() || enviando}
          >
            {enviado ? <><Check size={14} /> Publicado</> : enviando ? <RefreshCw size={14} className={styles.spinner} /> : <><Megaphone size={14} /> Publicar</>}
          </button>
        </div>
      </div>

      {/* Lista de avisos activos */}
      <div className={styles.tablonLista}>
        <h3 className={styles.tablonListaTitle}>
          Avisos activos
          <span className={styles.tablonCount}>{announcements.length}</span>
        </h3>

        {announcements.length === 0 ? (
          <div className={styles.tablonVacio}>
            <Megaphone size={28} strokeWidth={1.4} />
            <p>No hay avisos publicados</p>
            <span>Los avisos aparecerán en el Home de tus alumnos</span>
          </div>
        ) : (
          <div className={styles.tablonItems}>
            {announcements.map(a => {
              const meta = TIPOS_AVISO.find(t => t.id === a.tipo) || TIPOS_AVISO[0]
              return (
                <div key={a.id} className={styles.tablonItem}>
                  <div className={styles.tablonItemLeft}>
                    <span className={styles.tablonItemTipo}
                      style={{ color: meta.color, background: meta.bg }}>
                      {meta.label}
                    </span>
                    <p className={styles.tablonItemTitle}>{a.title}</p>
                    {a.body && <p className={styles.tablonItemBody}>{a.body}</p>}
                    <div className={styles.tablonItemMeta}>
                      <span>Publicado {formatFechaAviso(a.created_at)}</span>
                      {a.expires_at && <span>· Expira {formatFechaAviso(a.expires_at)}</span>}
                    </div>
                  </div>
                  <button className={styles.tablonItemDelete}
                    onClick={() => onDelete(a.id)} title="Eliminar aviso">
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}


// ── InboxPanel — acciones pendientes del profesor ─────────────────────────
function InboxPanel({ alumnos, inviteCodes, onVerAlumno, onRenovar, onRevocar }) {
  // Construir lista de acciones priorizadas
  const acciones = []

  // 1. Alumnos con acceso expirado — crítico
  alumnos
    .filter(a => a.accesoExpirado)
    .forEach(a => acciones.push({
      id:       `exp-${a.id}`,
      prioridad: 1,
      tipo:     'acceso_expirado',
      titulo:   `Acceso expirado — ${a.username}`,
      subtitulo: `El acceso de ${a.username} expiró hace ${a.diasParaExpirar !== null ? Math.abs(a.diasParaExpirar) : '?'} día${Math.abs(a.diasParaExpirar) !== 1 ? 's' : ''}`,
      alumno:   a,
      acciones: [
        { label: 'Renovar acceso', tipo: 'renovar', variant: 'primary' },
        { label: 'Ver alumno',     tipo: 'ver',     variant: 'secondary' },
      ]
    }))

  // 2. Accesos próximos a expirar — urgente
  alumnos
    .filter(a => a.proximoAExpirar && !a.accesoExpirado)
    .sort((a, b) => (a.diasParaExpirar ?? 99) - (b.diasParaExpirar ?? 99))
    .forEach(a => acciones.push({
      id:       `proxexp-${a.id}`,
      prioridad: 2,
      tipo:     'acceso_pronto',
      titulo:   `Acceso expira pronto — ${a.username}`,
      subtitulo: `Le quedan ${a.diasParaExpirar} día${a.diasParaExpirar !== 1 ? 's' : ''} de acceso`,
      alumno:   a,
      acciones: [
        { label: 'Renovar ahora', tipo: 'renovar', variant: 'primary' },
        { label: 'Ver alumno',    tipo: 'ver',     variant: 'secondary' },
      ]
    }))

  // 3. Alumnos inactivos — atención
  alumnos
    .filter(a => a.enRiesgo && !a.accesoExpirado)
    .sort((a, b) => (b.diasInactivo ?? 0) - (a.diasInactivo ?? 0))
    .forEach(a => acciones.push({
      id:       `inactivo-${a.id}`,
      prioridad: 3,
      tipo:     'inactivo',
      titulo:   `Sin actividad — ${a.username}`,
      subtitulo: `Lleva ${a.diasInactivo} día${a.diasInactivo !== 1 ? 's' : ''} sin estudiar`,
      alumno:   a,
      acciones: [
        { label: 'Ver alumno', tipo: 'ver', variant: 'primary' },
      ]
    }))

  // 4. Códigos de invitación expirados sin usar
  inviteCodes
    .filter(c => {
      if (c.usedBy) return false
      const exp = new Date(c.expiresAt || c.expires_at)
      return exp < new Date()
    })
    .forEach(c => acciones.push({
      id:       `cod-${c.id || c.code}`,
      prioridad: 4,
      tipo:     'codigo_expirado',
      titulo:   `Código caducado sin usar — ${c.code}`,
      subtitulo: 'Este código de invitación expiró sin que nadie lo usara',
      codigo:   c,
      acciones: [
        { label: 'Generar nuevo', tipo: 'nuevo_codigo', variant: 'primary' },
      ]
    }))

  const handleAccion = (accion, item) => {
    if (accion.tipo === 'renovar')      onRenovar(item.alumno)
    if (accion.tipo === 'ver')          onVerAlumno(item.alumno)
    if (accion.tipo === 'nuevo_codigo') {} // se maneja fuera
  }

  const TIPO_META = {
    acceso_expirado: { color: '#DC2626', bg: '#FEF2F2', icon: ShieldOff,  label: 'Acceso expirado' },
    acceso_pronto:   { color: '#D97706', bg: '#FFFBEB', icon: Clock,       label: 'Expira pronto' },
    inactivo:        { color: '#7C3AED', bg: '#F5F3FF', icon: UserX,       label: 'Inactivo' },
    codigo_expirado: { color: '#6B7280', bg: '#F3F4F6', icon: Key,         label: 'Código caducado' },
  }

  if (acciones.length === 0) {
    return (
      <div className={styles.inboxEmpty}>
        <CheckCircle2 size={40} strokeWidth={1.4} style={{ color: '#059669' }} />
        <p className={styles.inboxEmptyTitle}>Todo al día</p>
        <span className={styles.inboxEmptySub}>No hay acciones pendientes en tu clase. ¡Buen trabajo!</span>
      </div>
    )
  }

  return (
    <div className={styles.inboxList}>
      {acciones.map(item => {
        const meta = TIPO_META[item.tipo]
        const Icon = meta.icon
        return (
          <div key={item.id} className={styles.inboxItem} style={{ borderLeftColor: meta.color }}>
            <div className={styles.inboxItemIcon} style={{ background: meta.bg, color: meta.color }}>
              <Icon size={16} strokeWidth={2} />
            </div>
            <div className={styles.inboxItemBody}>
              <div className={styles.inboxItemTitulo}>{item.titulo}</div>
              <div className={styles.inboxItemSub}>{item.subtitulo}</div>
            </div>
            <div className={styles.inboxItemAcciones}>
              {item.acciones.map((a, i) => (
                <button
                  key={i}
                  className={a.variant === 'primary' ? styles.inboxBtnPrimary : styles.inboxBtnSecondary}
                  onClick={() => handleAccion(a, item)}
                >
                  {a.label}
                  {a.variant === 'primary' && <ArrowRight size={12} />}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}


// ── Panel principal ────────────────────────────────────────────────────────
export default function ProfesorPanel({ currentUser }) {
  const {
    alumnos, inviteCodes, statsClase, allSessions, loading, error,
    generarCodigo, renovarAcceso, revocarAcceso,
  } = useProfesor(currentUser)

  const { announcements, addAnnouncement, deleteAnnouncement } = useAnnouncements(
    currentUser?.academy_id, currentUser?.subject_id
  )

  const [tab,          setTab]          = useState('inbox')
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
  const nAcciones  = alumnos.filter(a => a.accesoExpirado || a.proximoAExpirar || a.enRiesgo).length
                   + inviteCodes.filter(c => !c.usedBy && new Date(c.expiresAt || c.expires_at) < new Date()).length

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
      currentUser={currentUser}
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
        <button className={[styles.tab, tab === 'inbox' ? styles.tabActive : ''].join(' ')} onClick={() => setTab('inbox')}>
          <Bell size={14} /> Acciones
          {nAcciones > 0 && <span className={styles.tabBadge}>{nAcciones}</span>}
        </button>
        <button className={[styles.tab, tab === 'clase' ? styles.tabActive : ''].join(' ')} onClick={() => setTab('clase')}>
          <Users size={14} /> Clase ({alumnos.length})
        </button>
        <button className={[styles.tab, tab === 'evolucion' ? styles.tabActive : ''].join(' ')} onClick={() => setTab('evolucion')}>
          <TrendingUp size={14} /> Evolución
        </button>
        <button className={[styles.tab, tab === 'fallos' ? styles.tabActive : ''].join(' ')} onClick={() => setTab('fallos')}>
          <TrendingDown size={14} /> Fallos clase
        </button>
        <button className={[styles.tab, tab === 'plan' ? styles.tabActive : ''].join(' ')} onClick={() => setTab('plan')}>
          <CalendarDays size={14} /> Plan semanal
        </button>
        <button className={[styles.tab, tab === 'tablon' ? styles.tabActive : ''].join(' ')} onClick={() => setTab('tablon')}>
          <Megaphone size={14} /> Tablón
          {announcements.length > 0 && <span className={styles.tabBadge} style={{ background: '#059669' }}>{announcements.length}</span>}
        </button>
        <button className={[styles.tab, tab === 'codigos' ? styles.tabActive : ''].join(' ')} onClick={() => setTab('codigos')}>
          <Key size={14} /> Códigos de invitación
        </button>
      </div>

      {/* Tab: Evolución */}
      {tab === 'evolucion' && (
        <ClaseEvolucionChart
          alumnos={alumnos}
          sessions={allSessions}
          academyId={currentUser?.academy_id}
          subjectId={currentUser?.subject_id}
        />
      )}

      {/* Tab: Inbox */}
      {tab === 'inbox' && (
        <InboxPanel
          alumnos={alumnos}
          inviteCodes={inviteCodes}
          onVerAlumno={setAlumnoDetalle}
          onRenovar={setModalRenovar}
        />
      )}

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
      {tab === 'tablon' && (
        <TablonPanel
          announcements={announcements}
          onAdd={addAnnouncement}
          onDelete={deleteAnnouncement}
          currentUser={currentUser}
        />
      )}

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
