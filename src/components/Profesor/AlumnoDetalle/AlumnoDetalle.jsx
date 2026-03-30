import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, BookOpen, Zap, AlertTriangle, TrendingUp,
         Calendar, BarChart2, RefreshCw, Shield, Download, FileText,
         MessageSquare, Send, Check, X } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import styles from './AlumnoDetalle.module.css'

function formatFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function scoreColor(s) {
  if (s === null || s === undefined) return '#6B7280'
  if (s >= 80) return '#059669'
  if (s >= 60) return '#0891B2'
  if (s >= 40) return '#B45309'
  return '#DC2626'
}

// Muestra los primeros 8 chars del UUID seguidos de … para no romper layouts
function shortId(uuid) {
  if (!uuid) return '—'
  if (uuid.length <= 8) return `#${uuid}`
  return `#${uuid.slice(0, 8)}…`
}

function DonutMini({ pct, color, size = 100, stroke = 10 }) {
  const r    = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const fill = Math.max(0, Math.min(pct / 100, 1)) * circ
  return (
    <svg width={size} height={size} style={{ overflow: 'visible' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--line-light)" strokeWidth={stroke} />
      {pct > 0 && (
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${fill} ${circ - fill}`} strokeDashoffset={circ / 4}
          strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      )}
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fontSize={size * 0.22} fontWeight="800" fill="var(--ink)">{pct}%</text>
    </svg>
  )
}

function KpiCard({ icon: Icon, label, value, color }) {
  return (
    <div className={styles.kpiCard} style={{ '--kpi': color }}>
      <Icon size={15} strokeWidth={1.8} className={styles.kpiIcon} />
      <span className={styles.kpiVal}>{value ?? '—'}</span>
      <span className={styles.kpiLabel}>{label}</span>
    </div>
  )
}

// ── Generador de PDF inline ──────────────────────────────────────────────────
function generateInformePDF(alumno, sesiones, temasLeidos, fallos) {
  const now        = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
  const notaColor  = scoreColor(alumno.notaMedia)
  const notaLabel  = alumno.notaMedia === null ? 'Sin datos' :
    alumno.notaMedia >= 80 ? 'Excelente' :
    alumno.notaMedia >= 60 ? 'Notable' :
    alumno.notaMedia >= 40 ? 'Mejorable' : 'Necesita refuerzo'

  const ultimas = [...sesiones].reverse().slice(-8)

  const sesTrs = sesiones.slice(0, 12).map(s => `
    <tr>
      <td>${formatFecha(s.played_at || s.created_at)}</td>
      <td style="color:${scoreColor(s.score)};font-weight:700">${s.score}%</td>
      <td>${s.total ?? '—'}</td>
    </tr>`).join('')

  // UUID truncado a 8 chars en el PDF — legible sin ocupar toda la celda
  const falloTrs = fallos.slice(0, 8).map((f, i) => `
    <tr>
      <td style="color:var(--muted)">${i + 1}</td>
      <td style="font-family:monospace;font-size:11px">${shortId(f.question_id)}</td>
      <td style="color:#DC2626;font-weight:700">${f.fail_count}×</td>
      <td style="color:var(--muted)">${formatFecha(f.next_review)}</td>
    </tr>`).join('')

  const barW    = 28
  const barGap  = 8
  const chartW  = ultimas.length * (barW + barGap)
  const chartH  = 60
  const barsSVG = ultimas.map((e, i) => {
    const h   = Math.max(3, (e.score / 100) * chartH)
    const x   = i * (barW + barGap)
    const y   = chartH - h
    const col = scoreColor(e.score)
    return `<rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="4" fill="${col}" opacity="0.85"/>
            <text x="${x + barW/2}" y="${chartH + 12}" text-anchor="middle" font-size="9" fill="#6B7280">${e.score}%</text>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  :root { --ink:#111; --muted:#6B7280; --line:#E5E7EB; --bg:#F9FAFB; --surface:#fff; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: -apple-system, 'Segoe UI', sans-serif; color:var(--ink); background:#fff; padding:0; }
  .page { max-width:780px; margin:0 auto; padding:40px 48px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:20px; border-bottom:2px solid var(--ink); margin-bottom:28px; }
  .header-left h1 { font-size:22px; font-weight:800; margin-bottom:4px; }
  .header-left p  { font-size:13px; color:var(--muted); }
  .header-right   { text-align:right; }
  .header-right .academia { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
  .header-right .fecha    { font-size:12px; color:var(--muted); margin-top:4px; }
  .kpis { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; margin-bottom:28px; }
  .kpi  { background:var(--bg); border-radius:10px; padding:14px 10px; text-align:center; border:1px solid var(--line); }
  .kpi-val   { font-size:20px; font-weight:800; line-height:1; margin-bottom:4px; }
  .kpi-label { font-size:10px; color:var(--muted); text-transform:uppercase; letter-spacing:.05em; }
  .section { margin-bottom:24px; }
  .section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid var(--line); }
  table { width:100%; border-collapse:collapse; font-size:12.5px; }
  th    { text-align:left; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:var(--muted); padding:6px 8px; border-bottom:1px solid var(--line); }
  td    { padding:8px 8px; border-bottom:1px solid var(--line); color:var(--ink); }
  tr:last-child td { border-bottom:none; }
  tr:nth-child(even) td { background:#F9FAFB; }
  .nota-box { display:flex; align-items:center; gap:24px; background:var(--bg); border-radius:12px; padding:20px 24px; border:1px solid var(--line); margin-bottom:28px; }
  .nota-num  { font-size:48px; font-weight:800; line-height:1; }
  .nota-info h3 { font-size:16px; font-weight:700; margin-bottom:4px; }
  .nota-info p  { font-size:12px; color:var(--muted); }
  .chart-wrap { background:var(--bg); border-radius:10px; padding:16px 20px; border:1px solid var(--line); }
  .footer { margin-top:36px; padding-top:16px; border-top:1px solid var(--line); display:flex; justify-content:space-between; align-items:center; }
  .footer p { font-size:10px; color:var(--muted); }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-left">
      <h1>Informe de progreso</h1>
      <p style="font-size:16px;font-weight:700;margin-top:4px">${alumno.username}</p>
      <p>Acceso hasta: ${formatFecha(alumno.accessUntil)}</p>
    </div>
    <div class="header-right">
      <div class="academia">FrostFox Academy</div>
      <div class="fecha">Generado el ${now}</div>
    </div>
  </div>
  <div class="nota-box">
    <div class="nota-num" style="color:${notaColor}">${alumno.notaMedia ?? '—'}${alumno.notaMedia !== null ? '%' : ''}</div>
    <div class="nota-info">
      <h3>${notaLabel}</h3>
      <p>Basado en ${sesiones.length} sesion${sesiones.length !== 1 ? 'es' : ''} completada${sesiones.length !== 1 ? 's' : ''}</p>
      <p style="margin-top:4px">Racha actual: <strong>${alumno.racha} dia${alumno.racha !== 1 ? 's' : ''}</strong></p>
    </div>
  </div>
  <div class="kpis">
    <div class="kpi"><div class="kpi-val" style="color:#7C3AED">${alumno.notaMedia ?? '—'}${alumno.notaMedia !== null ? '%' : ''}</div><div class="kpi-label">Nota media</div></div>
    <div class="kpi"><div class="kpi-val" style="color:#059669">${sesiones.length}</div><div class="kpi-label">Sesiones</div></div>
    <div class="kpi"><div class="kpi-val" style="color:#0891B2">${temasLeidos.length}</div><div class="kpi-label">Temas leidos</div></div>
    <div class="kpi"><div class="kpi-val" style="color:#DC2626">${fallos.length}</div><div class="kpi-label">Preguntas falladas</div></div>
    <div class="kpi"><div class="kpi-val" style="color:#D97706">${alumno.racha}d</div><div class="kpi-label">Racha</div></div>
  </div>
  ${ultimas.length > 0 ? `
  <div class="section">
    <div class="section-title">Evolucion de nota (ultimas sesiones)</div>
    <div class="chart-wrap">
      <svg viewBox="0 0 ${Math.max(chartW, 100)} ${chartH + 20}" width="100%" height="${chartH + 20}">
        ${barsSVG}
      </svg>
    </div>
  </div>` : ''}
  ${sesiones.length > 0 ? `
  <div class="section">
    <div class="section-title">Ultimas sesiones</div>
    <table>
      <thead><tr><th>Fecha</th><th>Nota</th><th>Preguntas</th></tr></thead>
      <tbody>${sesTrs}</tbody>
    </table>
  </div>` : ''}
  ${fallos.length > 0 ? `
  <div class="section">
    <div class="section-title">Preguntas con mas fallos</div>
    <table>
      <thead><tr><th>#</th><th>ID pregunta</th><th>Fallos</th><th>Proximo repaso</th></tr></thead>
      <tbody>${falloTrs}</tbody>
    </table>
  </div>` : ''}
  <div class="footer">
    <p>FrostFox Academy</p>
    <p>${alumno.username} · Informe generado automaticamente</p>
  </div>
</div>
</body>
</html>`

  const win = window.open('', '_blank', 'width=900,height=700')
  win.document.write(html)
  win.document.close()
  win.onload = () => { setTimeout(() => win.print(), 300) }
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function AlumnoDetalle({ alumno, onBack, academyId, currentUser }) {
  const [sesiones,     setSesiones]    = useState([])
  const [temasLeidos,  setTemas]       = useState([])
  const [fallos,       setFallos]      = useState([])
  const [loading,      setLoading]     = useState(true)
  const [exporting,    setExporting]   = useState(false)
  const [showMsgModal, setShowMsgModal] = useState(false)
  const [msgTexto,     setMsgTexto]    = useState('')
  const [msgSending,   setMsgSending]  = useState(false)
  const [msgSent,      setMsgSent]     = useState(false)

  useEffect(() => {
    if (!alumno?.id) return
    const load = async () => {
      setLoading(true)
      const [{ data: sess }, { data: reads }, { data: wrongs }] = await Promise.all([
        supabase.from('sessions').select('score, played_at, created_at, total')
          .eq('user_id', alumno.id).order('created_at', { ascending: false }).limit(30),
        supabase.from('study_read').select('topic_id')
          .eq('user_id', alumno.id).eq('academy_id', academyId),
        supabase.from('wrong_answers').select('question_id, fail_count, next_review')
          .eq('user_id', alumno.id).order('fail_count', { ascending: false }).limit(20),
      ])
      setSesiones(sess || [])
      setTemas(reads || [])
      setFallos(wrongs || [])
      setLoading(false)
    }
    load()
  }, [alumno?.id, academyId])

  const handleExport = useCallback(() => {
    setExporting(true)
    try {
      generateInformePDF(alumno, sesiones, temasLeidos, fallos)
    } finally {
      setTimeout(() => setExporting(false), 1000)
    }
  }, [alumno, sesiones, temasLeidos, fallos])

  const handleEnviarMensaje = useCallback(async () => {
    if (!msgTexto.trim()) return
    setMsgSending(true)
    await supabase.from('notifications').insert({
      user_id: alumno.id,
      type:    'mensaje_profesor',
      title:   `Mensaje de tu profesor`,
      body:    msgTexto.trim(),
      link:    '/',
    })
    setMsgSending(false)
    setMsgSent(true)
    setTimeout(() => {
      setShowMsgModal(false)
      setMsgTexto('')
      setMsgSent(false)
    }, 1500)
  }, [alumno.id, msgTexto])

  const evolucion = [...sesiones].reverse().slice(-10).map((s, i) => ({
    i, score: s.score,
    date: new Date(s.played_at || s.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  }))

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <button className={styles.btnBack} onClick={onBack}>
          <ArrowLeft size={16} /> Volver
        </button>
        <div className={styles.alumnoTitle}>
          <div className={styles.alumnoAvatar}>{alumno.username[0].toUpperCase()}</div>
          <div>
            <h1 className={styles.pageTitle}>{alumno.username}</h1>
            <p className={styles.pageSubtitle}>
              Ultimo acceso: {alumno.diasInactivo === 0 ? 'Hoy' : alumno.diasInactivo === 1 ? 'Ayer' : `Hace ${alumno.diasInactivo} dias`}
            </p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnMsg} onClick={() => setShowMsgModal(true)}>
            <MessageSquare size={14} /> Mensaje
          </button>
          <button className={styles.btnExport} onClick={handleExport} disabled={exporting || loading}>
            {exporting
              ? <RefreshCw size={14} className={styles.spinner} />
              : <Download size={14} />}
            Exportar PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.state}><RefreshCw size={22} className={styles.spinner} /><p>Cargando…</p></div>
      ) : (
        <>
          <div className={styles.kpisRow}>
            <KpiCard icon={BarChart2}     label="Nota media"   value={alumno.notaMedia !== null ? `${alumno.notaMedia}%` : '—'} color="#7C3AED" />
            <KpiCard icon={Zap}           label="Sesiones"     value={sesiones.length}    color="#059669" />
            <KpiCard icon={BookOpen}      label="Temas leidos" value={temasLeidos.length} color="#0891B2" />
            <KpiCard icon={AlertTriangle} label="Fallos"       value={fallos.length}      color="#DC2626" />
            <KpiCard icon={TrendingUp}    label="Racha"        value={`${alumno.racha}d`} color="#D97706" />
            <KpiCard icon={Shield}        label="Acceso hasta" value={formatFecha(alumno.accessUntil)} color="#6B7280" />
          </div>

          <div className={styles.mainRow}>
            <div className={styles.donutCard}>
              <h3 className={styles.cardTitle}>Rendimiento global</h3>
              <div className={styles.donutCenter}>
                <DonutMini pct={alumno.notaMedia ?? 0} color={scoreColor(alumno.notaMedia)} size={100} stroke={10} />
              </div>
              <div className={styles.donutStats}>
                <div className={styles.donutStat}><span className={styles.donutStatVal}>{sesiones.length}</span><span className={styles.donutStatLabel}>sesiones</span></div>
                <div className={styles.donutStat}><span className={styles.donutStatVal}>{temasLeidos.length}</span><span className={styles.donutStatLabel}>temas</span></div>
                <div className={styles.donutStat}><span className={styles.donutStatVal}>{alumno.racha}d</span><span className={styles.donutStatLabel}>racha</span></div>
              </div>
            </div>

            <div className={styles.evolucionCard}>
              <h3 className={styles.cardTitle}>Evolucion de nota</h3>
              {evolucion.length === 0 ? (
                <div className={styles.emptyMini}><p>Sin sesiones todavia</p></div>
              ) : (
                <div className={styles.barChart}>
                  {evolucion.map(e => (
                    <div key={e.i} className={styles.barCol}>
                      <span className={styles.barScore}>{e.score}%</span>
                      <div className={styles.barTrack}>
                        <div className={styles.barFill} style={{ height: `${e.score}%`, background: scoreColor(e.score) }} />
                      </div>
                      <span className={styles.barDate}>{e.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.seccionCard}>
            <h3 className={styles.cardTitle}>Ultimas sesiones</h3>
            {sesiones.length === 0 ? <p className={styles.empty}>Sin sesiones registradas</p> : (
              <div className={styles.sesionTabla}>
                <div className={styles.sesionHeader}><span>Fecha</span><span>Nota</span><span>Preguntas</span></div>
                {sesiones.slice(0, 15).map((s, i) => (
                  <div key={i} className={styles.sesionRow}>
                    <span>{formatFecha(s.played_at || s.created_at)}</span>
                    <span className={styles.sesionNota} style={{ color: scoreColor(s.score) }}>{s.score}%</span>
                    <span>{s.total ?? '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {fallos.length > 0 && (
            <div className={styles.seccionCard}>
              <h3 className={styles.cardTitle}>Preguntas con mas fallos</h3>
              <div className={styles.fallosList}>
                {fallos.slice(0, 10).map((f, i) => (
                  <div key={f.question_id} className={styles.falloRow}>
                    <span className={styles.falloNum}>{i + 1}</span>
                    <span className={styles.falloId} title={f.question_id}>{shortId(f.question_id)}</span>
                    <div className={styles.falloBarTrack}>
                      <div className={styles.falloBarFill} style={{ width: `${Math.min((f.fail_count / (fallos[0]?.fail_count || 1)) * 100, 100)}%` }} />
                    </div>
                    <span className={styles.falloCount}>{f.fail_count}x</span>
                    <span className={styles.falloReview}>Repaso: {formatFecha(f.next_review)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal mensaje directo */}
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
                <Check size={20} style={{ color: '#059669' }} />
                <span>Mensaje enviado</span>
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
                  <span className={styles.msgHint}>
                    El alumno lo vera en su campanita de notificaciones
                  </span>
                  <button
                    className={styles.msgBtnEnviar}
                    onClick={handleEnviarMensaje}
                    disabled={msgSending || !msgTexto.trim()}>
                    {msgSending
                      ? <RefreshCw size={13} className={styles.spinner} />
                      : <Send size={13} />}
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
