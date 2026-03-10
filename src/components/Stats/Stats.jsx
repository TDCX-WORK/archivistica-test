import { BarChart2, TrendingUp, Award, Flame, FileText, BookOpen, AlertTriangle, CheckCircle, Target } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import config from '../../data/config.json'
import allQuestions from '../../data/questions.json'
import styles from './Stats.module.css'

/* ── Donut SVG grande y bonito ── */
function Donut({ pct, correct, wrong }) {
  const size = 180, stroke = 18, r = (size - stroke) / 2, circ = 2 * Math.PI * r
  const fillLen = (pct / 100) * circ
  return (
    <div className={styles.donutOuter}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke="#F3F4F6" strokeWidth={stroke}
        />
        {/* Wrong arc (red) — empieza donde termina el verde */}
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke="#FECACA" strokeWidth={stroke}
          strokeDasharray={`${circ - fillLen} ${circ}`}
          strokeDashoffset={-fillLen}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
        {/* Correct arc (black) */}
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke="#111111" strokeWidth={stroke}
          strokeDasharray={`${fillLen} ${circ}`}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
      </svg>
      <div className={styles.donutCenter}>
        <span className={styles.donutPct}>{pct}%</span>
        <span className={styles.donutSub}>aciertos</span>
      </div>
      <div className={styles.donutLegend}>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: '#111111' }} />
          <span className={styles.legendLabel}>{correct} correctas</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: '#FECACA' }} />
          <span className={styles.legendLabel}>{wrong} incorrectas</span>
        </div>
      </div>
    </div>
  )
}

const TOOLTIP = {
  fontSize: '0.72rem', border: '1px solid #E5E7EB', borderRadius: '10px',
  fontFamily: 'DM Sans', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
  background: '#fff', color: '#111',
}

function getColor(pct) {
  if (pct >= 75) return '#059669'
  if (pct >= 50) return '#D97706'
  return '#DC2626'
}

function calcBlockStats(wrongAnswers, allQ) {
  const totalByBlock = {}
  allQ.forEach(q => { totalByBlock[q.block] = (totalByBlock[q.block] || 0) + 1 })
  const failsByBlock = {}
  wrongAnswers.forEach(w => { failsByBlock[w.block] = (failsByBlock[w.block] || 0) + w.fail_count })
  return Object.keys(config.blocks).map(key => {
    const fails = failsByBlock[key] || 0
    const total = totalByBlock[key] || 1
    const score = Math.max(0, Math.round(100 - (fails / total) * 100))
    return { key, label: config.blocks[key].label, fails, score }
  }).sort((a, b) => a.score - b.score)
}

