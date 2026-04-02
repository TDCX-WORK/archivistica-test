import { useState, useMemo, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, CalendarDays, X, ChevronDown } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import styles from './ClaseEvolucionChart.module.css'

/* ─── Constantes ──────────────────────────────────────────────────────────── */
const MODOS_BASE = [
  { id: 'all',      label: 'Global',           color: '#6366F1' },
  { id: 'beginner', label: 'Test Rápido',       color: '#059669' },
  { id: 'advanced', label: 'Test Avanzado',     color: '#D97706' },
  { id: 'exam',     label: 'Simulacro Oficial', color: '#7C3AED' },
  { id: 'bloques',  label: 'Por bloques',       color: '#0891B2' },
]

const RANGOS = [
  { id: '7d',    label: '7d',     dias: 7   },
  { id: '30d',   label: '30d',    dias: 30  },
  { id: '90d',   label: '3m',     dias: 90  },
  { id: 'todo',  label: 'Todo',   dias: null },
]

function scoreColor(s) {
  if (s >= 80) return '#059669'
  if (s >= 60) return '#0891B2'
  if (s >= 40) return '#D97706'
  return '#DC2626'
}

/* ─── Componente principal ────────────────────────────────────────────────── */
export default function ClaseEvolucionChart({ alumnos, sessions, academyId, subjectId }) {
  const [filtroActivo, setFiltroActivo] = useState('all')   // id de modo o block_id
  const [rangoActivo,  setRangoActivo]  = useState('todo')
  const [fechaDesde,   setFechaDesde]   = useState('')
  const [fechaHasta,   setFechaHasta]   = useState('')
  const [showCustom,   setShowCustom]   = useState(false)
  const [bloques,      setBloques]      = useState([])
  const [showBloques,  setShowBloques]  = useState(false)

  // Cargar bloques de la academia
  useEffect(() => {
    if (!academyId) return
    const load = async () => {
      let q = supabase.from('content_blocks')
        .select('id, label, color, position')
        .eq('academy_id', academyId)
        .order('position')
      if (subjectId) q = q.eq('subject_id', subjectId)
      const { data } = await q
      setBloques(data || [])
    }
    load()
  }, [academyId, subjectId])

  // Filtro activo — puede ser un modo base o un block_id
  const modoSeleccionado = MODOS_BASE.find(m => m.id === filtroActivo)
  const bloqueSeleccionado = bloques.find(b => b.id === filtroActivo)
  const colorActivo = modoSeleccionado?.color || bloqueSeleccionado?.color || '#6366F1'
  const labelActivo = modoSeleccionado?.label || bloqueSeleccionado?.label || 'Global'

  /* ── Procesar datos ──────────────────────────────────────────────────────── */
  const { puntos, alumnosLineas, tendencia, mediaActual, mediaInicio, totalSesiones } = useMemo(() => {
    const vacio = { puntos: [], alumnosLineas: [], tendencia: 0, mediaActual: null, mediaInicio: null, totalSesiones: 0 }
    if (!sessions?.length) return vacio


    // Filtrar por modo
    // NOTA: mode_id puede ser 'beginner'/'advanced'/'exam' O un UUID de bloque temático
    const MODOS_FIJOS = ['beginner', 'advanced', 'exam']
    const isUUID = (id) => id && id.includes('-') && id.length > 20 && !MODOS_FIJOS.includes(id)
    const isModoFallo = (id) => ['all_fails','review_due','quick_review'].includes(id)

    let sessFiltradas
    if (filtroActivo === 'all') {
      // Global: todos excepto modos de repaso de fallos
      sessFiltradas = sessions.filter(s => s.mode_id && !isModoFallo(s.mode_id))
    } else if (MODOS_FIJOS.includes(filtroActivo)) {
      sessFiltradas = sessions.filter(s => s.mode_id === filtroActivo)
    } else if (filtroActivo === 'bloques') {
      // Solo sesiones de bloque (mode_id es UUID)
      sessFiltradas = sessions.filter(s => isUUID(s.mode_id))
    } else {
      // UUID de bloque específico
      sessFiltradas = sessions.filter(s => s.mode_id === filtroActivo)
    }

    // Filtrar por rango de fechas
    const ahora = new Date()
    let fechaMin = null, fechaMax = null
    if (showCustom && fechaDesde) {
      fechaMin = new Date(fechaDesde + 'T00:00:00')
      fechaMax = fechaHasta ? new Date(fechaHasta + 'T23:59:59') : ahora
    } else {
      const rango = RANGOS.find(r => r.id === rangoActivo)
      if (rango?.dias) fechaMin = new Date(ahora.getTime() - rango.dias * 86400000)
    }

    const sessConFecha = sessFiltradas.filter(s => {
      const f = new Date(s.played_at || s.created_at)
      if (fechaMin && f < fechaMin) return false
      if (fechaMax && f > fechaMax) return false
      return true
    })

    if (!sessConFecha.length) return vacio

    // Agrupar por día — media, min, max
    const porDia = {}
    for (const s of sessConFecha) {
      const dia = (s.played_at || s.created_at)?.slice(0, 10)
      if (!dia) continue
      if (!porDia[dia]) porDia[dia] = []
      porDia[dia].push(s.score)
    }

    const dias = Object.keys(porDia).sort()
    const puntos = dias.map(dia => ({
      dia,
      media: Math.round(porDia[dia].reduce((a, b) => a + b, 0) / porDia[dia].length),
      min:   Math.min(...porDia[dia]),
      max:   Math.max(...porDia[dia]),
      n:     porDia[dia].length,
    }))

    // Líneas por alumno
    const alumnosLineas = alumnos.map(alumno => {
      const sessA = sessConFecha
        .filter(s => s.user_id === alumno.id)
        .sort((a, b) => new Date(a.played_at || a.created_at) - new Date(b.played_at || b.created_at))
      return {
        id: alumno.id, username: alumno.username,
        puntos: sessA.map(s => ({ dia: (s.played_at || s.created_at)?.slice(0,10), score: s.score })),
        color: alumno.enRiesgo ? '#DC2626' : '#94A3B8',
      }
    }).filter(a => a.puntos.length >= 1)

    // Tendencia
    const mitad    = Math.floor(puntos.length / 2)
    const primeraM = puntos.slice(0, Math.max(mitad, 1)).reduce((s, d) => s + d.media, 0) / Math.max(mitad, 1)
    const segundaM = puntos.slice(Math.max(mitad, 1)).reduce((s, d) => s + d.media, 0) / Math.max(puntos.length - mitad, 1)
    const tendencia = puntos.length >= 2 ? Math.round(segundaM - primeraM) : 0

    return {
      puntos,
      alumnosLineas,
      tendencia,
      mediaActual:   puntos[puntos.length - 1]?.media ?? null,
      mediaInicio:   puntos[0]?.media ?? null,
      totalSesiones: sessConFecha.length,
    }
  }, [sessions, alumnos, filtroActivo, rangoActivo, fechaDesde, fechaHasta, showCustom])

  /* ── SVG ─────────────────────────────────────────────────────────────────── */
  const W = 700, H = 200
  const PAD = { top: 24, right: 24, bottom: 36, left: 40 }
  const iW  = W - PAD.left - PAD.right
  const iH  = H - PAD.top  - PAD.bottom

  const xS = (i, n)  => PAD.left + (n <= 1 ? iW / 2 : (i / (n - 1)) * iW)
  const yS = (v)     => PAD.top  + iH - ((Math.max(0, Math.min(v, 100)) / 100) * iH)

  const mediaPath = puntos.length >= 2
    ? puntos.map((p, i) => `${i === 0 ? 'M' : 'L'}${xS(i, puntos.length)},${yS(p.media)}`).join(' ')
    : null

  const areaPath = puntos.length >= 2 ? [
    ...puntos.map((p, i) => `${i === 0 ? 'M' : 'L'}${xS(i, puntos.length)},${yS(p.max)}`),
    ...puntos.slice().reverse().map((p, i, arr) => `L${xS(arr.length - 1 - i, puntos.length)},${yS(p.min)}`),
    'Z'
  ].join(' ') : null

  return (
    <div className={styles.card}>

      {/* ── Header ── */}
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
          {/* Fila 1: Modos + Bloques */}
          <div className={styles.selectorRow}>
            {/* Modos base */}
            {MODOS_BASE.map(m => (
              <button key={m.id}
                className={[styles.selectorBtn, filtroActivo === m.id || (m.id === 'bloques' && bloqueSeleccionado) ? styles.selectorBtnActive : ''].join(' ')}
                style={(filtroActivo === m.id || (m.id === 'bloques' && bloqueSeleccionado)) ? { '--sc': bloqueSeleccionado && m.id === 'bloques' ? bloqueSeleccionado.color : m.color } : {}}
                onClick={() => {
                  if (m.id === 'bloques') {
                    setShowBloques(v => !v)
                  } else {
                    setFiltroActivo(m.id)
                    setShowBloques(false)
                  }
                }}
              >
                {m.id === 'bloques' && bloqueSeleccionado
                  ? bloqueSeleccionado.label.split(/[:—]/)[0].trim()
                  : m.label}
                {m.id === 'bloques' && <ChevronDown size={10} style={{ marginLeft: 2 }} />}
              </button>
            ))}

            {/* Dropdown de bloques específicos */}
            {showBloques && bloques.length > 0 && (
              <div className={styles.bloquesDropdownInline}>
                <div className={styles.bloquesMenu} style={{ position: 'relative', top: 'auto', right: 'auto', marginTop: 4, display: 'flex', flexDirection: 'column' }}>
                  <button className={styles.bloqueMenuItem}
                    style={{ fontStyle: 'italic', color: 'var(--ink-subtle)' }}
                    onClick={() => { setFiltroActivo('bloques'); setShowBloques(false) }}>
                    Todos los bloques
                  </button>
                  {bloques.map(b => (
                    <button key={b.id}
                      className={[styles.bloqueMenuItem, filtroActivo === b.id ? styles.bloqueMenuItemActive : ''].join(' ')}
                      style={{ '--bc': b.color }}
                      onClick={() => { setFiltroActivo(b.id); setShowBloques(false) }}
                    >
                      <span className={styles.bloqueDot} style={{ background: b.color }} />
                      {b.label.split(/[:—]/)[0].trim()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Fila 2: Rango de fechas */}
          <div className={styles.rangoRow}>
            <CalendarDays size={12} className={styles.rangoIcon} />
            {RANGOS.map(r => (
              <button key={r.id}
                className={[styles.rangoBtn, rangoActivo === r.id && !showCustom ? styles.rangoBtnActive : ''].join(' ')}
                onClick={() => { setRangoActivo(r.id); setShowCustom(false) }}
              >
                {r.label}
              </button>
            ))}
            <button
              className={[styles.rangoBtn, showCustom ? styles.rangoBtnActive : ''].join(' ')}
              onClick={() => setShowCustom(v => !v)}
            >
              Fechas
            </button>

            {/* Inputs personalizados inline */}
            {showCustom && (
              <>
                <input type="date" className={styles.dateInput} value={fechaDesde}
                  onChange={e => setFechaDesde(e.target.value)} />
                <span className={styles.dateSep}>→</span>
                <input type="date" className={styles.dateInput} value={fechaHasta}
                  onChange={e => setFechaHasta(e.target.value)} />
                {(fechaDesde || fechaHasta) && (
                  <button className={styles.clearBtn}
                    onClick={() => { setFechaDesde(''); setFechaHasta('') }}>
                    <X size={11} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── KPIs ── */}
      {puntos.length > 0 && (
        <div className={styles.kpiRow}>
          <div className={styles.kpi}>
            <span className={styles.kpiVal} style={{ color: mediaActual !== null ? scoreColor(mediaActual) : 'var(--ink)' }}>
              {mediaActual !== null ? `${mediaActual}%` : '—'}
            </span>
            <span className={styles.kpiLabel}>Media actual</span>
          </div>
          <div className={styles.kpi}>
            <span className={styles.kpiVal} style={{ color: mediaInicio !== null ? scoreColor(mediaInicio) : 'var(--ink)' }}>
              {mediaInicio !== null ? `${mediaInicio}%` : '—'}
            </span>
            <span className={styles.kpiLabel}>Media inicio</span>
          </div>
          <div className={styles.kpi}>
            <span className={styles.kpiVal}>{totalSesiones}</span>
            <span className={styles.kpiLabel}>Sesiones</span>
          </div>
          <div className={styles.kpi}>
            <span className={styles.kpiVal}>{puntos.length}</span>
            <span className={styles.kpiLabel}>Días con actividad</span>
          </div>
        </div>
      )}

      {/* ── Gráfico SVG ── */}
      {puntos.length === 0 ? (
        <div className={styles.empty}>
          <TrendingUp size={28} strokeWidth={1.4} />
          <p>Sin datos para este filtro</p>
          <span>Prueba con otro modo, bloque o rango de fechas</span>
        </div>
      ) : (
        <>
          <div className={styles.chartWrap}>
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={styles.svg}>
              <defs>
                <linearGradient id={`areaG_${filtroActivo}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={colorActivo} stopOpacity="0.18" />
                  <stop offset="100%" stopColor={colorActivo} stopOpacity="0.02" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>

              {/* Fondo suave */}
              <rect x="0" y="0" width={W} height={H} fill="#F8FAFC" />

              {/* Grid horizontal */}
              {[0, 25, 50, 75, 100].map(v => (
                <g key={v}>
                  <line x1={PAD.left} y1={yS(v)} x2={W - PAD.right} y2={yS(v)}
                    stroke="#E2E8F0" strokeWidth="1"
                    strokeDasharray={v === 0 || v === 100 ? 'none' : '4,4'} />
                  <text x={PAD.left - 6} y={yS(v) + 4} fontSize="9" fill="#94A3B8" textAnchor="end">
                    {v}%
                  </text>
                </g>
              ))}

              {/* Área min-max */}
              {areaPath && <path d={areaPath} fill={`url(#areaG_${filtroActivo})`} />}

              {/* Líneas de alumnos individuales */}
              {alumnosLineas.map(alumno => {
                const dias = [...new Set(puntos.map(p => p.dia))]
                const pts  = alumno.puntos
                  .map(p => {
                    const idx = dias.indexOf(p.dia)
                    return idx >= 0 ? { x: xS(idx, dias.length), y: yS(p.score) } : null
                  })
                  .filter(Boolean)
                if (pts.length < 2) return null
                return (
                  <path key={alumno.id}
                    d={pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')}
                    fill="none" stroke={alumno.color} strokeWidth="1.2"
                    strokeOpacity="0.3" strokeLinejoin="round" strokeLinecap="round"
                  />
                )
              })}

              {/* Línea de media — protagonista */}
              {mediaPath && (
                <path d={mediaPath} fill="none" stroke={colorActivo}
                  strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
                  filter="url(#glow)"
                />
              )}

              {/* Puntos de la media */}
              {puntos.map((p, i) => (
                <g key={i}>
                  <circle cx={xS(i, puntos.length)} cy={yS(p.media)} r="4"
                    fill={colorActivo} stroke="white" strokeWidth="2"
                    filter="url(#glow)" />
                  {(puntos.length <= 8 || i % Math.ceil(puntos.length / 8) === 0) && (
                    <text x={xS(i, puntos.length)} y={H - 4}
                      fontSize="9" fill="#94A3B8" textAnchor="middle">
                      {new Date(p.dia + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </text>
                  )}
                </g>
              ))}

              {/* Etiqueta último punto */}
              {puntos.length > 0 && (() => {
                const last = puntos[puntos.length - 1]
                const x    = xS(puntos.length - 1, puntos.length)
                const y    = yS(last.media)
                return (
                  <g>
                    <rect x={x - 20} y={y - 24} width={40} height={18} rx="5"
                      fill={colorActivo} />
                    <text x={x} y={y - 11} fontSize="10" fontWeight="700"
                      fill="white" textAnchor="middle">{last.media}%</text>
                  </g>
                )
              })()}
            </svg>
          </div>

          {/* Leyenda */}
          <div className={styles.leyenda}>
            <span className={styles.leyendaLabel}>Alumnos:</span>
            {alumnosLineas.map(a => (
              <span key={a.id} className={styles.leyendaItem}>
                <span className={styles.leyendaDot} style={{ background: a.color }} />
                {a.username}
              </span>
            ))}
            <span className={styles.leyendaItem}>
              <span className={styles.leyendaLinea} style={{ background: colorActivo }} />
              {labelActivo} — media
            </span>
          </div>
        </>
      )}
    </div>
  )
}
