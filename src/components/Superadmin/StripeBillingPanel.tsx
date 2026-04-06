import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard, Euro, TrendingUp, AlertTriangle, Check, X,
  Clock, Zap, ChevronRight, Building2, ArrowUpRight,
  Download, RefreshCw, Shield, Star, Rocket, Crown,
  Bell, Calendar, Users, CheckCircle, XCircle, Info, FileText
} from 'lucide-react'
import ManualBillingTab from './ManualBillingTab'
import styles from './StripeBillingPanel.module.css'

const EDGE_CHANGE_PLAN = 'https://zazqejluzyqihqhzbrga.supabase.co/functions/v1/stripe-change-plan'

interface Plan {
  id:               string
  name:             string
  icon:             React.ElementType
  color:            string
  bg:               string
  priceMonth:       number
  priceYear:        number
  priceYearMonthly: number
  popular?:         boolean
  features:         string[]
  noFeatures:       string[]
}

const PLANES: Plan[] = [
  { id:'starter', name:'Starter', icon:Shield,  color:'#6366F1', bg:'rgba(99,102,241,0.1)',   priceMonth:59,  priceYear:590,  priceYearMonthly:49,  features:['1 profesor','Hasta 30 alumnos','1 asignatura','Panel alumno completo','Tests autocorregidos','Estadísticas básicas','Plan semanal'], noFeatures:['Panel director','Múltiples asignaturas','Exportar PDF','Soporte prioritario'] },
  { id:'growth',  name:'Growth',  icon:Star,    color:'#F59E0B', bg:'rgba(245,158,11,0.1)',   priceMonth:99,  priceYear:990,  priceYearMonthly:83,  popular:true, features:['Hasta 3 profesores','Hasta 60 alumnos','Hasta 3 asignaturas','Todo lo del Starter','Panel director','Estadísticas avanzadas','Exportar PDF','Alertas automáticas'], noFeatures:['Soporte prioritario','IA configurable','Onboarding personalizado'] },
  { id:'academy', name:'Academy', icon:Rocket,  color:'#10B981', bg:'rgba(16,185,129,0.1)',   priceMonth:159, priceYear:1590, priceYearMonthly:133, features:['Hasta 5 profesores','Hasta 100 alumnos','Hasta 5 asignaturas','Todo lo del Growth','Soporte prioritario','IA configurable por asignatura','Onboarding personalizado'], noFeatures:['Alumnos ilimitados','API pública'] },
  { id:'pro',     name:'Pro',     icon:Crown,   color:'#8B5CF6', bg:'rgba(139,92,246,0.1)',   priceMonth:229, priceYear:2290, priceYearMonthly:191, features:['Profesores ilimitados','Alumnos ilimitados','Asignaturas ilimitadas','Todo lo del Academy','Soporte prioritario 24h','API pública','SLA garantizado'], noFeatures:[] },
]

interface StatusCfg { label: string; color: string; bg: string; icon: React.ElementType }
function statusConfig(s: string): StatusCfg {
  const map: Record<string, StatusCfg> = {
    paid:    { label:'Pagado',    color:'#22C55E', bg:'rgba(34,197,94,0.1)',  icon:CheckCircle },
    overdue: { label:'Vencido',   color:'#EF4444', bg:'rgba(239,68,68,0.1)',  icon:XCircle },
    pending: { label:'Pendiente', color:'#F59E0B', bg:'rgba(245,158,11,0.1)', icon:Clock },
    trial:   { label:'Trial',     color:'#6366F1', bg:'rgba(99,102,241,0.1)', icon:Zap },
  }
  return map[s] ?? { label: s, color:'#6B7280', bg:'rgba(107,114,128,0.1)', icon:Info }
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' })
}

interface Academia {
  id:             string
  name:           string
  slug:           string
  plan:           string
  price_monthly:  number | null
  payment_status: string | null
  payment_method: string | null
  suspended?:     boolean
  deleted_at?:    string | null
  billing_name?:  string | null
  billing_nif?:   string | null
  contract_renews?: string | null
  alumnosActivos?: number
}

