import { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Users, Zap, UserX, BarChart2, Shield, FileText, Plus, RefreshCw,
  ChevronUp, Key, BookOpen as BookIcon, Send, X, CheckCircle2, Search
} from 'lucide-react'
import { supabase }              from '../../../lib/supabase'
import { useProfesor }           from '../../../hooks/useProfesor'
import { useProfesorMessages }   from '../../../hooks/useDirectMessages'
import { useAnnouncements }      from '../../../hooks/useAnnouncements'
import FallosClase               from '../FallosClase/FallosClase'
import PlanSemanal               from '../PlanSemanal/PlanSemanal'
import AlumnoDetalle             from '../AlumnoDetalle/AlumnoDetalle'
import ClaseEvolucionChart       from '../ClaseEvolucionChart/ClaseEvolucionChart'
import BancoPreguntas            from '../BancoPreguntas/BancoPreguntas'
import ErrorState                from '../../ui/ErrorState'

// ── Componentes extraídos ───────────────────────────────────────────────────
import RenovarModal        from '../components/RenovarModal'
import GenerarCodigoModal  from '../components/GenerarCodigoModal'
import AlumnoRow           from '../components/AlumnoRow'
import CodigoCard, { useUserInfoMap } from '../components/CodigoCard'
import BentoNav            from '../components/BentoNav'
import TablonPanel         from '../components/TablonPanel'
import ProximosExamenes    from '../components/ProximosExamenes'
import BancoSupuestos      from '../components/BancoSupuestos'
import InboxPanel          from '../components/InboxPanel'

import type { CurrentUser, AlumnoConStats, StatsClase } from '../../../types'
import styles from './ProfesorPanel.module.css'

// ── Helpers locales ─────────────────────────────────────────────────────────
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

