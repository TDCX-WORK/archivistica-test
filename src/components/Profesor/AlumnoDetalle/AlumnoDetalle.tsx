import { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft, BookOpen, Zap, AlertTriangle, TrendingUp,
  Calendar, BarChart2, RefreshCw, Shield, Download,
  MessageSquare, Send, Check, X, ChevronDown, ChevronUp,
  User, Clock, Flame
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { AlumnoConStats } from '../../../types'
import styles from './AlumnoDetalle.module.css'

function formatFecha(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}
function scoreColor(s: number | null | undefined): string {
  if (s == null) return '#6B7280'
  if (s >= 80) return '#059669'
  if (s >= 60) return '#0891B2'
  if (s >= 40) return '#B45309'
  return '#DC2626'
}
function scoreLabel(s: number | null | undefined): string {
  if (s == null) return 'Sin datos'
  if (s >= 80) return 'Sobresaliente'
  if (s >= 60) return 'Notable'
  if (s >= 40) return 'Mejorable'
  return 'Necesita refuerzo'
}

function DonutMini({ pct, color, size = 110, stroke = 11 }: { pct: number; color: string; size?: number; stroke?: number }) {
  const r    = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const fill = Math.max(0, Math.min(pct / 100, 1)) * circ
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--line-strong)" strokeWidth={stroke} />
      {pct > 0 && (
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${fill} ${circ - fill}`} strokeDashoffset={circ / 4}
          strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      )}
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fontSize={size * 0.2} fontWeight="800" fill={color}>{pct}%</text>
    </svg>
  )
}

function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <div className={styles.kpiCard} style={{ ['--kpi' as string]: color }}>
      <div className={styles.kpiIconWrap}><Icon size={14} strokeWidth={2} /></div>
      <div className={styles.kpiBody}>
        <span className={styles.kpiVal}>{value ?? '—'}</span>
        <span className={styles.kpiLabel}>{label}</span>
      </div>
    </div>
  )
}

interface FalloConPregunta {
  question_id: string
  fail_count:  number
  next_review: string | null
  question:    { id: string; question: string; options: unknown; answer: number; explanation: string | null } | null
}

function FalloItem({ fallo, rank }: { fallo: FalloConPregunta; rank: number }) {
  const [open, setOpen] = useState(false)
  const q = fallo.question

  const opciones: string[] = q?.options
    ? (Array.isArray(q.options)
        ? q.options as string[]
        : Object.values(q.options as Record<string, string>))
    : []

  return (
    <div className={[styles.falloItem, open ? styles.falloItemOpen : ''].join(' ')}>
      <button className={styles.falloHeader} onClick={() => setOpen(v => !v)}>
        <span className={styles.falloRank} style={{
          background: rank === 1 ? '#FEF2F2' : rank <= 3 ? '#FFFBEB' : 'var(--surface-dim)',
          color:      rank === 1 ? '#DC2626' : rank <= 3 ? '#B45309' : 'var(--ink-muted)',
        }}>
          {rank}
        </span>
        <span className={styles.falloTexto}>
          {q?.question
            ? (q.question.length > 120 ? q.question.slice(0, 120) + '…' : q.question)
            : 'Pregunta no disponible'}
        </span>
        <span className={styles.falloCount} style={{ color: fallo.fail_count >= 3 ? '#DC2626' : '#B45309' }}>
          {fallo.fail_count}× fallada
        </span>
        {open
          ? <ChevronUp   size={14} className={styles.falloChevron} />
          : <ChevronDown size={14} className={styles.falloChevron} />}
      </button>

      {open && q && (
        <div className={styles.falloBody}>
          <p className={styles.falloPreguntaFull}>{q.question}</p>

          {opciones.length > 0 && (
            <div className={styles.falloOptions}>
              {opciones.map((opt, i) => {
                const letra     = String.fromCharCode(65 + i)
                const isCorrect = i === q.answer
                const texto     = typeof opt === 'object' && opt !== null ? JSON.stringify(opt) : String(opt)
                return (
                  <div key={i} className={[styles.falloOpt, isCorrect ? styles.falloOptCorrect : ''].join(' ')}>
                    <span className={styles.falloOptLetra}>{letra}</span>
                    <span className={styles.falloOptText}>{texto}</span>
                    {isCorrect && <span className={styles.falloOptTag}>✓ Correcta</span>}
                  </div>
                )
              })}
            </div>
          )}

          {q.explanation && (
            <div className={styles.falloExplicacion}>
              <span className={styles.falloExplLabel}>Explicación</span>
              <p>{q.explanation}</p>
            </div>
          )}

          <p className={styles.falloMeta}>
            Próximo repaso: <strong>{formatFecha(fallo.next_review)}</strong>
          </p>
        </div>
      )}
    </div>
  )
}

interface Sesion { score: number; played_at: string | null; created_at: string | null; total: number | null }

function BarChartComp({ sesiones }: { sesiones: Sesion[] }) {
  if (!sesiones.length) return <div className={styles.emptyChart}>Sin sesiones registradas todavía</div>
  const data = [...sesiones].reverse().slice(-12)
  return (
    <div className={styles.barChart}>
      {data.map((s, i) => {
        const color = scoreColor(s.score)
        const date  = new Date(s.played_at ?? s.created_at!).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
        return (
          <div key={i} className={styles.barCol} title={`${s.score}% — ${date}`}>
            <span className={styles.barScore} style={{ color }}>{s.score}%</span>
            <div className={styles.barTrack}>
              <div className={styles.barFill} style={{ height: `${Math.max(4, s.score)}%`, background: color }} />
            </div>
            <span className={styles.barDate}>{date}</span>
          </div>
        )
      })}
    </div>
  )
}

function generateInformePDF(
  alumno:      AlumnoConStats,
  sesiones:    Sesion[],
  temasLeidos: { topic_id: string }[],
  fallos:      FalloConPregunta[]
) {
  const now       = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
  const notaColor = scoreColor(alumno.notaMedia)
  const ultimas   = [...sesiones].reverse().slice(-8)
  const barW = 28, barGap = 8, chartH = 60

  const barsSVG = ultimas.map((s, i) => {
    const h = Math.max(3, (s.score / 100) * chartH)
    const x = i * (barW + barGap)
    return `<rect x="${x}" y="${chartH-h}" width="${barW}" height="${h}" rx="4" fill="${scoreColor(s.score)}" opacity=".85"/>
            <text x="${x+barW/2}" y="${chartH+14}" text-anchor="middle" font-size="9" fill="#6B7280">${s.score}%</text>`
  }).join('')

  const sesTrs = sesiones.slice(0, 12).map(s =>
    `<tr><td>${formatFecha(s.played_at ?? s.created_at)}</td><td style="color:${scoreColor(s.score)};font-weight:700">${s.score}%</td><td>${s.total ?? '—'}</td></tr>`
  ).join('')

  const falloTrs = fallos.slice(0, 8).map((f, i) =>
    `<tr><td>${i+1}</td><td>${(f.question?.question ?? '—').slice(0, 80)}${(f.question?.question ?? '').length > 80 ? '…' : ''}</td><td style="color:#DC2626;font-weight:700">${f.fail_count}×</td></tr>`
  ).join('')

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,'Segoe UI',sans-serif;color:#111;padding:40px 48px;max-width:780px;margin:0 auto}
    .hdr{display:flex;justify-content:space-between;padding-bottom:18px;border-bottom:2px solid #111;margin-bottom:24px}
    .nota{display:flex;align-items:center;gap:20px;background:#F9FAFB;border-radius:10px;padding:18px 22px;border:1px solid #E5E7EB;margin-bottom:22px}
    .nota-num{font-size:48px;font-weight:800}
    .kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:22px}
    .kpi{background:#F9FAFB;border-radius:8px;padding:12px 8px;text-align:center;border:1px solid #E5E7EB}
    .kpi b{display:block;font-size:18px;font-weight:800;margin-bottom:3px}.kpi span{font-size:10px;color:#6B7280;text-transform:uppercase}
    .sec{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6B7280;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #E5E7EB}
    table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:22px}
    th{text-align:left;font-size:10px;color:#6B7280;padding:6px 8px;border-bottom:1px solid #E5E7EB;font-weight:700;text-transform:uppercase}
    td{padding:8px;border-bottom:1px solid #E5E7EB}
    .chart{background:#F9FAFB;border-radius:8px;padding:14px 18px;border:1px solid #E5E7EB;margin-bottom:22px}
    footer{margin-top:32px;padding-top:14px;border-top:1px solid #E5E7EB;display:flex;justify-content:space-between;font-size:10px;color:#6B7280}
  </style></head><body>
  <div class="hdr"><div><h1 style="font-size:22px;font-weight:800">Informe de progreso</h1><p style="font-size:15px;font-weight:700;margin-top:6px">${alumno.username}</p><p style="font-size:12px;color:#6B7280">Acceso hasta: ${formatFecha(alumno.accessUntil ?? null)}</p></div><div style="text-align:right"><p style="font-weight:700;text-transform:uppercase;font-size:10px;letter-spacing:.08em;color:#6B7280">FrostFox Academy</p><p style="font-size:11px;color:#6B7280;margin-top:4px">Generado el ${now}</p></div></div>
  <div class="nota"><div class="nota-num" style="color:${notaColor}">${alumno.notaMedia ?? '—'}${alumno.notaMedia !== null ? '%' : ''}</div><div><h3 style="font-size:16px;font-weight:700">${scoreLabel(alumno.notaMedia)}</h3><p style="font-size:12px;color:#6B7280;margin-top:4px">${sesiones.length} sesiones · Racha: ${alumno.racha} días</p></div></div>
  <div class="kpis"><div class="kpi"><b style="color:#7C3AED">${alumno.notaMedia ?? '—'}${alumno.notaMedia !== null ? '%' : ''}</b><span>Nota media</span></div><div class="kpi"><b style="color:#059669">${sesiones.length}</b><span>Sesiones</span></div><div class="kpi"><b style="color:#0891B2">${temasLeidos.length}</b><span>Temas leídos</span></div><div class="kpi"><b style="color:#DC2626">${fallos.length}</b><span>Fallos</span></div><div class="kpi"><b style="color:#D97706">${alumno.racha}d</b><span>Racha</span></div></div>
  ${ultimas.length > 0 ? `<div class="sec">Evolución de nota</div><div class="chart"><svg viewBox="0 0 ${Math.max(ultimas.length*(barW+barGap), 100)} ${chartH+20}" width="100%" height="${chartH+20}">${barsSVG}</svg></div>` : ''}
  ${sesiones.length > 0 ? `<div class="sec">Últimas sesiones</div><table><thead><tr><th>Fecha</th><th>Nota</th><th>Preguntas</th></tr></thead><tbody>${sesTrs}</tbody></table>` : ''}
  ${fallos.length > 0 ? `<div class="sec">Preguntas más falladas</div><table><thead><tr><th>#</th><th>Pregunta</th><th>Fallos</th></tr></thead><tbody>${falloTrs}</tbody></table>` : ''}
  <footer><p>FrostFox Academy</p><p>${alumno.username} · Informe generado automáticamente</p></footer>
  </body></html>`

  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.onload = () => setTimeout(() => win.print(), 300)
}

interface AlumnoDetalleProps {
  alumno:      AlumnoConStats
  onBack:      () => void
  academyId:   string | null | undefined
  currentUser: unknown
}

export default function AlumnoDetalle({ alumno, onBack, academyId }: AlumnoDetalleProps) {
  const [sesiones,     setSesiones]     = useState<Sesion[]>([])
  const [temasLeidos,  setTemas]        = useState<{ topic_id: string }[]>([])
  const [fallos,       setFallos]       = useState<FalloConPregunta[]>([])
  const [loading,      setLoading]      = useState(true)
  const [exporting,    setExporting]    = useState(false)
  const [showMsgModal, setShowMsgModal] = useState(false)
  const [msgTexto,     setMsgTexto]     = useState('')
  const [msgSending,   setMsgSending]   = useState(false)
  const [msgSent,      setMsgSent]      = useState(false)

  useEffect(() => {
    if (!alumno?.id) return
    const load = async () => {
      setLoading(true)
      const [{ data: sess }, { data: reads }, { data: wrongs }] = await Promise.all([
        supabase.from('sessions').select('score, played_at, created_at, total')
          .eq('user_id', alumno.id).order('created_at', { ascending: false }).limit(30),
        supabase.from('study_read').select('topic_id')
          .eq('user_id', alumno.id).eq('academy_id', academyId!),
        supabase.from('wrong_answers').select('question_id, fail_count, next_review')
          .eq('user_id', alumno.id).order('fail_count', { ascending: false }).limit(15),
      ])
      setSesiones((sess ?? []) as Sesion[])
      setTemas((reads ?? []) as { topic_id: string }[])

      if (wrongs?.length) {
        const qIds = (wrongs as { question_id: string }[]).map(f => f.question_id).filter(Boolean)
        const { data: pregs } = await supabase
          .from('questions').select('id, question, options, answer, explanation').in('id', qIds)
        const map: Record<string, FalloConPregunta['question']> = {}
        for (const q of (pregs ?? []) as NonNullable<FalloConPregunta['question']>[]) map[q.id] = q
        setFallos((wrongs as { question_id: string; fail_count: number; next_review: string | null }[])
          .map(f => ({ ...f, question: map[f.question_id] ?? null })))
      } else {
        setFallos([])
      }
      setLoading(false)
    }
    load()
  }, [alumno?.id, academyId])

  const handleExport = useCallback(() => {
    setExporting(true)
    try { generateInformePDF(alumno, sesiones, temasLeidos, fallos) }
    finally { setTimeout(() => setExporting(false), 1000) }
  }, [alumno, sesiones, temasLeidos, fallos])

  const handleEnviarMensaje = useCallback(async () => {
    if (!msgTexto.trim()) return
    setMsgSending(true)
    await supabase.from('notifications').insert({
      user_id: alumno.id, type: 'mensaje_profesor',
      title: 'Mensaje de tu profesor', body: msgTexto.trim(), link: '/',
    })
    setMsgSending(false)
    setMsgSent(true)
    setTimeout(() => { setShowMsgModal(false); setMsgTexto(''); setMsgSent(false) }, 1500)
  }, [alumno.id, msgTexto])

  const estadoAlumno = alumno.accesoExpirado
    ? { label: 'Acceso expirado',                              color: '#DC2626', bg: '#FEF2F2' }
    : alumno.enRiesgo
      ? { label: 'En riesgo',                                  color: '#B45309', bg: '#FFFBEB' }
      : alumno.proximoAExpirar
        ? { label: `Expira en ${alumno.diasParaExpirar}d`,     color: '#D97706', bg: '#FFFBEB' }
        : { label: 'Activo',                                    color: '#059669', bg: '#ECFDF5' }

  const ultimaActividad = alumno.diasInactivo === 0 ? 'Hoy'
    : alumno.diasInactivo === 1 ? 'Ayer'
    : `Hace ${alumno.diasInactivo} días`

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <button className={styles.btnBack} onClick={onBack}>
          <ArrowLeft size={16} /> Volver
        </button>
        <div className={styles.alumnoTitle}>
          <div className={styles.alumnoAvatar} style={{ background: scoreColor(alumno.notaMedia) + '22', color: scoreColor(alumno.notaMedia) }}>
            {alumno.username[0]!.toUpperCase()}
          </div>
          <div>
            <h1 className={styles.pageTitle}>{alumno.username}</h1>
            <div className={styles.alumnoMeta}>
              <span className={styles.estadoBadge} style={{ color: estadoAlumno.color, background: estadoAlumno.bg }}>
                {estadoAlumno.label}
              </span>
              <span className={styles.metaDot}>·</span>
              <span className={styles.metaText}>Última actividad: {ultimaActividad}</span>
            </div>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnMsg} onClick={() => setShowMsgModal(true)}>
            <MessageSquare size={14} /> Mensaje
          </button>
          <button className={styles.btnExport} onClick={handleExport} disabled={exporting || loading}>
            {exporting ? <RefreshCw size={14} className={styles.spinner} /> : <Download size={14} />}
            Exportar PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.state}>
          <RefreshCw size={22} className={styles.spinner} /><p>Cargando…</p>
        </div>
      ) : (
        <div className={styles.layout}>
          <div className={styles.colLeft}>
            <div className={styles.card}>
              <div className={styles.donutCenter}>
                <DonutMini pct={alumno.notaMedia ?? 0} color={scoreColor(alumno.notaMedia)} size={110} stroke={11} />
              </div>
              <p className={styles.notaLabel} style={{ color: scoreColor(alumno.notaMedia) }}>
                {scoreLabel(alumno.notaMedia)}
              </p>
              <div className={styles.miniStats}>
                <div className={styles.miniStat}><span className={styles.miniStatVal}>{sesiones.length}</span><span className={styles.miniStatLabel}>sesiones</span></div>
                <div className={styles.miniStat}><span className={styles.miniStatVal}>{temasLeidos.length}</span><span className={styles.miniStatLabel}>temas leídos</span></div>
                <div className={styles.miniStat}><span className={styles.miniStatVal}>{alumno.racha}d</span><span className={styles.miniStatLabel}>racha</span></div>
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Información</h3>
              <div className={styles.infoList}>
                <div className={styles.infoRow}><User     size={13} className={styles.infoIcon} /><span className={styles.infoLabel}>Usuario</span><span className={styles.infoVal}>{alumno.username}</span></div>
                <div className={styles.infoRow}><Shield   size={13} className={styles.infoIcon} /><span className={styles.infoLabel}>Acceso hasta</span><span className={styles.infoVal}>{formatFecha(alumno.accessUntil ?? null) || 'Sin límite'}</span></div>
                <div className={styles.infoRow}><Clock    size={13} className={styles.infoIcon} /><span className={styles.infoLabel}>Última actividad</span><span className={styles.infoVal}>{ultimaActividad}</span></div>
                <div className={styles.infoRow}><Flame    size={13} className={styles.infoIcon} /><span className={styles.infoLabel}>Racha actual</span><span className={styles.infoVal}>{alumno.racha} día{alumno.racha !== 1 ? 's' : ''}</span></div>
                {alumno.diasParaExpirar !== null && !alumno.accesoExpirado && (
                  <div className={styles.infoRow}>
                    <Calendar size={13} className={styles.infoIcon} />
                    <span className={styles.infoLabel}>Expira en</span>
                    <span className={styles.infoVal} style={{ color: alumno.diasParaExpirar <= 7 ? '#DC2626' : 'inherit' }}>
                      {alumno.diasParaExpirar} días
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.kpisStack}>
              <KpiCard icon={BarChart2}     label="Nota media"         value={alumno.notaMedia !== null ? `${alumno.notaMedia}%` : '—'} color="#7C3AED" />
              <KpiCard icon={Zap}           label="Sesiones"           value={sesiones.length}    color="#059669" />
              <KpiCard icon={BookOpen}      label="Temas leídos"       value={temasLeidos.length} color="#0891B2" />
              <KpiCard icon={AlertTriangle} label="Preguntas falladas" value={fallos.length}       color="#DC2626" />
            </div>
          </div>

          <div className={styles.colRight}>
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <h3 className={styles.cardTitle}>Evolución de nota</h3>
                <span className={styles.cardSub}>{Math.min(sesiones.length, 12)} últimas sesiones</span>
              </div>
              <BarChartComp sesiones={sesiones} />
            </div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <h3 className={styles.cardTitle}>Últimas sesiones</h3>
                <span className={styles.cardSub}>{sesiones.length} en total</span>
              </div>
              {sesiones.length === 0 ? (
                <p className={styles.empty}>Sin sesiones registradas</p>
              ) : (
                <div className={styles.sesionTabla}>
                  <div className={styles.sesionHeader}>
                    <span>Fecha</span><span>Nota</span><span>Preguntas</span>
                  </div>
                  {sesiones.slice(0, 12).map((s, i) => (
                    <div key={i} className={styles.sesionRow}>
                      <span>{formatFecha(s.played_at ?? s.created_at)}</span>
                      <span className={styles.sesionNota} style={{ color: scoreColor(s.score) }}>{s.score}%</span>
                      <span>{s.total ?? '—'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {fallos.length > 0 && (
              <div className={styles.card}>
                <div className={styles.cardHead}>
                  <h3 className={styles.cardTitle}>Preguntas con más fallos</h3>
                  <span className={styles.cardSub}>{fallos.length} preguntas · clic para ver detalles</span>
                </div>
                <div className={styles.fallosList}>
                  {fallos.map((f, i) => (
                    <FalloItem key={f.question_id} fallo={f} rank={i + 1} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showMsgModal && (
        <div className={styles.msgOverlay} onClick={() => setShowMsgModal(false)}>
          <div className={styles.msgModal} onClick={e => e.stopPropagation()}>
            <div className={styles.msgModalHead}>
              <span className={styles.msgModalTitle}>Mensaje para {alumno.username}</span>
              <button className={styles.msgModalClose} onClick={() => setShowMsgModal(false)}>
                <X size={14} />
              </button>
            </div>
            {msgSent ? (
              <div className={styles.msgSent}>
                <Check size={20} style={{ color: '#059669' }} /><span>Mensaje enviado</span>
              </div>
            ) : (
              <>
                <textarea
                  className={styles.msgTextarea}
                  placeholder={`Escribe un mensaje para ${alumno.username}...`}
                  value={msgTexto}
                  onChange={e => setMsgTexto(e.target.value)}
                  rows={4}
                  autoFocus
                />
                <div className={styles.msgModalFoot}>
                  <span className={styles.msgHint}>El alumno lo verá en su campanita de notificaciones</span>
                  <button className={styles.msgBtnEnviar} onClick={handleEnviarMensaje} disabled={msgSending || !msgTexto.trim()}>
                    {msgSending ? <RefreshCw size={13} className={styles.spinner} /> : <Send size={13} />}
                    Enviar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
