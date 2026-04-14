import { useState, useMemo } from 'react'
import {
  Euro, TrendingUp, AlertTriangle, CheckCircle, Clock,
  Download, ChevronLeft, ChevronRight, FileText,
  MessageSquare, Check, RefreshCw, BarChart2, X
} from 'lucide-react'
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
  const conPrecio = alumnos.filter(a => a.monthly_price)
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
  historico: { month: string; cobrado: number; total: number }[]
}) {
  const W = 600; const H = 120; const PAD = { top: 16, right: 24, bottom: 32, left: 24 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top  - PAD.bottom

  const pcts = historico.map(h => h.total ? Math.round((h.cobrado/h.total)*100) : 0)
  const maxPct = Math.max(...pcts, 100)

  const points = historico.map((_, i) => ({
    x: PAD.left + (i / Math.max(historico.length - 1, 1)) * innerW,
    y: PAD.top  + (1 - pcts[i]! / maxPct) * innerH,
    pct: pcts[i]!,
    month: historico[i]!.month,
  }))

  // Smooth curve via cubic bezier
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
    <div className={styles.grafico}>
      <div className={styles.graficoTitle}><BarChart2 size={14}/> Evolución de cobros — últimos 6 meses</div>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.graficoSvg}>
        <defs>
          <linearGradient id="cobroGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#059669" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="#059669" stopOpacity="0.02"/>
          </linearGradient>
        </defs>
        {/* Area fill */}
        <path d={areaD} fill="url(#cobroGrad)"/>
        {/* Line */}
        <path d={pathD} fill="none" stroke="#059669" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"/>
        {/* Dots + labels */}
        {points.map((pt, i) => {
          const [y, m] = pt.month.split('-')
          const color = pt.pct>=80?'#059669':pt.pct>=50?'#D97706':'#DC2626'
          return (
            <g key={i}>
              {/* Dot glow */}
              <circle cx={pt.x} cy={pt.y} r="4" fill={color} fillOpacity="0.12"/>
              <circle cx={pt.x} cy={pt.y} r="2.5" fill="white" stroke={color} strokeWidth="1.5"/>
              {/* Pct label */}
              <text x={pt.x} y={pt.y - 10} textAnchor="middle"
                fill={color} fontSize="10" fontWeight="700" fontFamily="var(--font-body)">
                {pt.pct > 0 ? `${pt.pct}%` : '—'}
              </text>
              {/* Month label */}
              <text x={pt.x} y={H - 14} textAnchor="middle"
                fill="var(--ink-muted,#6B7280)" fontSize="10" fontWeight="600" fontFamily="var(--font-body)">
                {MESES_CORTO[parseInt(m!)-1]}
              </text>
              <text x={pt.x} y={H - 2} textAnchor="middle"
                fill="var(--ink-subtle,#9CA3AF)" fontSize="9" fontFamily="var(--font-body)">
                {y}
              </text>
            </g>
          )
        })}
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

  const conPrecio    = alumnos.filter(a => a.monthly_price)
  const sinRegistro  = conPrecio.filter(a => !a.payment)
  const pagados      = alumnos.filter(a => a.payment?.status==='paid')
  const pendientes   = alumnos.filter(a => a.payment?.status==='pending')
  const vencidos     = alumnos.filter(a => a.payment?.status==='overdue')
  const mrrTotal     = conPrecio.reduce((s,a)=>s+(a.monthly_price??0),0)
  const mrrCobrado   = pagados.reduce((s,a)=>s+(a.monthly_price??0),0)
  const tasaCobro    = mrrTotal ? Math.round((mrrCobrado/mrrTotal)*100) : 0
  const enRiesgo     = vencidos.filter(a => a.payment?.created_at && Math.floor((Date.now()-new Date(a.payment.created_at).getTime())/86400000)>15)

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

      {/* KPIs */}
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
          <div className={styles.alumnosGrid}>
            {alumnos.map(a=>(
              <AlumnoCobroCard key={a.id} alumno={a} saving={saving[a.id]??false}
                onStatus={s=>onStatus(a.id,s)} onNota={n=>onNota(a.id,n)}/>
            ))}
          </div>
          {historico.length>0 && <ResumenAnual historico={historico}/>}
        </>
      )}
    </div>
  )
}
