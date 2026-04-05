import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSuperadmin } from '../../hooks/useSuperadmin'
import {
  Building2, Users, Zap, BarChart2, Plus, RefreshCw,
  ChevronDown, AlertTriangle, Check, X,
  Euro, TrendingUp, PauseCircle, PlayCircle,
  Edit3, Phone, Mail, FileText, Activity,
  ArrowUpRight, Trash2, RotateCcw,
  GraduationCap, CreditCard, BookOpen
} from 'lucide-react'
import AcademiaDetalle from './AcademiaDetalle'
import logoAzul from '../../assets/azul.webp'
import styles from './SuperadminPanel.module.css'

function slugify(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
}
const PLANES = ['starter','growth','academy','pro']
const PAYMENT_METHODS = ['transferencia','tarjeta','domiciliacion']
const PAYMENT_STATUS = [
  { id:'active',  label:'Al día',    color:'#22C55E' },
  { id:'pending', label:'Pendiente', color:'#F59E0B' },
  { id:'overdue', label:'Moroso',    color:'#EF4444' },
]
const COLORS = ['#0F766E','#7C3AED','#DC2626','#D97706','#0891B2','#059669','#DB2777','#2563EB']
const PLAN_CFG = {
  starter: { color:'#6366F1', bg:'rgba(99,102,241,0.15)',  label:'STARTER' },
  growth:  { color:'#F59E0B', bg:'rgba(245,158,11,0.15)',  label:'GROWTH'  },
  academy: { color:'#10B981', bg:'rgba(16,185,129,0.15)',  label:'ACADEMY' },
  pro:     { color:'#5de4ff', bg:'rgba(93,228,255,0.12)',  label:'PRO'     },
}
function statusLabel(s){ return PAYMENT_STATUS.find(p=>p.id===s)||PAYMENT_STATUS[0] }

// ── Count-up ──────────────────────────────────────────
function useCountUp(target, duration=1100){
  const [val,setVal] = useState(0)
  useEffect(()=>{
    if(target==null||isNaN(Number(target))){ setVal(target); return }
    const n = Number(String(target).replace(/[^0-9.]/g,''))
    let start = null
    const step = ts => {
      if(!start) start = ts
      const p = Math.min((ts-start)/duration, 1)
      setVal(Math.floor((1-Math.pow(1-p,3))*n))
      if(p<1){ requestAnimationFrame(step) } else { setVal(target) }
    }
    requestAnimationFrame(step)
  },[target,duration])
  return val
}