// ── HeroBillingCard ────────────────────────────────────────────────────────
function HeroBillingCard({ academias }: { academias: Academia[] }) {
  const mrr     = academias.reduce((s, a) => s + (a.payment_status === 'active' && !a.suspended ? (parseFloat(String(a.price_monthly ?? 0)) || 0) : 0), 0)
  const activas = academias.filter(a => !a.suspended && !a.deleted_at).length
  const morosas = academias.filter(a => a.payment_status === 'overdue').length
  const trial   = academias.filter(a => !a.payment_status || a.payment_status === 'trial').length
  const arr     = mrr * 12
  return (
    <div className={styles.heroCard}>
      <div className={styles.floatOrb1} /><div className={styles.floatOrb2} />
      <div className={styles.heroTop}>
        <div>
          <div className={styles.heroLabel}>Monthly Recurring Revenue</div>
          <div className={styles.heroMrr}>
            <span className={styles.heroMrrCurrency}>€</span>
            <span className={styles.heroMrrVal}>{mrr.toLocaleString('es-ES')}</span>
          </div>
          <div style={{ fontSize:'.7rem', color:'rgba(255,255,255,.3)', marginTop:'.3rem' }}>ARR estimado: €{arr.toLocaleString('es-ES')}</div>
        </div>
        <div className={styles.heroTrend}><ArrowUpRight size={13} /><span>+12% vs mes anterior</span></div>
      </div>
      <div className={styles.ticker}><div className={styles.tickerFill} /></div>
      <div className={styles.heroBottom}>
        <div className={styles.heroStat}><span className={styles.heroStatVal}>{activas}</span><span className={styles.heroStatLabel}>Academias activas</span></div>
        <div className={styles.heroStatDiv} />
        {morosas > 0 && <><div className={styles.heroStat}><span className={styles.heroStatVal} style={{ color:'#EF4444' }}>{morosas}</span><span className={styles.heroStatLabel}>Morosas</span></div><div className={styles.heroStatDiv} /></>}
        {trial > 0 && <><div className={styles.heroStat}><span className={styles.heroStatVal} style={{ color:'#6366F1' }}>{trial}</span><span className={styles.heroStatLabel}>En trial</span></div><div className={styles.heroStatDiv} /></>}
        <div className={styles.heroStat}><span className={styles.heroStatVal}>€{(mrr / Math.max(activas, 1)).toFixed(0)}</span><span className={styles.heroStatLabel}>ARPU</span></div>
      </div>
    </div>
  )
}

// ── PlanDistCard ───────────────────────────────────────────────────────────
function PlanDistCard({ academias }: { academias: Academia[] }) {
  const counts: Record<string, number> = { starter:0, growth:0, academy:0, pro:0 }
 academias.forEach(a => { const c = counts[a.plan]; if (c !== undefined) counts[a.plan] = c + 1 })
  const total = Object.values(counts).reduce((s, n) => s + n, 0) || 1
  return (
    <div className={styles.distCard} style={{ position:'relative', overflow:'hidden' }}>
      <div className={styles.dotGrid}>{Array.from({ length:24 }, (_, i) => <span key={i} className={styles.dot} style={{ animationDelay:`${(i*.1)%2}s` }} />)}</div>
      <div className={styles.distTitle}>Distribución de planes</div>
      <div className={styles.distBars}>
        {PLANES.map(p => {
          const n = counts[p.id] ?? 0, pct = Math.round((n/total)*100)
          return (
            <div key={p.id} className={styles.distRow}>
              <div className={styles.distLabel}><span style={{ color:p.color, fontWeight:800 }}>{p.name}</span><span className={styles.distCount}>{n}</span></div>
              <div className={styles.distTrack}><motion.div className={styles.distFill} style={{ background:p.color }} initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:0.8, ease:'easeOut', delay:0.2 }} /></div>
              <span className={styles.distPct}>{pct}%</span>
            </div>
          )
        })}
      </div>
      <div className={styles.distMrr}>
        <Euro size={13} /><span>MRR por plan:</span>
        {PLANES.map(p => <span key={p.id} style={{ color:p.color, fontWeight:700 }}>{p.name} €{((counts[p.id]??0)*p.priceMonth).toLocaleString('es-ES')}</span>)}
      </div>
    </div>
  )
}

