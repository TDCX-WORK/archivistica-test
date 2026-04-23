import { useState, useMemo, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, CalendarDays, X, ChevronDown, Users, UsersRound } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { AlumnoConStats } from '../../../types'
import styles from './ClaseEvolucionChart.module.css'

const MODOS_BASE = [
  { id: 'all',      label: 'Global',           color: '#6366F1' },
  { id: 'beginner', label: 'Test Rápido',       color: '#059669' },
  { id: 'advanced', label: 'Test Avanzado',     color: '#D97706' },
  { id: 'exam',     label: 'Simulacro Oficial', color: '#7C3AED' },
  { id: 'bloques',  label: 'Por bloques',       color: '#0891B2' },
]

const RANGOS = [
  { id: '7d',   label: '7d',   dias: 7    },
  { id: '30d',  label: '30d',  dias: 30   },
  { id: '90d',  label: '3m',   dias: 90   },
  { id: 'todo', label: 'Todo', dias: null },
]

/* Paleta para líneas de alumno — misma idea que Foro / Mensajes */
const ALUMNO_COLORS = [
  '#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626',
  '#0891B2', '#EC4899', '#10B981', '#F59E0B', '#6366F1',
]
function colorForId(id: string): string {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return ALUMNO_COLORS[hash % ALUMNO_COLORS.length]!
}

function scoreColor(s: number): string {
  if (s >= 80) return '#059669'
  if (s >= 60) return '#0891B2'
  if (s >= 40) return '#D97706'
  return '#DC2626'
}

/* ── Lunes de la semana a la que pertenece una fecha (YYYY-MM-DD) ── */
function weekStart(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  const dow = (d.getDay() + 6) % 7 // 0 = lunes
  d.setDate(d.getDate() - dow)
  return d.toISOString().slice(0, 10)
}

/* ── Formato de etiqueta de eje X ── */
function fmtTick(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

/* ── Curva suave Catmull-Rom → Bezier ── */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return ''
  if (pts.length === 2) return `M${pts[0]!.x},${pts[0]!.y} L${pts[1]!.x},${pts[1]!.y}`
  const t = 0.18
  let d = `M${pts[0]!.x},${pts[0]!.y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!
    const p1 = pts[i]!
    const p2 = pts[i + 1]!
    const p3 = pts[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) * t
    const c1y = p1.y + (p2.y - p0.y) * t
    const c2x = p2.x - (p3.x - p1.x) * t
    const c2y = p2.y - (p3.y - p1.y) * t
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`
  }
  return d
}

interface Bloque { id: string; label: string; color: string; position: number }

interface SessionParaGrafico {
  user_id:    string
  score:      number
  played_at:  string
  created_at: string
  mode_id:    string
}

interface ClaseEvolucionChartProps {
  alumnos:    AlumnoConStats[]
  sessions:   SessionParaGrafico[]
  academyId:  string | null | undefined
  subjectId:  string | null | undefined
}