// ── Sparkline ─────────────────────────────────────────
function Sparkline({ data=[], color='#5de4ff', width=80, height=32 }){
  if(!data.length) return null
  const max=Math.max(...data), min=Math.min(...data), range=max-min||1
  const pts = data.map((v,i)=>({
    x:(i/(data.length-1))*width,
    y:height-((v-min)/range)*(height-4)-2
  }))
  const d = pts.map((p,i)=>i===0?`M${p.x},${p.y}`:`L${p.x},${p.y}`).join(' ')
  const [lx,ly] = [pts[pts.length-1].x, pts[pts.length-1].y]
  return (
    <svg width={width} height={height} style={{overflow:'visible'}}>
      <defs>
        <linearGradient id={`spGrad_${color.replace('#','')}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="1"/>
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke={`url(#spGrad_${color.replace('#','')})`} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={lx} cy={ly} r="2.5" fill={color}
        style={{filter:`drop-shadow(0 0 4px ${color})`}}/>
    </svg>
  )
}

// ── Action Banner ─────────────────────────────────────
function ActionBanner({ msg, type, onClose }){
  if(!msg) return null
  const isErr = type==='error'
  return (
    <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}
      exit={{opacity:0,y:-8}}
      className={isErr ? styles.bannerErr : styles.bannerOk}>
      {isErr ? <AlertTriangle size={15}/> : <Check size={15}/>}
      <span>{msg}</span>
      <button onClick={onClose} className={styles.bannerClose}><X size={13}/></button>
    </motion.div>
  )
}

// ── Modal base ────────────────────────────────────────
function Modal({ title, onClose, children, wide }){
  return (
    <motion.div className={styles.overlay} initial={{opacity:0}} animate={{opacity:1}}
      exit={{opacity:0}} onClick={onClose}>
      <motion.div className={[styles.modal, wide?styles.modalWide:''].join(' ')}
        initial={{scale:0.92,opacity:0,y:20}}
        animate={{scale:1,opacity:1,y:0}}
        exit={{scale:0.92,opacity:0,y:20}}
        transition={{type:'spring',damping:22,stiffness:300}}
        onClick={e=>e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
          <button className={styles.modalClose} onClick={onClose}><X size={15}/></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}

function Field({ label, hint, children }){
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      {children}
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  )
}

// ── Modal academia ────────────────────────────────────
function ModalAcademia({ academia, onGuardar, onClose }){
  const isEdit = !!academia
  const [form,setForm] = useState({
    name:academia?.name||'', slug:academia?.slug||'', plan:academia?.plan||'starter',
    contact_email:academia?.contact_email||'', contact_phone:academia?.contact_phone||'',
    city:academia?.city||'', province:academia?.province||'',
    billing_name:academia?.billing_name||'', billing_nif:academia?.billing_nif||'',
    billing_address:academia?.billing_address||'', price_monthly:academia?.price_monthly||'',
    payment_method:academia?.payment_method||'transferencia',
    payment_status:academia?.payment_status||'active',
    contract_start:academia?.contract_start||'', contract_renews:academia?.contract_renews||'',
    notes:academia?.notes||'',
  })
  const [error,setError] = useState('')
  const [saving,setSaving] = useState(false)
  const [tab,setTab] = useState('basico')
  const set = (k,v) => {
    if(k==='name'&&!isEdit) setForm(f=>({...f,name:v,slug:slugify(v)}))
    else setForm(f=>({...f,[k]:v}))
  }
  const handleSubmit = async () => {
    if(!form.name.trim()){ setError('El nombre es obligatorio'); return }
    if(!isEdit&&!form.slug.trim()){ setError('El slug es obligatorio'); return }
    setSaving(true)
    const res = await onGuardar(form)
    if(res.error){ setError(res.error); setSaving(false) } else onClose()
  }
  const tabs = [{id:'basico',label:'Básico'},{id:'contacto',label:'Contacto'},{id:'facturacion',label:'Facturación'},{id:'notas',label:'Notas'}]
  return (
    <Modal title={isEdit?`Editar — ${academia.name}`:'Nueva academia'} onClose={onClose} wide>
      <div className={styles.modalTabs}>
        {tabs.map(t=>(
          <button key={t.id} className={[styles.modalTab,tab===t.id?styles.modalTabActive:''].join(' ')}
            onClick={()=>setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      <div className={styles.modalBody}>
        {tab==='basico'&&(<>
          <Field label="Nombre de la academia">
            <input className={styles.input} value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Ej: Academia Opositas Madrid" autoFocus/>
          </Field>
          {!isEdit&&(<Field label="Slug (URL)" hint="Solo letras, números y guiones">
            <input className={styles.input} value={form.slug} onChange={e=>set('slug',e.target.value)} placeholder="academia-opositas-madrid"/>
          </Field>)}
          <Field label="Plan">
            <div className={styles.optBtns}>
              {PLANES.map(p=>(<button key={p} className={[styles.optBtn,form.plan===p?styles.optBtnActive:''].join(' ')} onClick={()=>set('plan',p)}>{p.charAt(0).toUpperCase()+p.slice(1)}</button>))}
            </div>
          </Field>
        </>)}
        {tab==='contacto'&&(<>
          <Field label="Email de contacto"><input className={styles.input} type="email" value={form.contact_email} onChange={e=>set('contact_email',e.target.value)} placeholder="academia@ejemplo.com"/></Field>
          <Field label="Teléfono"><input className={styles.input} value={form.contact_phone} onChange={e=>set('contact_phone',e.target.value)} placeholder="+34 600 000 000"/></Field>
          <div className={styles.fieldRow}>
            <Field label="Ciudad"><input className={styles.input} value={form.city} onChange={e=>set('city',e.target.value)} placeholder="Madrid"/></Field>
            <Field label="Provincia"><input className={styles.input} value={form.province} onChange={e=>set('province',e.target.value)} placeholder="Madrid"/></Field>
          </div>
        </>)}
        {tab==='facturacion'&&(<>
          <Field label="Razón social"><input className={styles.input} value={form.billing_name} onChange={e=>set('billing_name',e.target.value)} placeholder="Academia Opositas S.L."/></Field>
          <div className={styles.fieldRow}>
            <Field label="NIF/CIF"><input className={styles.input} value={form.billing_nif} onChange={e=>set('billing_nif',e.target.value)} placeholder="B12345678"/></Field>
            <Field label="Precio mensual (€)"><input className={styles.input} type="number" value={form.price_monthly} onChange={e=>set('price_monthly',e.target.value)} placeholder="49"/></Field>
          </div>
          <Field label="Método de pago">
            <div className={styles.optBtns}>{PAYMENT_METHODS.map(m=>(<button key={m} className={[styles.optBtn,form.payment_method===m?styles.optBtnActive:''].join(' ')} onClick={()=>set('payment_method',m)}>{m.charAt(0).toUpperCase()+m.slice(1)}</button>))}</div>
          </Field>
          <Field label="Estado de pago">
            <div className={styles.optBtns}>{PAYMENT_STATUS.map(s=>(<button key={s.id} className={[styles.optBtn,form.payment_status===s.id?styles.optBtnActive:''].join(' ')} onClick={()=>set('payment_status',s.id)} style={form.payment_status===s.id?{background:s.color,borderColor:s.color,color:'#fff'}:{}}>{s.label}</button>))}</div>
          </Field>
          <div className={styles.fieldRow}>
            <Field label="Inicio de contrato"><input className={styles.input} type="date" value={form.contract_start} onChange={e=>set('contract_start',e.target.value)}/></Field>
            <Field label="Renovación"><input className={styles.input} type="date" value={form.contract_renews} onChange={e=>set('contract_renews',e.target.value)}/></Field>
          </div>
        </>)}
        {tab==='notas'&&(<Field label="Notas internas"><textarea className={styles.textarea} value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Notas visibles solo para el superadmin…" rows={5}/></Field>)}
        {error&&<div className={styles.errorMsg}><AlertTriangle size={13}/>{error}</div>}
        <div className={styles.modalActions}>
          <button className={styles.btnCancel} onClick={onClose}>Cancelar</button>
          <button className={styles.btnPrimary} onClick={handleSubmit} disabled={saving}>
            {saving?<><RefreshCw size={13} className={styles.spinnerInline}/> Guardando…</>:isEdit?'Guardar cambios':'Crear academia'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Modal asignatura ──────────────────────────────────
function ModalAsignatura({ academia, onCrear, onClose }){
  const [name,setName] = useState('')
  const [slug,setSlug] = useState('')
  const [color,setColor] = useState(COLORS[0])
  const [error,setError] = useState('')
  const [saving,setSaving] = useState(false)
  const handleCrear = async () => {
    if(!name.trim()||!slug.trim()){ setError('Nombre y slug obligatorios'); return }
    setSaving(true)
    const res = await onCrear({academyId:academia.id,name,slug,color})
    if(res.error){ setError(res.error); setSaving(false) } else onClose()
  }
  return (
    <Modal title={`Nueva asignatura — ${academia.name}`} onClose={onClose}>
      <div className={styles.modalBody}>
        <Field label="Nombre"><input className={styles.input} value={name} onChange={e=>{setName(e.target.value);setSlug(slugify(e.target.value))}} placeholder="Archivística" autoFocus/></Field>
        <Field label="Slug"><input className={styles.input} value={slug} onChange={e=>setSlug(e.target.value)} placeholder="archivistica"/></Field>
        <Field label="Color">
          <div className={styles.colorPicker}>
            {COLORS.map(c=>(<button key={c} className={[styles.colorBtn,color===c?styles.colorBtnActive:''].join(' ')} style={{'--col':c}} onClick={()=>setColor(c)}>{color===c&&<Check size={11}/>}</button>))}
          </div>
        </Field>
        {error&&<div className={styles.errorMsg}><AlertTriangle size={13}/>{error}</div>}
        <div className={styles.modalActions}>
          <button className={styles.btnCancel} onClick={onClose}>Cancelar</button>
          <button className={styles.btnPrimary} onClick={handleCrear} disabled={saving}>
            {saving?<><RefreshCw size={13} className={styles.spinnerInline}/> Creando…</>:'Crear asignatura'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Modal usuario ─────────────────────────────────────
function ModalUsuario({ academia, onCrear, onClose }){
  const [username,setUsername] = useState('')
  const [password,setPassword] = useState('')
  const [role,setRole] = useState('alumno')
  const [subjectId,setSubjectId] = useState(academia.subjects?.[0]?.id||'')
  const [email,setEmail] = useState('')
  const [error,setError] = useState('')
  const [saving,setSaving] = useState(false)
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const suffix = role==='alumno'?'alumno':role==='profesor'?'prof':'dir'
  const emailPreview = email.trim()||`${username||'usuario'}.<generado>@${academia?.slug}.${suffix}`
  const handleCrear = async () => {
    if(!username.trim()||password.length<4){ setError('Usuario requerido y contraseña mínimo 4 caracteres'); return }
    if(role!=='director'&&!subjectId){ setError('Selecciona una asignatura'); return }
    if((role==='profesor'||role==='director')&&!email.trim()){ setError('El email real es obligatorio'); return }
    if((role==='profesor'||role==='director')&&!emailValido){ setError('El email no tiene un formato válido'); return }
    setSaving(true)
    const res = await onCrear({username,password,role,academyId:academia.id,subjectId:role!=='director'?subjectId:null,academySlug:academia.slug,emailOverride:email.trim()||null})
    if(res.error){ setError(res.error); setSaving(false) } else onClose()
  }
  return (
    <Modal title={`Nuevo usuario — ${academia.name}`} onClose={onClose}>
      <div className={styles.modalBody}>
        <Field label="Rol">
          <div className={styles.optBtns}>{['alumno','profesor','director'].map(r=>(<button key={r} className={[styles.optBtn,role===r?styles.optBtnActive:''].join(' ')} onClick={()=>setRole(r)}>{r.charAt(0).toUpperCase()+r.slice(1)}</button>))}</div>
        </Field>
        <Field label="Nombre de usuario"><input className={styles.input} value={username} onChange={e=>setUsername(e.target.value.toLowerCase())} placeholder="nombre_alumno" autoFocus/></Field>
        <Field label="Contraseña"><input className={styles.input} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo 4 caracteres"/></Field>
        {['profesor','alumno'].includes(role)&&academia.subjects?.length>0&&(
          <Field label="Asignatura">
            <select className={styles.select} value={subjectId} onChange={e=>setSubjectId(e.target.value)}>
              {academia.subjects.map(s=>(<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
          </Field>
        )}
        {(role==='profesor'||role==='director')&&(<Field label="Email real" hint="Necesario para recuperar contraseña"><input className={styles.input} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="profesor@ejemplo.com"/></Field>)}
        <Field label="Email generado"><div className={styles.emailPreview}>{emailPreview}</div></Field>
        {error&&<div className={styles.errorMsg}><AlertTriangle size={13}/>{error}</div>}
        <div className={styles.modalActions}>
          <button className={styles.btnCancel} onClick={onClose}>Cancelar</button>
          <button className={styles.btnPrimary} onClick={handleCrear} disabled={saving}>
            {saving?<><RefreshCw size={13} className={styles.spinnerInline}/> Creando…</>:'Crear usuario'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── KPI Card ──────────────────────────────────────────
function KpiCard({ icon:Icon, label, value, color, sub, delay=0, chart }){
  const displayed = useCountUp(typeof value==='number'?value:null)
  return (
    <motion.div className={styles.kpiCard}
      initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
      transition={{delay,duration:0.4}}
      style={{'--kc':color}}>
      <div className={styles.kpiTop}>
        <div className={styles.kpiIconWrap} style={{background:`${color}18`,border:`1px solid ${color}30`}}>
          <Icon size={16} style={{color}}/>
        </div>
        {chart && <Sparkline data={chart} color={color} width={70} height={28}/>}
      </div>
      <div className={styles.kpiVal}>{typeof value==='number'?displayed:value}</div>
      <div className={styles.kpiLabel}>{label}</div>
      {sub && <div className={styles.kpiSub}>{sub}</div>}
      <div className={styles.kpiGlow} style={{background:`radial-gradient(ellipse at 50% 100%, ${color}18 0%, transparent 70%)`}}/>
    </motion.div>
  )
}

// ── Hero MRR Card ─────────────────────────────────────
function HeroCard({ stats }){
  const mrr = useCountUp(stats?.mrr||0)
  const arr = Math.round((stats?.mrr||0)*12)
  return (
    <motion.div className={styles.heroCard}
      initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.5}}>
      <div className={styles.heroCardTop}>
        <div>
          <div className={styles.heroCardPill}>
            <span className={styles.pulseDot}/>
            MRR en tiempo real
          </div>
          <div className={styles.heroCardVal}>€{mrr.toLocaleString('es-ES')}</div>
          <div className={styles.heroCardSub}>ARR estimado · <strong style={{color:'#e8f4f8'}}>€{arr.toLocaleString('es-ES')}</strong></div>
        </div>
        <img src={logoAzul} alt="FrostFox" className={styles.heroLogo}/>
      </div>
      <div className={styles.heroCardStats}>
        <div className={styles.heroStatItem}>
          <span className={styles.heroStatNum}>{stats?.acadActivas||0}</span>
          <span className={styles.heroStatLabel}>academias activas</span>
        </div>
        <div className={styles.heroStatDivider}/>
        <div className={styles.heroStatItem}>
          <span className={styles.heroStatNum}>{stats?.totalAlumnos||0}</span>
          <span className={styles.heroStatLabel}>alumnos totales</span>
        </div>
        <div className={styles.heroStatDivider}/>
        <div className={styles.heroStatItem}>
          <span className={styles.heroStatNum}>{stats?.sesiones30d||0}</span>
          <span className={styles.heroStatLabel}>sesiones 30d</span>
        </div>
      </div>
    </motion.div>
  )
}

// ── Payment Health Card ────────────────────────────────
function PaymentHealthCard({ stats }){
  const total     = stats?.totalAcademias||1
  const activas   = stats?.acadActivas||0
  const morosas   = stats?.morosos||0
  const pendientes= stats?.pendientePago||0
  const aldía     = Math.max(0, activas - morosas - pendientes)
  const pct       = Math.round((aldía/total)*100)
  return (
    <motion.div className={styles.healthCard}
      initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.1,duration:0.5}}>
      <div className={styles.healthTitle}>Estado de pago</div>
      <div className={styles.healthRows}>
        <div className={styles.healthRow}>
          <span className={styles.healthDot} style={{background:'#22C55E'}}/>
          <span className={styles.healthRowLabel}>Al día</span>
          <span className={styles.healthRowVal} style={{color:'#22C55E'}}>{aldía}</span>
        </div>
        <div className={styles.healthRow}>
          <span className={styles.healthDot} style={{background:'#F59E0B'}}/>
          <span className={styles.healthRowLabel}>Pendiente</span>
          <span className={styles.healthRowVal} style={{color:'#F59E0B'}}>{pendientes}</span>
        </div>
        <div className={styles.healthRow}>
          <span className={styles.healthDot} style={{background:'#EF4444'}}/>
          <span className={styles.healthRowLabel}>Morosa</span>
          <span className={styles.healthRowVal} style={{color:'#EF4444'}}>{morosas}</span>
        </div>
      </div>
      <div className={styles.healthBar}>
        <div className={styles.healthBarFill} style={{width:`${pct}%`}}/>
      </div>
      <div className={styles.healthPct}>{pct}% solvencia</div>
    </motion.div>
  )
}

// ── Academia Card ──────────────────────────────────────
function AcademiaCard({ ac, onVerDetalle, onEditar, onNuevaAsignatura, onNuevoUsuario, onToggleSuspender, onEliminar }){
  const [open,setOpen]             = useState(false)
  const [suspending,setSuspending] = useState(false)
  const [actionError,setActionError] = useState('')
  const st      = statusLabel(ac.payment_status)
  const plan    = ac.plan||'starter'
  const planCfg = PLAN_CFG[plan]||{color:'#6B7280',bg:'rgba(107,114,128,0.12)',label:plan.toUpperCase()}

  const handleSuspender = async () => {
    setSuspending(true); setActionError('')
    const res = await onToggleSuspender(ac.id, !ac.suspended)
    setSuspending(false)
    if(res?.error) setActionError(res.error)
  }

  return (
    <motion.div layout
      initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,scale:0.97}}
      transition={{type:'spring',damping:26,stiffness:300}}
      className={[styles.acadCard, ac.suspended?styles.acadCardSuspended:'', open?styles.acadCardOpen:''].join(' ')}>

      <button className={styles.acadHeader} onClick={()=>setOpen(o=>!o)}>
        <div className={styles.acadIcon} style={{borderColor:`${planCfg.color}30`,background:`${planCfg.color}10`}}>
          <Building2 size={16} style={{color:planCfg.color}}/>
        </div>
        <div className={styles.acadInfo}>
          <div className={styles.acadName}>
            {ac.name}
            {ac.suspended&&<span className={styles.acadSuspTag}>SUSPENDIDA</span>}
          </div>
          <div className={styles.acadMeta}>
            <code className={styles.acadSlug}>/{ac.slug}</code>
            {ac.city&&<><span className={styles.acadDot}>·</span><span>{ac.city}</span></>}
          </div>
        </div>

        <div className={styles.acadStats}>
          <div className={styles.acadStat}>
            <span className={styles.acadStatNum}>{ac.totalAlumnos}</span>
            <span className={styles.acadStatLabel}>alumnos</span>
          </div>
          <div className={styles.acadStatDivider}/>
          <div className={styles.acadStat}>
            <span className={styles.acadStatNum} style={{color:ac.alumnosActivos>0?'#5de4ff':'inherit'}}>
              {ac.alumnosActivos}
            </span>
            <span className={styles.acadStatLabel}>activos</span>
          </div>
          {ac.sesiones30d>0&&(<>
            <div className={styles.acadStatDivider}/>
            <div className={styles.acadStat}>
              <span className={styles.acadStatNum}>{ac.sesiones30d}</span>
              <span className={styles.acadStatLabel}>sesiones</span>
            </div>
          </>)}
        </div>

        <div className={styles.acadPrice}>
          {ac.price_monthly>0
            ? <><span className={styles.acadPriceNum}>€{ac.price_monthly}</span><span className={styles.acadPricePer}>/mes</span></>
            : <span className={styles.acadPriceFree}>—</span>
          }
        </div>

        <div className={styles.acadBadges}>
          <span className={styles.acadStatus}
            style={{color:st.color,background:`${st.color}15`,border:`1px solid ${st.color}35`}}>
            <span className={styles.acadStatusDot} style={{background:st.color}}/>
            {st.label}
          </span>
          <span className={styles.acadPlan} style={{color:planCfg.color,background:planCfg.bg}}>
            {planCfg.label}
          </span>
          {ac.healthScore!==null&&(
            <span className={styles.acadHealth} style={{
              color:      ac.healthScore>=7?'#22C55E':ac.healthScore>=4?'#F59E0B':'#EF4444',
              background: ac.healthScore>=7?'rgba(34,197,94,0.1)':ac.healthScore>=4?'rgba(245,158,11,0.1)':'rgba(239,68,68,0.1)',
              border:     `1px solid ${ac.healthScore>=7?'rgba(34,197,94,0.25)':ac.healthScore>=4?'rgba(245,158,11,0.25)':'rgba(239,68,68,0.25)'}`,
            }}>
              {ac.healthScore>=7?'●':ac.healthScore>=4?'◐':'○'} {ac.healthScore}/10
            </span>
          )}
        </div>

        <motion.div className={styles.acadChevron} animate={{rotate:open?180:0}} transition={{duration:0.2}}>
          <ChevronDown size={14}/>
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open&&(
          <motion.div key="panel"
            initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}}
            exit={{height:0,opacity:0}} transition={{duration:0.28,ease:[0.4,0,0.2,1]}}
            style={{overflow:'hidden'}}>
            <div className={styles.acadPanel}>
              {actionError&&(
                <div className={styles.acadPanelErr}>
                  <AlertTriangle size={12}/>{actionError}
                  <button onClick={()=>setActionError('')} style={{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',color:'#EF4444',padding:0,display:'flex'}}><X size={11}/></button>
                </div>
              )}
              <div className={styles.acadBento}>
                <div className={styles.acadCell}>
                  <div className={styles.acadCellLabel}>Contacto</div>
                  {ac.contact_email&&(<a href={`mailto:${ac.contact_email}`} className={styles.acadCellLine}><Mail size={11}/> {ac.contact_email}</a>)}
                  {ac.contact_phone&&(<span className={styles.acadCellLine}><Phone size={11}/> {ac.contact_phone}</span>)}
                  {!ac.contact_email&&!ac.contact_phone&&(<span className={styles.acadCellEmpty}>Sin contacto</span>)}
                </div>
                <div className={styles.acadCell}>
                  <div className={styles.acadCellLabel}>Facturación</div>
                  {ac.billing_name&&(<span className={styles.acadCellBig}>{ac.billing_name}</span>)}
                  {ac.billing_nif&&(<span className={styles.acadCellLine}><FileText size={11}/> {ac.billing_nif}</span>)}
                  {ac.contract_renews&&(<span className={styles.acadCellLine} style={{color:'rgba(93,228,255,0.4)'}}>Renueva: {new Date(ac.contract_renews).toLocaleDateString('es-ES')}</span>)}
                  {!ac.billing_name&&!ac.billing_nif&&(<span className={styles.acadCellEmpty}>Sin datos</span>)}
                </div>
                <div className={styles.acadCell}>
                  <div className={styles.acadCellLabelRow}>
                    <span className={styles.acadCellLabel}>Asignaturas</span>
                    <button className={styles.acadCellBtn} onClick={e=>{e.stopPropagation();onNuevaAsignatura(ac)}}><Plus size={10}/> Nueva</button>
                  </div>
                  {!ac.subjects?.length
                    ? <span className={styles.acadCellEmpty}>Sin asignaturas</span>
                    : <div className={styles.acadSubjects}>
                        {ac.subjects.map(s=>(
                          <span key={s.id} className={styles.acadSubjectChip}>
                            <span style={{width:6,height:6,borderRadius:'50%',background:s.color,display:'inline-block',flexShrink:0}}/>
                            {s.name}
                          </span>
                        ))}
                      </div>
                  }
                </div>
                <div className={[styles.acadCell, styles.acadCellNote].join(' ')}>
                  <div className={styles.acadCellLabel}>Nota interna</div>
                  {ac.notes
                    ? <span className={styles.acadNoteText}>{ac.notes}</span>
                    : <span className={styles.acadCellEmpty}>Sin notas</span>
                  }
                </div>
              </div>
              <div className={styles.acadActions}>
                <div className={styles.acadActionsL}>
                  <button className={styles.acadActBtn} onClick={()=>onVerDetalle(ac)}><BarChart2 size={12}/> Detalle</button>
                  <button className={styles.acadActBtn} onClick={()=>onNuevoUsuario(ac)}><Plus size={12}/> Usuario</button>
                  <button className={styles.acadActBtn} onClick={()=>onEditar(ac)}><Edit3 size={12}/> Editar</button>
                </div>
                <div className={styles.acadActionsR}>
                  <button className={[styles.acadActBtn, ac.suspended?styles.acadActBtnGreen:styles.acadActBtnAmber].join(' ')} onClick={handleSuspender} disabled={suspending}>
                    {suspending
                      ? <><RefreshCw size={12} className={styles.spinnerInline}/> Procesando…</>
                      : ac.suspended ? <><PlayCircle size={12}/> Reactivar</> : <><PauseCircle size={12}/> Suspender</>
                    }
                  </button>
                  <button className={[styles.acadActBtn,styles.acadActBtnRed].join(' ')} onClick={()=>onEliminar(ac)}>
                    <Trash2 size={12}/> Eliminar
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Panel principal ────────────────────────────────────
export default function SuperadminPanel({ currentUser, modoPapelera=false }){
  const { academias,stats,loading,error, crearAcademia,actualizarAcademia, toggleSuspender,eliminarAcademia,restaurarAcademia, crearAsignatura,crearUsuario,recargar } = useSuperadmin(currentUser)
  const [detalle,setDetalle]               = useState(null)
  const [modalAcademia,setModalAcademia]   = useState(false)
  const [editarAcademia,setEditarAcademia] = useState(null)
  const [modalAsignatura,setModalAsignatura] = useState(null)
  const [modalUsuario,setModalUsuario]     = useState(null)
  const [filtro,setFiltro]                 = useState('todas')
  const [verPapelera,setVerPapelera]       = useState(modoPapelera)
  const [confirmDelete,setConfirmDelete]   = useState(null)
  const [deleteError,setDeleteError]       = useState('')
  const [deleteLoading,setDeleteLoading]   = useState(false)
  const [bannerMsg,setBannerMsg]           = useState('')
  const [bannerType,setBannerType]         = useState('success')

  useEffect(()=>{ setVerPapelera(modoPapelera) },[modoPapelera])

  const showBanner = (msg,type='success') => {
    setBannerMsg(msg); setBannerType(type)
    if(type==='success') setTimeout(()=>setBannerMsg(''),6000)
  }
  const handleCrearAcademia   = useCallback(async d=>crearAcademia(d),[crearAcademia])
  const handleEditarAcademia  = useCallback(async d=>actualizarAcademia(editarAcademia?.id,d),[actualizarAcademia,editarAcademia])
  const handleCrearAsignatura = useCallback(async d=>crearAsignatura(d),[crearAsignatura])
  const handleCrearUsuario    = useCallback(async d=>crearUsuario(d),[crearUsuario])
  const handleToggleSuspender = useCallback(async(id,suspendido)=>{
    const res = await toggleSuspender(id,suspendido)
    if(res?.ok){
      if(res.warning){ showBanner(res.warning,'error') }
      else { showBanner(`Academia ${suspendido?'suspendida':'reactivada'}. ${res.affected??0} usuario(s) procesados.`) }
    }
    return res
  },[toggleSuspender])

  const handleEliminar = async () => {
    if(!confirmDelete) return
    setDeleteError(''); setDeleteLoading(true)
    const res = await eliminarAcademia(confirmDelete.id)
    setDeleteLoading(false)
    if(res?.error) setDeleteError(`Error: ${res.error}`)
    else { setConfirmDelete(null); showBanner(`"${confirmDelete.name}" movida a la papelera.`) }
  }

  if(loading) return (
    <div className={styles.loadState}>
      <motion.div animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:'linear'}}>
        <RefreshCw size={22} style={{color:'#5de4ff'}}/>
      </motion.div>
      <p>Cargando plataforma…</p>
    </div>
  )
  if(error) return (<div className={styles.loadState}><AlertTriangle size={22}/><p>{error}</p></div>)
  if(detalle) return (<AcademiaDetalle academia={detalle} onBack={()=>setDetalle(null)}/>)

  const papelera       = academias.filter(ac=>!!ac.deleted_at)
  const acadsActivas   = academias.filter(ac=>!ac.deleted_at)
  const acadsFiltradas = acadsActivas.filter(ac=>{
    if(filtro==='activas')     return !ac.suspended
    if(filtro==='suspendidas') return ac.suspended
    if(filtro==='morosas')     return ac.payment_status==='overdue'
    return true
  })

  return (
    <div className={styles.page}>
      <AnimatePresence>
        {modalAcademia&&<ModalAcademia key="mc" onGuardar={handleCrearAcademia} onClose={()=>setModalAcademia(false)}/>}
        {editarAcademia&&<ModalAcademia key="me" academia={editarAcademia} onGuardar={handleEditarAcademia} onClose={()=>setEditarAcademia(null)}/>}
        {modalAsignatura&&<ModalAsignatura key="ma" academia={modalAsignatura} onCrear={handleCrearAsignatura} onClose={()=>setModalAsignatura(null)}/>}
        {modalUsuario&&<ModalUsuario key="mu" academia={modalUsuario} onCrear={handleCrearUsuario} onClose={()=>setModalUsuario(null)}/>}
      </AnimatePresence>

      <div className={styles.inner}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <img src={logoAzul} alt="FrostFox" className={styles.headerLogo}/>
          <div>
            <h1 className={styles.pageTitle}>Control Center</h1>
            <p className={styles.pageSubtitle}>Vista global · <span className={styles.accentText}>FrostFox Academy</span></p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnRefresh} onClick={recargar} title="Recargar"><RefreshCw size={14}/></button>
          {!verPapelera&&(
            <motion.button className={styles.btnPrimary} onClick={()=>setModalAcademia(true)}
              whileHover={{scale:1.02}} whileTap={{scale:0.97}}>
              <Plus size={14}/> Nueva academia
            </motion.button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {bannerMsg&&<ActionBanner key="banner" msg={bannerMsg} type={bannerType} onClose={()=>setBannerMsg('')}/>}
      </AnimatePresence>

      {!verPapelera&&(<>
        {/* ── Bento top ── */}
        <div className={styles.bentoTop}>
          {stats&&<HeroCard stats={stats}/>}
          {stats&&<PaymentHealthCard stats={stats}/>}
        </div>

        {/* ── KPI row ── */}
        <div className={styles.kpiRow}>
          <KpiCard icon={Building2}  label="Academias"    value={stats?.totalAcademias} color="#6366F1" delay={0.1}  chart={[3,3,4,4,5,5,stats?.totalAcademias||0]}/>
          <KpiCard icon={Users}      label="Alumnos"      value={stats?.totalAlumnos}   color="#5de4ff" delay={0.15} chart={[12,18,22,25,28,32,stats?.totalAlumnos||0]}/>
          <KpiCard icon={BarChart2}  label="Sesiones 30d" value={stats?.sesiones30d}    color="#10B981" delay={0.2}  chart={[40,55,48,62,70,65,stats?.sesiones30d||0]} sub="últimos 30 días"/>
          <KpiCard icon={CreditCard} label="Facturación"  value={`€${(stats?.mrr||0).toFixed(0)}`} color="#F59E0B" delay={0.25} chart={[120,135,128,145,160,155,stats?.mrr||0]}/>
        </div>

        {/* ── Lista academias ── */}
        <div className={styles.acadSection}>
          <div className={styles.acadSectionHeader}>
            <h2 className={styles.acadSectionTitle}>
              Academias
              <span className={styles.acadSectionCount}>{acadsActivas.length}</span>
            </h2>
            <div className={styles.filtros}>
              {[
                {id:'todas',      label:'Todas'},
                {id:'activas',    label:`Activas (${acadsActivas.filter(a=>!a.suspended).length})`},
                {id:'suspendidas',label:`Suspendidas (${acadsActivas.filter(a=>a.suspended).length})`},
                {id:'morosas',    label:`Morosas (${acadsActivas.filter(a=>a.payment_status==='overdue').length})`},
              ].map(f=>(
                <motion.button key={f.id}
                  className={[styles.filtro, filtro===f.id?styles.filtroActive:''].join(' ')}
                  onClick={()=>setFiltro(f.id)} whileTap={{scale:0.95}}>{f.label}</motion.button>
              ))}
            </div>
          </div>

          {acadsFiltradas.length===0?(
            <motion.div className={styles.emptyAcads} initial={{opacity:0}} animate={{opacity:1}}>
              <Building2 size={36} strokeWidth={1.2}/>
              <p>No hay academias en este filtro</p>
              {filtro==='todas'&&<button className={styles.btnPrimary} onClick={()=>setModalAcademia(true)}><Plus size={14}/> Crear la primera</button>}
            </motion.div>
          ):(
            <motion.div className={styles.acadList} layout>
              <AnimatePresence mode="popLayout">
                {acadsFiltradas.map(ac=>(
                  <AcademiaCard key={ac.id} ac={ac}
                    onVerDetalle={setDetalle} onEditar={setEditarAcademia}
                    onNuevaAsignatura={setModalAsignatura} onNuevoUsuario={setModalUsuario}
                    onToggleSuspender={handleToggleSuspender} onEliminar={setConfirmDelete}/>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </>)}

      {/* ── Papelera ── */}
      {verPapelera&&(
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
          <div className={styles.papeleraHeader}>
            <Trash2 size={16}/>
            <h2>Papelera <span>({papelera.length})</span></h2>
          </div>
          {papelera.length===0?(
            <div className={styles.papeleraEmpty}>
              <Trash2 size={36} strokeWidth={1.2}/>
              <p>La papelera está vacía</p>
            </div>
          ):(
            <div className={styles.acadList}>
              {papelera.map(ac=>(
                <motion.div key={ac.id} className={styles.papeleraCard}
                  initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
                  <div className={styles.papeleraInfo}>
                    <div className={styles.papeleraName}>{ac.name}</div>
                    <div className={styles.papeleraMeta}>/{ac.slug} · Eliminada {new Date(ac.deleted_at).toLocaleDateString('es-ES')}{ac.contact_email&&` · ${ac.contact_email}`}</div>
                  </div>
                  <button className={styles.btnRestaurar} onClick={()=>restaurarAcademia(ac.id)}>
                    <RotateCcw size={12}/> Restaurar
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ── Confirmar eliminar ── */}
      <AnimatePresence>
        {confirmDelete&&(
          <motion.div className={styles.overlay} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={()=>{ if(!deleteLoading){ setConfirmDelete(null); setDeleteError('') } }}>
            <motion.div className={styles.modal}
              initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}}
              exit={{scale:0.9,opacity:0}} transition={{type:'spring',damping:22,stiffness:300}}
              onClick={e=>e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>¿Eliminar academia?</h3>
                <button className={styles.modalClose} onClick={()=>{ setConfirmDelete(null); setDeleteError('') }}><X size={15}/></button>
              </div>
              <div className={styles.modalBody}>
                <p style={{fontSize:'var(--fs-4)',color:'rgba(232,244,248,0.7)',margin:'0 0 1rem'}}>
                  <strong style={{color:'#e8f4f8'}}>{confirmDelete.name}</strong> pasará a la papelera y todos sus usuarios perderán acceso.
                </p>
                {deleteError&&(<div className={styles.errorMsg} style={{marginBottom:'0.75rem'}}><AlertTriangle size={13}/><div><div style={{fontWeight:700}}>No se pudo eliminar</div><div>{deleteError}</div></div></div>)}
                <div className={styles.modalActions}>
                  <button className={styles.btnCancel} onClick={()=>{ setConfirmDelete(null); setDeleteError('') }} disabled={deleteLoading}>Cancelar</button>
                  <button className={styles.btnDanger} onClick={handleEliminar} disabled={deleteLoading}>
                    {deleteLoading?<><RefreshCw size={13} className={styles.spinnerInline}/> Procesando…</>:<><Trash2 size={13}/> Mover a papelera</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>{/* /inner */}
    </div>
  )
}