// ── PaymentAlerts ──────────────────────────────────────────────────────────
function PaymentAlerts({ academias }: { academias: Academia[] }) {
  const morosas = academias.filter(a => a.payment_status === 'overdue' && !a.deleted_at)
  const pending = academias.filter(a => a.payment_status === 'pending' && !a.deleted_at)
  if (!morosas.length && !pending.length) return null
  return (
    <div className={styles.alerts}>
      {morosas.length > 0 && (
        <motion.div className={styles.alertBanner} style={{ ['--ac' as string]:'#EF4444', ['--ab' as string]:'rgba(239,68,68,0.08)' }} initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}>
          <div className={styles.alertIcon} style={{ color:'#EF4444' }}><AlertTriangle size={15} /></div>
          <div className={styles.alertContent}><span className={styles.alertTitle}>{morosas.length} {morosas.length===1?'academia morosa':'academias morosas'}</span><span className={styles.alertSub}>{morosas.map(a=>a.name).join(', ')}</span></div>
          <button className={styles.alertBtn} style={{ color:'#EF4444', borderColor:'rgba(239,68,68,0.3)' }}>Enviar recordatorio</button>
        </motion.div>
      )}
      {pending.length > 0 && (
        <motion.div className={styles.alertBanner} style={{ ['--ac' as string]:'#F59E0B', ['--ab' as string]:'rgba(245,158,11,0.08)' }} initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
          <div className={styles.alertIcon} style={{ color:'#F59E0B' }}><Clock size={15} /></div>
          <div className={styles.alertContent}><span className={styles.alertTitle}>{pending.length} {pending.length===1?'pago pendiente':'pagos pendientes'}</span><span className={styles.alertSub}>{pending.map(a=>a.name).join(', ')}</span></div>
          <button className={styles.alertBtn} style={{ color:'#F59E0B', borderColor:'rgba(245,158,11,0.3)' }}>Ver detalles</button>
        </motion.div>
      )}
    </div>
  )
}