export default function Stats({ progress }) {
  const { totalSessions, totalAnswered, totalCorrect, avgScore, streakDays, last30, wrongAnswers = [] } = progress
  const totalWrong = totalAnswered - totalCorrect
  const blockStats = calcBlockStats(wrongAnswers, allQuestions)
  const weakBlocks = blockStats.filter(b => b.score < 75).slice(0, 3)
  const aciertoPct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Estadísticas</h1>

      {/* ── KPI ── */}
      <div className={styles.kpiGrid}>
        {[
          { icon: FileText,   label: 'Tests',       value: totalSessions,    bg: '#F9FAFB', color: '#374151' },
          { icon: Award,      label: 'Nota media',  value: `${avgScore}%`,   bg: '#ECFDF5', color: '#059669' },
          { icon: Flame,      label: 'Racha',        value: `${streakDays}d`, bg: '#FFFBEB', color: '#D97706' },
          { icon: TrendingUp, label: 'Respondidas', value: totalAnswered,     bg: '#F5F3FF', color: '#7C3AED' },
        ].map(({ icon: Icon, label, value, bg, color }) => (
          <div key={label} className={styles.kpi} style={{ '--c': color, '--bg': bg }}>
            <div className={styles.kpiIcon}><Icon size={15} strokeWidth={2} /></div>
            <div className={styles.kpiVal}>{value}</div>
            <div className={styles.kpiLabel}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── GRÁFICA 1 — Nota media (full width, grande) ── */}
      {last30.length > 0 ? (
        <>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}><TrendingUp size={14} /> Evolución de nota media</div>
              <span className={styles.cardBadge}>Últimas {last30.length} sesiones</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={last30} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#111111" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#111111" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF', fontFamily: 'DM Sans' }} tickFormatter={d => d.slice(5)} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9CA3AF', fontFamily: 'DM Sans' }} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={v => [`${v}%`, 'Nota']} contentStyle={TOOLTIP} />
                <Area type="monotone" dataKey="score" stroke="#111111" strokeWidth={2}
                  fill="url(#gScore)" dot={{ r: 3, fill: '#111111', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#111111' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* ── FILA: Donut + Barras ── */}
          <div className={styles.midRow}>

            {/* Donut grande */}
            <div className={[styles.card, styles.donutCard].join(' ')}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}><Target size={14} /> Tasa de aciertos</div>
              </div>
              {totalAnswered > 0 ? (
                <Donut pct={aciertoPct} correct={totalCorrect} wrong={totalWrong} />
              ) : (
                <div className={styles.emptySmall}>Sin datos aún</div>
              )}
            </div>

            {/* Gráfica 2 — Barras (grande) */}
            <div className={[styles.card, styles.barCard].join(' ')}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}><BarChart2 size={14} /> Preguntas por sesión</div>
                <span className={styles.cardBadge}>Últimas {last30.length} sesiones</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={last30} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF', fontFamily: 'DM Sans' }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF', fontFamily: 'DM Sans' }} />
                  <Tooltip contentStyle={TOOLTIP} />
                  <Bar dataKey="questions" radius={[5, 5, 0, 0]}>
                    {last30.map((entry, i) => (
                      <Cell key={i} fill={i === last30.length - 1 ? '#111111' : '#E5E7EB'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        <div className={styles.empty}>
          <BarChart2 size={28} strokeWidth={1.4} />
          <p>Completa tests para ver tus estadísticas</p>
        </div>
      )}

      {/* ── Rendimiento por tema ── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}><BookOpen size={14} /> Rendimiento por tema</div>
          {weakBlocks.length > 0 && (
            <span className={styles.cardBadgeAmber}>
              <AlertTriangle size={11} /> {weakBlocks.length} temas débiles
            </span>
          )}
        </div>

        {wrongAnswers.length === 0 && totalAnswered === 0 ? (
          <div className={styles.emptySmall}>Completa tests para ver tu rendimiento por tema.</div>
        ) : (
          <>
            {weakBlocks.length > 0 && (
              <div className={styles.weakAlert}>
                <AlertTriangle size={13} style={{ color: '#D97706', flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p className={styles.weakTitle}>Refuerza estos temas</p>
                  <p className={styles.weakDesc}>{weakBlocks.map(b => b.label).join(' · ')}</p>
                </div>
              </div>
            )}
            <div className={styles.blockGrid}>
              {blockStats.map(b => (
                <div key={b.key} className={styles.blockItem}>
                  <div className={styles.blockTop}>
                    <span className={styles.blockLabel}>{b.label}</span>
                    <span className={styles.blockScore} style={{ color: getColor(b.score) }}>{b.score}%</span>
                  </div>
                  <div className={styles.blockBar}>
                    <div className={styles.blockFill} style={{ width: `${b.score}%`, background: getColor(b.score) }} />
                  </div>
                  {b.fails > 0 && (
                    <span className={styles.blockFails}>{b.fails} fallo{b.fails !== 1 ? 's' : ''}</span>
                  )}
                </div>
              ))}
            </div>
            <p className={styles.blockNote}>
              <CheckCircle size={11} style={{ color: '#059669' }} />
              Calculado a partir de tus fallos registrados por tema.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
