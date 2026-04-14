import { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Users, TrendingUp, AlertTriangle, BookOpen, Copy, Check, FileText,
  Plus, RefreshCw, ChevronDown, ChevronUp, Zap, Clock,
  UserX, BarChart2, Key, Calendar, Shield, ShieldOff, RotateCcw, XCircle,
  TrendingDown, CalendarDays, ExternalLink, Bell, CheckCircle2, ArrowRight,
  Megaphone, Trash2, BookOpen as BookIcon, MessageSquare, Send, X, CornerDownLeft
} from 'lucide-react'
import { supabase }              from '../../../lib/supabase'
import { Ripple }              from '../../magicui/Ripple'
import { AnimatedGridPattern } from '../../magicui/AnimatedGridPattern'
import { useProfesor }         from '../../../hooks/useProfesor'
import { useProfesorMessages } from '../../../hooks/useDirectMessages'
import type { DirectMessage }  from '../../../hooks/useDirectMessages'
import { useAnnouncements }    from '../../../hooks/useAnnouncements'
import FallosClase             from '../FallosClase/FallosClase'
import PlanSemanal             from '../PlanSemanal/PlanSemanal'
import AlumnoDetalle           from '../AlumnoDetalle/AlumnoDetalle'
import ClaseEvolucionChart     from '../ClaseEvolucionChart/ClaseEvolucionChart'
import BancoPreguntas          from '../BancoPreguntas/BancoPreguntas'
import type { CurrentUser, AlumnoConStats, InviteCode, Announcement, StatsClase } from '../../../types'
import ErrorState     from '../../ui/ErrorState'
import styles from './ProfesorPanel.module.css'

function formatDias(n: number | null): string {
  if (n === null) return 'Nunca'
  if (n === 0)    return 'Hoy'
  if (n === 1)    return 'Ayer'
  return `Hace ${n} días`
}

function formatFecha(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function Stat({ icon: Icon, label, value, color, alert }: {
  icon: React.ElementType; label: string; value: string | number | null | undefined; color: string; alert?: boolean
}) {
  return (
    <div className={[styles.statCard, alert ? styles.statAlert : ''].join(' ')} style={{ ['--accent' as string]: color }}>
      <div className={styles.statIcon}><Icon size={18} strokeWidth={1.8} /></div>
      <div className={styles.statValue}>{value ?? '—'}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  )
}

function RenovarModal({ alumno, onRenovar, onClose }: {
  alumno:    AlumnoConStats
  onRenovar: (id: string, meses: number) => Promise<boolean | void>
  onClose:   () => void
}) {
  const [meses,   setMeses]   = useState(3)
  const [loading, setLoading] = useState(false)
  const handleRenovar = async () => { setLoading(true); await onRenovar(alumno.id, meses); setLoading(false); onClose() }
  const base  = alumno.accessUntil && !alumno.accesoExpirado ? new Date(alumno.accessUntil) : new Date()
  const nueva = new Date(base); nueva.setMonth(nueva.getMonth() + meses)
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>Renovar acceso — {alumno.username}</h3>
        <p className={styles.modalSub}>{alumno.accesoExpirado ? 'El acceso de este alumno ha expirado.' : `Acceso actual hasta: ${formatFecha(alumno.accessUntil ?? null)}`}</p>
        <div className={styles.modalField}>
          <label className={styles.modalLabel}>Meses a añadir</label>
          <div className={styles.pillarBtns}>
            {[1, 2, 3, 6, 12].map(m => (
              <button key={m} className={[styles.pillarBtn, meses === m ? styles.pillarBtnActive : ''].join(' ')} onClick={() => setMeses(m)}>
                {m === 12 ? '1 año' : `${m} mes${m > 1 ? 'es' : ''}`}
              </button>
            ))}
          </div>
        </div>
        <p className={styles.modalPreview}>Acceso hasta: <strong>{nueva.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></p>
        <div className={styles.modalActions}>
          <button className={styles.btnCancelar} onClick={onClose}>Cancelar</button>
          <button className={styles.btnRenovarModal} onClick={handleRenovar} disabled={loading}>
            {loading ? <RefreshCw size={14} className={styles.spinner} /> : <RotateCcw size={14} />} Renovar
          </button>
        </div>
      </div>
    </div>
  )
}

function GenerarCodigoModal({ onGenerar, onClose }: { onGenerar: (dias: number, meses: number) => Promise<string | null>; onClose: () => void }) {
  const [diasCodigo,   setDiasCodigo]   = useState(30)
  const [accessMonths, setAccessMonths] = useState(3)
  const [loading,      setLoading]      = useState(false)
  const [codigoCreado, setCodigoCreado] = useState<string | null>(null)
  const [copied,       setCopied]       = useState(false)
  const handleGenerar = async () => { setLoading(true); const code = await onGenerar(diasCodigo, accessMonths); if (code) setCodigoCreado(code); setLoading(false) }
  const handleCopy = () => { if (!codigoCreado) return; navigator.clipboard.writeText(codigoCreado); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  if (codigoCreado) return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>Código generado ✓</h3>
        <div className={styles.codigoGenerado}>
          <span className={styles.codigoTexto}>{codigoCreado}</span>
          <button className={styles.copyBtn} onClick={handleCopy}>{copied ? <Check size={16} /> : <Copy size={16} />}</button>
        </div>
        <p className={styles.modalPreview}>Registro: <strong>{diasCodigo} días</strong> · Acceso: <strong>{accessMonths === 12 ? '1 año' : `${accessMonths} meses`}</strong></p>
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
            {[7, 15, 30].map(d => <button key={d} className={[styles.pillarBtn, diasCodigo === d ? styles.pillarBtnActive : ''].join(' ')} onClick={() => setDiasCodigo(d)}>{d} días</button>)}
          </div>
        </div>
        <div className={styles.modalField}>
          <label className={styles.modalLabel}>Duración del acceso</label>
          <div className={styles.pillarBtns}>
            {[1, 2, 3, 6, 12].map(m => <button key={m} className={[styles.pillarBtn, accessMonths === m ? styles.pillarBtnActive : ''].join(' ')} onClick={() => setAccessMonths(m)}>{m === 12 ? '1 año' : `${m} mes${m > 1 ? 'es' : ''}`}</button>)}
          </div>
        </div>
        <div className={styles.modalActions}>
          <button className={styles.btnCancelar} onClick={onClose}>Cancelar</button>
          <button className={styles.btnRenovarModal} onClick={handleGenerar} disabled={loading}>
            {loading ? <RefreshCw size={14} className={styles.spinner} /> : <Key size={14} />} Generar código
          </button>
        </div>
      </div>
    </div>
  )
}

function AlumnoRow({ alumno, expanded, onToggle, onRenovar, onRevocar, onDetalle, onMensaje }: {
  alumno: AlumnoConStats; expanded: boolean; onToggle: () => void
  onRenovar: (a: AlumnoConStats) => void; onRevocar: (id: string) => Promise<boolean | void>
  onDetalle: (a: AlumnoConStats) => void; onMensaje: (a: AlumnoConStats) => void
}) {
  const [revocando, setRevocando] = useState(false)
  const handleRevocar = async () => {
    if (!window.confirm(`¿Revocar acceso de ${alumno.username}? Dejará de poder entrar inmediatamente.`)) return
    setRevocando(true); await onRevocar(alumno.id); setRevocando(false)
  }
  const getEstadoAcceso = () => {
    if (alumno.accesoExpirado)  return { text: 'Acceso expirado',                         cls: styles.badgeExpirado  }
    if (alumno.proximoAExpirar) return { text: `Expira en ${alumno.diasParaExpirar}d`,     cls: styles.badgeExpirando }
    if (alumno.accessUntil)     return { text: `Hasta ${formatFecha(alumno.accessUntil)}`, cls: styles.badgeAccesoOk  }
    return null
  }
  const estadoAcceso = getEstadoAcceso()

  return (
    <div className={[styles.alumnoCard, alumno.enRiesgo ? styles.enRiesgo : '', alumno.accesoExpirado ? styles.expirado : '', alumno.proximoAExpirar ? styles.expirando : ''].filter(Boolean).join(' ')}>
      <button className={styles.alumnoHeader} onClick={onToggle}>
        <div className={styles.alumnoLeft}>
          <div className={styles.alumnoAvatar}>{alumno.accesoExpirado ? <ShieldOff size={14} /> : alumno.username[0]!.toUpperCase()}</div>
          <div className={styles.alumnoInfo}>
            <span className={styles.alumnoName}>{alumno.username}</span>
            <div className={styles.alumnoBadges}>
              <span className={[styles.badge, alumno.accesoExpirado ? styles.badgeExpirado : alumno.enRiesgo ? styles.badgeRiesgo : alumno.diasInactivo === 0 ? styles.badgeActivo : styles.badgeNormal].join(' ')}>
                {alumno.accesoExpirado ? '✕ Expirado' : alumno.enRiesgo ? '⚠ En riesgo' : alumno.diasInactivo === 0 ? '● Activo hoy' : formatDias(alumno.diasInactivo)}
              </span>
              {estadoAcceso && !alumno.accesoExpirado && <span className={[styles.badge, estadoAcceso.cls].join(' ')}>{estadoAcceso.text}</span>}
            </div>
          </div>
        </div>
        <div className={styles.alumnoRight}>
          <span className={styles.alumnoNota}>{alumno.notaMedia !== null ? `${alumno.notaMedia}%` : '—'}</span>
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
            <div className={styles.detailItem}><Calendar size={13} /><span>Acceso hasta: {formatFecha(alumno.accessUntil ?? null)}</span></div>
          </div>
          <div className={styles.detailActions}>
            <button className={styles.btnRevocarSmall} onClick={handleRevocar} disabled={revocando}>
              {revocando ? <RefreshCw size={12} className={styles.spinner} /> : <XCircle size={12} />} Revocar acceso
            </button>
            <button className={styles.btnRenovarSmall2} onClick={() => onRenovar(alumno)}><RotateCcw size={12} /> Renovar acceso</button>
            <button className={styles.btnDetalleSmall} onClick={() => onDetalle(alumno)}><ExternalLink size={12} /> Ver detalle</button>
            <button className={styles.btnMensajeSmall} onClick={() => onMensaje(alumno)}><MessageSquare size={12} /> Mensaje</button>
          </div>
        </div>
      )}
    </div>
  )
}