// ── UpgradeModal ───────────────────────────────────────────────────────────
function UpgradeModal({ academia, academiaId, currentPlan, onClose, onRecargar }: {
  academia: string; academiaId: string; currentPlan: string; onClose: () => void; onRecargar?: () => void
}) {
  const [selected, setSelected] = useState(currentPlan)
  const [billing,  setBilling]  = useState<'monthly'|'yearly'>('monthly')
  const [saving,   setSaving]   = useState(false)
  const [done,     setDone]     = useState(false)
  const [saveErr,  setSaveErr]  = useState('')

  const handleSave = async () => {
    if (selected === currentPlan) return
    setSaving(true); setSaveErr('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(EDGE_CHANGE_PLAN, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${session?.access_token}`, 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string },
        body: JSON.stringify({ academy_id:academiaId, new_plan:selected, billing_cycle:billing }),
      })
      const result = await res.json()
      if (!res.ok) { setSaveErr(result.error || `Error ${res.status}`); return }
      setDone(true)
      if (onRecargar) setTimeout(onRecargar, 1000)
      setTimeout(onClose, 2200)
    } catch (err: any) {
      setSaveErr(`Error inesperado: ${err.message}`)
    } finally { setSaving(false) }
  }

  const selectedPlan    = PLANES.find(p => p.id === selected)
  const currentPlanCfg  = PLANES.find(p => p.id === currentPlan)
  const isUpgrade       = PLANES.findIndex(p=>p.id===selected) > PLANES.findIndex(p=>p.id===currentPlan)

  return (
    <motion.div className={styles.modalOverlay} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={onClose}>
      <motion.div className={styles.upgradeModal} initial={{ scale:0.93, opacity:0, y:20 }} animate={{ scale:1, opacity:1, y:0 }} exit={{ scale:0.93, opacity:0 }} transition={{ type:'spring', damping:22, stiffness:300 }} onClick={e=>e.stopPropagation()}>
        {done ? (
          <div className={styles.upgradeSuccess}>
            <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', damping:15, stiffness:400 }}><CheckCircle size={48} style={{ color:'#22C55E' }} /></motion.div>
            <div className={styles.upgradeSuccessTitle}>Plan actualizado</div>
            <div className={styles.upgradeSuccessText}>{academia} ahora está en el plan <strong>{selectedPlan?.name}</strong></div>
          </div>
        ) : (<>
          <div className={styles.upgradeHeader}>
            <div><h3 className={styles.upgradeTitle}>Cambiar plan</h3><p className={styles.upgradeSub}>{academia}</p></div>
            <button className={styles.upgradeBtnClose} onClick={onClose}><X size={15} /></button>
          </div>
          <div className={styles.billingToggle}>
            <button className={[styles.toggleBtn, billing==='monthly'?styles.toggleBtnActive:''].join(' ')} onClick={()=>setBilling('monthly')}>Mensual</button>
            <button className={[styles.toggleBtn, billing==='yearly'?styles.toggleBtnActive:''].join(' ')} onClick={()=>setBilling('yearly')}>Anual <span className={styles.toggleSave}>-20%</span></button>
          </div>
          <div className={styles.planGrid}>
            {PLANES.map(plan => {
              const Icon  = plan.icon
              const price = billing==='yearly' ? plan.priceYear : plan.priceMonth
              const isCur = plan.id===currentPlan, isSel = plan.id===selected
              return (
                <button key={plan.id} className={[styles.planCard, isSel?styles.planCardSelected:'', isCur?styles.planCardCurrent:''].join(' ')} style={{ ['--pc' as string]:plan.color }} onClick={()=>setSelected(plan.id)}>
                  {plan.popular && <div className={styles.popularBadge}>Más popular</div>}
                  {isCur && <div className={styles.currentBadge}>Plan actual</div>}
                  <div className={styles.planCardIcon} style={{ background:plan.bg, color:plan.color }}><Icon size={18} /></div>
                  <div className={styles.planCardName}>{plan.name}</div>
                  <div className={styles.planCardPrice}><span className={styles.planCardPriceCur}>€</span><span className={styles.planCardPriceNum}>{price}</span><span className={styles.planCardPricePer}>/mes</span></div>
                  {billing==='yearly'&&<div className={styles.planCardYearlyNote}>€{price*12}/año</div>}
                  <div className={styles.planCardFeatures}>{plan.features.slice(0,4).map((f,i)=><div key={i} className={styles.planCardFeature}><Check size={11} style={{ color:plan.color, flexShrink:0 }}/><span>{f}</span></div>)}</div>
                  {isSel&&<motion.div className={styles.planCardCheck} initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', damping:15 }}><Check size={13}/></motion.div>}
                </button>
              )
            })}
          </div>
          {selected!==currentPlan && (
            <motion.div className={styles.changeSummary} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
              <div className={styles.changeSummaryIcon}>{isUpgrade?<ArrowUpRight size={16} style={{ color:'#22C55E' }}/>:<ChevronRight size={16} style={{ color:'#F59E0B', transform:'rotate(90deg)' }}/>}</div>
              <div className={styles.changeSummaryText}>{isUpgrade?`Upgrade de ${currentPlanCfg?.name} → ${selectedPlan?.name}. El importe se prorrateará automáticamente.`:`Downgrade de ${currentPlanCfg?.name} → ${selectedPlan?.name}. Efectivo al final del período actual.`}</div>
              <div className={styles.changeSummaryDiff} style={{ color:isUpgrade?'#22C55E':'#F59E0B' }}>{isUpgrade?'+':'−'}€{Math.abs((selectedPlan?.priceMonth??0)-(currentPlanCfg?.priceMonth??0))}/mes</div>
            </motion.div>
          )}
          {saveErr&&<div style={{ margin:'0 1.5rem .5rem', padding:'.65rem 1rem', borderRadius:'9px', background:'rgba(239,68,68,.07)', border:'1px solid rgba(239,68,68,.25)', color:'#dc2626', fontSize:'.83rem', fontWeight:500 }}>{saveErr}</div>}
          <div className={styles.upgradeActions}>
            <button className={styles.upgradeBtnCancel} onClick={onClose}>Cancelar</button>
            <button className={styles.upgradeBtnSave} onClick={handleSave} disabled={saving||selected===currentPlan}>
              {saving?<><RefreshCw size={14} className={styles.spinnerInline}/> Guardando…</>:selected===currentPlan?'Sin cambios':`Confirmar cambio a ${selectedPlan?.name}`}
            </button>
          </div>
        </>)}
      </motion.div>
    </motion.div>
  )
}

