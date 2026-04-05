import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Users, TrendingUp, AlertTriangle, BookOpen, Copy, Check, FileText,
  Plus, RefreshCw, ChevronDown, ChevronUp, Zap, Clock,
  UserX, BarChart2, Key, Calendar, Shield, ShieldOff, RotateCcw, XCircle,
  TrendingDown, CalendarDays, ExternalLink, Bell, CheckCircle2, ArrowRight,
  Megaphone, Trash2, AlertTriangle as AlertIcon, Info, BookOpen as BookIcon
} from 'lucide-react'
import { Ripple }             from '../../magicui/Ripple'
import { AnimatedGridPattern } from '../../magicui/AnimatedGridPattern'
import { useProfesor }        from '../../../hooks/useProfesor'
import { useAnnouncements }   from '../../../hooks/useAnnouncements'
import FallosClase   from '../FallosClase/FallosClase'
import PlanSemanal   from '../PlanSemanal/PlanSemanal'
import AlumnoDetalle from '../AlumnoDetalle/AlumnoDetalle'
import ClaseEvolucionChart from '../ClaseEvolucionChart/ClaseEvolucionChart'
import BancoPreguntas     from '../BancoPreguntas/BancoPreguntas'
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


// ── Exportar PDF Profesor ─────────────────────────────────────────────────────
function exportarInformeProfesor(alumnos, statsClase, academyName, subjectName) {
  const fecha = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })

  const enRiesgo   = alumnos.filter(a => a.enRiesgo)
  const porExpirar = alumnos.filter(a => a.proximoAExpirar)
  const sorted     = [...alumnos].sort((a, b) => (b.notaMedia ?? -1) - (a.notaMedia ?? -1))

  const css = `
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111;background:#fff;padding:2.5rem;max-width:860px;margin:0 auto;font-size:13px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2rem;padding-bottom:1.5rem;border-bottom:2px solid #111}
    .header-left h1{font-size:1.5rem;font-weight:800;margin-bottom:.2rem}
    .header-left p{color:#6B7280;font-size:.8rem}
    .header-right{text-align:right;color:#6B7280;font-size:.75rem;line-height:1.8}
    h2{font-size:.7rem;font-weight:800;color:#6B7280;text-transform:uppercase;letter-spacing:.08em;margin:1.75rem 0 .75rem}
    .kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:.6rem;margin-bottom:.5rem}
    .kpi{border:1px solid #E5E7EB;border-radius:10px;padding:.75rem .5rem;text-align:center}
    .kv{font-size:1.4rem;font-weight:800;line-height:1}
    .kl{font-size:.62rem;color:#6B7280;margin-top:.3rem;text-transform:uppercase;letter-spacing:.04em}
    table{width:100%;border-collapse:collapse;margin-bottom:1rem}
    th{background:#F9FAFB;font-size:.7rem;font-weight:700;text-align:left;padding:.5rem .75rem;border-bottom:2px solid #E5E7EB;text-transform:uppercase;letter-spacing:.04em;color:#374151}
    td{padding:.5rem .75rem;border-bottom:1px solid #F3F4F6;font-size:.78rem;vertical-align:middle}
    tr:last-child td{border-bottom:none}
    .tag{display:inline-block;border-radius:4px;padding:.15rem .45rem;font-size:.65rem;font-weight:700}
    .tag-red{background:#FEF2F2;color:#DC2626}
    .tag-green{background:#ECFDF5;color:#059669}
    .tag-amber{background:#FFFBEB;color:#B45309}
    .tag-blue{background:#EFF6FF;color:#2563EB}
    .alert-section{border:1px solid #FEE2E2;border-radius:10px;padding:1rem;background:#FFF5F5;margin-bottom:.75rem}
    .alert-title{font-size:.7rem;font-weight:800;color:#DC2626;text-transform:uppercase;margin-bottom:.5rem}
    .alert-row{display:flex;justify-content:space-between;align-items:center;padding:.3rem 0;border-bottom:1px solid #FEE2E2;font-size:.75rem}
    .alert-row:last-child{border:none}
    .nota-bar-wrap{display:flex;align-items:center;gap:.5rem}
    .nota-bar{height:6px;border-radius:3px;background:#E5E7EB;flex:1;overflow:hidden}
    .nota-bar-fill{height:100%;border-radius:3px}
    footer{margin-top:2.5rem;padding-top:1rem;border-top:1px solid #E5E7EB;display:flex;justify-content:space-between;color:#9CA3AF;font-size:.7rem}
    @media print{body{padding:1rem}@page{margin:1.5cm}}
  `

  const notaColor = n => n >= 70 ? '#059669' : n >= 50 ? '#B45309' : '#DC2626'

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
  <title>Informe de clase — ${subjectName || 'Clase'} — ${fecha}</title>
  <style>${css}</style></head><body>

  <div class="header">
    <div class="header-left">
      <h1>${academyName || 'Academia'}</h1>
      <p>Informe del profesor · ${subjectName || 'Clase'}</p>
    </div>
    <div class="header-right">
      <div><strong>Generado el</strong> ${fecha}</div>
      <div>FrostFox Academy</div>
    </div>
  </div>

  <h2>Resumen de la clase</h2>
  <div class="kpis">
    <div class="kpi"><div class="kv">${statsClase?.totalAlumnos ?? 0}</div><div class="kl">Alumnos</div></div>
    <div class="kpi"><div class="kv" style="color:#059669">${statsClase?.alumnosActivos ?? 0}</div><div class="kl">Activos 7d</div></div>
    <div class="kpi"><div class="kv" style="color:${notaColor(statsClase?.notaMediaClase ?? 0)}">${statsClase?.notaMediaClase !== null && statsClase?.notaMediaClase !== undefined ? statsClase.notaMediaClase + '%' : '—'}</div><div class="kl">Nota media</div></div>
    <div class="kpi"><div class="kv" style="color:#DC2626">${statsClase?.enRiesgo ?? 0}</div><div class="kl">En riesgo</div></div>
    <div class="kpi"><div class="kv" style="color:#B45309">${statsClase?.proximosAExpirar ?? 0}</div><div class="kl">Expiran pronto</div></div>
  </div>

  <h2>Ranking de alumnos</h2>
  <table>
    <tr><th>#</th><th>Alumno</th><th>Nota media</th><th>Sesiones</th><th>Temas leídos</th><th>Racha</th><th>Estado</th></tr>
    ${sorted.map((a, i) => `<tr>
      <td style="color:#9CA3AF;font-weight:700">${i + 1}</td>
      <td><strong>${a.username}</strong></td>
      <td>
        <div class="nota-bar-wrap">
          <span style="font-weight:700;color:${notaColor(a.notaMedia ?? 0)};min-width:36px">${a.notaMedia !== null ? a.notaMedia + '%' : '—'}</span>
          <div class="nota-bar"><div class="nota-bar-fill" style="width:${a.notaMedia ?? 0}%;background:${notaColor(a.notaMedia ?? 0)}"></div></div>
        </div>
      </td>
      <td>${a.sesiones}</td>
      <td>${a.temasLeidos}</td>
      <td>${a.racha > 0 ? `<span class="tag tag-blue">${a.racha}d 🔥</span>` : '—'}</td>
      <td>${a.accesoExpirado
        ? '<span class="tag tag-red">Expirado</span>'
        : a.enRiesgo
          ? `<span class="tag tag-amber">${a.diasInactivo ?? '?'}d inactivo</span>`
          : '<span class="tag tag-green">Activo</span>'
      }</td>
    </tr>`).join('')}
  </table>

  ${enRiesgo.length > 0 ? `
  <h2>Alumnos en riesgo</h2>
  <div class="alert-section">
    <div class="alert-title">⚠ ${enRiesgo.length} alumno${enRiesgo.length !== 1 ? 's' : ''} sin actividad reciente</div>
    ${enRiesgo.map(a => `<div class="alert-row">
      <span><strong>${a.username}</strong></span>
      <span style="color:#DC2626">${a.diasInactivo ?? '?'} días sin estudiar</span>
    </div>`).join('')}
  </div>` : ''}

  ${porExpirar.length > 0 ? `
  <div class="alert-section" style="border-color:#FDE68A;background:#FFFBEB">
    <div class="alert-title" style="color:#B45309">🔒 ${porExpirar.length} acceso${porExpirar.length !== 1 ? 's' : ''} próximos a expirar</div>
    ${porExpirar.map(a => `<div class="alert-row" style="border-color:#FDE68A">
      <span><strong>${a.username}</strong></span>
      <span style="color:#B45309">Expira en ${a.diasParaExpirar} días</span>
    </div>`).join('')}
  </div>` : ''}

  <footer>
    <span>FrostFox Academy · Informe del profesor · ${subjectName || ''}</span>
    <span>${fecha}</span>
  </footer>
  </body></html>`

  const w = window.open('', '_blank')
  w.document.write(html)
  w.document.close()
  setTimeout(() => w.print(), 500)
}

// ── Bento Nav ─────────────────────────────────────────────────────────────────
function ProximosExamenes({ alumnos }) {
  const hoy = new Date()

  const proximos = alumnos
    .filter(a => a.examDate)
    .map(a => ({
      nombre: a.fullName || a.username,
      fecha:  a.examDate,
      dias:   Math.ceil((new Date(a.examDate) - hoy) / 86400000),
    }))
    .sort((a, b) => a.dias - b.dias)

  if (proximos.length === 0) return (
    <div className={styles.examEmpty}>
      <CalendarDays size={22} strokeWidth={1.4} />
      <p>Sin fechas de examen registradas</p>
    </div>
  )

  return (
    <div className={styles.examList}>
      {proximos.map((ex, i) => (
        <div key={i} className={styles.examRow}>
          <div className={styles.examDias} style={{
            color:      ex.dias <= 14 ? '#DC2626' : ex.dias <= 30 ? '#D97706' : '#059669',
            background: ex.dias <= 14 ? '#FEF2F2' : ex.dias <= 30 ? '#FFFBEB' : '#ECFDF5',
          }}>
            {ex.dias}d
          </div>
          <div className={styles.examInfo}>
            <span className={styles.examNombre}>{ex.nombre}</span>
            <span className={styles.examFecha}>
              {new Date(ex.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function BentoNav({ tab, setTab, statsClase, nAcciones, announcements, preguntas, alumnos }) {
  const cards = [
    {
      id:       'clase',
      label:    'Mi clase',
      desc:     statsClase ? `${statsClase.totalAlumnos} alumnos · ${statsClase.alumnosActivos} activos` : 'Ver alumnos',
      icon:     Users,
      color:    '#2563EB',
      big:      true,
      badge:    null,
    },
    {
      id:       'inbox',
      label:    'Acciones',
      desc:     nAcciones > 0 ? `${nAcciones} pendiente${nAcciones !== 1 ? 's' : ''}` : 'Todo al día',
      icon:     Bell,
      color:    nAcciones > 0 ? '#DC2626' : '#059669',
      badge:    nAcciones > 0 ? nAcciones : null,
    },
    {
      id:       'evolucion',
      label:    'Evolución',
      desc:     statsClase ? `Nota media ${statsClase.notaMediaClase ?? 0}%` : 'Ver progreso',
      icon:     TrendingUp,
      color:    '#7C3AED',
    },
    {
      id:       'fallos',
      label:    'Fallos clase',
      desc:     'Preguntas con más errores',
      icon:     TrendingDown,
      color:    '#DC2626',
    },
    {
      id:       'plan',
      label:    'Plan semanal',
      desc:     'Organiza el temario',
      icon:     CalendarDays,
      color:    '#D97706',
    },
    {
      id:       'tablon',
      label:    'Tablón',
      desc:     announcements.length > 0 ? `${announcements.length} aviso${announcements.length !== 1 ? 's' : ''} activo${announcements.length !== 1 ? 's' : ''}` : 'Sin avisos activos',
      icon:     Megaphone,
      color:    '#059669',
      badge:    announcements.length > 0 ? announcements.length : null,
    },
    {
      id:       'codigos',
      label:    'Códigos',
      desc:     'Invitaciones de acceso',
      icon:     Key,
      color:    '#0891B2',
    },
    {
      id:       'banco',
      label:    'Banco de preguntas',
      desc:     preguntas > 0 ? `${preguntas} preguntas` : 'Ver temario completo',
      icon:     BookIcon,
      color:    '#6366F1',
      big:      true,
    },
    {
      id:       'examenes',
      label:    'Fecha de examen',
      desc:     'Por alumno',
      icon:     CalendarDays,
      color:    '#0891B2',
      big:      true,
    },
  ]

  return (
    <div className={styles.bentoGrid}>
      {cards.map(card => {
        const Icon    = card.icon
        const active  = tab === card.id
        const isExam  = card.id === 'examenes'
        return (
          <button
            key={card.id}
            className={[
              styles.bentoCard,
              card.big  ? styles.bentoBig  : '',
              active && !isExam ? styles.bentoActive : '',
              isExam ? styles.bentoExam : '',
            ].join(' ')}
            style={{ '--bento-color': card.color }}
            onClick={() => !isExam && setTab(card.id)}
          >
            {/* Fondo animado solo en la card grande no-exam */}
            {card.big && !isExam && (
              <AnimatedGridPattern
                numSquares={18}
                maxOpacity={active ? 0.12 : 0.06}
                duration={4}
                color={card.color}
                lineColor={card.color + '20'}
              />
            )}

            {/* Ripple solo en cards normales */}
            {!isExam && (
              <Ripple
                mainCircleSize={card.big ? 60 : 40}
                mainCircleOpacity={active ? 0.25 : 0.12}
                numCircles={card.big ? 5 : 3}
                color={card.color}
                duration={card.big ? 3 : 3.5}
              />
            )}

            {/* Contenido especial para examenes */}
            {isExam ? (
              <div className={styles.bentoContent}>
                <div className={styles.bentoExamHeader}>
                  <div className={styles.bentoIconWrap} style={{ background: card.color + '18', color: card.color }}>
                    <Icon size={16} strokeWidth={1.8} />
                  </div>
                  <span className={styles.bentoLabel}>{card.label}</span>
                </div>
                <ProximosExamenes alumnos={alumnos} />
              </div>
            ) : (
              <div className={styles.bentoContent}>
                <div className={styles.bentoIconWrap} style={{ background: card.color + '18', color: card.color }}>
                  <Icon size={card.big ? 20 : 16} strokeWidth={1.8} />
                </div>
                <div className={styles.bentoText}>
                  <span className={styles.bentoLabel}>{card.label}</span>
                  <span className={styles.bentoDesc}>{card.desc}</span>
                </div>
                {card.badge && (
                  <span className={styles.bentoBadge} style={{ background: card.color }}>
                    {card.badge}
                  </span>
                )}
              </div>
            )}
          </button>
        )
      })}
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

  const nExpirando   = alumnos.filter(a => a.proximoAExpirar || a.accesoExpirado).length
  const [nPreguntas, setNPreguntas] = useState(0)
  const nAcciones  = alumnos.filter(a => a.accesoExpirado || a.proximoAExpirar || a.enRiesgo).length
                   + inviteCodes.filter(c => !c.usedBy && new Date(c.expiresAt || c.expires_at) < new Date()).length

  // ── Scroll automático al contenido en mobile ─────────────────────────────
  const bentoRef   = useRef(null)
  const contentRef = useRef(null)

  useEffect(() => {
    if (!tab || !contentRef.current) return
    if (window.innerWidth > 900) return // solo mobile/tablet
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }, [tab])

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
        <div className={styles.headerActions}>
          <button className={styles.btnExport} onClick={() => exportarInformeProfesor(alumnos, statsClase, currentUser?.academyName, currentUser?.subjectName)}>
            <FileText size={14} /> Exportar PDF
          </button>
          <button className={styles.btnGenerar} onClick={() => setModalCodigo(true)}>
            <Plus size={15} /> Nuevo código
          </button>
        </div>
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

      {/* Bento Nav */}
      <div ref={bentoRef}>
        <BentoNav
          tab={tab}
          setTab={setTab}
          statsClase={statsClase}
          nAcciones={nAcciones}
          announcements={announcements}
          preguntas={nPreguntas}
          alumnos={alumnos}
        />
      </div>

      {/* Contenido de tabs — ref para scroll automático en mobile */}
      <div ref={contentRef} className={styles.contentArea}>

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

      {/* Tab: Banco de preguntas */}
      {tab === 'banco' && (
        <div className={styles.tabContent}>
          <BancoPreguntas currentUser={currentUser} onLoad={setNPreguntas} />
        </div>
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

      {/* Botón volver arriba — solo visible en mobile cuando hay tab activo */}
      {tab && (
        <button
          className={styles.scrollBackBtn}
          onClick={() => bentoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          aria-label="Volver arriba"
        >
          <ChevronUp size={18} strokeWidth={2.5} />
        </button>
      )}

      </div>{/* /contentArea */}
    </div>
  )
}