function CodigoCard({ code, onCopy, copied }: { code: InviteCode; onCopy: (c: string) => void; copied: string | null }) {
  const isUsado   = !!code.used_by
  const isExpired = new Date(code.expires_at) < new Date()
  const estado    = isUsado ? 'usado' : isExpired ? 'expirado' : 'activo'
  const expDate   = new Date(code.expires_at).toLocaleDateString('es-ES')
  return (
    <div className={[styles.codeCard, styles[`code_${estado}`]].join(' ')}>
      <div className={styles.codeLeft}>
        <span className={styles.codeText}>{code.code}</span>
        <span className={styles.codeExpiry}>
          {estado === 'activo' ? `Registro hasta ${expDate} · Acceso ${code.access_months === 12 ? '1 año' : `${code.access_months} meses`}` : estado === 'usado' ? 'Utilizado' : 'Expirado'}
        </span>
      </div>
      {estado === 'activo' && <button className={styles.copyBtn} onClick={() => onCopy(code.code)}>{copied === code.code ? <Check size={14} /> : <Copy size={14} />}</button>}
    </div>
  )
}

function exportarInformeProfesor(alumnos: AlumnoConStats[], statsClase: StatsClase | null, academyName: string | null | undefined, subjectName: string | null | undefined) {
  const fecha = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
  const enRiesgo = alumnos.filter(a => a.enRiesgo), porExpirar = alumnos.filter(a => a.proximoAExpirar)
  const sorted = [...alumnos].sort((a, b) => (b.notaMedia ?? -1) - (a.notaMedia ?? -1))
  const nc = (n: number) => n >= 70 ? '#059669' : n >= 50 ? '#B45309' : '#DC2626'
  const css = `*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,'Segoe UI',sans-serif;color:#111;padding:2.5rem;max-width:860px;margin:0 auto;font-size:13px}.header{display:flex;justify-content:space-between;margin-bottom:2rem;padding-bottom:1.5rem;border-bottom:2px solid #111}.header-left h1{font-size:1.5rem;font-weight:800}.kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:.6rem;margin-bottom:.5rem}.kpi{border:1px solid #E5E7EB;border-radius:10px;padding:.75rem .5rem;text-align:center}.kv{font-size:1.4rem;font-weight:800}.kl{font-size:.62rem;color:#6B7280;margin-top:.3rem;text-transform:uppercase}h2{font-size:.7rem;font-weight:800;color:#6B7280;text-transform:uppercase;letter-spacing:.08em;margin:1.75rem 0 .75rem}table{width:100%;border-collapse:collapse;margin-bottom:1rem}th{background:#F9FAFB;font-size:.7rem;font-weight:700;text-align:left;padding:.5rem .75rem;border-bottom:2px solid #E5E7EB;text-transform:uppercase;color:#374151}td{padding:.5rem .75rem;border-bottom:1px solid #F3F4F6;font-size:.78rem}.tag{display:inline-block;border-radius:4px;padding:.15rem .45rem;font-size:.65rem;font-weight:700}.tag-red{background:#FEF2F2;color:#DC2626}.tag-green{background:#ECFDF5;color:#059669}.tag-amber{background:#FFFBEB;color:#B45309}.alert-section{border:1px solid #FEE2E2;border-radius:10px;padding:1rem;background:#FFF5F5;margin-bottom:.75rem}.alert-title{font-size:.7rem;font-weight:800;color:#DC2626;text-transform:uppercase;margin-bottom:.5rem}.alert-row{display:flex;justify-content:space-between;padding:.3rem 0;border-bottom:1px solid #FEE2E2;font-size:.75rem}.alert-row:last-child{border:none}.nota-bar-wrap{display:flex;align-items:center;gap:.5rem}.nota-bar{height:6px;border-radius:3px;background:#E5E7EB;flex:1;overflow:hidden}.nota-bar-fill{height:100%;border-radius:3px}footer{margin-top:2.5rem;padding-top:1rem;border-top:1px solid #E5E7EB;display:flex;justify-content:space-between;color:#9CA3AF;font-size:.7rem}@media print{body{padding:1rem}@page{margin:1.5cm}}`
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Informe — ${fecha}</title><style>${css}</style></head><body>
  <div class="header"><div class="header-left"><h1>${academyName ?? 'Academia'}</h1><p style="color:#6B7280;font-size:.8rem">Informe del profesor · ${subjectName ?? 'Clase'}</p></div><div style="text-align:right;color:#6B7280;font-size:.75rem"><div><strong>Generado el</strong> ${fecha}</div></div></div>
  <h2>Resumen</h2><div class="kpis"><div class="kpi"><div class="kv">${statsClase?.totalAlumnos ?? 0}</div><div class="kl">Alumnos</div></div><div class="kpi"><div class="kv" style="color:#059669">${statsClase?.alumnosActivos ?? 0}</div><div class="kl">Activos 7d</div></div><div class="kpi"><div class="kv" style="color:${nc(statsClase?.notaMediaClase ?? 0)}">${statsClase?.notaMediaClase != null ? statsClase.notaMediaClase + '%' : '—'}</div><div class="kl">Nota media</div></div><div class="kpi"><div class="kv" style="color:#DC2626">${statsClase?.enRiesgo ?? 0}</div><div class="kl">En riesgo</div></div><div class="kpi"><div class="kv" style="color:#B45309">${statsClase?.proximosAExpirar ?? 0}</div><div class="kl">Expiran pronto</div></div></div>
  <h2>Ranking</h2><table><tr><th>#</th><th>Alumno</th><th>Nota media</th><th>Sesiones</th><th>Temas</th><th>Racha</th><th>Estado</th></tr>${sorted.map((a, i) => `<tr><td style="color:#9CA3AF;font-weight:700">${i+1}</td><td><strong>${a.username}</strong></td><td><div class="nota-bar-wrap"><span style="font-weight:700;color:${nc(a.notaMedia??0)};min-width:36px">${a.notaMedia!==null?a.notaMedia+'%':'—'}</span><div class="nota-bar"><div class="nota-bar-fill" style="width:${a.notaMedia??0}%;background:${nc(a.notaMedia??0)}"></div></div></div></td><td>${a.sesiones}</td><td>${a.temasLeidos}</td><td>${a.racha>0?`<span class="tag" style="background:#EFF6FF;color:#2563EB">${a.racha}d 🔥</span>`:'—'}</td><td>${a.accesoExpirado?'<span class="tag tag-red">Expirado</span>':a.enRiesgo?`<span class="tag tag-amber">${a.diasInactivo??'?'}d inactivo</span>`:'<span class="tag tag-green">Activo</span>'}</td></tr>`).join('')}</table>
  ${enRiesgo.length>0?`<h2>En riesgo</h2><div class="alert-section"><div class="alert-title">⚠ ${enRiesgo.length} alumnos sin actividad reciente</div>${enRiesgo.map(a=>`<div class="alert-row"><span><strong>${a.username}</strong></span><span style="color:#DC2626">${a.diasInactivo??'?'} días sin estudiar</span></div>`).join('')}</div>`:''}
  ${porExpirar.length>0?`<div class="alert-section" style="border-color:#FDE68A;background:#FFFBEB"><div class="alert-title" style="color:#B45309">🔒 Accesos próximos a expirar</div>${porExpirar.map(a=>`<div class="alert-row" style="border-color:#FDE68A"><span><strong>${a.username}</strong></span><span style="color:#B45309">Expira en ${a.diasParaExpirar} días</span></div>`).join('')}</div>`:''}
  <footer><span>FrostFox Academy · ${subjectName??''}</span><span>${fecha}</span></footer></body></html>`
  const w = window.open('', '_blank'); if (!w) return
  w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500)
}

function ProximosExamenes({ alumnos }: { alumnos: AlumnoConStats[] }) {
  const hoy = new Date()
  const proximos = alumnos.filter(a => a.examDate).map(a => ({ nombre: a.fullName ?? a.username, fecha: a.examDate!, dias: Math.ceil((new Date(a.examDate!).getTime() - hoy.getTime()) / 86400000) })).sort((a, b) => a.dias - b.dias)
  if (proximos.length === 0) return <div className={styles.examEmpty}><CalendarDays size={22} strokeWidth={1.4} /><p>Sin fechas de examen registradas</p></div>
  return (
    <div className={styles.examList}>
      {proximos.map((ex, i) => (
        <div key={i} className={styles.examRow}>
          <div className={styles.examDias} style={{ color: ex.dias<=14?'#DC2626':ex.dias<=30?'#D97706':'#059669', background: ex.dias<=14?'#FEF2F2':ex.dias<=30?'#FFFBEB':'#ECFDF5' }}>{ex.dias}d</div>
          <div className={styles.examInfo}>
            <span className={styles.examNombre}>{ex.nombre}</span>
            <span className={styles.examFecha}>{new Date(ex.fecha).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' })}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── BancoSupuestos ────────────────────────────────────────────────────────────
const LETRAS_SUP = ['A', 'B', 'C', 'D']

function SupuestoCard({ supuesto }: { supuesto: { id: string; title: string; subtitle: string | null; scenario: string | null; questions: { id: string; question: string; options: string[]; answer: number; explanation: string | null; position: number }[] } }) {
  const [abierto, setAbierto] = useState(false)
  const [pregAbierta, setPregAbierta] = useState<string | null>(null)

  return (
    <div className={styles.supCard}>
      <button className={styles.supHeader} onClick={() => setAbierto(v => !v)}>
        <div className={styles.supHeaderLeft}>
          <span className={styles.supTitle}>{supuesto.title}</span>
          {supuesto.subtitle && <span className={styles.supSubtitle}>{supuesto.subtitle}</span>}
        </div>
        <div className={styles.supHeaderRight}>
          <span className={styles.supCount}>{supuesto.questions.length} preguntas</span>
          {abierto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {abierto && (
        <div className={styles.supBody}>
          {supuesto.scenario && (
            <div className={styles.supScenario}>
              <span className={styles.supScenarioLabel}>Caso práctico</span>
              <p className={styles.supScenarioText}>{supuesto.scenario}</p>
            </div>
          )}
          <div className={styles.supPreguntas}>
            {supuesto.questions.map((q, idx) => (
              <div key={q.id} className={styles.supPregunta}>
                <button className={styles.supPreguntaHeader} onClick={() => setPregAbierta(pregAbierta === q.id ? null : q.id)}>
                  <span className={styles.supPreguntaNum}>{idx + 1}</span>
                  <span className={styles.supPreguntaTexto}>{q.question}</span>
                  {pregAbierta === q.id ? <ChevronUp size={13} className={styles.chevron} /> : <ChevronDown size={13} className={styles.chevron} />}
                </button>
                {pregAbierta === q.id && (
                  <div className={styles.supPreguntaBody}>
                    {q.options.map((op, i) => (
                      <div key={i} className={[styles.supOpcion, i === q.answer ? styles.supOpcionCorrecta : ''].join(' ')}>
                        <span className={styles.supOpcionLetra}>{LETRAS_SUP[i]}</span>
                        <span>{op}</span>
                        {i === q.answer && <span className={styles.supOpcionBadge}>✓</span>}
                      </div>
                    ))}
                    {q.explanation && <p className={styles.supExplicacion}>{q.explanation}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function BancoSupuestos({ currentUser }: { currentUser: CurrentUser | null }) {
  const [supuestos, setSupuestos] = useState<{ id: string; title: string; subtitle: string | null; scenario: string | null; position: number; questions: { id: string; question: string; options: string[]; answer: number; explanation: string | null; position: number }[] }[]>([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    const aid = currentUser?.academy_id
    const sid = currentUser?.subject_id
    if (!aid) return
    const load = async () => {
      setLoading(true)
      let q = supabase
        .from('supuestos')
        .select('id, title, subtitle, scenario, position, supuesto_questions(id, question, options, answer, explanation, position)')
        .eq('academy_id', aid)
        .order('position')
      if (sid) q = q.eq('subject_id', sid)
      const { data } = await q

      type RawSupQ = { id: string; question: string; options: string[]; answer: number; explanation: string | null; position: number }
      type RawSup  = { id: string; title: string; subtitle: string | null; scenario: string | null; position: number; supuesto_questions: RawSupQ[] }

      const mapped = ((data ?? []) as RawSup[]).map(s => ({
        id:        s.id,
        title:     s.title,
        subtitle:  s.subtitle ?? null,
        scenario:  s.scenario ?? null,
        position:  s.position,
        questions: (s.supuesto_questions ?? [])
          .sort((a, b) => a.position - b.position)
          .map(q => ({
            id:          q.id,
            question:    q.question,
            options:     Array.isArray(q.options) ? q.options : [],
            answer:      q.answer,
            explanation: q.explanation ?? null,
            position:    q.position,
          }))
      }))
      setSupuestos(mapped)
      setLoading(false)
    }
    load()
  }, [currentUser?.academy_id, currentUser?.subject_id])

  if (loading) return (
    <div className={styles.loading}>
      <div className={styles.loadingSpinner} />
      <p>Cargando supuestos…</p>
    </div>
  )

  if (!supuestos.length) return (
    <div className={styles.empty}>
      <FileText size={32} strokeWidth={1.2} />
      <p>No hay supuestos prácticos para esta asignatura.</p>
    </div>
  )

  return (
    <div className={styles.supLista}>
      {supuestos.map(s => <SupuestoCard key={s.id} supuesto={s} />)}
    </div>
  )
}

// ── BentoNav ──────────────────────────────────────────────────────────────────
function BentoNav({ tab, setTab, statsClase, nAcciones, announcements, preguntas, supuestos, alumnos }: {
  tab: string; setTab: (t: string) => void; statsClase: StatsClase | null; nAcciones: number; announcements: Announcement[]; preguntas: number; supuestos: number; alumnos: AlumnoConStats[]
}) {
  const bancoDesc      = preguntas > 0 ? `${preguntas} preguntas` : 'Ver temario completo'
  const bancoDescExtra = supuestos > 0 ? `${supuestos} supuesto${supuestos !== 1 ? 's' : ''} práctico${supuestos !== 1 ? 's' : ''}` : null

  const cards = [
    { id:'clase',    label:'Mi clase',          desc: statsClase?`${statsClase.totalAlumnos} alumnos · ${statsClase.alumnosActivos} activos`:'Ver alumnos', descExtra: null as string|null, icon:Users,        color:'#2563EB', big:true,  badge:null as number|null },
    { id:'inbox',    label:'Acciones',           desc: nAcciones>0?`${nAcciones} pendiente${nAcciones!==1?'s':''}`:'Todo al día', descExtra: null, icon:Bell, color:nAcciones>0?'#DC2626':'#059669', badge:nAcciones>0?nAcciones:null },
    { id:'evolucion',label:'Evolución',          desc: statsClase?`Nota media ${statsClase.notaMediaClase??0}%`:'Ver progreso', descExtra: null, icon:TrendingUp,  color:'#7C3AED' },
    { id:'fallos',   label:'Fallos clase',       desc:'Preguntas con más errores', descExtra: null, icon:TrendingDown, color:'#DC2626' },
    { id:'plan',     label:'Plan semanal',       desc:'Organiza el temario', descExtra: null, icon:CalendarDays, color:'#D97706' },
    { id:'tablon',   label:'Tablón',             desc: announcements.length>0?`${announcements.length} aviso${announcements.length!==1?'s':''} activo${announcements.length!==1?'s':''}`:'Sin avisos activos', descExtra: null, icon:Megaphone, color:'#059669', badge:announcements.length>0?announcements.length:null },
    { id:'codigos',  label:'Códigos',            desc:'Invitaciones de acceso', descExtra: null, icon:Key, color:'#0891B2' },
    { id:'banco',    label:'Banco de preguntas', desc: bancoDesc, descExtra: bancoDescExtra, icon:BookIcon, color:'#6366F1', big:true },
    { id:'examenes', label:'Fecha de examen',    desc:'Ver fechas por alumno', descExtra: null, icon:CalendarDays, color:'#0891B2', big:true,  badge:null as number|null },
  ]
  return (
    <div className={styles.bentoGrid}>
      {cards.map(card => {
        const Icon = card.icon, active = tab===card.id
        return (
          <button key={card.id} className={[styles.bentoCard, card.big?styles.bentoBig:'', active?styles.bentoActive:''].join(' ')} style={{ ['--bento-color' as string]: card.color }} onClick={() => setTab(card.id)}>
            {card.big && <AnimatedGridPattern numSquares={18} maxOpacity={active?0.12:0.06} duration={4} color={card.color} lineColor={card.color+'20'} />}
            <Ripple mainCircleSize={card.big?60:40} mainCircleOpacity={active?0.25:0.12} numCircles={card.big?5:3} color={card.color} duration={card.big?3:3.5} />
            <div className={styles.bentoContent}>
              <div className={styles.bentoIconWrap} style={{ background:card.color+'18', color:card.color }}><Icon size={card.big?20:16} strokeWidth={1.8} /></div>
              <div className={styles.bentoText}>
                <span className={styles.bentoLabel}>{card.label}</span>
                <span className={styles.bentoDesc}>{card.desc}</span>
                {card.descExtra && <span className={styles.bentoDescExtra}>{card.descExtra}</span>}
              </div>
              {card.badge!=null && card.badge>0 && <span className={styles.bentoBadge} style={{ background:card.color }}>{card.badge}</span>}
            </div>
          </button>
        )
      })}
    </div>
  )
}

const TIPOS_AVISO = [
  { id:'info',         label:'Info',         color:'#0891B2', bg:'#EFF6FF' },
  { id:'importante',   label:'Importante',   color:'#DC2626', bg:'#FEF2F2' },
  { id:'examen',       label:'Examen',       color:'#7C3AED', bg:'#F5F3FF' },
  { id:'recordatorio', label:'Recordatorio', color:'#D97706', bg:'#FFFBEB' },
]

function TablonPanel({ announcements, onAdd, onDelete, currentUser }: {
  announcements: Announcement[]; onAdd: (a: { authorId: string | undefined; tipo: string; title: string; body: string | null; expiresAt: string | null }) => Promise<Announcement | null | void>; onDelete: (id: string) => Promise<void>; currentUser: CurrentUser|null
}) {
  const [titulo,setTitulo]=useState(''), [cuerpo,setCuerpo]=useState(''), [tipo,setTipo]=useState('info'), [expira,setExpira]=useState(''), [enviando,setEnviando]=useState(false), [enviado,setEnviado]=useState(false)
  const handlePublicar = async () => {
    if (!titulo.trim()) return; setEnviando(true)
    await onAdd({ authorId:currentUser?.id, tipo, title:titulo.trim(), body:cuerpo.trim()||null, expiresAt:expira?new Date(expira+'T23:59:59').toISOString():null })
    setTitulo(''); setCuerpo(''); setTipo('info'); setExpira(''); setEnviando(false); setEnviado(true); setTimeout(()=>setEnviado(false),2000)
  }
  const tipoMeta = TIPOS_AVISO.find(t=>t.id===tipo)??TIPOS_AVISO[0]!
  return (
    <div className={styles.tablonPage}>
      <div className={styles.tablonForm}>
        <h3 className={styles.tablonFormTitle}><Megaphone size={15}/> Publicar nuevo aviso</h3>
        <div className={styles.tipoRow}>{TIPOS_AVISO.map(t=><button key={t.id} className={[styles.tipoBtn,tipo===t.id?styles.tipoBtnActive:''].join(' ')} style={tipo===t.id?{background:t.bg,color:t.color,borderColor:t.color+'40'}:{}} onClick={()=>setTipo(t.id)}>{t.label}</button>)}</div>
        <input className={styles.tablonInput} placeholder="Título del aviso *" value={titulo} onChange={e=>setTitulo(e.target.value)} maxLength={120}/>
        <textarea className={styles.tablonTextarea} placeholder="Descripción (opcional)" value={cuerpo} onChange={e=>setCuerpo(e.target.value)} rows={3}/>
        <div className={styles.tablonFooter}>
          <div className={styles.expiraWrap}>
            <label className={styles.expiraLabel}>Expira el</label>
            <input type="date" className={styles.expiraInput} value={expira} onChange={e=>setExpira(e.target.value)} min={new Date().toISOString().slice(0,10)}/>
            {expira&&<button className={styles.expiraClear} onClick={()=>setExpira('')}>×</button>}
          </div>
          <button className={styles.tablonPublicar} onClick={handlePublicar} disabled={!titulo.trim()||enviando}>
            {enviado?<><Check size={14}/> Publicado</>:enviando?<RefreshCw size={14} className={styles.spinner}/>:<><Megaphone size={14}/> Publicar</>}
          </button>
        </div>
      </div>
      <div className={styles.tablonLista}>
        <h3 className={styles.tablonListaTitle}>Avisos activos <span className={styles.tablonCount}>{announcements.length}</span></h3>
        {announcements.length===0?(
          <div className={styles.tablonVacio}><Megaphone size={28} strokeWidth={1.4}/><p>No hay avisos publicados</p><span>Los avisos aparecerán en el Home de tus alumnos</span></div>
        ):(
          <div className={styles.tablonItems}>{announcements.map(a=>{const meta=TIPOS_AVISO.find(t=>t.id===a.tipo)??TIPOS_AVISO[0]!;return(
            <div key={a.id} className={styles.tablonItem}>
              <div className={styles.tablonItemLeft}>
                <span className={styles.tablonItemTipo} style={{color:meta.color,background:meta.bg}}>{meta.label}</span>
                <p className={styles.tablonItemTitle}>{a.title}</p>
                {a.body&&<p className={styles.tablonItemBody}>{a.body}</p>}
                <div className={styles.tablonItemMeta}><span>Publicado {a.created_at?new Date(a.created_at).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'}):''}</span>{a.expires_at&&<span>· Expira {new Date(a.expires_at).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'})}</span>}</div>
              </div>
              <button className={styles.tablonItemDelete} onClick={()=>onDelete(a.id)} title="Eliminar aviso"><Trash2 size={14}/></button>
            </div>
          )})}</div>
        )}
      </div>
    </div>
  )
}

// ── InboxPanel — Grid de alumnos con acciones y mensajes ─────────────────────
// Colores por posición para los bocadillos
const ALUMNO_COLORS = [
  '#2563EB','#7C3AED','#059669','#DC2626','#D97706',
  '#0891B2','#BE185D','#065F46','#92400E','#1D4ED8',
]

function AlumnoBocadillo({ alumno, colorIdx, mensajes, onRenovar, onVerAlumno, onEnviarMensaje, onLeidoMsg, onDeleteMsg }: {
  alumno:          AlumnoConStats
  colorIdx:        number
  mensajes:        DirectMessage[]
  onRenovar:       (a: AlumnoConStats) => void
  onVerAlumno:     (a: AlumnoConStats) => void
  onEnviarMensaje: (a: AlumnoConStats) => void
  onLeidoMsg:      (id: string) => void
  onDeleteMsg:     (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const color = ALUMNO_COLORS[colorIdx % ALUMNO_COLORS.length]!

  // Alertas del alumno
  const tieneAccesoExpirado  = alumno.accesoExpirado
  const proximoAExpirar      = alumno.proximoAExpirar && !alumno.accesoExpirado
  const inactivo             = alumno.enRiesgo && !alumno.accesoExpirado
  const tieneAlerta          = tieneAccesoExpirado || proximoAExpirar || inactivo

  // Mensajes con respuesta no leída
  const msgsPendientes = mensajes.filter(m => m.to_id === alumno.id && m.reply_body)
  const msgsEnviados   = mensajes.filter(m => m.to_id === alumno.id)
  const nBadge         = msgsPendientes.length + (tieneAlerta ? 1 : 0)

  return (
    <div className={[styles.bocadillo, expanded ? styles.bocadilloExpanded : ''].join(' ')}
      style={{ ['--bc' as string]: color }}>

      {/* Cabecera siempre visible */}
      <button className={styles.bocadilloHeader} onClick={() => setExpanded(v => !v)}>
        <div className={styles.bocadilloAvatar} style={{ background: color + '18', border: `2px solid ${color}`, color }}>
          {alumno.username[0]!.toUpperCase()}
        </div>
        <span className={styles.bocadilloNombre}>{alumno.username}</span>
        {nBadge > 0 && (
          <span className={styles.bocadilloBadge} style={{ background: msgsPendientes.length > 0 ? '#059669' : '#DC2626' }}>
            {nBadge}
          </span>
        )}
      </button>

      {/* Panel expandido */}
      {expanded && (
        <div className={styles.bocadilloBody}>

          {/* Alertas */}
          {tieneAccesoExpirado && (
            <div className={styles.bocadilloAlerta} style={{ borderColor:'#DC2626', background:'#FEF2F2' }}>
              <ShieldOff size={13} style={{color:'#DC2626',flexShrink:0}}/>
              <span style={{color:'#DC2626',flex:1}}>Acceso expirado hace {alumno.diasParaExpirar!==null?Math.abs(alumno.diasParaExpirar):'?'}d</span>
              <button className={styles.bocadilloAlertaBtn} onClick={() => onRenovar(alumno)}>Renovar</button>
            </div>
          )}
          {proximoAExpirar && (
            <div className={styles.bocadilloAlerta} style={{ borderColor:'#D97706', background:'#FFFBEB' }}>
              <Clock size={13} style={{color:'#D97706',flexShrink:0}}/>
              <span style={{color:'#D97706',flex:1}}>Expira en {alumno.diasParaExpirar}d</span>
              <button className={styles.bocadilloAlertaBtn} onClick={() => onRenovar(alumno)}>Renovar</button>
            </div>
          )}
          {inactivo && (
            <div className={styles.bocadilloAlerta} style={{ borderColor:'#7C3AED', background:'#F5F3FF' }}>
              <UserX size={13} style={{color:'#7C3AED',flexShrink:0}}/>
              <span style={{color:'#7C3AED',flex:1}}>Inactivo {alumno.diasInactivo}d</span>
            </div>
          )}

          {/* Historial de mensajes */}
          {msgsEnviados.length > 0 && (
            <div className={styles.bocadilloMsgs}>
              {msgsEnviados.map(m => (
                <div key={m.id} className={styles.bocadilloMsg}>
                  <div className={styles.inboxMsgBubbleProfe}>
                    <span className={styles.inboxMsgLabel}>Tú enviaste</span>
                    <p className={styles.inboxMsgText}>{m.body}</p>
                  </div>
                  {m.reply_body && (
                    <div className={styles.inboxMsgBubbleAlumno}>
                      <div className={styles.inboxMsgAlumnoHead}>
                        <span className={styles.inboxMsgLabel} style={{color:'#059669'}}>{alumno.username} respondió</span>
                        <span className={styles.inboxMsgFecha}>{m.reply_at ? new Date(m.reply_at).toLocaleDateString('es-ES',{day:'2-digit',month:'short'}) : ''}</span>
                      </div>
                      <p className={styles.inboxMsgText}>{m.reply_body}</p>
                    </div>
                  )}
                  <div className={styles.bocadilloMsgActions}>
                    {m.reply_body && (
                      <button className={styles.inboxMsgBtnLeido} onClick={() => onLeidoMsg(m.id)}>
                        <Check size={11}/> Leído
                      </button>
                    )}
                    <button className={styles.inboxMsgBtnEliminar} onClick={() => onDeleteMsg(m.id)}>
                      <Trash2 size={11}/> Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Acciones */}
          <div className={styles.bocadilloAcciones}>
            <button className={styles.bocadilloActBtn} onClick={() => onEnviarMensaje(alumno)}>
              <MessageSquare size={12}/> Mensaje
            </button>
            <button className={styles.bocadilloActBtn} onClick={() => onVerAlumno(alumno)}>
              <ExternalLink size={12}/> Ver detalle
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function InboxPanel({ alumnos, inviteCodes, onVerAlumno, onRenovar, onEnviarMensaje, mensajes, onMensajeLeido, onDeleteMensaje }: {
  alumnos:AlumnoConStats[]; inviteCodes:InviteCode[]; onVerAlumno:(a:AlumnoConStats)=>void; onRenovar:(a:AlumnoConStats)=>void
  onEnviarMensaje:(a:AlumnoConStats)=>void
  mensajes: DirectMessage[]; onMensajeLeido: (id: string) => void; onDeleteMensaje: (id: string) => void
}) {
  // Códigos caducados — se muestran separados
  const codigosCaducados = inviteCodes.filter(c => !c.used_by && new Date(c.expires_at) < new Date())

  return (
    <div className={styles.inboxNuevo}>
      {/* Grid de bocadillos */}
      <div className={styles.bocadillosGrid}>
        {alumnos.map((alumno, i) => (
          <AlumnoBocadillo
            key={alumno.id}
            alumno={alumno}
            colorIdx={i}
            mensajes={mensajes.filter(m => m.to_id === alumno.id)}
            onRenovar={onRenovar}
            onVerAlumno={onVerAlumno}
            onEnviarMensaje={onEnviarMensaje}
            onLeidoMsg={onMensajeLeido}
            onDeleteMsg={onDeleteMensaje}
          />
        ))}
      </div>

      {/* Códigos caducados */}
      {codigosCaducados.length > 0 && (
        <div className={styles.inboxCodigosCaducados}>
          <div className={styles.inboxMensajesSectionTitle}><Key size={13}/> Códigos caducados sin usar ({codigosCaducados.length})</div>
          {codigosCaducados.map(c => (
            <div key={c.id} className={styles.inboxItem} style={{borderLeftColor:'#6B7280'}}>
              <div className={styles.inboxItemIcon} style={{background:'#F3F4F6',color:'#6B7280'}}><Key size={16} strokeWidth={2}/></div>
              <div className={styles.inboxItemBody}><div className={styles.inboxItemTitulo}>Código caducado — {c.code}</div><div className={styles.inboxItemSub}>Expiró sin que nadie lo usara</div></div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProfesorPanel({ currentUser }: { currentUser: CurrentUser | null }) {
  const { alumnos, inviteCodes, statsClase, allSessions, loading, error, generarCodigo, renovarAcceso, revocarAcceso } = useProfesor(currentUser)
  const { announcements, addAnnouncement, deleteAnnouncement } = useAnnouncements(currentUser?.academy_id, currentUser?.subject_id)

  const { sent: dmSent, sendMessage: dmSend, deleteSentMessage: dmDeleteSent } = useProfesorMessages(
    currentUser?.id, currentUser?.academy_id, currentUser?.subject_id
  )
  const [modalMensaje,  setModalMensaje]  = useState<AlumnoConStats | null>(null)
  const [msgTexto,      setMsgTexto]      = useState('')
  const [msgSending,    setMsgSending]    = useState(false)
  const [msgSent,       setMsgSent]       = useState(false)
  const [dmLeidos,      setDmLeidos]      = useState<Set<string>>(new Set())

  const handleEnviarMensaje = async () => {
    if (!modalMensaje || !msgTexto.trim()) return
    setMsgSending(true)
    const ok = await dmSend(modalMensaje.id, msgTexto)
    setMsgSending(false)
    if (ok) {
      setMsgSent(true)
      setTimeout(() => { setModalMensaje(null); setMsgTexto(''); setMsgSent(false) }, 1500)
    }
  }

  const handleMensajeLeido = (id: string) => {
    setDmLeidos(prev => new Set([...prev, id]))
  }

  const handleDeleteMensaje = useCallback(async (id: string) => {
    await dmDeleteSent(id)
  }, [dmDeleteSent])

  const [tab,           setTab]           = useState('')
  const [alumnoDetalle, setAlumnoDetalle] = useState<AlumnoConStats | null>(null)
  const [expandedId,    setExpandedId]    = useState<string | null>(null)
  const [filtro,        setFiltro]        = useState('todos')
  const [modalCodigo,   setModalCodigo]   = useState(false)
  const [modalRenovar,  setModalRenovar]  = useState<AlumnoConStats | null>(null)
  const [copied,        setCopied]        = useState<string | null>(null)
  const [bancoSubtab,   setBancoSubtab]   = useState<'preguntas' | 'supuestos'>('preguntas')
  const [nPreguntas,    setNPreguntas]    = useState(0)
  const [nSupuestos,    setNSupuestos]    = useState(0)

  // Cargar count de supuestos al montar
  useEffect(() => {
    const aid = currentUser?.academy_id
    const sid = currentUser?.subject_id
    if (!aid) return
    let q = supabase.from('supuestos').select('id', { count: 'exact', head: true }).eq('academy_id', aid)
    if (sid) q = q.eq('subject_id', sid)
    q.then(({ count }) => setNSupuestos(count ?? 0))
  }, [currentUser?.academy_id, currentUser?.subject_id])

  const handleCopy = useCallback((code: string) => { navigator.clipboard.writeText(code); setCopied(code); setTimeout(()=>setCopied(null),2000) }, [])

  const nExpirando     = alumnos.filter(a => a.proximoAExpirar || a.accesoExpirado).length
  const nMsgRespuestas = dmSent.filter(m => m.reply_body).length
  const nAcciones      = alumnos.filter(a => a.accesoExpirado || a.proximoAExpirar || a.enRiesgo).length
                       + inviteCodes.filter(c => !c.used_by && new Date(c.expires_at) < new Date()).length
                       + nMsgRespuestas

  const bentoRef   = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!tab || !contentRef.current) return
    setTimeout(() => contentRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }), 80)
  }, [tab])

  const alumnosFiltrados = alumnos.filter(a => {
    if (filtro==='riesgo')    return a.enRiesgo
    if (filtro==='expirando') return a.proximoAExpirar || a.accesoExpirado
    if (filtro==='activos')   return !a.enRiesgo && !a.accesoExpirado && a.diasInactivo!==null && a.diasInactivo<3
    return true
  })

  if (loading) return <div className={styles.loading}><RefreshCw size={22} className={styles.spinner}/><p>Cargando datos de la clase…</p></div>
  if (error)   return <ErrorState message={error ?? 'Error cargando los datos de la clase.'} onRetry={() => window.location.reload()} />

  if (alumnoDetalle) return <AlumnoDetalle alumno={alumnoDetalle} onBack={()=>setAlumnoDetalle(null)} academyId={currentUser?.academy_id} currentUser={currentUser}/>

  return (
    <div className={styles.page}>
      {modalCodigo && <GenerarCodigoModal onGenerar={generarCodigo} onClose={()=>setModalCodigo(false)}/>}
      {modalRenovar && <RenovarModal alumno={modalRenovar} onRenovar={renovarAcceso} onClose={()=>setModalRenovar(null)}/>}

      <div className={styles.pageHeader}>
        <div><h1 className={styles.pageTitle}>Panel del Profesor</h1><p className={styles.pageSubtitle}>Seguimiento de tu clase en tiempo real</p></div>
        <div className={styles.headerActions}>
          <button className={styles.btnExport} onClick={()=>exportarInformeProfesor(alumnos,statsClase,currentUser?.academyName,currentUser?.subjectName)}><FileText size={14}/> Exportar PDF</button>
          <button className={styles.btnGenerar} onClick={()=>setModalCodigo(true)}><Plus size={15}/> Nuevo código</button>
        </div>
      </div>

      {nExpirando>0&&(<div className={styles.alertaBanner}><Shield size={15}/><span>{nExpirando===1?'1 alumno':`${nExpirando} alumnos`} con acceso expirado o próximo a expirar</span><button className={styles.alertaBtn} onClick={()=>{setTab('clase');setFiltro('expirando')}}>Ver alumnos</button></div>)}

      {statsClase&&(
        <div className={styles.statsRow}>
          <Stat icon={Users}     label="Alumnos"             value={statsClase.totalAlumnos}     color="var(--primary)"/>
          <Stat icon={Zap}       label="Activos esta semana" value={statsClase.alumnosActivos}   color="#059669"/>
          <Stat icon={UserX}     label="En riesgo"           value={statsClase.enRiesgo}         color="#DC2626"/>
          <Stat icon={Shield}    label="Accesos por expirar" value={statsClase.proximosAExpirar} color="#B45309" alert={(statsClase.proximosAExpirar??0)>0}/>
          <Stat icon={BarChart2} label="Nota media"          value={`${statsClase.notaMediaClase??0}%`} color="#7C3AED"/>
        </div>
      )}

      <div ref={bentoRef}><BentoNav tab={tab} setTab={setTab} statsClase={statsClase} nAcciones={nAcciones} announcements={announcements} preguntas={nPreguntas} supuestos={nSupuestos} alumnos={alumnos}/></div>

      <div ref={contentRef} className={styles.contentArea}>
        {tab==='evolucion'&&<ClaseEvolucionChart alumnos={alumnos} sessions={allSessions} academyId={currentUser?.academy_id} subjectId={currentUser?.subject_id}/>}
        {tab==='inbox'&&<InboxPanel alumnos={alumnos} inviteCodes={inviteCodes} onVerAlumno={setAlumnoDetalle} onRenovar={setModalRenovar} onEnviarMensaje={setModalMensaje} mensajes={dmSent} onMensajeLeido={handleMensajeLeido} onDeleteMensaje={handleDeleteMensaje}/>}
        {tab==='clase'&&(
          <div className={styles.tabContent}>
            <div className={styles.filtros}>
              {[{id:'todos',label:`Todos (${alumnos.length})`},{id:'riesgo',label:`⚠ En riesgo (${alumnos.filter(a=>a.enRiesgo).length})`},{id:'expirando',label:`🔒 Acceso (${nExpirando})`},{id:'activos',label:`Activos (${alumnos.filter(a=>!a.enRiesgo&&!a.accesoExpirado&&a.diasInactivo!==null&&a.diasInactivo<3).length})`}].map(f=>(
                <button key={f.id} className={[styles.filtroBtn,filtro===f.id?styles.filtroActive:''].join(' ')} onClick={()=>setFiltro(f.id)}>{f.label}</button>
              ))}
            </div>
            {alumnosFiltrados.length===0?(
              <div className={styles.emptyState}><Users size={32} strokeWidth={1.2}/><p>{filtro==='riesgo'?'Ningún alumno en riesgo. ¡Bien!':filtro==='expirando'?'Ningún acceso próximo a expirar.':'No hay alumnos en este filtro.'}</p></div>
            ):(
              <div className={styles.alumnosList}>
                {alumnosFiltrados.map(alumno=><AlumnoRow key={alumno.id} alumno={alumno} expanded={expandedId===alumno.id} onToggle={()=>setExpandedId(prev=>prev===alumno.id?null:alumno.id)} onRenovar={setModalRenovar} onRevocar={revocarAcceso} onDetalle={setAlumnoDetalle} onMensaje={setModalMensaje}/>)}
              </div>
            )}
          </div>
        )}
        {tab==='fallos'&&<div className={styles.tabContent}><FallosClase currentUser={currentUser}/></div>}
        {tab==='plan'&&<div className={styles.tabContent}><PlanSemanal currentUser={currentUser}/></div>}
        {tab==='tablon'&&<TablonPanel announcements={announcements} onAdd={(a) => addAnnouncement({ ...a, authorId: a.authorId ?? '' })} onDelete={deleteAnnouncement} currentUser={currentUser}/>}
        {tab==='banco'&&(
          <div className={styles.tabContent}>
            <div className={styles.bancoSubtabs}>
              <button
                className={[styles.bancoSubtab, bancoSubtab==='preguntas' ? styles.bancoSubtabActive : ''].join(' ')}
                onClick={() => setBancoSubtab('preguntas')}
              >
                <BookIcon size={14} /> Preguntas {nPreguntas > 0 && <span className={styles.bancoSubtabCount}>{nPreguntas}</span>}
              </button>
              <button
                className={[styles.bancoSubtab, bancoSubtab==='supuestos' ? styles.bancoSubtabActive : ''].join(' ')}
                onClick={() => setBancoSubtab('supuestos')}
              >
                <FileText size={14} /> Supuestos prácticos {nSupuestos > 0 && <span className={styles.bancoSubtabCount}>{nSupuestos}</span>}
              </button>
            </div>
            {bancoSubtab === 'preguntas'
              ? <BancoPreguntas currentUser={currentUser} onLoad={setNPreguntas} />
              : <BancoSupuestos currentUser={currentUser} />
            }
          </div>
        )}
        {tab==='examenes'&&<div className={styles.tabContent}><ProximosExamenes alumnos={alumnos} /></div>}
        {tab==='codigos'&&(
          <div className={styles.tabContent}>
            {inviteCodes.length===0?(<div className={styles.emptyState}><Key size={32} strokeWidth={1.2}/><p>No hay códigos. Pulsa "Nuevo código" para crear uno.</p></div>):(<div className={styles.codesList}>{inviteCodes.map(code=><CodigoCard key={code.id} code={code} onCopy={handleCopy} copied={copied}/>)}</div>)}
          </div>
        )}
        {tab&&<button className={styles.scrollBackBtn} onClick={()=>bentoRef.current?.scrollIntoView({behavior:'smooth',block:'start'})} aria-label="Volver arriba"><ChevronUp size={18} strokeWidth={2.5}/></button>}
      </div>

      {/* Modal enviar mensaje desde Mi Clase */}
      {modalMensaje && createPortal(
        <div className={styles.msgOverlay} onClick={() => { setModalMensaje(null); setMsgTexto(''); setMsgSent(false) }}>
          <div className={styles.msgModal} onClick={e => e.stopPropagation()}>
            <div className={styles.msgModalHead}>
              <span className={styles.msgModalTitle}>Mensaje para {modalMensaje.username}</span>
              <button className={styles.msgModalClose} onClick={() => { setModalMensaje(null); setMsgTexto(''); setMsgSent(false) }}><X size={14} /></button>
            </div>
            {msgSent ? (
              <div className={styles.msgSent}><CheckCircle2 size={20} style={{color:'#059669'}}/><span>Mensaje enviado</span></div>
            ) : (
              <>
                <textarea className={styles.msgTextarea} placeholder={`Escribe un mensaje para ${modalMensaje.username}...`}
                  value={msgTexto} onChange={e => setMsgTexto(e.target.value)} rows={4} autoFocus />
                <div className={styles.msgModalFoot}>
                  <span className={styles.msgHint}>El alumno lo verá en su tablón de mensajes</span>
                  <button className={styles.msgBtnEnviar} onClick={handleEnviarMensaje} disabled={msgSending || !msgTexto.trim()}>
                    {msgSending ? <RefreshCw size={13} className={styles.spinner} /> : <Send size={13} />} Enviar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
