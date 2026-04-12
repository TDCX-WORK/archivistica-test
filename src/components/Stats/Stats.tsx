import { useState, useEffect, useRef } from 'react'
import {
  BarChart2, TrendingUp, Award, Flame, BookOpen, CheckCircle,
  Target, Clock, Bookmark, Brain, ArrowUp, ArrowDown, Minus, Loader2, Users
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'
import { supabase }        from '../../lib/supabase'
import ErrorState          from '../ui/ErrorState'
import { useContent }      from '../../hooks/useContent'
import { calcularRacha }   from '../../lib/helpers'
import type { CurrentUser, WrongAnswer, Session } from '../../types'
import type { useProgress } from '../../hooks/useProgress'
import styles from './Stats.module.css'

// ── Donut SVG ──────────────────────────────────────────────────────────────
interface DonutProps {
  pct:      number
  color?:   string
  size?:    number
  stroke?:  number
  label?:   string
  sublabel?: string
}

function Donut({ pct, color = '#2563EB', size = 130, stroke = 14, label, sublabel }: DonutProps) {
  const r    = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const fill = (pct / 100) * circ
  return (
    <div className={styles.donutWrap}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F3F4F6" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`} />
      </svg>
      <div className={styles.donutCenter}>
        <span className={styles.donutPct} style={{ color }}>{pct}%</span>
        {sublabel && <span className={styles.donutSub}>{sublabel}</span>}
      </div>
      {label && <p className={styles.donutLabel}>{label}</p>}
    </div>
  )
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className={styles.tooltipItem}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

// ── Comparativa con la clase ───────────────────────────────────────────────
function ComparativaClaseCard({ avgScore, academyId, subjectId, userId }: {
  avgScore:  number
  academyId: string | null | undefined
  subjectId: string | null | undefined
  userId:    string | null | undefined
}) {
  const [mediaClase,    setMediaClase]    = useState<number | null>(null)
  const [totalSesiones, setTotalSesiones] = useState(0)
  const [loading,       setLoading]       = useState(true)

  useEffect(() => {
    if (!academyId || !userId) { setLoading(false); return }
    const fetch = async () => {
      const hace30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
      let q = supabase
        .from('sessions').select('score, user_id')
        .eq('academy_id', academyId).gte('played_at', hace30).neq('user_id', userId)
      if (subjectId) q = q.or(`subject_id.eq.${subjectId},subject_id.is.null`)
      const { data } = await q
      if (data && data.length > 0) {
        const porAlumno: Record<string, number[]> = {}
        for (const s of data as { user_id: string; score: number }[]) {
          if (!porAlumno[s.user_id]) porAlumno[s.user_id] = []
          porAlumno[s.user_id]!.push(s.score)
        }
        const mediasAlumnos = Object.values(porAlumno).map(
          scores => scores.reduce((a, b) => a + b, 0) / scores.length
        )
        const media = Math.round(mediasAlumnos.reduce((a, b) => a + b, 0) / mediasAlumnos.length)
        setMediaClase(media)
        setTotalSesiones(mediasAlumnos.length)
      } else {
        setMediaClase(-1)
        setTotalSesiones(0)
      }
      setLoading(false)
    }
    fetch()
  }, [academyId, subjectId, avgScore, userId])

  if (loading || mediaClase === null) return null

  if (mediaClase === -1) {
    return (
      <div className={styles.comparativaCard}>
        <div className={styles.comparativaHeader}>
          <Users size={14} className={styles.comparativaIcon} />
          <span className={styles.comparativaTitle}>Comparativa con la clase</span>
          <span className={styles.comparativaSub}>Sin datos aún</span>
        </div>
        <div className={styles.comparativaBody}>
          <div className={styles.comparativaStat}>
            <span className={styles.comparativaStatVal} style={{ color: '#2563EB' }}>{avgScore}%</span>
            <span className={styles.comparativaStatLabel}>Tu nota media</span>
          </div>
          <div className={styles.comparativaSep}>
            <Minus size={20} className={styles.comparativaIgual} />
          </div>
          <div className={styles.comparativaStat}>
            <span className={styles.comparativaStatVal} style={{ color: '#9CA3AF' }}>—</span>
            <span className={styles.comparativaStatLabel}>Media de la clase</span>
          </div>
        </div>
        <p className={styles.comparativaMsg} style={{ color: '#6B7280' }}>
          Ningún compañero ha hecho tests en los últimos 30 días
        </p>
      </div>
    )
  }

  const diff  = avgScore - mediaClase
  const mejor = diff > 0
  const igual = diff === 0
  const percentilMsg = mejor ? 'Estás por encima de la media de tu clase'
    : igual ? 'Estás exactamente en la media de tu clase'
    : 'Estás por debajo de la media de tu clase'

  return (
    <div className={styles.comparativaCard}>
      <div className={styles.comparativaHeader}>
        <Users size={14} className={styles.comparativaIcon} />
        <span className={styles.comparativaTitle}>Comparativa con la clase</span>
        <span className={styles.comparativaSub}>{totalSesiones} alumno{totalSesiones !== 1 ? 's' : ''} · últimos 30 días</span>
      </div>
      <div className={styles.comparativaBody}>
        <div className={styles.comparativaStat}>
          <span className={styles.comparativaStatVal} style={{ color: '#2563EB' }}>{avgScore}%</span>
          <span className={styles.comparativaStatLabel}>Tu nota media</span>
        </div>
        <div className={styles.comparativaSep}>
          {igual ? <Minus size={20} className={styles.comparativaIgual} />
            : mejor ? <ArrowUp size={20} className={styles.comparativaMejor} />
            : <ArrowDown size={20} className={styles.comparativaPeor} />}
          <span className={styles.comparativaDiff}
            style={{ color: igual ? '#6B7280' : mejor ? '#059669' : '#DC2626' }}>
            {igual ? 'igual' : `${Math.abs(diff)} pts`}
          </span>
        </div>
        <div className={styles.comparativaStat}>
          <span className={styles.comparativaStatVal} style={{ color: '#6B7280' }}>{mediaClase}%</span>
          <span className={styles.comparativaStatLabel}>Media de la clase</span>
        </div>
      </div>
      <p className={styles.comparativaMsg} style={{ color: igual ? '#6B7280' : mejor ? '#059669' : '#DC2626' }}>
        {percentilMsg}
      </p>
    </div>
  )
}

// ── Chowchow card ──────────────────────────────────────────────────────────
function ChowchowCard({ modeData, avgScore, sessions }: {
  modeData: { name: string; value: number }[]
  avgScore: number
  sessions: Session[]
}) {
  const totalSessions = sessions.length
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video) return
    if (video.duration && video.currentTime >= video.duration - 0.1) {
      video.currentTime = 0
    }
  }

  const speech = totalSessions === 0 ? '¡Woof! Aún no has empezado... ¿a qué esperas? 🐾'
    : avgScore >= 80 ? '¡Woof! Estás en racha, campeón! 🏆'
    : avgScore >= 60 ? '¡Guau! Vas muy bien, sigue así 💪'
    : avgScore >= 40 ? 'Woof... ¿cómo vas? Puedes mejorar 📚'
    : '¡Woof! Hay que estudiar más... yo te ayudo 🐶'

  const modeLabel = (n: string) =>
    n === 'beginner' ? 'Test Rápido' : n === 'advanced' ? 'Test Avanzado' :
    n === 'exam' ? 'Simulacro' : n === 'review_due' ? 'Repasar' :
    n === 'all_fails' ? 'Fallos' : n === 'quick_review' ? 'Exprés' : n

  const colors = ['#2563EB', '#059669', '#D97706', '#9333EA', '#DC2626', '#0891B2']
  const sorted = [...modeData].sort((a, b) => b.value - a.value)

  return (
    <div className={styles.chowWrap}>
      <div className={styles.chowBubble}>
        <span>{speech}</span>
        <div className={styles.chowBubbleTail} />
      </div>
      <video
        ref={videoRef}
        className={styles.chowVideo}
        src="/chowchow.mp4"
        autoPlay loop muted playsInline
        onTimeUpdate={handleTimeUpdate}
      />
      {sorted.length > 0 && (
        <div className={styles.chowModes}>
          {sorted.map((d, i) => (
            <div key={d.name} className={styles.chowModeChip} style={{ ['--mc' as string]: colors[i % colors.length] }}>
              <span className={styles.chowModeDot} />
              <span className={styles.chowModeName}>{modeLabel(d.name)}</span>
              <span className={styles.chowModeVal}>{d.value}x</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────
interface StatsProps {
  currentUser:      CurrentUser | null
  progress:         ReturnType<typeof useProgress>
  studyReadTopics:  Set<string>
  studyBookmarks:   Set<string>
}

export default function Stats({ currentUser, progress, studyReadTopics, studyBookmarks }: StatsProps) {
  const [activeTab, setActiveTab] = useState<'test' | 'estudio'>('test')

  const { blocks: studyBlocks, loading: loadingContent, error: errorContent } = useContent(
    currentUser?.id, currentUser?.subject_id
  )

  const [questions,        setQuestions]        = useState<{ id: string; block_id: string | null; question: string }[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(true)
  const [errorQuestions,   setErrorQuestions]   = useState<string | null>(null)

  useEffect(() => {
    if (!currentUser?.academy_id) return
    const load = async () => {
      setLoadingQuestions(true)
      setErrorQuestions(null)
      let query = supabase.from('questions').select('id, block_id, question').eq('academy_id', currentUser.academy_id!)
      if (currentUser.subject_id) query = query.eq('subject_id', currentUser.subject_id)
      const { data, error: qErr } = await query
      if (qErr) { setErrorQuestions('Error cargando preguntas'); setLoadingQuestions(false); return }
      setQuestions((data ?? []) as { id: string; block_id: string | null; question: string }[])
      setLoadingQuestions(false)
    }
    load()
  }, [currentUser?.academy_id, currentUser?.subject_id])

  const isLoading = loadingContent || loadingQuestions
  const hasError  = errorContent || errorQuestions

  const sessions = progress?.sessions ?? []
  const wrongs   = progress?.wrongAnswers ?? []

  const ROOT_BLOCKS = studyBlocks.filter(b => b.topics?.length > 0 && b.estimatedMinutes)

  const totalSessions  = sessions.length
  const totalQuestions = sessions.reduce((s, x) => s + (x.total   ?? 0), 0)
  const totalCorrect   = sessions.reduce((s, x) => s + (x.correct ?? 0), 0)
  const totalWrong     = totalQuestions - totalCorrect
  const avgScore       = totalSessions ? Math.round(sessions.reduce((s, x) => s + (x.score ?? 0), 0) / totalSessions) : 0
  const globalPct      = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0

  const MODOS_REPASO = ['quick_review', 'review_due', 'all_fails']
  const sortedSessions = [...sessions]
    .filter(s => !MODOS_REPASO.includes(s.mode_id))
    .sort((a, b) => new Date(a.played_at).getTime() - new Date(b.played_at).getTime())
  const dates = [...new Set(sortedSessions.map(s => s.played_at.split('T')[0] ?? s.played_at))]

  // Racha actual — usa la misma función que Inicio para que sean siempre iguales
  const currentStreak = calcularRacha(dates)

  // Mejor racha histórica
  let bestStreak = 0, tmp = 0
  for (let i = 0; i < dates.length; i++) {
    tmp++
    bestStreak = Math.max(bestStreak, tmp)
    if (i < dates.length - 1) {
      const diff = (new Date(dates[i + 1]!).getTime() - new Date(dates[i]!).getTime()) / (1000 * 60 * 60 * 24)
      if (diff > 1) tmp = 0
    }
  }

  const last10 = sortedSessions.slice(-10).map((s, i) => ({
    name: `S${i+1}`, score: s.score ?? 0, correctas: s.correct ?? 0, total: s.total ?? 0,
  }))

  const blockStats = studyBlocks.map(block => {
    const blockQ = questions.filter(q => q.block_id === block.id)
    const blockW = wrongs.filter(w => blockQ.some(q => q.id === w.question_id))
    const score  = blockQ.length ? Math.max(0, Math.round(100 - (blockW.length / blockQ.length) * 100)) : 0
    return { id: block.id, label: block.label, color: block.color, score, fails: blockW.length, total: blockQ.length }
  })

  const modeCount: Record<string, number> = {}
  sessions.forEach(s => { modeCount[s.mode_id] = (modeCount[s.mode_id] ?? 0) + 1 })
  const modeData = Object.entries(modeCount).map(([name, value]) => ({ name, value }))

  const totalTopics   = ROOT_BLOCKS.reduce((s, b) => s + b.topics.length, 0)
  const readCount     = studyReadTopics?.size ?? 0
  const bookmarkCount = studyBookmarks?.size  ?? 0
  const readPct       = totalTopics > 0 ? Math.round((readCount / totalTopics) * 100) : 0

  const studyBlockData = ROOT_BLOCKS.map(b => {
    const read  = b.topics.filter(t => studyReadTopics?.has(t.id)).length
    const total = b.topics.length
    const pct   = Math.round((read / total) * 100)
    return { name: b.label.split(' ')[0], pct, read, total, color: b.color }
  })

  const totalMinutes = ROOT_BLOCKS.reduce((s, b) => s + (b.estimatedMinutes ?? 0), 0)
  const readMinutes  = ROOT_BLOCKS.reduce((s, b) => {
    const readFrac = b.topics.filter(t => studyReadTopics?.has(t.id)).length / b.topics.length
    return s + Math.round((b.estimatedMinutes ?? 0) * readFrac)
  }, 0)
  const remainMins = totalMinutes - readMinutes

  if (hasError) return <ErrorState message="No se pudieron cargar tus estadísticas. Comprueba tu conexión." onRetry={() => window.location.reload()} />

  if (isLoading) return (
    <div className={styles.page} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <Loader2 size={28} strokeWidth={1.5} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
        <p style={{ marginTop: '1rem', color: 'var(--ink-muted)', fontSize: '0.88rem' }}>Cargando estadísticas…</p>
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Estadísticas</h1>
        <p className={styles.pageSubtitle}>Tu progreso global en tests y estudio</p>
      </div>

      <div className={styles.tabs}>
        <button className={[styles.tab, activeTab === 'test' ? styles.tabActive : ''].join(' ')} onClick={() => setActiveTab('test')}>
          <BarChart2 size={14} /> Tests
        </button>
        <button className={[styles.tab, activeTab === 'estudio' ? styles.tabActive : ''].join(' ')} onClick={() => setActiveTab('estudio')}>
          <BookOpen size={14} /> Estudio
        </button>
      </div>

      {activeTab === 'test' && (
        <>
          <div className={styles.kpiGrid}>
            {([
              { icon: Target,     label: 'Sesiones',       value: totalSessions,         color: '#2563EB' },
              { icon: Brain,      label: 'Preguntas',      value: totalQuestions,         color: '#059669' },
              { icon: Award,      label: 'Nota media',     value: `${avgScore}/100`,      color: '#D97706' },
              { icon: Flame,      label: 'Racha actual',   value: `${currentStreak}d`,    color: '#DC2626' },
              { icon: TrendingUp, label: '% correcto',     value: `${globalPct}%`,        color: '#9333EA' },
              { icon: BarChart2,  label: 'Fallos activos', value: wrongs.length,          color: '#0891B2' },
            ] as { icon: React.ElementType; label: string; value: string | number; color: string }[]).map(({ icon: Icon, label, value, color }) => (
              <div key={label} className={styles.kpiCard}>
                <div className={styles.kpiIcon} style={{ background: `${color}18`, color }}><Icon size={18} /></div>
                <div><p className={styles.kpiValue}>{value}</p><p className={styles.kpiLabel}>{label}</p></div>
              </div>
            ))}
          </div>

          {totalSessions > 0 && (
            <ComparativaClaseCard avgScore={avgScore} academyId={currentUser?.academy_id} subjectId={currentUser?.subject_id} userId={currentUser?.id} />
          )}

          <div className={styles.row2}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Resultado global</h3>
              <div className={styles.donutCentered}>
                <Donut pct={globalPct} color="#059669" size={150} sublabel={`${totalCorrect}/${totalQuestions}`} />
                <div className={styles.donutStatsGrid}>
                  <div className={styles.donutStat}><span className={styles.donutStatDot} style={{ background: '#059669' }} /><span className={styles.donutStatLabel}>Correctas — <strong>{totalCorrect}</strong></span></div>
                  <div className={styles.donutStat}><span className={styles.donutStatDot} style={{ background: '#DC2626' }} /><span className={styles.donutStatLabel}>Incorrectas — <strong>{totalWrong}</strong></span></div>
                  <div className={styles.donutStat}><span className={styles.donutStatDot} style={{ background: '#CBD5E1' }} /><span className={styles.donutStatLabel}>Total — <strong>{totalQuestions}</strong></span></div>
                  <div className={styles.donutStat}><Flame size={9} style={{ color: '#DC2626', flexShrink: 0 }} /><span className={styles.donutStatLabel}>Mejor racha — <strong>{bestStreak}d</strong></span></div>
                </div>
              </div>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Evolución (últimas sesiones)</h3>
              {last10.length === 0 ? (
                <div className={styles.emptyChart}>Aún no hay sesiones registradas</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={last10} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="score" name="Nota" stroke="#2563EB" fill="url(#scoreGrad)" strokeWidth={2} dot={{ r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className={styles.row2}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Modos de práctica</h3>
              <ChowchowCard modeData={modeData} avgScore={globalPct} sessions={sessions} />
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Puntuación por bloque</h3>
              <div className={styles.blockGrid}>
                {blockStats.map(b => (
                  <div key={b.id} className={styles.blockItem}>
                    <div className={styles.blockItemTop}>
                      <span className={styles.blockItemLabel}>{b.label}</span>
                      <span className={styles.blockItemScore} style={{ color: b.score >= 75 ? '#059669' : b.score >= 50 ? '#D97706' : '#DC2626' }}>{b.score}%</span>
                    </div>
                    <div className={styles.blockItemBar}>
                      <div className={styles.blockItemFill} style={{ width: `${b.score}%`, background: b.score >= 75 ? '#059669' : b.score >= 50 ? '#D97706' : '#DC2626' }} />
                    </div>
                    <span className={styles.blockItemFails}>{b.fails} fallos / {b.total} preguntas</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {wrongs.length > 0 && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Preguntas con más fallos</h3>
              <div className={styles.wrongList}>
                {wrongs.slice(0, 8).map(w => {
                  const q     = questions.find(x => x.id === w.question_id)
                  if (!q) return null
                  const block = studyBlocks.find(b => b.id === q.block_id)
                  return (
                    <div key={w.id} className={styles.wrongItem}>
                      <div className={styles.wrongBadge} style={{ background: (block?.color ?? '#6B7280') + '20', color: block?.color ?? '#6B7280' }}>
                        {block?.label ?? 'General'}
                      </div>
                      <div className={styles.wrongItemBottom}>
                        <p className={styles.wrongQ}>{q.question}</p>
                        <span className={styles.wrongCount}>{w.fail_count}x</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'estudio' && (
        <>
          <div className={styles.kpiGrid}>
            {([
              { icon: BookOpen,    label: 'Temas leídos',     value: `${readCount}/${totalTopics}`, color: '#2563EB' },
              { icon: TrendingUp,  label: '% completado',     value: `${readPct}%`,                 color: '#059669' },
              { icon: Bookmark,    label: 'Marcadores',       value: bookmarkCount,                  color: '#D97706' },
              { icon: Clock,       label: 'Tiempo leído',     value: `${readMinutes}min`,            color: '#9333EA' },
              { icon: Clock,       label: 'Tiempo restante',  value: `${remainMins}min`,             color: '#DC2626' },
              { icon: CheckCircle, label: 'Bloques completos', value: ROOT_BLOCKS.filter(b => b.topics.every(t => studyReadTopics?.has(t.id))).length, color: '#0891B2' },
            ] as { icon: React.ElementType; label: string; value: string | number; color: string }[]).map(({ icon: Icon, label, value, color }) => (
              <div key={label} className={styles.kpiCard}>
                <div className={styles.kpiIcon} style={{ background: `${color}18`, color }}><Icon size={18} /></div>
                <div><p className={styles.kpiValue}>{value}</p><p className={styles.kpiLabel}>{label}</p></div>
              </div>
            ))}
          </div>

          <div className={styles.row2}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Progreso global del temario</h3>
              <div className={styles.donutRow}>
                <Donut pct={readPct} color="#2563EB" size={150} label="Leídos" sublabel={`${readCount}/${totalTopics}`} />
                <div className={styles.donutLegend}>
                  <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#2563EB' }} /><span>Leídos: <strong>{readCount}</strong></span></div>
                  <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#F3F4F6' }} /><span>Pendientes: <strong>{totalTopics - readCount}</strong></span></div>
                  <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#D97706' }} /><span>Marcadores: <strong>{bookmarkCount}</strong></span></div>
                  <p className={styles.studyTime}><Clock size={11} /> {readMinutes}min leídos de {totalMinutes}min totales</p>
                </div>
              </div>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Progreso por bloque</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={studyBlockData} layout="vertical" margin={{ top: 0, right: 30, left: 5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="pct" name="Completado" radius={[0, 4, 4, 0]}>
                    {studyBlockData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Detalle por bloque</h3>
            <div className={styles.studyDonutGrid}>
              {ROOT_BLOCKS.map(b => {
                const read  = b.topics.filter(t => studyReadTopics?.has(t.id)).length
                const total = b.topics.length
                const pct   = Math.round((read / total) * 100)
                return (
                  <div key={b.id} className={styles.studyDonutItem}>
                    <Donut pct={pct} color={b.color} size={90} stroke={9} />
                    <p className={styles.studyDonutLabel}>{b.label.split(' ').slice(0, 2).join(' ')}</p>
                    <p className={styles.studyDonutSub}>{read}/{total} temas</p>
                  </div>
                )
              })}
            </div>
          </div>

          {bookmarkCount > 0 && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Temas marcados como favoritos</h3>
              <div className={styles.bookmarkStatList}>
                {ROOT_BLOCKS.flatMap(b =>
                  b.topics.filter(t => studyBookmarks?.has(t.id)).map(t => (
                    <div key={t.id} className={styles.bookmarkStatItem}>
                      <span className={styles.bookmarkStatDot} style={{ background: b.color }} />
                      <div>
                        <p className={styles.bookmarkStatTitle}>{t.title}</p>
                        <p className={styles.bookmarkStatBlock}>{b.label}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
