import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import {
  Users, Zap, AlertTriangle, Shield, BarChart2, BookOpen,
  RefreshCw, TrendingUp, TrendingDown, GraduationCap,
  Clock, FileText, CheckCircle, X, Check, Key, Euro,
  UserPlus, Star, BookMarked, Rocket, ArrowUpDown, ArrowRight,
  MessageSquare, Send, Trash2, CornerDownLeft, Megaphone, RotateCcw,
  Phone, MapPin, Mail, Target, Calendar, Edit3,
  Save, ChevronLeft, ChevronUp
} from 'lucide-react'
import type { CurrentUser } from '../../../types'
import { MASCOTAS } from '../DirectorTypes'
import styles from './AlertasPanel.module.css'

// ── Types ──────────────────────────────────────────────────────────────────
interface SubjectStats {
  id:               string
  slug:             string
  name:             string
  color:            string
  totalAlumnos:     number
  alumnosActivos:   number
  notaMedia:        number | null
  sesiones30d:      number
  enRiesgo:         number
  porExpirar:       number
  alumnosConNota:   { id: string; username: string; nota: number | null; sesiones: number }[]
  alumnosEnRiesgo:  { id: string; username: string; diasInactivo: number | null }[]
  alumnosPorExpirar:{ id: string; username: string; diasRestantes: number }[]
  profesores:       { id: string; username: string; alumnos: number; notaMedia: number | null; sesionesThisWeek: number }[]
}

interface Stats {
  totalAlumnos:    number
  totalActivos:    number
  totalProfesores: number
  totalEnRiesgo:   number
  totalPorExpirar: number
  notaGlobal:      number | null
  sesiones30d:     number
  bySubject:       SubjectStats[]
  semanas:         { label: string; sesiones: number; alumnosActivos: number; notaMedia: number | null }[]
  profesorActivity?: {
    lastAvisoByProfesor:  Record<string, { created_at: string; title: string }>
    totalAvisosByProfesor:Record<string, number>
  }
  finanzas?: {
    mrrAcademia:           number
    mrrActivos:            number
    alumnosSinPrecio:      number
    totalAlumnosConPrecio: number
    spMap:                 Record<string, { monthly_price: number | null; exam_date: string | null; full_name: string | null; city: string | null; payment_status: string }>
    pagos: {
      pagados:     number
      pendientes:  number
      vencidos:    number
      mrrCobrado:  number
      mrrPendiente:number
      mrrVencido:  number
    }
  }
}

interface ProfileSimple {
  id:           string
  username:     string
  role:         string
  access_until: string | null
  created_at:   string
}

interface StudentProfile {
  id:            string
  username:      string
  role:          string
  access_until:  string | null
  created_at:    string | null
  subject_name?: string | null
  extended:      Record<string, any> | null
}

interface AlumnoEnriquecido {
  id:            string
  username:      string
  nota:          number | null
  sesiones:      number
  subjectName:   string
  subjectColor:  string
  enRiesgo:      boolean
  diasInactivo:  number | null
  diasRestantes: number | null
  extended:      Record<string, any> | null
  access_until:  string | null
  created_at:    string | null
}

interface AlumnoDetalleForm {
  full_name:     string
  phone:         string
  email_contact: string
  city:          string
  exam_date:     string
  monthly_price: string
  access_until:  string
}


