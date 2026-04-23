import { useState, useMemo } from 'react'
import {
  Euro, TrendingUp, AlertTriangle, CheckCircle, Clock,
  Download, ChevronLeft, ChevronRight, FileText,
  MessageSquare, Check, RefreshCw, BarChart2, X,
  TrendingDown, Tag, Sparkles,
  Search, List, LayoutGrid
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { emit } from '../../../lib/eventBus'
import type { AlumnoCobro, AcademyPayment } from '../../../hooks/useCobros'
import styles from './CobrosAcademia.module.css'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const STATUS_META = {
  paid:    { label:'Pagado',    color:'#059669', bg:'rgba(5,150,105,0.08)',  icon: CheckCircle   },
  pending: { label:'Pendiente', color:'#D97706', bg:'rgba(217,119,6,0.08)',  icon: Clock         },
  overdue: { label:'Vencido',   color:'#DC2626', bg:'rgba(220,38,38,0.08)', icon: AlertTriangle  },
} as const

type Status = keyof typeof STATUS_META

function fmtEur(n: number) {
  return new Intl.NumberFormat('es-ES', { style:'currency', currency:'EUR', maximumFractionDigits:0 }).format(n)
}
function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day:'2-digit', month:'short' })
}

function exportarPDF(alumnos: AlumnoCobro[], mes: number, ano: number) {
  const mesNombre = MESES[mes]
  const conPrecio = alumnos.filter(a => (a.monthly_price ?? 0) > 0)
  const mrrTotal  = conPrecio.reduce((s,a) => s+(a.monthly_price??0), 0)
  const mrrCobrado = conPrecio.filter(a=>a.payment?.status==='paid').reduce((s,a)=>s+(a.monthly_price??0),0)

  const rows = conPrecio.map(a => {
    const status = a.payment?.status ?? 'sin registro'
    const meta   = STATUS_META[status as Status]
    const color  = meta?.color ?? '#6B7280'
    return `<tr>
      <td>${a.full_name ?? a.username}</td>
      <td style="color:#6b7280">@${a.username}</td>
      <td style="font-weight:700">${a.monthly_price?.toFixed(2).replace('.',',') ?? '—'} €</td>
      <td><span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:99px;background:${meta?.bg??'#f3f4f6'};color:${color};font-weight:700;font-size:11px">${meta?.label ?? status}</span></td>
      <td style="color:#6b7280">${a.payment?.paid_at ? fmtFecha(a.payment.paid_at) : '—'}</td>
      <td style="color:#6b7280;font-style:italic">${a.payment?.notes ?? ''}</td>
    </tr>`
  }).join('')

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<title>Cobros ${mesNombre} ${ano}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#1a1a1a;background:#fff;padding:48px;max-width:900px;margin:0 auto}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #111}
.brand-name{font-size:20px;font-weight:800;color:#111}.brand-name span{color:#2563EB}
.brand-sub{font-size:11px;color:#6b7280;margin-top:3px}
.report-title{font-size:22px;font-weight:800;color:#111}
.report-sub{font-size:11px;color:#6b7280;margin-top:4px}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:32px}
.kpi{padding:16px;border:1px solid #e5e7eb;border-radius:10px}
.kpi-val{font-size:22px;font-weight:900;color:#111;letter-spacing:-0.03em}
.kpi-label{font-size:11px;color:#6b7280;margin-top:4px}
table{width:100%;border-collapse:collapse}
thead{background:#111;color:#fff}
thead th{padding:10px 14px;font-size:11px;font-weight:600;text-align:left;letter-spacing:0.04em}
tbody td{padding:10px 14px;border-bottom:1px solid #f3f4f6;font-size:12px;vertical-align:middle}
.total-row{background:#f9fafb;font-weight:700}
.footer{margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;line-height:1.6}
@media print{body{padding:32px}}
</style></head><body>
<div class="header">
  <div><div class="brand-name">Frost<span>Fox</span></div><div class="brand-sub">Gestión de cobros — ${mesNombre} ${ano}</div></div>
  <div style="text-align:right"><div class="report-title">Cobros ${mesNombre} ${ano}</div><div class="report-sub">Generado el ${new Date().toLocaleDateString('es-ES',{day:'2-digit',month:'long',year:'numeric'})}</div></div>
</div>
<div class="kpis">
  <div class="kpi"><div class="kpi-val" style="color:#059669">${conPrecio.filter(a=>a.payment?.status==='paid').length}</div><div class="kpi-label">Pagados</div></div>
  <div class="kpi"><div class="kpi-val" style="color:#D97706">${conPrecio.filter(a=>a.payment?.status==='pending').length}</div><div class="kpi-label">Pendientes</div></div>
  <div class="kpi"><div class="kpi-val" style="color:#DC2626">${conPrecio.filter(a=>a.payment?.status==='overdue').length}</div><div class="kpi-label">Vencidos</div></div>
  <div class="kpi"><div class="kpi-val">${mrrTotal>0?Math.round((mrrCobrado/mrrTotal)*100):0}%</div><div class="kpi-label">Tasa de cobro — ${fmtEur(mrrCobrado)} / ${fmtEur(mrrTotal)}</div></div>
</div>
<table>
  <thead><tr><th>Alumno</th><th>Usuario</th><th>Precio/mes</th><th>Estado</th><th>Fecha pago</th><th>Notas</th></tr></thead>
  <tbody>
    ${rows}
    <tr class="total-row">
      <td colspan="2">TOTAL</td>
      <td>${fmtEur(mrrTotal)}/mes</td>
      <td></td><td></td><td></td>
    </tr>
  </tbody>
</table>
<div class="footer">Informe generado automáticamente por FrostFox Academy. Los datos reflejan el estado de cobros registrado en el sistema a la fecha de generación.</div>
</body></html>`

  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html); win.document.close(); win.print()
}

// ── Gráfico evolución ─────────────────────────────────────────────────────────
function GraficoEvolucion({ historico }: {
  historico: { month: string; cobrado: number; pendiente: number; total: number; nPagados: number; nTotal: number }[]
}) {
  const W = 720; const H = 200; const PAD = { top: 32, right: 24, bottom: 44, left: 42 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top  - PAD.bottom

  const maxPct = 100
  const pcts = historico.map(h => h.total ? Math.round((h.cobrado/h.total)*100) : 0)

  const points = historico.map((_, i) => ({
    x: PAD.left + (i / Math.max(historico.length - 1, 1)) * innerW,
    y: PAD.top  + (1 - pcts[i]! / maxPct) * innerH,
    pct: pcts[i]!,
    month: historico[i]!.month,
    data: historico[i]!,
  }))

  // Curva Catmull-Rom → Bezier para que fluya bonito
  const pathD = (() => {
    if (points.length < 2) return ''
    const t = 0.2
    let d = `M${points[0]!.x},${points[0]!.y}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] ?? points[i]!
      const p1 = points[i]!
      const p2 = points[i + 1]!
      const p3 = points[i + 2] ?? p2
      const c1x = p1.x + (p2.x - p0.x) * t
      const c1y = p1.y + (p2.y - p0.y) * t
      const c2x = p2.x - (p3.x - p1.x) * t
      const c2y = p2.y - (p3.y - p1.y) * t
      d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`
    }
    return d
  })()

  const areaD = points.length > 0
    ? `${pathD} L${points[points.length-1]!.x},${PAD.top+innerH} L${points[0]!.x},${PAD.top+innerH} Z`
    : ''

  const avgPct = pcts.length ? Math.round(pcts.reduce((a,b) => a+b, 0) / pcts.length) : 0
  const avgY   = PAD.top + (1 - avgPct / maxPct) * innerH

  // Mejor / peor mes — solo considerando meses con actividad (total > 0)
  const mesesConDatos = historico.map((h, i) => ({ pct: pcts[i]!, total: h.total })).filter(m => m.total > 0)
  const bestPct  = mesesConDatos.length ? Math.max(...mesesConDatos.map(m => m.pct)) : null
  const worstPct = mesesConDatos.length ? Math.min(...mesesConDatos.map(m => m.pct)) : null
  const bestIdx  = bestPct  !== null ? pcts.findIndex((p, i) => p === bestPct  && historico[i]!.total > 0) : -1
  const worstIdx = worstPct !== null ? pcts.findIndex((p, i) => p === worstPct && historico[i]!.total > 0) : -1

  // Delta del último mes cerrado vs el anterior cerrado (ambos con datos)
  const cerrados = historico
    .map((h, i) => ({ pct: pcts[i]!, total: h.total }))
    .filter(m => m.total > 0)
  const lastCerrado = cerrados[cerrados.length - 1]
  const prevCerrado = cerrados[cerrados.length - 2]
  const delta = lastCerrado && prevCerrado ? lastCerrado.pct - prevCerrado.pct : null

  const [hover, setHover] = useState<number | null>(null)
  const hoverPt = hover !== null ? points[hover]! : null
  const hoverData = hoverPt?.data

  return (
    <div className={styles.grafico}>
      <div className={styles.graficoHead}>
        <div className={styles.graficoHeadLeft}>
          <span className={styles.graficoEyebrow}>
            <BarChart2 size={11} strokeWidth={2}/> Evolución de cobros · últimos {historico.length} {historico.length === 1 ? 'mes' : 'meses'}
          </span>
          <div className={styles.graficoHeadMain}>
            <span className={styles.graficoBigPct}>{avgPct}%</span>
            <span className={styles.graficoBigLabel}>media del periodo</span>
            {delta !== null && delta !== 0 && (
              <span className={[styles.graficoDelta, delta > 0 ? styles.graficoDeltaPos : styles.graficoDeltaNeg].join(' ')}>
                {delta > 0 ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
                {delta > 0 ? '+' : ''}{delta}pts último mes
              </span>
            )}
          </div>
        </div>
        <div className={styles.graficoHeadRight}>
          <div className={styles.graficoStat}>
            <span className={styles.graficoStatLabel}>Últ.</span>
            <span className={styles.graficoStatVal}>{lastCerrado ? `${lastCerrado.pct}%` : '—'}</span>
          </div>
          <div className={styles.graficoStatDivider}/>
          <div className={styles.graficoStat}>
            <span className={styles.graficoStatLabel}>Mejor</span>
            <span className={[styles.graficoStatVal, styles.graficoStatValOk].join(' ')}>
              {bestPct !== null ? `${bestPct}%` : '—'}
            </span>
          </div>
          <div className={styles.graficoStatDivider}/>
          <div className={styles.graficoStat}>
            <span className={styles.graficoStatLabel}>Peor</span>
            <span className={[styles.graficoStatVal, styles.graficoStatValDanger].join(' ')}>
              {worstPct !== null ? `${worstPct}%` : '—'}
            </span>
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className={styles.graficoSvg} preserveAspectRatio="xMidYMid meet"
           onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="cobroGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#10B981" stopOpacity="0.28"/>
            <stop offset="55%"  stopColor="#059669" stopOpacity="0.10"/>
            <stop offset="100%" stopColor="#059669" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="cobroLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#10B981"/>
            <stop offset="100%" stopColor="#059669"/>
          </linearGradient>
          <filter id="cobroGlow">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Bandas verticales muy suaves para separar meses */}
        {points.map((pt, i) => i % 2 === 1 && (
          <rect key={`band-${i}`}
            x={pt.x - innerW / (points.length * 2 || 1)}
            y={PAD.top}
            width={innerW / (points.length || 1)}
            height={innerH}
            fill="var(--surface-off)"
            opacity="0.5"/>
        ))}

        {/* Gridlines Y: 0%, 50%, 100% */}
        {[0, 50, 100].map(t => {
          const y = PAD.top + (1 - t / maxPct) * innerH
          return (
            <g key={t}>
              <line x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y}
                stroke="var(--line)" strokeWidth="1"
                strokeDasharray={t === 0 ? undefined : '3 4'}
                opacity={t === 0 ? 0.7 : 0.35}/>
              <text x={PAD.left - 8} y={y + 3} textAnchor="end"
                fill="var(--ink-subtle)" fontSize="9" fontWeight="600"
                fontFamily="var(--font-body)">{t}%</text>
            </g>
          )
        })}

        {/* Línea de media del periodo */}
        {avgPct > 0 && points.length >= 2 && (
          <g>
            <line x1={PAD.left} y1={avgY} x2={PAD.left + innerW} y2={avgY}
              stroke="#059669" strokeOpacity="0.4" strokeWidth="1"
              strokeDasharray="2 4"/>
            <rect x={PAD.left + innerW - 42} y={avgY - 8} width={38} height={16} rx="4"
              fill="#059669" opacity="0.12"/>
            <text x={PAD.left + innerW - 23} y={avgY + 3} textAnchor="middle"
              fill="#059669" fontSize="9" fontWeight="700"
              fontFamily="var(--font-body)">med {avgPct}%</text>
          </g>
        )}

        {/* Area fill */}
        <path d={areaD} fill="url(#cobroGrad)" className={styles.graficoArea}/>

        {/* Línea principal con degradado */}
        <path d={pathD} fill="none" stroke="url(#cobroLine)" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          filter="url(#cobroGlow)"
          className={styles.graficoLine}/>

        {/* Línea vertical al hover */}
        {hoverPt && (
          <line x1={hoverPt.x} y1={PAD.top} x2={hoverPt.x} y2={PAD.top + innerH}
            stroke="#059669" strokeOpacity="0.25" strokeWidth="1"
            strokeDasharray="2 3"/>
        )}

        {/* Dots */}
        {points.map((pt, i) => {
          const [y, m] = pt.month.split('-')
          const sinDatos = pt.data.total === 0
          const color = sinDatos ? '#9CA3AF' : pt.pct >= 80 ? '#059669' : pt.pct >= 50 ? '#D97706' : '#DC2626'
          const isH = hover === i
          const isBest  = !sinDatos && i === bestIdx  && bestIdx  !== worstIdx
          const isWorst = !sinDatos && i === worstIdx && bestIdx  !== worstIdx

          return (
            <g key={i}
               onMouseEnter={() => setHover(i)}
               style={{ cursor: 'pointer' }}>

              {/* Hit area */}
              <rect x={pt.x - 26} y={PAD.top - 8} width={52} height={innerH + 16} fill="transparent"/>

              {/* Anillo exterior en hover */}
              {isH && (
                <circle cx={pt.x} cy={pt.y} r={10}
                  fill={color} fillOpacity={0.14}/>
              )}

              {/* Dot */}
              <circle cx={pt.x} cy={pt.y} r={isH ? 4.5 : (isBest || isWorst ? 3.8 : 3)}
                fill={isBest || isWorst ? color : 'white'}
                stroke={color} strokeWidth={isBest || isWorst ? 2 : 1.5}
                opacity={sinDatos ? 0.45 : 1}
                style={{ transition: 'r 0.2s ease' }}/>

              {/* % */}
              {!sinDatos && pt.pct > 0 && !isH && (
                <text x={pt.x} y={pt.y - 12} textAnchor="middle"
                  fill="var(--ink-muted)" fontSize="9" fontWeight="700"
                  fontFamily="var(--font-body)">{pt.pct}%</text>
              )}

              {/* Mes */}
              <text x={pt.x} y={H - 22} textAnchor="middle"
                fill={isH ? 'var(--ink)' : 'var(--ink-muted)'}
                fontSize="10" fontWeight={isH ? '700' : '600'}
                fontFamily="var(--font-body)"
                style={{ transition: 'fill 0.2s, font-weight 0.2s' }}>
                {MESES_CORTO[parseInt(m!)-1]}
              </text>
              {/* Año */}
              <text x={pt.x} y={H - 9} textAnchor="middle"
                fill="var(--ink-subtle)" fontSize="8" fontWeight="500"
                fontFamily="var(--font-body)">{y}</text>
            </g>
          )
        })}

        {/* Tooltip card */}
        {hoverPt && hoverData && (() => {
          const sinDatos = hoverData.total === 0
          const tipW = 176, tipH = sinDatos ? 44 : 76
          const tipX = Math.max(PAD.left, Math.min(W - PAD.right - tipW, hoverPt.x - tipW/2))
          const tipY = hoverPt.y - tipH - 16 < PAD.top ? hoverPt.y + 16 : hoverPt.y - tipH - 16
          const [,m] = hoverPt.month.split('-')
          const color = sinDatos ? '#9CA3AF' : hoverPt.pct >= 80 ? '#059669' : hoverPt.pct >= 50 ? '#D97706' : '#DC2626'
          return (
            <g style={{ pointerEvents: 'none' }}>
              <rect x={tipX} y={tipY} width={tipW} height={tipH} rx="10"
                fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1"
                filter="drop-shadow(0 8px 20px rgba(0,0,0,0.12))"/>
              <text x={tipX + 12} y={tipY + 17} fontSize="10" fontWeight="700" fill="var(--ink-muted)"
                fontFamily="var(--font-body)" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {MESES[parseInt(m!)-1]}
              </text>
              <text x={tipX + tipW - 12} y={tipY + 17} fontSize="12" fontWeight="800" fill={color}
                textAnchor="end" fontFamily="var(--font-body)">{sinDatos ? '—' : `${hoverPt.pct}%`}</text>
              <line x1={tipX + 12} y1={tipY + 24} x2={tipX + tipW - 12} y2={tipY + 24}
                stroke="var(--line)" strokeWidth="1"/>
              {sinDatos ? (
                <text x={tipX + tipW/2} y={tipY + 38} fontSize="10" fill="var(--ink-muted)"
                  textAnchor="middle" fontFamily="var(--font-body)" fontStyle="italic">Sin registros este mes</text>
              ) : (
                <>
                  <text x={tipX + 12} y={tipY + 40} fontSize="10" fill="var(--ink-muted)" fontFamily="var(--font-body)">Cobrado</text>
                  <text x={tipX + tipW - 12} y={tipY + 40} fontSize="10" fontWeight="700" fill="var(--ink)"
                    textAnchor="end" fontFamily="var(--font-body)">{fmtEur(hoverData.cobrado)}</text>
                  <text x={tipX + 12} y={tipY + 54} fontSize="10" fill="var(--ink-muted)" fontFamily="var(--font-body)">Pendiente</text>
                  <text x={tipX + tipW - 12} y={tipY + 54} fontSize="10" fontWeight="700" fill="var(--ink)"
                    textAnchor="end" fontFamily="var(--font-body)">{fmtEur(hoverData.pendiente)}</text>
                  <text x={tipX + 12} y={tipY + 68} fontSize="10" fill="var(--ink-muted)" fontFamily="var(--font-body)">Alumnos</text>
                  <text x={tipX + tipW - 12} y={tipY + 68} fontSize="10" fontWeight="700" fill="var(--ink)"
                    textAnchor="end" fontFamily="var(--font-body)">{hoverData.nPagados}/{hoverData.nTotal}</text>
                </>
              )}
            </g>
          )
        })()}
      </svg>
    </div>
  )
}

// ── Card alumno ───────────────────────────────────────────────────────────────
function AlumnoCobroCard({ alumno, saving, onStatus, onNota }: {
  alumno:   AlumnoCobro
  saving:   boolean
  onStatus: (s: Status) => void
  onNota:   (n: string) => void
}) {
  const [editNota,  setEditNota]  = useState(false)
  const [notaVal,   setNotaVal]   = useState(alumno.payment?.notes ?? '')
  const [confirmed, setConfirmed] = useState<Status | null>(null)

  const status = (alumno.payment?.status ?? 'pending') as Status
  const meta   = STATUS_META[status]
  const Icon   = meta.icon

  const handleStatus = (s: Status) => {
    onStatus(s); setConfirmed(s)
    setTimeout(() => setConfirmed(null), 2200)
  }

  return (
    <div className={[
        styles.alumnoCard,
        status==='paid' ? styles.alumnoCardPaid :
        status==='overdue' ? styles.alumnoCardOverdue :
        styles.alumnoCardPending
      ].join(' ')}>
      <div className={styles.alumnoCardTop}>
        <div className={styles.alumnoCardLeft}>
          <div className={styles.alumnoAvatar} style={{background:`${meta.color}18`,color:meta.color}}>
            {(alumno.full_name??alumno.username)[0]!.toUpperCase()}
          </div>
          <div>
            <div className={styles.alumnoNombre}>{alumno.full_name??alumno.username}</div>
            <div className={styles.alumnoUsername}>@{alumno.username}</div>
          </div>
        </div>
        <div className={styles.alumnoCardRight}>
          <div className={styles.alumnoPrecio}>{fmtEur(alumno.monthly_price??0)}<span>/mes</span></div>
          {confirmed ? (
            <span className={[styles.estadoBadge, styles.badgeConfirm].join(' ')}
              style={{color:STATUS_META[confirmed].color,background:STATUS_META[confirmed].bg}}>
              <Check size={10} strokeWidth={3}/>{STATUS_META[confirmed].label}
            </span>
          ) : (
            <span className={styles.estadoBadge} style={{color:meta.color,background:meta.bg}}>
              {saving?<RefreshCw size={10} className={styles.spinnerSm}/>:<Icon size={10} strokeWidth={2.5}/>}
              {saving?'Guardando…':meta.label}
            </span>
          )}
        </div>
      </div>

      {alumno.payment?.paid_at && (
        <div className={styles.alumnoFechaPago}>✓ Pagado el {fmtFecha(alumno.payment.paid_at)}</div>
      )}

      <div className={styles.alumnoNota}>
        {editNota ? (
          <div className={styles.notaEdit}>
            <input className={styles.notaInput} value={notaVal} onChange={e=>setNotaVal(e.target.value)}
              placeholder="Nota interna (Bizum, acuerdo, etc.)" autoFocus/>
            <button className={styles.notaGuardar} onClick={()=>{onNota(notaVal);setEditNota(false)}}><Check size={11}/></button>
            <button className={styles.notaCancelar} onClick={()=>setEditNota(false)}><X size={11}/></button>
          </div>
        ) : (
          <button className={styles.notaBtn} onClick={()=>setEditNota(true)}>
            <MessageSquare size={11}/>
            {alumno.payment?.notes||'Añadir nota interna'}
          </button>
        )}
      </div>

      <div className={styles.alumnoBtns}>
        {(['paid','pending','overdue'] as Status[]).filter(s=>s!==status).map(s=>{
          const m = STATUS_META[s]; const BIcon = m.icon
          return (
            <button key={s} className={styles.alumnoBtn}
              style={{'--bc':m.color} as React.CSSProperties}
              disabled={saving} onClick={()=>handleStatus(s)}>
              <BIcon size={11} strokeWidth={2}/>{m.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Fila alumno (modo lista) ──────────────────────────────────────────────────
function AlumnoCobroRow({ alumno, saving, onStatus, onNota }: {
  alumno:   AlumnoCobro
  saving:   boolean
  onStatus: (s: Status) => void
  onNota:   (n: string) => void
}) {
  const [editNota, setEditNota] = useState(false)
  const [notaVal,  setNotaVal]  = useState(alumno.payment?.notes ?? '')
  const [confirmed, setConfirmed] = useState<Status | null>(null)

  const status = (alumno.payment?.status ?? 'pending') as Status
  const meta   = STATUS_META[status]
  const Icon   = meta.icon

  const handleStatus = (s: Status) => {
    onStatus(s); setConfirmed(s)
    setTimeout(() => setConfirmed(null), 2200)
  }

  return (
    <div className={[
      styles.alumnoRow,
      status==='paid' ? styles.alumnoRowPaid :
      status==='overdue' ? styles.alumnoRowOverdue :
      styles.alumnoRowPending
    ].join(' ')}>
      <div className={styles.alumnoRowMain}>
        <div className={styles.alumnoRowAvatar} style={{background:`${meta.color}18`, color:meta.color}}>
          {(alumno.full_name??alumno.username)[0]!.toUpperCase()}
        </div>
        <div className={styles.alumnoRowInfo}>
          <div className={styles.alumnoRowNombre}>{alumno.full_name??alumno.username}</div>
          <div className={styles.alumnoRowUsername}>@{alumno.username}</div>
        </div>
      </div>

      <div className={styles.alumnoRowPrecio}>
        <span className={styles.alumnoRowPrecioVal}>{fmtEur(alumno.monthly_price??0)}</span>
        <span className={styles.alumnoRowPrecioLabel}>/mes</span>
      </div>

      <div className={styles.alumnoRowEstado}>
        {confirmed ? (
          <span className={[styles.estadoBadge, styles.badgeConfirm].join(' ')}
            style={{color:STATUS_META[confirmed].color, background:STATUS_META[confirmed].bg}}>
            <Check size={10} strokeWidth={3}/>{STATUS_META[confirmed].label}
          </span>
        ) : (
          <span className={styles.estadoBadge} style={{color:meta.color, background:meta.bg}}>
            {saving ? <RefreshCw size={10} className={styles.spinnerSm}/> : <Icon size={10} strokeWidth={2.5}/>}
            {saving ? 'Guardando…' : meta.label}
          </span>
        )}
        {alumno.payment?.paid_at && status === 'paid' && (
          <span className={styles.alumnoRowFecha}>✓ {fmtFecha(alumno.payment.paid_at)}</span>
        )}
      </div>

      <div className={styles.alumnoRowNota}>
        {editNota ? (
          <div className={styles.notaEdit}>
            <input className={styles.notaInput} value={notaVal} onChange={e=>setNotaVal(e.target.value)}
              placeholder="Nota interna" autoFocus/>
            <button className={styles.notaGuardar} onClick={()=>{onNota(notaVal); setEditNota(false)}}><Check size={11}/></button>
            <button className={styles.notaCancelar} onClick={()=>setEditNota(false)}><X size={11}/></button>
          </div>
        ) : (
          <button className={styles.notaBtnRow} onClick={()=>setEditNota(true)} title={alumno.payment?.notes || 'Añadir nota'}>
            <MessageSquare size={11}/>
            <span className={styles.notaBtnRowText}>{alumno.payment?.notes || 'Nota'}</span>
          </button>
        )}
      </div>

      <div className={styles.alumnoRowBtns}>
        {(['paid','pending','overdue'] as Status[]).filter(s => s !== status).map(s => {
          const m = STATUS_META[s]; const BIcon = m.icon
          return (
            <button key={s} className={styles.alumnoRowBtn}
              style={{'--bc': m.color} as React.CSSProperties}
              disabled={saving} onClick={()=>handleStatus(s)} title={m.label}>
              <BIcon size={11} strokeWidth={2}/>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Resumen anual ─────────────────────────────────────────────────────────────
function ResumenAnual({ historico }: {
  historico: {month:string;cobrado:number;pendiente:number;total:number;nPagados:number;nTotal:number}[]
}) {
  return (
    <div className={styles.resumenWrap}>
      <div className={styles.resumenHeader}>
        <FileText size={15}/> Resumen anual de cobros
      </div>
      <div className={styles.resumenTableWrap}>
        <table className={styles.resumenTable}>
          <thead>
            <tr><th>Mes</th><th>Alumnos</th><th>Cobrado</th><th>Pendiente</th><th>Tasa</th></tr>
          </thead>
          <tbody>
            {historico.map((h,i) => {
              const pct = h.total ? Math.round((h.cobrado/h.total)*100) : 0
              const [,m] = h.month.split('-')
              return (
                <tr key={i}>
                  <td className={styles.resumenMes}>{MESES[parseInt(m!)-1]}</td>
                  <td>{h.nPagados}/{h.nTotal}</td>
                  <td style={{color:'#059669',fontWeight:700}}>{fmtEur(h.cobrado)}</td>
                  <td style={{color:h.pendiente>0?'#D97706':'var(--ink-subtle)'}}>{fmtEur(h.pendiente)}</td>
                  <td>
                    <div className={styles.resumenBarRow}>
                      <div className={styles.resumenBar}>
                        <div className={styles.resumenBarFill} style={{
                          width:`${pct}%`,
                          background:pct>=80?'#059669':pct>=50?'#D97706':'#DC2626'
                        }}/>
                      </div>
                      <span style={{color:pct>=80?'#059669':pct>=50?'#D97706':'#DC2626',fontWeight:700}}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Finanzas en tiempo real ──────────────────────────────────────────────────
// Tira compacta con los KPIs globales de la academia + aplicación de precio base.
// Antes vivían en FinanzasPanel del Director; ahora viven aquí.
function FinanzasRealtime({ alumnos, onAplicadoBase }: {
  alumnos:        AlumnoCobro[]
  onAplicadoBase: () => void
}) {
  const [precioBase,   setPrecioBase]   = useState('')
  const [aplicando,    setAplicando]    = useState(false)
  const [feedback,     setFeedback]     = useState<string | null>(null)

  // Cálculos derivados — todos desde los datos que ya tenemos en alumnos
  const conPrecio   = alumnos.filter(a => (a.monthly_price ?? 0) > 0)
  const sinPrecio   = alumnos.filter(a => !a.monthly_price || a.monthly_price <= 0)
  const mrr         = conPrecio.reduce((s, a) => s + (a.monthly_price ?? 0), 0)
  const arr         = mrr * 12
  const now         = Date.now()
  const enRiesgoMRR = conPrecio.reduce((s, a) => {
    if (!a.access_until) return s
    const dias = Math.ceil((new Date(a.access_until).getTime() - now) / 86400000)
    if (dias > 0 && dias <= 30) return s + (a.monthly_price ?? 0)
    return s
  }, 0)

  const precioNum = parseFloat(precioBase.replace(',', '.'))
  const precioValido = !isNaN(precioNum) && precioNum > 0
  const puedeAplicar = precioValido && sinPrecio.length > 0

  const handleAplicar = async () => {
    if (!puedeAplicar || aplicando) return
    setAplicando(true); setFeedback(null)
    try {
      const rows = sinPrecio.map(a => ({
        id:             a.id,
        monthly_price:  precioNum,
        updated_at:     new Date().toISOString(),
      }))
      const { error } = await supabase
        .from('student_profiles')
        .upsert(rows, { onConflict: 'id' })
      if (error) {
        setFeedback(`Error: ${error.message}`)
      } else {
        setFeedback(`✓ Precio aplicado a ${sinPrecio.length} alumno${sinPrecio.length !== 1 ? 's' : ''}`)
        setPrecioBase('')
        // Notificar al resto de paneles (Acciones, Finanzas, etc.)
        emit('director-data-changed')
        onAplicadoBase()
        // Auto-limpiar feedback tras 3 segundos
        setTimeout(() => setFeedback(null), 3000)
      }
    } finally {
      setAplicando(false)
    }
  }

  return (
    <div className={styles.realtime}>
      <div className={styles.realtimeHead}>
        <div className={styles.realtimeEyebrow}>
          <Sparkles size={11} strokeWidth={2.2}/> Finanzas · tiempo real
        </div>
        <div className={styles.realtimeHint}>Se actualiza solo al cambiar precios o pagos</div>
      </div>

      <div className={styles.realtimeRow}>
        {/* Micro-KPIs */}
        <div className={styles.miniKpi}>
          <div className={styles.miniKpiIcon} style={{background:'rgba(5,150,105,0.10)',color:'#059669'}}>
            <Euro size={12} strokeWidth={2}/>
          </div>
          <div>
            <div className={styles.miniKpiVal}>{fmtEur(mrr)}</div>
            <div className={styles.miniKpiLabel}>MRR academia</div>
          </div>
        </div>

        <div className={styles.miniKpi}>
          <div className={styles.miniKpiIcon} style={{background:'rgba(37,99,235,0.10)',color:'#2563EB'}}>
            <TrendingUp size={12} strokeWidth={2}/>
          </div>
          <div>
            <div className={styles.miniKpiVal}>{fmtEur(arr)}</div>
            <div className={styles.miniKpiLabel}>ARR estimado</div>
          </div>
        </div>

        <div className={styles.miniKpi}>
          <div className={styles.miniKpiIcon} style={{background:'rgba(220,38,38,0.10)',color:'#DC2626'}}>
            <TrendingDown size={12} strokeWidth={2}/>
          </div>
          <div>
            <div className={styles.miniKpiVal} style={{color: enRiesgoMRR > 0 ? '#DC2626' : undefined}}>
              {enRiesgoMRR > 0 ? `-${fmtEur(enRiesgoMRR)}` : fmtEur(0)}
            </div>
            <div className={styles.miniKpiLabel}>MRR en riesgo &lt;30d</div>
          </div>
        </div>

        <div className={styles.miniKpi} data-warn={sinPrecio.length > 0 ? 'true' : 'false'}>
          <div className={styles.miniKpiIcon} style={{
            background: sinPrecio.length > 0 ? 'rgba(217,119,6,0.10)' : 'rgba(107,114,128,0.10)',
            color: sinPrecio.length > 0 ? '#D97706' : '#6B7280'
          }}>
            <AlertTriangle size={12} strokeWidth={2}/>
          </div>
          <div>
            <div className={styles.miniKpiVal} style={{color: sinPrecio.length > 0 ? '#D97706' : undefined}}>
              {sinPrecio.length}
            </div>
            <div className={styles.miniKpiLabel}>Sin precio</div>
          </div>
        </div>

        {/* Separador vertical */}
        <div className={styles.realtimeDivider}/>

        {/* Precio base */}
        <div className={styles.precioBase}>
          <div className={styles.precioBaseIcon} title="Aplica un precio unificado a los alumnos que aún no tienen precio">
            <Tag size={13} strokeWidth={2}/>
          </div>
          <div className={styles.precioBaseField}>
            <label className={styles.precioBaseLabel}>Precio base</label>
            <div className={styles.precioBaseRow}>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="69"
                value={precioBase}
                onChange={e => { setPrecioBase(e.target.value); setFeedback(null) }}
                disabled={aplicando || sinPrecio.length === 0}
                className={styles.precioBaseInput}
              />
              <span className={styles.precioBaseCurrency}>€</span>
              <button
                className={styles.precioBaseBtn}
                onClick={handleAplicar}
                disabled={!puedeAplicar || aplicando}
                title={sinPrecio.length === 0
                  ? 'Todos los alumnos ya tienen precio'
                  : `Aplicar ${precioValido ? fmtEur(precioNum) : '--'} a ${sinPrecio.length} alumno${sinPrecio.length !== 1 ? 's' : ''} sin precio`}>
                {aplicando
                  ? <><RefreshCw size={11} style={{animation:'spin 0.8s linear infinite'}}/> Aplicando…</>
                  : <>Aplicar a {sinPrecio.length}</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <div className={[styles.realtimeFeedback, feedback.startsWith('✓') ? styles.realtimeFeedbackOk : styles.realtimeFeedbackErr].join(' ')}>
          {feedback}
        </div>
      )}
    </div>
  )
}

// ── CobrosAcademia ────────────────────────────────────────────────────────────
interface Props {
  alumnos:    AlumnoCobro[]
  loading:    boolean
  saving:     Record<string,boolean>
  mes:        number
  ano:        number
  onPrevMes:  () => void
  onNextMes:  () => void
  onStatus:   (id:string, s:Status) => void
  onNota:     (id:string, n:string) => void
  onGenerar:  () => void
  onExportar: () => void
  historico:  {month:string;cobrado:number;pendiente:number;total:number;nPagados:number;nTotal:number}[]
}

export default function CobrosAcademia({ alumnos, loading, saving, mes, ano, onPrevMes, onNextMes, onStatus, onNota, onGenerar, onExportar, historico }: Props) {
  const now = new Date()
  const isCurrentMes = mes===now.getMonth() && ano===now.getFullYear()
  const isFuture = ano>now.getFullYear() || (ano===now.getFullYear() && mes>now.getMonth())

  const [busqueda,    setBusqueda]    = useState('')
  const [vista,       setVista]       = useState<'grid' | 'lista'>('grid')
  const [filtroEstado, setFiltroEstado] = useState<'todos' | Status>('todos')

  const conPrecio    = alumnos.filter(a => (a.monthly_price ?? 0) > 0)
  const sinRegistro  = conPrecio.filter(a => !a.payment)
  const pagados      = alumnos.filter(a => a.payment?.status==='paid')
  const pendientes   = alumnos.filter(a => a.payment?.status==='pending')
  const vencidos     = alumnos.filter(a => a.payment?.status==='overdue')
  const mrrTotal     = conPrecio.reduce((s,a)=>s+(a.monthly_price??0),0)
  const mrrCobrado   = pagados.reduce((s,a)=>s+(a.monthly_price??0),0)
  const tasaCobro    = mrrTotal ? Math.round((mrrCobrado/mrrTotal)*100) : 0
  const enRiesgo     = vencidos.filter(a => a.payment?.created_at && Math.floor((Date.now()-new Date(a.payment.created_at).getTime())/86400000)>15)

  // Filtrado buscador + estado
  const alumnosFiltrados = useMemo(() => {
    let arr = alumnos
    if (filtroEstado !== 'todos') {
      arr = arr.filter(a => (a.payment?.status ?? 'pending') === filtroEstado)
    }
    const q = busqueda.trim().toLowerCase()
    if (q) {
      arr = arr.filter(a => {
        const nombre = (a.full_name ?? '').toLowerCase()
        return a.username.toLowerCase().includes(q) || nombre.includes(q)
      })
    }
    return arr
  }, [alumnos, busqueda, filtroEstado])

  if (loading) return <div className={styles.loadingWrap}><div className={styles.spinner}/></div>

  return (
    <div className={styles.cobrosWrap}>

      {/* Selector mes */}
      <div className={styles.mesRow}>
        <button className={styles.mesBtnNav} onClick={onPrevMes}><ChevronLeft size={16}/></button>
        <div className={styles.mesInfo}>
          <span className={styles.mesNombre}>{MESES[mes]} {ano}</span>
          {isCurrentMes && <span className={styles.mesActualBadge}>Mes actual</span>}
        </div>
        <button className={styles.mesBtnNav} onClick={onNextMes} disabled={isFuture}><ChevronRight size={16}/></button>
        <div className={styles.mesAcciones}>
          {sinRegistro.length>0 && (
            <button className={styles.btnGenerar} onClick={onGenerar}>
              <RefreshCw size={12}/> Generar {sinRegistro.length} registros
            </button>
          )}
          <button className={styles.btnSecundario} onClick={onExportar}><Download size={13}/> CSV</button>
          <button className={styles.btnSecundario} onClick={()=>exportarPDF(alumnos,mes,ano)}><FileText size={13}/> PDF</button>
        </div>
      </div>

      {/* Finanzas en tiempo real — tira global (antes en Director > Finanzas) */}
      <FinanzasRealtime alumnos={alumnos} onAplicadoBase={() => { /* el bus ya recarga useCobros */ }} />

      {/* KPIs del mes — Pagados / Pendientes / Vencidos / Tasa */}
      <div className={styles.kpis}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{background:'rgba(5,150,105,0.1)',color:'#059669'}}><CheckCircle size={18} strokeWidth={1.8}/></div>
          <div className={styles.kpiVal} style={{color:'#059669'}}>{pagados.length}</div>
          <div className={styles.kpiLabel}>Pagados</div>
          <div className={styles.kpiSub}>{fmtEur(mrrCobrado)} cobrado</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{background:'rgba(217,119,6,0.1)',color:'#D97706'}}><Clock size={18} strokeWidth={1.8}/></div>
          <div className={styles.kpiVal} style={{color:'#D97706'}}>{pendientes.length}</div>
          <div className={styles.kpiLabel}>Pendientes</div>
          <div className={styles.kpiSub}>{fmtEur(pendientes.reduce((s,a)=>s+(a.monthly_price??0),0))}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{background:'rgba(220,38,38,0.1)',color:'#DC2626'}}><AlertTriangle size={18} strokeWidth={1.8}/></div>
          <div className={styles.kpiVal} style={{color:'#DC2626'}}>{vencidos.length}</div>
          <div className={styles.kpiLabel}>Vencidos</div>
          <div className={styles.kpiSub}>{fmtEur(vencidos.reduce((s,a)=>s+(a.monthly_price??0),0))}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{background:'rgba(37,99,235,0.1)',color:'#2563EB'}}><TrendingUp size={18} strokeWidth={1.8}/></div>
          <div className={styles.kpiVal} style={{color:tasaCobro>=80?'#059669':tasaCobro>=50?'#D97706':'#DC2626'}}>{tasaCobro}%</div>
          <div className={styles.kpiLabel}>Tasa de cobro</div>
          <div className={styles.kpiSub}>{fmtEur(mrrTotal)}/mes total</div>
        </div>
      </div>

      {/* Alerta churn */}
      {enRiesgo.length>0 && (
        <div className={styles.alertaChurn}>
          <AlertTriangle size={14} style={{color:'#DC2626',flexShrink:0}}/>
          <span><strong>{enRiesgo.length} alumno{enRiesgo.length!==1?'s':''}</strong> lleva{enRiesgo.length===1?'':'n'} más de 15 días vencido{enRiesgo.length!==1?'s':''} — riesgo de abandono: {enRiesgo.map(a=>a.full_name??a.username).join(', ')}</span>
        </div>
      )}

      {alumnos.length===0 ? (
        <div className={styles.emptyState}>
          <Euro size={36} strokeWidth={1.2} className={styles.emptyIcon}/>
          <p className={styles.emptyText}>No hay alumnos en esta academia.</p>
        </div>
      ) : sinRegistro.length===conPrecio.length && conPrecio.length > 0 ? (
        <div className={styles.emptyState}>
          <RefreshCw size={36} strokeWidth={1.2} className={styles.emptyIcon}/>
          <p className={styles.emptyText}>Sin registros para {MESES[mes]} {ano}.</p>
          <button className={styles.btnGenerar} onClick={onGenerar} style={{marginTop:'0.75rem'}}>
            <RefreshCw size={13}/> Generar registros del mes
          </button>
        </div>
      ) : (
        <>
          {historico.length>1 && <GraficoEvolucion historico={historico.slice(-6)}/>}

          {/* Toolbar: buscador + filtro estado + toggle vista */}
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <Search size={14} className={styles.searchIcon}/>
              <input
                className={styles.searchInput}
                placeholder="Buscar alumno por nombre o usuario…"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
              {busqueda && (
                <button className={styles.searchClear} onClick={() => setBusqueda('')} aria-label="Limpiar">
                  <X size={12}/>
                </button>
              )}
            </div>

            <div className={styles.filtrosEstado}>
              <button
                className={[styles.filtroEstado, filtroEstado==='todos' ? styles.filtroEstadoActive : ''].join(' ')}
                onClick={() => setFiltroEstado('todos')}>
                Todos <span className={styles.filtroEstadoCount}>{alumnos.length}</span>
              </button>
              <button
                className={[styles.filtroEstado, styles.filtroEstadoPaid, filtroEstado==='paid' ? styles.filtroEstadoPaidActive : ''].join(' ')}
                onClick={() => setFiltroEstado('paid')}
                disabled={pagados.length === 0}>
                <CheckCircle size={11}/> Pagados <span className={styles.filtroEstadoCount}>{pagados.length}</span>
              </button>
              <button
                className={[styles.filtroEstado, styles.filtroEstadoPending, filtroEstado==='pending' ? styles.filtroEstadoPendingActive : ''].join(' ')}
                onClick={() => setFiltroEstado('pending')}
                disabled={pendientes.length === 0}>
                <Clock size={11}/> Pendientes <span className={styles.filtroEstadoCount}>{pendientes.length}</span>
              </button>
              <button
                className={[styles.filtroEstado, styles.filtroEstadoOverdue, filtroEstado==='overdue' ? styles.filtroEstadoOverdueActive : ''].join(' ')}
                onClick={() => setFiltroEstado('overdue')}
                disabled={vencidos.length === 0}>
                <AlertTriangle size={11}/> Vencidos <span className={styles.filtroEstadoCount}>{vencidos.length}</span>
              </button>
            </div>

            <div className={styles.vistaToggle}>
              <button
                className={[styles.vistaBtn, vista==='grid' ? styles.vistaBtnActive : ''].join(' ')}
                onClick={() => setVista('grid')}
                aria-label="Vista en tarjetas">
                <LayoutGrid size={13}/> Tarjetas
              </button>
              <button
                className={[styles.vistaBtn, vista==='lista' ? styles.vistaBtnActive : ''].join(' ')}
                onClick={() => setVista('lista')}
                aria-label="Vista en lista">
                <List size={13}/> Lista
              </button>
            </div>
          </div>

          {alumnosFiltrados.length === 0 ? (
            <div className={styles.emptyFilterState}>
              <Search size={28} strokeWidth={1.3}/>
              <p>No hay alumnos para este filtro o búsqueda</p>
              {(busqueda || filtroEstado !== 'todos') && (
                <button className={styles.emptyFilterReset} onClick={() => { setBusqueda(''); setFiltroEstado('todos') }}>
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : vista === 'grid' ? (
            <div className={styles.alumnosGrid}>
              {alumnosFiltrados.map(a => (
                <AlumnoCobroCard key={a.id} alumno={a} saving={saving[a.id]??false}
                  onStatus={s => onStatus(a.id, s)} onNota={n => onNota(a.id, n)}/>
              ))}
            </div>
          ) : (
            <div className={styles.alumnosList}>
              {alumnosFiltrados.map(a => (
                <AlumnoCobroRow key={a.id} alumno={a} saving={saving[a.id]??false}
                  onStatus={s => onStatus(a.id, s)} onNota={n => onNota(a.id, n)}/>
              ))}
            </div>
          )}

          {alumnosFiltrados.length > 0 && (busqueda || filtroEstado !== 'todos') && (
            <div className={styles.footerCount}>
              Mostrando <strong>{alumnosFiltrados.length}</strong> de {alumnos.length} alumnos
            </div>
          )}

          {historico.length>0 && <ResumenAnual historico={historico}/>}
        </>
      )}
    </div>
  )
}