// ── ProfesorPanel — Shell Principal ─────────────────────────────────────────
export default function ProfesorPanel({ currentUser }: { currentUser: CurrentUser | null }) {
  const { alumnos, inviteCodes, statsClase, allSessions, loading, error, generarCodigo, renovarAcceso, revocarAcceso } = useProfesor(currentUser)
  const { announcements, addAnnouncement, deleteAnnouncement } = useAnnouncements(currentUser?.academy_id, currentUser?.subject_id)

  const { sent: dmSent, sendMessage: dmSend, deleteSentMessage: dmDeleteSent } = useProfesorMessages(
    currentUser?.id, currentUser?.academy_id, currentUser?.subject_id
  )

  // ── Estados ─────────────────────────────────────────────────────────────
  const [modalMensaje,  setModalMensaje]  = useState<AlumnoConStats | null>(null)
  const [msgTexto,      setMsgTexto]      = useState('')
  const [msgSending,    setMsgSending]    = useState(false)
  const [msgSent,       setMsgSent]       = useState(false)
  const [dmLeidos,      setDmLeidos]      = useState<Set<string>>(new Set())

  const [tab,           setTab]           = useState('')
  const [alumnoDetalle, setAlumnoDetalle] = useState<AlumnoConStats | null>(null)
  const [expandedId,    setExpandedId]    = useState<string | null>(null)
  const [filtro,        setFiltro]        = useState('todos')
  const [busquedaClase, setBusquedaClase] = useState('')
  const [modalCodigo,   setModalCodigo]   = useState(false)
  const [modalRenovar,  setModalRenovar]  = useState<AlumnoConStats | null>(null)
  const [copied,        setCopied]        = useState<string | null>(null)
  const [bancoSubtab,   setBancoSubtab]   = useState<'preguntas' | 'supuestos'>('preguntas')
  const [nPreguntas,    setNPreguntas]    = useState(0)
  const [nSupuestos,    setNSupuestos]    = useState(0)

  // ── Hooks derivados ─────────────────────────────────────────────────────
  const usedByIds = inviteCodes.map(c => c.used_by).filter((x): x is string => !!x)
  const usedByInfoMap = useUserInfoMap(usedByIds)

  useEffect(() => {
    const aid = currentUser?.academy_id
    const sid = currentUser?.subject_id
    if (!aid) return
    let q = supabase.from('supuestos').select('id', { count: 'exact', head: true }).eq('academy_id', aid)
    if (sid) q = q.eq('subject_id', sid)
    q.then(({ count }) => setNSupuestos(count ?? 0))
  }, [currentUser?.academy_id, currentUser?.subject_id])

  const handleCopy = useCallback((code: string) => { navigator.clipboard.writeText(code); setCopied(code); setTimeout(() => setCopied(null), 2000) }, [])

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

  // ── Conteos ─────────────────────────────────────────────────────────────
  const nExpirando     = alumnos.filter(a => a.proximoAExpirar || a.accesoExpirado).length
  const nMsgRespuestas = dmSent.filter(m => m.reply_body).length
  const nAcciones      = alumnos.filter(a => a.accesoExpirado || a.proximoAExpirar || a.enRiesgo).length
                       + inviteCodes.filter(c => !c.used_by && new Date(c.expires_at) < new Date()).length
                       + nMsgRespuestas

  const bentoRef   = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!tab || !contentRef.current) return
    setTimeout(() => contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }, [tab])

  const alumnosFiltrados = alumnos.filter(a => {
    if (filtro === 'riesgo')    return a.enRiesgo
    if (filtro === 'expirando') return a.proximoAExpirar || a.accesoExpirado
    if (filtro === 'activos')   return !a.enRiesgo && !a.accesoExpirado && a.diasInactivo !== null && a.diasInactivo < 3
    return true
  })

  // ── Loading / Error / Detalle ───────────────────────────────────────────
  if (loading) return <div className={styles.loading}><RefreshCw size={22} className={styles.spinner} /><p>Cargando datos de la clase…</p></div>
  if (error)   return <ErrorState message={error ?? 'Error cargando los datos de la clase.'} onRetry={() => window.location.reload()} />
  if (alumnoDetalle) return <AlumnoDetalle alumno={alumnoDetalle} onBack={() => setAlumnoDetalle(null)} academyId={currentUser?.academy_id} currentUser={currentUser} />

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {modalCodigo && <GenerarCodigoModal onGenerar={generarCodigo} onClose={() => setModalCodigo(false)} />}
      {modalRenovar && <RenovarModal alumno={modalRenovar} onRenovar={renovarAcceso} onClose={() => setModalRenovar(null)} />}

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

      {nExpirando > 0 && (
        <div className={styles.alertaBanner}>
          <Shield size={15} />
          <span>{nExpirando === 1 ? '1 alumno' : `${nExpirando} alumnos`} con acceso expirado o próximo a expirar</span>
          <button className={styles.alertaBtn} onClick={() => { setTab('clase'); setFiltro('expirando') }}>Ver alumnos</button>
        </div>
      )}

      {statsClase && (
        <div className={styles.statsRow}>
          <Stat icon={Users}     label="Alumnos"             value={statsClase.totalAlumnos}     color="var(--primary)" />
          <Stat icon={Zap}       label="Activos esta semana" value={statsClase.alumnosActivos}   color="#059669" />
          <Stat icon={UserX}     label="En riesgo"           value={statsClase.enRiesgo}         color="#DC2626" />
          <Stat icon={Shield}    label="Accesos por expirar" value={statsClase.proximosAExpirar} color="#B45309" alert={(statsClase.proximosAExpirar ?? 0) > 0} />
          <Stat icon={BarChart2} label="Nota media"          value={`${statsClase.notaMediaClase ?? 0}%`} color="#7C3AED" />
        </div>
      )}

      <div ref={bentoRef}>
        <BentoNav tab={tab} setTab={setTab} statsClase={statsClase} nAcciones={nAcciones} announcements={announcements} preguntas={nPreguntas} supuestos={nSupuestos} alumnos={alumnos} />
      </div>

      <div ref={contentRef} className={styles.contentArea}>
        {tab === 'evolucion' && <ClaseEvolucionChart alumnos={alumnos} sessions={allSessions} academyId={currentUser?.academy_id} subjectId={currentUser?.subject_id} />}

        {tab === 'inbox' && <InboxPanel alumnos={alumnos} inviteCodes={inviteCodes} onVerAlumno={setAlumnoDetalle} onRenovar={setModalRenovar} onEnviarMensaje={setModalMensaje} mensajes={dmSent} onMensajeLeido={handleMensajeLeido} onDeleteMensaje={handleDeleteMensaje} />}

        {tab === 'clase' && (
          <div className={styles.tabContent}>
            <div className={styles.claseHeader}>
              <div className={styles.claseHeaderLeft}>
                <h2 className={styles.claseTitle}>Mi clase</h2>
                <span className={styles.claseCount}>{alumnos.length} alumnos</span>
              </div>
              <div className={styles.claseSearchWrap}>
                <Search size={14} className={styles.claseSearchIcon} />
                <input className={styles.claseSearchInput} placeholder="Buscar alumno…" value={busquedaClase} onChange={e => setBusquedaClase(e.target.value)} />
              </div>
            </div>
            <div className={styles.filtros}>
              {[
                { id: 'todos',     label: `Todos (${alumnos.length})` },
                { id: 'riesgo',    label: `⚠ En riesgo (${alumnos.filter(a => a.enRiesgo).length})` },
                { id: 'expirando', label: `🔒 Acceso (${nExpirando})` },
                { id: 'activos',   label: `Activos (${alumnos.filter(a => !a.enRiesgo && !a.accesoExpirado && a.diasInactivo !== null && a.diasInactivo < 3).length})` },
              ].map(f => (
                <button key={f.id} className={[styles.filtroBtn, filtro === f.id ? styles.filtroActive : ''].join(' ')} onClick={() => setFiltro(f.id)}>{f.label}</button>
              ))}
            </div>
            {(() => {
              const q = busquedaClase.toLowerCase()
              const filtered = alumnosFiltrados.filter(a => !q || a.username.toLowerCase().includes(q) || (a.fullName?.toLowerCase().includes(q) ?? false))
              return filtered.length === 0 ? (
                <div className={styles.emptyState}><Users size={32} strokeWidth={1.2} /><p>{busquedaClase ? 'No se encontraron alumnos' : filtro === 'riesgo' ? 'Ningún alumno en riesgo. ¡Bien!' : filtro === 'expirando' ? 'Ningún acceso próximo a expirar.' : 'No hay alumnos en este filtro.'}</p></div>
              ) : (
                <div className={styles.alumnosList}>
                  {filtered.map(alumno => <AlumnoRow key={alumno.id} alumno={alumno} expanded={expandedId === alumno.id} onToggle={() => setExpandedId(prev => prev === alumno.id ? null : alumno.id)} onRenovar={setModalRenovar} onRevocar={revocarAcceso} onDetalle={setAlumnoDetalle} onMensaje={setModalMensaje} />)}
                </div>
              )
            })()}
          </div>
        )}

        {tab === 'fallos' && <div className={styles.tabContent}><FallosClase currentUser={currentUser} /></div>}
        {tab === 'plan' && <div className={styles.tabContent}><PlanSemanal currentUser={currentUser} /></div>}
        {tab === 'tablon' && <TablonPanel announcements={announcements} onAdd={(a) => addAnnouncement({ ...a, authorId: a.authorId ?? '' })} onDelete={deleteAnnouncement} currentUser={currentUser} />}

        {tab === 'banco' && (
          <div className={styles.tabContent}>
            <div className={styles.bancoSubtabs}>
              <button className={[styles.bancoSubtab, bancoSubtab === 'preguntas' ? styles.bancoSubtabActive : ''].join(' ')} onClick={() => setBancoSubtab('preguntas')}>
                <BookIcon size={14} /> Preguntas {nPreguntas > 0 && <span className={styles.bancoSubtabCount}>{nPreguntas}</span>}
              </button>
              <button className={[styles.bancoSubtab, bancoSubtab === 'supuestos' ? styles.bancoSubtabActive : ''].join(' ')} onClick={() => setBancoSubtab('supuestos')}>
                <FileText size={14} /> Supuestos prácticos {nSupuestos > 0 && <span className={styles.bancoSubtabCount}>{nSupuestos}</span>}
              </button>
            </div>
            {bancoSubtab === 'preguntas' ? <BancoPreguntas currentUser={currentUser} onLoad={setNPreguntas} /> : <BancoSupuestos currentUser={currentUser} />}
          </div>
        )}

        {tab === 'examenes' && <div className={styles.tabContent}><ProximosExamenes alumnos={alumnos} /></div>}

        {tab === 'codigos' && (
          <div className={styles.tabContent}>
            {inviteCodes.length === 0 ? (
              <div className={styles.emptyState}><Key size={32} strokeWidth={1.2} /><p>No hay códigos. Pulsa "Nuevo código" para crear uno.</p></div>
            ) : (
              <div className={styles.codesList}>{inviteCodes.map(code => <CodigoCard key={code.id} code={code} usedByInfo={code.used_by ? (usedByInfoMap[code.used_by] ?? null) : null} onCopy={handleCopy} copied={copied} />)}</div>
            )}
          </div>
        )}

        {tab && <button className={styles.scrollBackBtn} onClick={() => bentoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} aria-label="Volver arriba"><ChevronUp size={18} strokeWidth={2.5} /></button>}
      </div>

      {/* Modal enviar mensaje */}
      {modalMensaje && createPortal(
        <div className={styles.msgOverlay} onClick={() => { setModalMensaje(null); setMsgTexto(''); setMsgSent(false) }}>
          <div className={styles.msgModal} onClick={e => e.stopPropagation()}>
            <div className={styles.msgModalHead}>
              <span className={styles.msgModalTitle}>Mensaje para {modalMensaje.username}</span>
              <button className={styles.msgModalClose} onClick={() => { setModalMensaje(null); setMsgTexto(''); setMsgSent(false) }}><X size={14} /></button>
            </div>
            {msgSent ? (
              <div className={styles.msgSent}><CheckCircle2 size={20} style={{ color: '#059669' }} /><span>Mensaje enviado</span></div>
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