// ── AlertasPanel ───────────────────────────────────────────────────────────
function AlertasPanel({ stats, onAlumnoClick }: { stats: Stats; onAlumnoClick: (a: any) => void }) {
  const todos   = stats.bySubject.flatMap(sub => sub.alumnosEnRiesgo.map(a => ({ ...a, subjectName: sub.name, subjectColor: sub.color }))).sort((a, b) => (b.diasInactivo ?? 0) - (a.diasInactivo ?? 0))
  const expiran = stats.bySubject.flatMap(sub => sub.alumnosPorExpirar.map(a => ({ ...a, subjectName: sub.name, subjectColor: sub.color }))).sort((a, b) => a.diasRestantes - b.diasRestantes)

  if (!todos.length && !expiran.length) return (
    <div className={styles.riesgoOk}><CheckCircle size={18} style={{ color: '#059669' }} /><span>Sin alertas activas — todo en orden</span></div>
  )

  const Item = ({ a, badge }: { a: any; badge: React.ReactNode }) => (
    <div className={styles.riesgoItem} onClick={() => onAlumnoClick({ ...a, enRiesgo: true })}>
      <div className={styles.riesgoAvatar}>{String(a.username)[0]!.toUpperCase()}</div>
      <div className={styles.riesgoBody}>
        <span className={styles.riesgoUsername}>{a.username}</span>
        <span className={styles.riesgoSub} style={{ color: a.subjectColor }}>{a.subjectName}</span>
      </div>
      {badge}
      <ArrowRight size={13} className={styles.alumnoArrow} />
    </div>
  )

  return (
    <div className={styles.riesgoWrap}>
      {todos.length > 0 && (
        <div className={styles.riesgoGrupo}>
          <div className={styles.riesgoGrupoTitle}><AlertTriangle size={13} style={{ color: '#DC2626' }} />{todos.length} alumno{todos.length !== 1 ? 's' : ''} sin actividad</div>
          {todos.map(a => <Item key={a.id} a={a} badge={<span className={styles.riesgoBadgeRed}>{a.diasInactivo ?? '?'}d inactivo</span>} />)}
        </div>
      )}
      {expiran.length > 0 && (
        <div className={styles.riesgoGrupo}>
          <div className={styles.riesgoGrupoTitle}><Clock size={13} style={{ color: '#D97706' }} />{expiran.length} acceso{expiran.length !== 1 ? 's' : ''} próximos a expirar</div>
          {expiran.map(a => <Item key={a.id} a={a} badge={<span className={styles.riesgoBadgeAmber}>Expira en {a.diasRestantes}d</span>} />)}
        </div>
      )}
    </div>
  )
}