// ── ActivarBtn ─────────────────────────────────────────────────────────────
function ActivarBtn({ academia, onRecargar }: { academia: Academia; onRecargar?: () => void }) {
  const [loading, setLoading] = useState(false)
  const [msg,     setMsg]     = useState('')
  const [err,     setErr]     = useState('')

  const handleActivar = async () => {
    setLoading(true); setMsg(''); setErr('')
    try {
      const trialEnd = new Date(); trialEnd.setDate(trialEnd.getDate() + 30)
      const { error } = await supabase.from('academies').update({ payment_status:'pending', trial_ends_at:trialEnd.toISOString() }).eq('id', academia.id)
      if (error) { setErr(error.message); return }
      setMsg('Trial de 30 días activado correctamente.')
      if (onRecargar) setTimeout(onRecargar, 800)
    } catch (e: any) { setErr(`Error inesperado: ${e.message}`) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
      <button className={styles.billingBtnAccent} onClick={handleActivar} disabled={loading}>
        {loading?<><RefreshCw size={12} className={styles.spinnerInline}/> Activando…</>:<><CreditCard size={12}/> Activar suscripción</>}
      </button>
      {msg && <span style={{ fontSize:'11px', color:'#16a34a', fontWeight:600 }}>{msg}</span>}
      {err && <span style={{ fontSize:'11px', color:'#dc2626', fontWeight:600 }}>{err}</span>}
    </div>
  )
}

// ── AcademiaBillingRow ─────────────────────────────────────────────────────
function AcademiaBillingRow({ academia, onUpgrade, onRecargar }: { academia: Academia; onUpgrade: (a: Academia) => void; onRecargar?: () => void }) {
  const [open, setOpen] = useState(false)
  const plan      = PLANES.find(p => p.id === academia.plan) ?? PLANES[0]!
  const st        = statusConfig(academia.payment_status ?? 'pending')
  const StatusIcon = st.icon
  const isTrial   = !academia.payment_status || academia.payment_status === 'trial'
  const trialDays = 14

  return (
    <motion.div layout className={styles.billingRow} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
      <button className={styles.billingRowHeader} onClick={() => setOpen(o => !o)}>
        <div className={styles.billingRowLeft}>
          <div className={styles.billingRowIcon}><Building2 size={14} /></div>
          <div><div className={styles.billingRowName}>{academia.name}</div><div className={styles.billingRowSlug}>/{academia.slug}</div></div>
        </div>
        <div className={styles.billingRowPlan} style={{ color:plan.color, background:plan.bg }}>{plan.name}</div>
        {isTrial && <div className={styles.trialBadge}><Clock size={11} /> {trialDays}d restantes</div>}
        <div className={styles.billingRowPrice}>
          {(academia.price_monthly ?? 0) > 0
            ? <><span className={styles.billingRowPriceNum}>€{academia.price_monthly}</span><span className={styles.billingRowPricePer}>/mes</span></>
            : <span className={styles.billingRowPriceFree}>Trial gratuito</span>}
        </div>
        <div className={styles.billingRowStatus} style={{ color:st.color, background:st.bg }}><StatusIcon size={11} />{st.label}</div>
        <motion.div animate={{ rotate:open?180:0 }} transition={{ duration:0.2 }} style={{ color:'var(--ink-subtle)', display:'flex' }}><ChevronRight size={14} /></motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.25, ease:[0.4,0,0.2,1] }} style={{ overflow:'hidden' }}>
            <div className={styles.billingRowBody}>
              <div className={styles.billingMini}>
                <div className={styles.billingMiniStat}><span className={styles.billingMiniLabel}>Próxima factura</span><span className={styles.billingMiniVal}>{isTrial?`En ${trialDays} días`:'1 abr 2026'}</span></div>
                <div className={styles.billingMiniStat}><span className={styles.billingMiniLabel}>Método de pago</span><span className={styles.billingMiniVal}>{academia.payment_method ?? 'Transferencia'}</span></div>
                <div className={styles.billingMiniStat}><span className={styles.billingMiniLabel}>Alumnos activos</span><span className={styles.billingMiniVal}>{academia.alumnosActivos ?? 0}</span></div>
                {academia.contract_renews && <div className={styles.billingMiniStat}><span className={styles.billingMiniLabel}>Contrato hasta</span><span className={styles.billingMiniVal}>{new Date(academia.contract_renews).toLocaleDateString('es-ES')}</span></div>}
              </div>
              {isTrial && (
                <div className={styles.trialBar}>
                  <div className={styles.trialBarTop}><Zap size={13} style={{ color:'#6366F1' }}/><span>Trial activo — quedan <strong>{trialDays} días</strong></span><span style={{ marginLeft:'auto', fontSize:'0.72rem', color:'var(--ink-subtle)' }}>Expira el 5 abr 2026</span></div>
                  <div className={styles.trialTrack}><div className={styles.trialFill} style={{ width:`${((14-trialDays)/14)*100}%` }}/></div>
                </div>
              )}
              <div className={styles.billingRowActions}>
                <button className={styles.billingBtn} onClick={() => onUpgrade(academia)}><TrendingUp size={12} /> Cambiar plan</button>
                <button className={styles.billingBtn}><Bell size={12} /> Enviar recordatorio</button>
                <button className={styles.billingBtn}><Download size={12} /> Descargar factura</button>
                {isTrial && <ActivarBtn academia={academia} onRecargar={onRecargar} />}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── PaymentHistory ─────────────────────────────────────────────────────────
function PaymentHistory({ academias }: { academias: Academia[] }) {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data, error } = await supabase.from('invoices').select('*, academies(name, plan)').order('created_at', { ascending:false }).limit(50)
      if (!error && data) setInvoices(data)
      setLoading(false)
    }
    fetchData()
  }, [])

  const exportCSV = () => {
    const rows = [
      ['Fecha','Academia','Plan','Importe','Estado'],
      ...invoices.map(inv => [inv.created_at?.slice(0,10), inv.academies?.name ?? inv.academy_id, inv.academies?.plan ?? '—', `€${((inv.amount_cents??0)/100).toFixed(2)}`, inv.status])
    ]
    const csv  = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type:'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href=url; a.download=`facturas_${new Date().toISOString().slice(0,10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={styles.historyCard}>
      <div className={styles.historyHeader}>
        <div className={styles.historyTitle}><Calendar size={14} /> Historial de pagos</div>
        <button className={styles.historyExport} onClick={exportCSV}><Download size={13} /> Exportar CSV</button>
      </div>
      <div className={styles.historyList}>
        {loading && <div style={{ padding:'2rem', textAlign:'center', color:'#aaa', fontSize:'.85rem' }}>Cargando facturas…</div>}
        {!loading && invoices.length===0 && <div style={{ padding:'2rem', textAlign:'center', color:'#aaa', fontSize:'.85rem' }}>Aún no hay facturas.</div>}
        {!loading && invoices.map(inv => {
          const st = statusConfig(inv.status)
          const StatusIcon = st.icon
          const importe = ((inv.amount_cents??0)/100).toFixed(2)
          const plan    = PLANES.find(p => p.id === inv.academies?.plan)
          return (
            <div key={inv.id} className={styles.historyRow}>
              <div className={styles.historyRowLeft}>
                <div className={styles.historyRowIcon} style={{ color:st.color, background:st.bg }}><StatusIcon size={12}/></div>
                <div>
                  <div className={styles.historyRowName}>{inv.academies?.name ?? inv.academy_id}</div>
                  <div className={styles.historyRowDate}>{formatDate(inv.created_at)} · Plan {plan?.name ?? inv.academies?.plan ?? '—'}</div>
                </div>
              </div>
              <div className={styles.historyRowRight}>
                <div className={styles.historyRowAmount}>€{importe}</div>
                <div className={styles.historyRowStatus} style={{ color:st.color, background:st.bg }}>{st.label}</div>
                {inv.invoice_url && <a href={inv.invoice_url} target="_blank" rel="noreferrer" className={styles.historyRowBtn} title="Ver factura en Stripe"><Download size={11}/></a>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Panel principal ────────────────────────────────────────────────────────
export default function StripeBillingPanel({ academias = [] as Academia[], onRecargar }: { academias?: Academia[]; onRecargar?: () => void }) {
  const [upgradeAcad, setUpgradeAcad] = useState<Academia | null>(null)
  const [tab,         setTab]         = useState('academias')
  const acadsActivas = academias.filter(a => !a.deleted_at)

  const TABS = [
    { id:'academias', label:'Academias',          icon:Building2 },
    { id:'historial', label:'Historial Stripe',   icon:Calendar  },
    { id:'planes',    label:'Planes',             icon:Star      },
    { id:'manual',    label:'Facturación manual', icon:FileText  },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div><h1 className={styles.pageTitle}>Facturación</h1><p className={styles.pageSubtitle}>Gestión de planes y pagos · Stripe</p></div>
        <div className={styles.headerBadge}>
          <div className={styles.stripeDot} />
          <span>Stripe {import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? 'conectado' : 'no conectado'}</span>
        </div>
      </div>

      <PaymentAlerts academias={acadsActivas} />

      <div className={styles.bentoTop}>
        <HeroBillingCard academias={acadsActivas} />
        <PlanDistCard academias={acadsActivas} />
      </div>

      <div className={styles.tabs}>
        {TABS.map(t => (
          <button key={t.id} className={[styles.tab, tab===t.id?styles.tabActive:''].join(' ')} onClick={() => setTab(t.id)}>
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {tab==='academias' && (
        <div className={styles.billingList}>
          {acadsActivas.length===0 ? (
            <div className={styles.emptyState}><Building2 size={32} strokeWidth={1.2}/><p>No hay academias activas</p></div>
          ) : acadsActivas.map(ac => <AcademiaBillingRow key={ac.id} academia={ac} onUpgrade={setUpgradeAcad} onRecargar={onRecargar} />)}
        </div>
      )}

      {tab==='historial' && <PaymentHistory academias={acadsActivas} />}

      {tab==='planes' && (
        <div className={styles.planesSection}>
          <div className={styles.planesGrid}>
            {PLANES.map((plan, idx) => {
              const Icon = plan.icon
              const acadsOnPlan = acadsActivas.filter(a => a.plan===plan.id).length
              return (
                <motion.div key={plan.id} className={[styles.planShowCard, plan.popular?styles.planShowCardPopular:''].join(' ')} style={{ ['--pc' as string]:plan.color, ['--pb' as string]:plan.bg }} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:idx*0.1 }}>
                  {plan.popular && <div className={styles.planShowPopular}>Más popular</div>}
                  <div className={styles.planShowTop}>
                    <div className={styles.planShowIconWrap}><Icon size={22}/></div>
                    <div className={styles.planShowName}>{plan.name}</div>
                    <div className={styles.planShowPrice}><span className={styles.planShowPriceCur}>€</span><span className={styles.planShowPriceNum}>{plan.priceMonth}</span><span className={styles.planShowPricePer}>/mes</span></div>
                    <div className={styles.planShowPriceYear}>o €{plan.priceYear}/mes con facturación anual</div>
                    <div className={styles.planShowUsage}><Users size={11}/>{acadsOnPlan} {acadsOnPlan===1?'academia':'academias'} en este plan</div>
                  </div>
                  <div className={styles.planShowFeatures}>
                    {plan.features.map((f,i)=><div key={i} className={styles.planShowFeature}><Check size={12} style={{ color:plan.color, flexShrink:0 }}/><span>{f}</span></div>)}
                    {plan.noFeatures.map((f,i)=><div key={i} className={styles.planShowFeatureNo}><X size={12} style={{ color:'var(--ink-subtle)', flexShrink:0 }}/><span>{f}</span></div>)}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {tab==='manual' && <ManualBillingTab academias={acadsActivas} />}

      <AnimatePresence>
        {upgradeAcad && (
          <UpgradeModal key="upgrade" academia={upgradeAcad.name} academiaId={upgradeAcad.id} currentPlan={upgradeAcad.plan ?? 'starter'} onClose={() => setUpgradeAcad(null)} onRecargar={onRecargar} />
        )}
      </AnimatePresence>
    </div>
  )
}