export default function ClaseEvolucionChart({ alumnos, sessions, academyId, subjectId }: ClaseEvolucionChartProps) {
  const [filtroActivo, setFiltroActivo] = useState('all')
  const [rangoActivo,  setRangoActivo]  = useState('todo')
  const [fechaDesde,   setFechaDesde]   = useState('')
  const [fechaHasta,   setFechaHasta]   = useState('')
  const [showCustom,   setShowCustom]   = useState(false)
  const [bloques,      setBloques]      = useState<Bloque[]>([])
  const [showBloques,  setShowBloques]  = useState(false)
  const [verAlumnos,   setVerAlumnos]   = useState(false)
  const [alumnoHover,  setAlumnoHover]  = useState<string | null>(null)
  const [puntoHover,   setPuntoHover]   = useState<number | null>(null)

  useEffect(() => {
    if (!academyId) return
    const load = async () => {
      let q = supabase.from('content_blocks').select('id, label, color, position').eq('academy_id', academyId).order('position')
      if (subjectId) q = q.eq('subject_id', subjectId)
      const { data } = await q
      setBloques((data ?? []) as Bloque[])
    }
    load()
  }, [academyId, subjectId])

  const modoSeleccionado   = MODOS_BASE.find(m => m.id === filtroActivo)
  const bloqueSeleccionado = bloques.find(b => b.id === filtroActivo)
  const colorActivo = modoSeleccionado?.color ?? bloqueSeleccionado?.color ?? '#6366F1'
  const labelActivo = modoSeleccionado?.label ?? bloqueSeleccionado?.label ?? 'Global'

  const { puntos, alumnosLineas, tendencia, mediaActual, mediaInicio, mediaPeriodo, totalSesiones, granularidad } = useMemo(() => {
    const vacio = {
      puntos: [] as { clave: string; media: number; n: number }[],
      alumnosLineas: [] as { id: string; username: string; puntos: { clave: string; score: number }[]; color: string }[],
      tendencia: 0, mediaActual: null as number | null, mediaInicio: null as number | null,
      mediaPeriodo: null as number | null, totalSesiones: 0, granularidad: 'week' as 'day' | 'week',
    }
    if (!sessions?.length) return vacio

    const MODOS_FIJOS = ['beginner', 'advanced', 'exam']
    const isUUID      = (id: string) => id && id.includes('-') && id.length > 20 && !MODOS_FIJOS.includes(id)
    const isModoFallo = (id: string) => ['all_fails', 'review_due', 'quick_review'].includes(id)

    let sessFiltradas: SessionParaGrafico[]
    if (filtroActivo === 'all') {
      sessFiltradas = sessions.filter(s => s.mode_id && !isModoFallo(s.mode_id))
    } else if (MODOS_FIJOS.includes(filtroActivo)) {
      sessFiltradas = sessions.filter(s => s.mode_id === filtroActivo)
    } else if (filtroActivo === 'bloques') {
      sessFiltradas = sessions.filter(s => isUUID(s.mode_id))
    } else {
      sessFiltradas = sessions.filter(s => s.mode_id === filtroActivo)
    }

    const ahora = new Date()
    let fechaMin: Date | null = null, fechaMax: Date | null = null
    let diasRango: number | null = null
    if (showCustom && fechaDesde) {
      fechaMin = new Date(fechaDesde + 'T00:00:00')
      fechaMax = fechaHasta ? new Date(fechaHasta + 'T23:59:59') : ahora
      diasRango = Math.round((fechaMax.getTime() - fechaMin.getTime()) / 86400000)
    } else {
      const rango = RANGOS.find(r => r.id === rangoActivo)
      if (rango?.dias) {
        fechaMin = new Date(ahora.getTime() - rango.dias * 86400000)
        diasRango = rango.dias
      }
    }

    const sessConFecha = sessFiltradas.filter(s => {
      const f = new Date(s.played_at ?? s.created_at!)
      if (fechaMin && f < fechaMin) return false
      if (fechaMax && f > fechaMax) return false
      return true
    })
    if (!sessConFecha.length) return vacio

    // Granularidad: día si rango ≤14d; semana en el resto (reduce ruido masivamente)
    const diasUnicos = new Set(sessConFecha.map(s => (s.played_at ?? s.created_at)?.slice(0, 10))).size
    const gran: 'day' | 'week' =
      (diasRango !== null && diasRango <= 14) || diasUnicos <= 10 ? 'day' : 'week'

    const claveOf = (iso: string) => gran === 'week' ? weekStart(iso) : iso

    const porClave: Record<string, number[]> = {}
    for (const s of sessConFecha) {
      const iso = (s.played_at ?? s.created_at)?.slice(0, 10)
      if (!iso) continue
      const k = claveOf(iso)
      if (!porClave[k]) porClave[k] = []
      porClave[k]!.push(s.score ?? 0)
    }

    const claves = Object.keys(porClave).sort()
    const puntos = claves.map(clave => ({
      clave,
      media: Math.round(porClave[clave]!.reduce((a, b) => a + b, 0) / porClave[clave]!.length),
      n:     porClave[clave]!.length,
    }))

    // Líneas de alumno: agrupadas por la misma granularidad
    const alumnosLineas = alumnos.map(alumno => {
      const sessA = sessConFecha.filter(s => s.user_id === alumno.id)
      const porClaveA: Record<string, number[]> = {}
      for (const s of sessA) {
        const iso = (s.played_at ?? s.created_at)?.slice(0, 10)
        if (!iso) continue
        const k = claveOf(iso)
        if (!porClaveA[k]) porClaveA[k] = []
        porClaveA[k]!.push(s.score ?? 0)
      }
      const clavesA = Object.keys(porClaveA).sort()
      return {
        id: alumno.id,
        username: alumno.username,
        puntos: clavesA.map(k => ({
          clave: k,
          score: Math.round(porClaveA[k]!.reduce((a, b) => a + b, 0) / porClaveA[k]!.length),
        })),
        color: colorForId(alumno.id),
      }
    }).filter(a => a.puntos.length >= 2)

    const mitad    = Math.floor(puntos.length / 2)
    const primeraM = puntos.slice(0, Math.max(mitad, 1)).reduce((s, d) => s + d.media, 0) / Math.max(mitad, 1)
    const segundaM = puntos.slice(Math.max(mitad, 1)).reduce((s, d) => s + d.media, 0) / Math.max(puntos.length - mitad, 1)
    const tendencia = puntos.length >= 2 ? Math.round(segundaM - primeraM) : 0
    const mediaPeriodo = puntos.length ? Math.round(puntos.reduce((s, p) => s + p.media, 0) / puntos.length) : null

    return {
      puntos, alumnosLineas, tendencia,
      mediaActual:   puntos[puntos.length - 1]?.media ?? null,
      mediaInicio:   puntos[0]?.media ?? null,
      mediaPeriodo,
      totalSesiones: sessConFecha.length,
      granularidad:  gran,
    }
  }, [sessions, alumnos, filtroActivo, rangoActivo, fechaDesde, fechaHasta, showCustom])

  /* ── Dimensiones del SVG ── */
  const W = 700, H = 220
  const PAD = { top: 16, right: 28, bottom: 30, left: 38 }
  const iW  = W - PAD.left - PAD.right
  const iH  = H - PAD.top  - PAD.bottom

  const xS = (i: number, n: number) => PAD.left + (n <= 1 ? iW / 2 : (i / (n - 1)) * iW)
  const yS = (v: number)            => PAD.top  + iH - ((Math.max(0, Math.min(v, 100)) / 100) * iH)

  const mediaPts = puntos.map((p, i) => ({ x: xS(i, puntos.length), y: yS(p.media) }))
  const mediaPath = smoothPath(mediaPts)
  const areaPath  = mediaPath && mediaPts.length >= 2
    ? `${mediaPath} L${mediaPts[mediaPts.length - 1]!.x},${yS(0)} L${mediaPts[0]!.x},${yS(0)} Z`
    : null

  /* Ticks X: 4–5 puntos bien espaciados */
  const tickIdxs = (() => {
    const n = puntos.length
    if (n <= 5) return puntos.map((_, i) => i)
    const step = Math.ceil(n / 5)
    const idxs: number[] = []
    for (let i = 0; i < n; i += step) idxs.push(i)
    if (idxs[idxs.length - 1] !== n - 1) idxs.push(n - 1)
    return idxs
  })()

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h3 className={styles.title}>Evolución de la clase</h3>
          <div className={styles.tendenciaRow}>
            {puntos.length < 2
              ? <span className={styles.tendenciaNeutral}>— Sin suficientes datos</span>
              : tendencia > 0
                ? <><TrendingUp size={13} style={{ color: '#059669' }} /><span className={styles.tendenciaPos}>+{tendencia}pts vs inicio</span></>
                : tendencia < 0
                  ? <><TrendingDown size={13} style={{ color: '#DC2626' }} /><span className={styles.tendenciaNeg}>{tendencia}pts vs inicio</span></>
                  : <><Minus size={13} style={{ color: '#6B7280' }} /><span className={styles.tendenciaNeutral}>Estable</span></>
            }
          </div>
        </div>

        <div className={styles.filtrosWrap}>
          <div className={styles.selectorRow}>
            {MODOS_BASE.map(m => (
              <button key={m.id}
                className={[styles.selectorBtn, filtroActivo === m.id || (m.id === 'bloques' && bloqueSeleccionado) ? styles.selectorBtnActive : ''].join(' ')}
                style={(filtroActivo === m.id || (m.id === 'bloques' && bloqueSeleccionado)) ? { ['--sc' as string]: bloqueSeleccionado && m.id === 'bloques' ? bloqueSeleccionado.color : m.color } : {}}
                onClick={() => {
                  if (m.id === 'bloques') { setShowBloques(v => !v) }
                  else { setFiltroActivo(m.id); setShowBloques(false) }
                }}
              >
                {m.id === 'bloques' && bloqueSeleccionado ? bloqueSeleccionado.label.split(/[:—]/)[0]!.trim() : m.label}
                {m.id === 'bloques' && <ChevronDown size={10} style={{ marginLeft: 2 }} />}
              </button>
            ))}

            {showBloques && bloques.length > 0 && (
              <div className={styles.bloquesDropdownInline}>
                <div className={styles.bloquesMenu} style={{ position: 'relative', top: 'auto', right: 'auto', marginTop: 4, display: 'flex', flexDirection: 'column' }}>
                  <button className={styles.bloqueMenuItem} style={{ fontStyle: 'italic', color: 'var(--ink-subtle)' }}
                    onClick={() => { setFiltroActivo('bloques'); setShowBloques(false) }}>
                    Todos los bloques
                  </button>
                  {bloques.map(b => (
                    <button key={b.id}
                      className={[styles.bloqueMenuItem, filtroActivo === b.id ? styles.bloqueMenuItemActive : ''].join(' ')}
                      style={{ ['--bc' as string]: b.color }}
                      onClick={() => { setFiltroActivo(b.id); setShowBloques(false) }}>
                      <span className={styles.bloqueDot} style={{ background: b.color }} />
                      {b.label.split(/[:—]/)[0]!.trim()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.rangoRow}>
            <CalendarDays size={12} className={styles.rangoIcon} />
            {RANGOS.map(r => (
              <button key={r.id}
                className={[styles.rangoBtn, rangoActivo === r.id && !showCustom ? styles.rangoBtnActive : ''].join(' ')}
                onClick={() => { setRangoActivo(r.id); setShowCustom(false) }}>
                {r.label}
              </button>
            ))}
            <button className={[styles.rangoBtn, showCustom ? styles.rangoBtnActive : ''].join(' ')} onClick={() => setShowCustom(v => !v)}>
              Fechas
            </button>
            {showCustom && (
              <>
                <input type="date" className={styles.dateInput} value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
                <span className={styles.dateSep}>→</span>
                <input type="date" className={styles.dateInput} value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
                {(fechaDesde || fechaHasta) && (
                  <button className={styles.clearBtn} onClick={() => { setFechaDesde(''); setFechaHasta('') }}>
                    <X size={11} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {puntos.length > 0 && (
        <div className={styles.kpiRow}>
          {[
            { val: mediaActual  !== null ? `${mediaActual}%`  : '—', label: 'Media actual',       color: mediaActual  !== null ? scoreColor(mediaActual)  : 'var(--ink)' },
            { val: mediaInicio  !== null ? `${mediaInicio}%`  : '—', label: 'Media inicio',       color: mediaInicio  !== null ? scoreColor(mediaInicio)  : 'var(--ink)' },
            { val: totalSesiones,                                      label: 'Sesiones',           color: 'var(--ink)' },
            { val: puntos.length,                                      label: granularidad === 'week' ? 'Semanas' : 'Días con actividad', color: 'var(--ink)' },
          ].map(({ val, label, color }) => (
            <div key={label} className={styles.kpi}>
              <span className={styles.kpiVal} style={{ color }}>{val}</span>
              <span className={styles.kpiLabel}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {puntos.length === 0 ? (
        <div className={styles.empty}>
          <TrendingUp size={28} strokeWidth={1.4} />
          <p>Sin datos para este filtro</p>
          <span>Prueba con otro modo, bloque o rango de fechas</span>
        </div>
      ) : (
        <>
          {/* Toggle Ver alumnos + indicador granularidad */}
          <div className={styles.chartToolbar}>
            <span className={styles.granPill}>
              {granularidad === 'week' ? 'Vista semanal' : 'Vista diaria'}
            </span>
            <button
              className={[styles.verAlumnosBtn, verAlumnos ? styles.verAlumnosBtnActive : ''].join(' ')}
              onClick={() => setVerAlumnos(v => !v)}
              disabled={alumnosLineas.length === 0}
              title={alumnosLineas.length === 0 ? 'No hay alumnos con datos suficientes' : ''}
            >
              {verAlumnos ? <UsersRound size={13} /> : <Users size={13} />}
              {verAlumnos ? 'Ocultar alumnos' : 'Ver alumnos'}
              {alumnosLineas.length > 0 && <span className={styles.verAlumnosCount}>{alumnosLineas.length}</span>}
            </button>
          </div>

          <div className={styles.chartWrap}>
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={styles.svg} role="img"
              onMouseLeave={() => setPuntoHover(null)}>
              <defs>
                <linearGradient id={`areaG_${filtroActivo}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={colorActivo} stopOpacity="0.22" />
                  <stop offset="100%" stopColor={colorActivo} stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid horizontal */}
              {[0, 25, 50, 75, 100].map(v => (
                <g key={v}>
                  <line x1={PAD.left} y1={yS(v)} x2={W - PAD.right} y2={yS(v)}
                    className={styles.gridLine}
                    strokeDasharray={v === 0 || v === 100 ? 'none' : '3,5'} />
                  <text x={PAD.left - 8} y={yS(v) + 3} className={styles.axisText} textAnchor="end">{v}%</text>
                </g>
              ))}

              {/* Línea de promedio del periodo (referencia) */}
              {mediaPeriodo !== null && (
                <g>
                  <line x1={PAD.left} x2={W - PAD.right} y1={yS(mediaPeriodo)} y2={yS(mediaPeriodo)}
                    stroke={colorActivo} strokeOpacity="0.35" strokeWidth="1" strokeDasharray="2,4" />
                  <text x={W - PAD.right + 2} y={yS(mediaPeriodo) + 3} fontSize="9" fill={colorActivo} opacity="0.75" fontWeight="600">
                    prom. {mediaPeriodo}%
                  </text>
                </g>
              )}

              {/* Área bajo media */}
              {areaPath && <path d={areaPath} fill={`url(#areaG_${filtroActivo})`} />}

              {/* Líneas de alumnos (solo con toggle) */}
              {verAlumnos && alumnosLineas.map(alumno => {
                const clavesList = puntos.map(p => p.clave)
                const pts = alumno.puntos
                  .map(p => {
                    const idx = clavesList.indexOf(p.clave)
                    return idx >= 0 ? { x: xS(idx, clavesList.length), y: yS(p.score) } : null
                  })
                  .filter((p): p is { x: number; y: number } => p !== null)
                if (pts.length < 2) return null

                const isHover = alumnoHover === alumno.id
                const isDimmed = alumnoHover !== null && !isHover

                return (
                  <path key={alumno.id}
                    d={smoothPath(pts)}
                    fill="none"
                    stroke={alumno.color}
                    strokeWidth={isHover ? 2.4 : 1.2}
                    strokeOpacity={isDimmed ? 0.12 : isHover ? 0.95 : 0.55}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    style={{ transition: 'stroke-opacity 0.15s, stroke-width 0.15s' }}
                  />
                )
              })}

              {/* Línea principal de media */}
              {mediaPath && (
                <path d={mediaPath} fill="none" stroke={colorActivo}
                  strokeWidth={verAlumnos && alumnoHover ? 2 : 2.8}
                  strokeOpacity={verAlumnos && alumnoHover ? 0.35 : 1}
                  strokeLinejoin="round" strokeLinecap="round"
                  style={{ transition: 'stroke-opacity 0.15s, stroke-width 0.15s' }} />
              )}

              {/* Puntos de la media + hit areas para tooltip */}
              {puntos.map((p, i) => {
                const x = xS(i, puntos.length)
                const y = yS(p.media)
                const isHover = puntoHover === i
                const hitW = iW / (puntos.length || 1)
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r={isHover ? 5.5 : 3.5}
                      fill={colorActivo} stroke="var(--surface)" strokeWidth="1.8"
                      style={{ transition: 'r 0.15s' }} />
                    <rect x={x - hitW / 2} y={PAD.top}
                      width={hitW} height={iH}
                      fill="transparent"
                      onMouseEnter={() => setPuntoHover(i)} />
                  </g>
                )
              })}

              {/* Ticks del eje X */}
              {tickIdxs.map(i => {
                const p = puntos[i]!
                return (
                  <text key={i} x={xS(i, puntos.length)} y={H - 8}
                    className={styles.axisText} textAnchor="middle">
                    {fmtTick(p.clave)}
                  </text>
                )
              })}

              {/* Tooltip */}
              {puntoHover !== null && puntos[puntoHover] && (() => {
                const p = puntos[puntoHover]!
                const x = xS(puntoHover, puntos.length)
                const y = yS(p.media)
                const tipW = 126
                const tipH = 44
                const tipX = Math.max(PAD.left, Math.min(W - PAD.right - tipW, x - tipW / 2))
                const tipY = y - tipH - 12 < PAD.top ? y + 12 : y - tipH - 12
                return (
                  <g style={{ pointerEvents: 'none' }}>
                    <line x1={x} y1={PAD.top} x2={x} y2={PAD.top + iH}
                      stroke={colorActivo} strokeOpacity="0.3" strokeWidth="1" strokeDasharray="2,3" />
                    <rect x={tipX} y={tipY} width={tipW} height={tipH} rx="8"
                      fill="var(--surface)" stroke="var(--line)" strokeWidth="1"
                      filter="drop-shadow(0 4px 12px rgba(0,0,0,0.10))" />
                    <text x={tipX + 10} y={tipY + 16} fontSize="10" fontWeight="700" fill="var(--ink)">
                      {fmtTick(p.clave)}{granularidad === 'week' ? ' · semana' : ''}
                    </text>
                    <text x={tipX + 10} y={tipY + 33} fontSize="12" fontWeight="800" fill={colorActivo}>
                      {p.media}%
                    </text>
                    <text x={tipX + 52} y={tipY + 33} fontSize="9" fill="var(--ink-muted)">
                      {p.n} {p.n === 1 ? 'sesión' : 'sesiones'}
                    </text>
                  </g>
                )
              })()}

              {/* Badge de último valor (se oculta al hacer hover) */}
              {puntos.length > 0 && puntoHover === null && (() => {
                const last = puntos[puntos.length - 1]!
                const x = xS(puntos.length - 1, puntos.length)
                const y = yS(last.media)
                const bx = Math.min(W - PAD.right - 38, x - 19)
                return (
                  <g>
                    <rect x={bx} y={y - 24} width={38} height={17} rx="5" fill={colorActivo} />
                    <text x={bx + 19} y={y - 12} fontSize="10" fontWeight="700" fill="white" textAnchor="middle">{last.media}%</text>
                  </g>
                )
              })()}
            </svg>
          </div>

          {/* Leyenda con colores únicos — solo si toggle activo */}
          {verAlumnos && alumnosLineas.length > 0 && (
            <div className={styles.leyenda}>
              <span className={styles.leyendaLabel}>Alumnos:</span>
              {alumnosLineas.map(a => (
                <button key={a.id}
                  className={[styles.leyendaItem, alumnoHover === a.id ? styles.leyendaItemActive : ''].join(' ')}
                  onMouseEnter={() => setAlumnoHover(a.id)}
                  onMouseLeave={() => setAlumnoHover(null)}
                  style={{ ['--lc' as string]: a.color }}>
                  <span className={styles.leyendaDot} style={{ background: a.color }} />
                  {a.username}
                </button>
              ))}
              <span className={styles.leyendaItemStatic}>
                <span className={styles.leyendaLinea} style={{ background: colorActivo }} />
                {labelActivo} — media
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