// ── OnboardingChecklist ────────────────────────────────────────────────────
function OnboardingChecklist({ currentUser, stats }: { currentUser: CurrentUser | null; stats: Stats }) {
  const [dismissed, setDismissed] = useState(!!localStorage.getItem(`onboarding_dismissed_${currentUser?.id}`))
  const [hasCodigo, setHasCodigo] = useState(false)

  useEffect(() => {
    if (dismissed || !currentUser?.academy_id) return
    supabase.from('invite_codes').select('id', { count: 'exact', head: true }).eq('academy_id', currentUser.academy_id)
      .then(({ count }) => setHasCodigo((count ?? 0) > 0))
  }, [dismissed, currentUser?.academy_id])

  if (dismissed) return null

  const pasos = [
    { id: 'academia',   label: 'Academia creada',               done: true,                            icon: Rocket },
    { id: 'asignatura', label: 'Primera asignatura',            done: (stats?.bySubject?.length??0)>0, icon: BookMarked },
    { id: 'profesor',   label: 'Primer profesor',               done: (stats?.totalProfesores??0)>0,   icon: GraduationCap },
    { id: 'codigo',     label: 'Código de invitación generado', done: hasCodigo,                       icon: Key },
    { id: 'alumno',     label: 'Primer alumno registrado',      done: (stats?.totalAlumnos??0)>0,      icon: UserPlus },
    { id: 'sesion',     label: 'Primera sesión completada',     done: (stats?.sesiones30d??0)>0,       icon: Zap },
  ]
  const completados = pasos.filter(p => p.done).length
  if (completados === pasos.length) return null

  return (
    <div className={styles.onboarding}>
      <div className={styles.onboardingHead}>
        <div className={styles.onboardingTitle}><Rocket size={14} /> Configura tu academia <span className={styles.onboardingPct}>{completados}/{pasos.length}</span></div>
        <button className={styles.onboardingDismiss} onClick={() => { localStorage.setItem(`onboarding_dismissed_${currentUser?.id}`, '1'); setDismissed(true) }}><X size={13} /></button>
      </div>
      <div className={styles.onboardingBar}><div className={styles.onboardingBarFill} style={{ width: `${Math.round(completados/pasos.length*100)}%` }} /></div>
      <div className={styles.onboardingSteps}>
        {pasos.map(paso => {
          const Icon = paso.icon
          return (
            <div key={paso.id} className={[styles.onboardingStep, paso.done ? styles.onboardingStepDone : ''].join(' ')}>
              <div className={styles.onboardingStepIcon}>{paso.done ? <Check size={11} strokeWidth={2.5} /> : <Icon size={11} />}</div>
              <span className={styles.onboardingStepLabel}>{paso.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── exportarInforme ────────────────────────────────────────────────────────
function exportarInforme(stats: Stats, academyName: string | null | undefined, studentProfiles: StudentProfile[]) {
  const fecha         = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
  const preciosReales = studentProfiles.filter(p => p.extended?.monthly_price).map(p => parseFloat(String(p.extended!.monthly_price)))
  const mrr           = preciosReales.length > 0 ? preciosReales.reduce((a, b) => a + b, 0) : null
  const enRiesgo      = stats.bySubject.flatMap(s => s.alumnosEnRiesgo)
  const porExpirar    = stats.bySubject.flatMap(s => s.alumnosPorExpirar)
  const spMap: Record<string, StudentProfile> = {}
  for (const sp of studentProfiles) spMap[sp.id] = sp
  const todosAlumnos = stats.bySubject.flatMap(sub =>
    sub.alumnosConNota.map(a => ({
      ...a,
      subjectName: sub.name,
      enRiesgo:    sub.alumnosEnRiesgo.some(r => r.id === a.id),
      examDate:    spMap[a.id]?.extended?.exam_date ?? null,
      fullName:    spMap[a.id]?.extended?.full_name ?? null,
    }))
  ).sort((a, b) => (b.nota ?? -1) - (a.nota ?? -1))
  const nc     = (n: number) => n >= 70 ? '#059669' : n >= 50 ? '#B45309' : '#DC2626'
  const maxSes = Math.max(...stats.semanas.map(s => s.sesiones), 1)
  const semanasHtml = stats.semanas.map(s => {
    const h = Math.round((s.sesiones/maxSes)*50)
    return `<div class="sem-bar-wrap">${s.sesiones>0?`<div class="sem-val">${s.sesiones}</div>`:''}<div class="sem-bar" style="height:${Math.max(h,2)}px"></div><div class="sem-label">${s.label}</div></div>`
  }).join('')

  const css = `*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,'Segoe UI',sans-serif;color:#111;padding:2.5rem;max-width:860px;margin:0 auto;font-size:13px}.header{display:flex;justify-content:space-between;margin-bottom:2rem;padding-bottom:1.5rem;border-bottom:2px solid #111}.header-left h1{font-size:1.5rem;font-weight:800}h2{font-size:.7rem;font-weight:800;color:#6B7280;text-transform:uppercase;letter-spacing:.08em;margin:1.75rem 0 .75rem}.kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:.6rem;margin-bottom:.5rem}.kpi{border:1px solid #E5E7EB;border-radius:10px;padding:.75rem .5rem;text-align:center}.kv{font-size:1.4rem;font-weight:800}.kl{font-size:.62rem;color:#6B7280;margin-top:.3rem;text-transform:uppercase}table{width:100%;border-collapse:collapse;margin-bottom:1rem}th{background:#F9FAFB;font-size:.7rem;font-weight:700;text-align:left;padding:.5rem .75rem;border-bottom:2px solid #E5E7EB;text-transform:uppercase;color:#374151}td{padding:.5rem .75rem;border-bottom:1px solid #F3F4F6;font-size:.78rem}.tag{display:inline-block;border-radius:4px;padding:.15rem .45rem;font-size:.65rem;font-weight:700}.tag-red{background:#FEF2F2;color:#DC2626}.tag-green{background:#ECFDF5;color:#059669}.tag-amber{background:#FFFBEB;color:#B45309}.alert-section{border:1px solid #FEE2E2;border-radius:10px;padding:1rem;background:#FFF5F5;margin-bottom:.5rem}.alert-title{font-size:.7rem;font-weight:800;color:#DC2626;text-transform:uppercase;margin-bottom:.5rem}.alert-row{display:flex;justify-content:space-between;padding:.3rem 0;border-bottom:1px solid #FEE2E2;font-size:.75rem}.alert-row:last-child{border:none}.semanas{display:grid;grid-template-columns:repeat(8,1fr);gap:.4rem;align-items:flex-end;height:60px;margin-bottom:.3rem}.sem-bar-wrap{display:flex;flex-direction:column;align-items:center;gap:.2rem;height:100%;justify-content:flex-end}.sem-bar{width:100%;border-radius:3px;background:#0891B2;min-height:2px}.sem-label{font-size:.55rem;color:#9CA3AF;text-align:center}.sem-val{font-size:.6rem;color:#374151;font-weight:700}.rent{display:grid;grid-template-columns:repeat(3,1fr);gap:.6rem}.rent-kpi{border:1px solid #E5E7EB;border-radius:10px;padding:.75rem 1rem}footer{margin-top:2.5rem;padding-top:1rem;border-top:1px solid #E5E7EB;display:flex;justify-content:space-between;color:#9CA3AF;font-size:.7rem}@media print{body{padding:1rem}@page{margin:1.5cm}}`

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Informe ${academyName??'Academia'}</title><style>${css}</style></head><body>
  <div class="header"><div class="header-left"><h1>${academyName??'Academia'}</h1><p style="color:#6B7280;font-size:.8rem">Informe de dirección · Últimos 30 días</p></div><div style="text-align:right;color:#6B7280;font-size:.75rem"><strong>Generado el</strong> ${fecha}</div></div>
  <h2>Resumen</h2><div class="kpis"><div class="kpi"><div class="kv">${stats.totalAlumnos}</div><div class="kl">Alumnos</div></div><div class="kpi"><div class="kv" style="color:#059669">${stats.totalActivos}</div><div class="kl">Activos 7d</div></div><div class="kpi"><div class="kv">${stats.notaGlobal!==null?stats.notaGlobal+'%':'—'}</div><div class="kl">Nota media</div></div><div class="kpi"><div class="kv">${stats.sesiones30d}</div><div class="kl">Sesiones 30d</div></div><div class="kpi"><div class="kv" style="color:#DC2626">${stats.totalEnRiesgo}</div><div class="kl">En riesgo</div></div><div class="kpi"><div class="kv" style="color:#B45309">${stats.totalPorExpirar}</div><div class="kl">Expiran pronto</div></div></div>
  <h2>Actividad</h2><div class="semanas">${semanasHtml}</div>
  <h2>Por asignatura</h2><table><tr><th>Asignatura</th><th>Alumnos</th><th>Activos 7d</th><th>Nota media</th><th>Sesiones 30d</th><th>En riesgo</th><th>Expiran pronto</th></tr>${stats.bySubject.map(s=>`<tr><td><strong>${s.name}</strong></td><td>${s.totalAlumnos}</td><td>${s.alumnosActivos}</td><td style="font-weight:700;color:${nc(s.notaMedia??0)}">${s.notaMedia!==null?s.notaMedia+'%':'—'}</td><td>${s.sesiones30d}</td><td>${s.enRiesgo>0?`<span class="tag tag-red">${s.enRiesgo}</span>`:'—'}</td><td>${s.porExpirar>0?`<span class="tag tag-amber">${s.porExpirar}</span>`:'—'}</td></tr>`).join('')}</table>
  <h2>Alumnos</h2><table><tr><th>Alumno</th><th>Asignatura</th><th>Nota media</th><th>Sesiones</th><th>Estado</th><th>Fecha examen</th></tr>${todosAlumnos.map(a=>`<tr><td><strong>${a.fullName||a.username}</strong>${a.fullName?`<br><span style="color:#9CA3AF;font-size:.68rem">@${a.username}</span>`:''}</td><td>${a.subjectName}</td><td style="font-weight:700;color:${nc(a.nota??0)}">${a.nota!==null?a.nota+'%':'—'}</td><td>${a.sesiones}</td><td>${a.enRiesgo?'<span class="tag tag-red">En riesgo</span>':'<span class="tag tag-green">Activo</span>'}</td><td style="color:#6B7280">${a.examDate?new Date(String(a.examDate)).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'}):'—'}</td></tr>`).join('')}</table>
  ${enRiesgo.length>0?`<h2>Alertas</h2><div class="alert-section"><div class="alert-title">⚠ ${enRiesgo.length} sin actividad</div>${enRiesgo.map(a=>`<div class="alert-row"><span>${a.username}</span><span style="color:#DC2626">${a.diasInactivo??'?'} días inactivo</span></div>`).join('')}</div>`:''}
  ${mrr!==null?`<h2>Rentabilidad</h2><div class="rent"><div class="rent-kpi"><div class="kv">${mrr.toLocaleString('es-ES')} €</div><div class="kl">MRR</div></div><div class="rent-kpi"><div class="kv">${(mrr*12).toLocaleString('es-ES')} €</div><div class="kl">ARR estimado</div></div><div class="rent-kpi"><div class="kv">${preciosReales.length}</div><div class="kl">Alumnos con precio</div></div></div>`:''}
  <footer><span>FrostFox Academy · Informe de dirección</span><span>${fecha}</span></footer></body></html>`

  const w = window.open('', '_blank'); if (!w) return
  w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500)
}


export { AlertasPanel, OnboardingChecklist, exportarInforme }
