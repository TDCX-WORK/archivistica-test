import { useState, useEffect } from 'react'
import { useDirector } from '../../../hooks/useDirector'
import { supabase } from '../../../lib/supabase'
import {
  Users, Zap, AlertTriangle, Shield, BarChart2, BookOpen,
  RefreshCw, ChevronDown, ChevronUp, TrendingUp, GraduationCap,
  Clock, FileText, CheckCircle, X, Check, Key, UserPlus,
  BookMarked, Rocket
} from 'lucide-react'
import styles from './DirectorPanel.module.css'

// ── Helpers ──────────────────────────────────────────────────────────────────
const scoreColor = (s) => {
  if (s === null || s === undefined) return '#6B7280'
  if (s >= 80) return '#059669'
  if (s >= 60) return '#0891B2'
  if (s >= 40) return '#B45309'
  return '#DC2626'
}

// ── Onboarding Checklist ──────────────────────────────────────────────────────
function OnboardingChecklist({ currentUser, stats }) {
  const [dismissed, setDismissed] = useState(false)
  const [hasCodigo, setHasCodigo] = useState(false)
  const [checked,   setChecked]   = useState(false)

  useEffect(() => {
    // Comprobar si ya fue descartado por este director
    const key = `onboarding_dismissed_${currentUser?.id}`
    if (localStorage.getItem(key)) { setDismissed(true); return }

    // Comprobar si existe algun codigo de invitacion
    const checkCodigo = async () => {
      const { count } = await supabase
        .from('invite_codes')
        .select('id', { count: 'exact', head: true })
        .eq('academy_id', currentUser?.academy_id)
      setHasCodigo((count || 0) > 0)
      setChecked(true)
    }
    checkCodigo()
  }, [currentUser?.id, currentUser?.academy_id])

  const handleDismiss = () => {
    localStorage.setItem(`onboarding_dismissed_${currentUser?.id}`, '1')
    setDismissed(true)
  }

  if (dismissed || !checked) return null

  const tieneAsignatura  = (stats?.bySubject?.length || 0) > 0
  const tieneProfesor    = (stats?.totalProfesores || 0) > 0
  const tieneCodigo      = hasCodigo
  const tieneAlumno      = (stats?.totalAlumnos || 0) > 0
  const tieneSesion      = (stats?.sesiones30d || 0) > 0

  // Si todo esta completo mostrar durante 2 renders mas y luego auto-dismiss
  const todosCompletos = tieneAsignatura && tieneProfesor && tieneCodigo && tieneAlumno && tieneSesion
  if (todosCompletos) return null

  const pasos = [
    {
      id:        'academia',
      label:     'Academia creada',
      desc:      'Tu espacio en FrostFox Academy esta listo.',
      done:      true,
      icon:      Rocket,
    },
    {
      id:        'asignatura',
      label:     'Crea tu primera asignatura',
      desc:      'El superadmin puede crearla desde el panel de administracion.',
      done:      tieneAsignatura,
      icon:      BookMarked,
    },
    {
      id:        'profesor',
      label:     'Registra un profesor',
      desc:      'El superadmin puede crear cuentas de profesor.',
      done:      tieneProfesor,
      icon:      GraduationCap,
    },
    {
      id:        'codigo',
      label:     'Genera un codigo de invitacion',
      desc:      'El profesor puede generar codigos desde su panel.',
      done:      tieneCodigo,
      icon:      Key,
    },
    {
      id:        'alumno',
      label:     'Primer alumno registrado',
      desc:      'Comparte el codigo con tus alumnos para que se unan.',
      done:      tieneAlumno,
      icon:      UserPlus,
    },
    {
      id:        'sesion',
      label:     'Primera sesion completada',
      desc:      'Un alumno ha completado su primer test. El sistema funciona.',
      done:      tieneSesion,
      icon:      Zap,
    },
  ]

  const completados = pasos.filter(p => p.done).length
  const pct         = Math.round((completados / pasos.length) * 100)
  const siguiente   = pasos.find(p => !p.done)

  return (
    <div className={styles.onboarding}>
      <div className={styles.onboardingHead}>
        <div className={styles.onboardingTitle}>
          <Rocket size={15} />
          Configura tu academia
          <span className={styles.onboardingPct}>{completados}/{pasos.length}</span>
        </div>
        <button className={styles.onboardingDismiss} onClick={handleDismiss}
          title="Ocultar esta guia">
          <X size={13} />
        </button>
      </div>

      {/* Barra de progreso */}
      <div className={styles.onboardingBar}>
        <div className={styles.onboardingBarFill} style={{ width: `${pct}%` }} />
      </div>

      {/* Pasos */}
      <div className={styles.onboardingSteps}>
        {pasos.map((paso) => {
          const Icon = paso.icon
          const isNext = siguiente?.id === paso.id
          return (
            <div key={paso.id}
              className={[
                styles.onboardingStep,
                paso.done  ? styles.onboardingStepDone : '',
                isNext     ? styles.onboardingStepNext : '',
              ].join(' ')}>
              <div className={styles.onboardingStepIcon}>
                {paso.done
                  ? <Check size={12} strokeWidth={2.5} />
                  : <Icon size={12} strokeWidth={1.8} />
                }
              </div>
              <div className={styles.onboardingStepBody}>
                <span className={styles.onboardingStepLabel}>{paso.label}</span>
                {isNext && (
                  <span className={styles.onboardingStepDesc}>{paso.desc}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, color, alert, sub, onClick }) {
  return (
    <div className={[styles.kpi, onClick ? styles.kpiClickable : ''].join(' ')}
      style={{ '--c': color }} onClick={onClick}>
      {alert && <div className={styles.kpiAlert} />}
      <div className={styles.kpiGlow} />
      <Icon size={18} strokeWidth={1.8} className={styles.kpiIcon} />
      <div className={styles.kpiVal}>{value ?? '—'}</div>
      <div className={styles.kpiLabel}>{label}</div>
      {sub && <div className={styles.kpiSub}>{sub}</div>}
    </div>
  )
}

// ── Grafico de barras SVG ─────────────────────────────────────────────────────
function ActivityChart({ semanas }) {
  const [hover, setHover] = useState(null)
  if (!semanas?.length) return null

  const maxSes  = Math.max(...semanas.map(s => s.sesiones), 1)
  const W = 560, H = 120, BAR_W = 40, GAP = 30
  const totalW  = semanas.length * (BAR_W + GAP)
  const offsetX = (W - totalW) / 2

  return (
    <div className={styles.chartWrap}>
      <svg viewBox={`0 0 ${W} ${H + 40}`} className={styles.chartSvg}>
        {semanas.map((s, i) => {
          const x    = offsetX + i * (BAR_W + GAP)
          const pct  = s.sesiones / maxSes
          const barH = Math.max(pct * H, s.sesiones > 0 ? 4 : 0)
          const y    = H - barH
          const isHov = hover === i
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={x} y={0} width={BAR_W} height={H} rx={6}
                fill="var(--surface-dim)" opacity={0.5} />
              <rect x={x} y={y} width={BAR_W} height={barH} rx={6}
                fill={isHov ? 'var(--primary)' : 'var(--c,#0891B2)'}
                opacity={isHov ? 1 : 0.75}
                style={{ transition: 'all 0.2s' }} />
              {barH > 8 && (
                <rect x={x + 4} y={y + 3} width={8} height={4} rx={2}
                  fill="white" opacity={0.3} />
              )}
              {s.sesiones > 0 && (
                <text x={x + BAR_W / 2} y={y - 5} textAnchor="middle"
                  fontSize="10" fill="var(--ink-muted)" fontWeight="600">
                  {s.sesiones}
                </text>
              )}
              <text x={x + BAR_W / 2} y={H + 16} textAnchor="middle"
                fontSize="9" fill="var(--ink-muted)">
                {s.label}
              </text>
              {isHov && (
                <g>
                  <rect x={x - 10} y={y - 44} width={60} height={36} rx={6}
                    fill="var(--ink)" opacity={0.9} />
                  <text x={x + 20} y={y - 28} textAnchor="middle"
                    fontSize="10" fill="white" fontWeight="700">
                    {s.sesiones} ses.
                  </text>
                  <text x={x + 20} y={y - 14} textAnchor="middle"
                    fontSize="9" fill="#9CA3AF">
                    {s.alumnosActivos} activos
                    {s.notaMedia !== null ? ` · ${s.notaMedia}%` : ''}
                  </text>
                </g>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Tabla de profesores ───────────────────────────────────────────────────────
function ProfesoresTable({ bySubject }) {
  const todos = bySubject.flatMap(sub =>
    sub.profesores.map(p => ({ ...p, subjectName: sub.name, subjectColor: sub.color }))
  )
  if (!todos.length) return <p className={styles.empty}>Sin profesores registrados</p>

  return (
    <div className={styles.profTable}>
      <div className={styles.profTableHead}>
        <span>Profesor</span>
        <span>Asignatura</span>
        <span>Alumnos</span>
        <span>Ses. semana</span>
        <span>Nota media</span>
      </div>
      {todos.map(p => (
        <div key={p.id} className={styles.profTableRow}>
          <div className={styles.profAvatar}>
            <div className={styles.profAvatarCircle}>{p.username[0].toUpperCase()}</div>
            <span>{p.username}</span>
          </div>
          <div className={styles.profSubject}>
            <div className={styles.profSubjectDot} style={{ background: p.subjectColor }} />
            <span>{p.subjectName}</span>
          </div>
          <span className={styles.profStat}>{p.alumnos}</span>
          <span className={styles.profStat}>{p.sesionesThisWeek}</span>
          <span className={styles.profStat} style={{ color: scoreColor(p.notaMedia), fontWeight: 700 }}>
            {p.notaMedia !== null ? `${p.notaMedia}%` : '—'}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Card de asignatura expandible ─────────────────────────────────────────────
function SubjectCard({ sub }) {
  const [open, setOpen] = useState(false)
  const notaColor = scoreColor(sub.notaMedia)

  return (
    <div className={styles.subCard}>
      <button className={styles.subCardHeader} onClick={() => setOpen(v => !v)}
        style={{ '--sc': sub.color }}>
        <div className={styles.subCardBar} />
        <div className={styles.subCardInfo}>
          <span className={styles.subCardName}>{sub.name}</span>
          <div className={styles.subCardMeta}>
            <span><Users size={11} /> {sub.totalAlumnos} alumnos</span>
            <span><Zap size={11} /> {sub.alumnosActivos} activos</span>
            <span><BarChart2 size={11} /> {sub.sesiones30d} sesiones 30d</span>
          </div>
        </div>
        <div className={styles.subCardRight}>
          {sub.notaMedia !== null && (
            <span className={styles.subCardNota} style={{ color: notaColor }}>
              {sub.notaMedia}%
            </span>
          )}
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {open && (
        <div className={styles.subCardBody}>
          {sub.alumnosConNota?.length > 0 && (
            <div className={styles.subSection}>
              <div className={styles.subSectionTitle}>Ranking alumnos (30d)</div>
              <div className={styles.alumnosList}>
                {sub.alumnosConNota.slice(0, 5).map((a, i) => (
                  <div key={a.id} className={styles.alumnoRow}>
                    <span className={styles.alumnoRank}>{i + 1}</span>
                    <span className={styles.alumnoName}>{a.username}</span>
                    <span className={styles.alumnoSes}>{a.sesiones} ses.</span>
                    <span className={styles.alumnoNota} style={{ color: scoreColor(a.nota) }}>
                      {a.nota !== null ? `${a.nota}%` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Panel de alertas expandible ───────────────────────────────────────────────
function AlertasPanel({ stats }) {
  const [openRiesgo,  setOpenRiesgo]  = useState(false)
  const [openExpirar, setOpenExpirar] = useState(false)

  const todosEnRiesgo   = stats.bySubject.flatMap(s =>
    s.alumnosEnRiesgo.map(a => ({ ...a, subjectName: s.name, subjectColor: s.color }))
  )
  const todosPorExpirar = stats.bySubject.flatMap(s =>
    s.alumnosPorExpirar.map(a => ({ ...a, subjectName: s.name, subjectColor: s.color }))
  )

  if (!todosEnRiesgo.length && !todosPorExpirar.length) return (
    <div className={styles.alertaOk}>
      <CheckCircle size={16} />
      <span>Sin alertas activas — todo en orden</span>
    </div>
  )

  return (
    <div className={styles.alertasWrap}>
      {todosEnRiesgo.length > 0 && (
        <div className={styles.alertaBlock}>
          <button className={styles.alertaBlockHeader} onClick={() => setOpenRiesgo(v => !v)}>
            <div className={styles.alertaBlockLeft}>
              <AlertTriangle size={14} className={styles.alertaIconRed} />
              <span>{todosEnRiesgo.length} alumno{todosEnRiesgo.length !== 1 ? 's' : ''} en riesgo de abandono</span>
            </div>
            {openRiesgo ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {openRiesgo && (
            <div className={styles.alertaList}>
              {todosEnRiesgo.map(a => (
                <div key={a.id} className={styles.alertaItem}>
                  <div className={styles.alertaSubDot} style={{ background: a.subjectColor }} />
                  <span className={styles.alertaUsername}>{a.username}</span>
                  <span className={styles.alertaSubName}>{a.subjectName}</span>
                  <span className={styles.alertaBadgeRed}>
                    {a.diasInactivo === null ? 'Sin actividad' : `${a.diasInactivo}d inactivo`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {todosPorExpirar.length > 0 && (
        <div className={styles.alertaBlock}>
          <button className={styles.alertaBlockHeader} onClick={() => setOpenExpirar(v => !v)}>
            <div className={styles.alertaBlockLeft}>
              <Clock size={14} className={styles.alertaIconAmber} />
              <span>{todosPorExpirar.length} acceso{todosPorExpirar.length !== 1 ? 's' : ''} proximo{todosPorExpirar.length !== 1 ? 's' : ''} a expirar</span>
            </div>
            {openExpirar ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {openExpirar && (
            <div className={styles.alertaList}>
              {todosPorExpirar.sort((a, b) => a.diasRestantes - b.diasRestantes).map(a => (
                <div key={a.id} className={styles.alertaItem}>
                  <div className={styles.alertaSubDot} style={{ background: a.subjectColor }} />
                  <span className={styles.alertaUsername}>{a.username}</span>
                  <span className={styles.alertaSubName}>{a.subjectName}</span>
                  <span className={styles.alertaBadgeAmber}>Expira en {a.diasRestantes}d</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Exportar PDF ──────────────────────────────────────────────────────────────
function exportarInforme(stats, academyName) {
  const fecha = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
  const html = `
    <html><head><meta charset="utf-8">
    <style>
      body { font-family: -apple-system, sans-serif; color: #111; padding: 2rem; max-width: 800px; margin: 0 auto; }
      h1 { font-size: 1.5rem; border-bottom: 2px solid #111; padding-bottom: 0.5rem; }
      h2 { font-size: 1rem; margin: 1.5rem 0 0.5rem; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; }
      .kpis { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; margin: 1rem 0; }
      .kpi { border: 1px solid #E5E7EB; border-radius: 8px; padding: 1rem; text-align: center; }
      .kpi-val { font-size: 1.75rem; font-weight: 800; }
      .kpi-label { font-size: 0.75rem; color: #6B7280; margin-top: 0.25rem; }
      table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
      th { background: #F9FAFB; text-align: left; padding: 0.5rem 0.75rem; border-bottom: 2px solid #E5E7EB; }
      td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #F3F4F6; }
      .footer { margin-top: 2rem; font-size: 0.75rem; color: #9CA3AF; text-align: center; }
    </style></head><body>
    <h1>Informe de Academia${academyName ? ` — ${academyName}` : ''}</h1>
    <p style="color:#6B7280;font-size:0.85rem">Generado el ${fecha}</p>
    <h2>Resumen global</h2>
    <div class="kpis">
      <div class="kpi"><div class="kpi-val">${stats.totalAlumnos}</div><div class="kpi-label">Alumnos totales</div></div>
      <div class="kpi"><div class="kpi-val">${stats.totalActivos}</div><div class="kpi-label">Activos esta semana</div></div>
      <div class="kpi"><div class="kpi-val">${stats.notaGlobal !== null ? stats.notaGlobal + '%' : '—'}</div><div class="kpi-label">Nota media 30d</div></div>
      <div class="kpi"><div class="kpi-val">${stats.sesiones30d}</div><div class="kpi-label">Sesiones 30d</div></div>
      <div class="kpi"><div class="kpi-val" style="color:#DC2626">${stats.totalEnRiesgo}</div><div class="kpi-label">En riesgo</div></div>
      <div class="kpi"><div class="kpi-val" style="color:#B45309">${stats.totalPorExpirar}</div><div class="kpi-label">Expiran pronto</div></div>
    </div>
    <h2>Por asignatura</h2>
    <table>
      <tr><th>Asignatura</th><th>Alumnos</th><th>Activos</th><th>Nota media</th><th>Sesiones 30d</th><th>En riesgo</th></tr>
      ${stats.bySubject.map(s => `
        <tr>
          <td>${s.name}</td>
          <td>${s.totalAlumnos}</td>
          <td>${s.alumnosActivos}</td>
          <td>${s.notaMedia !== null ? s.notaMedia + '%' : '—'}</td>
          <td>${s.sesiones30d}</td>
          <td style="color:${s.enRiesgo > 0 ? '#DC2626' : '#6B7280'}">${s.enRiesgo}</td>
        </tr>`).join('')}
    </table>
    ${stats.totalEnRiesgo > 0 ? `
    <h2>Alumnos en riesgo</h2>
    <table>
      <tr><th>Alumno</th><th>Asignatura</th><th>Dias inactivo</th></tr>
      ${stats.bySubject.flatMap(s => s.alumnosEnRiesgo.map(a =>
        `<tr><td>${a.username}</td><td>${s.name}</td><td>${a.diasInactivo ?? 'Sin actividad'}</td></tr>`
      )).join('')}
    </table>` : ''}
    <div class="footer">Generado por FrostFox Academy · ${fecha}</div>
    </body></html>
  `
  const w = window.open('', '_blank')
  w.document.write(html)
  w.document.close()
  setTimeout(() => w.print(), 500)
}

// ── Panel principal ───────────────────────────────────────────────────────────
export default function DirectorPanel({ currentUser }) {
  const { stats, loading, error } = useDirector(currentUser)
  const [seccion, setSeccion] = useState('overview')

  if (loading) return (
    <div className={styles.state}>
      <RefreshCw size={22} className={styles.spinner} /><p>Cargando datos…</p>
    </div>
  )
  if (error) return (
    <div className={styles.state}><AlertTriangle size={22} /><p>{error}</p></div>
  )
  if (!stats) return null

  return (
    <div className={styles.page}>
      {/* Onboarding checklist — solo visible si hay pasos pendientes */}
      <OnboardingChecklist currentUser={currentUser} stats={stats} />

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Panel de Direccion</h1>
          <p className={styles.pageSubtitle}>{currentUser?.academyName || 'Tu academia'}</p>
        </div>
        <button className={styles.btnExport}
          onClick={() => exportarInforme(stats, currentUser?.academyName)}>
          <FileText size={14} /> Exportar informe
        </button>
      </div>

      {/* KPIs */}
      <div className={styles.kpisRow}>
        <KpiCard icon={Users}         label="Alumnos totales"  value={stats.totalAlumnos}    color="#0891B2" />
        <KpiCard icon={GraduationCap} label="Profesores"       value={stats.totalProfesores}  color="#7C3AED" />
        <KpiCard icon={Zap}           label="Activos 7d"       value={stats.totalActivos}     color="#059669"
          sub={`${stats.totalAlumnos > 0 ? Math.round(stats.totalActivos / stats.totalAlumnos * 100) : 0}% del total`} />
        <KpiCard icon={BarChart2}     label="Nota media 30d"
          value={stats.notaGlobal !== null ? `${stats.notaGlobal}%` : '—'}
          color={scoreColor(stats.notaGlobal)} />
        <KpiCard icon={AlertTriangle} label="En riesgo"        value={stats.totalEnRiesgo}    color="#DC2626"
          alert={stats.totalEnRiesgo > 0} />
        <KpiCard icon={Shield}        label="Expiran pronto"   value={stats.totalPorExpirar}  color="#B45309"
          alert={stats.totalPorExpirar > 0} />
      </div>

      {/* Alertas */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}><AlertTriangle size={14} /> Alertas</h2>
        <AlertasPanel stats={stats} />
      </div>

      {/* Tabs navegacion */}
      <div className={styles.tabs}>
        {[
          { id: 'overview',    label: 'Actividad',   icon: TrendingUp },
          { id: 'profesores',  label: 'Profesores',  icon: GraduationCap },
          { id: 'asignaturas', label: 'Asignaturas', icon: BookOpen },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id}
            className={[styles.tab, seccion === id ? styles.tabActive : ''].join(' ')}
            onClick={() => setSeccion(id)}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {seccion === 'overview' && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Sesiones por semana (ultimas 8 semanas)</h2>
          <div className={styles.chartCard}>
            <ActivityChart semanas={stats.semanas} />
            {stats.sesiones30d === 0 && (
              <p className={styles.empty}>Sin sesiones registradas todavia</p>
            )}
          </div>
        </div>
      )}

      {seccion === 'profesores' && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Profesores esta semana</h2>
          <ProfesoresTable bySubject={stats.bySubject} />
        </div>
      )}

      {seccion === 'asignaturas' && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Detalle por asignatura</h2>
          {stats.bySubject.length === 0 ? (
            <p className={styles.empty}>Sin asignaturas configuradas</p>
          ) : (
            <div className={styles.subList}>
              {stats.bySubject.map(sub => <SubjectCard key={sub.id} sub={sub} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
