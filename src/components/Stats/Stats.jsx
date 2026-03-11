import { useState } from 'react'
import {
  BarChart2, TrendingUp, Award, Flame, BookOpen, CheckCircle,
  Target, Clock, Bookmark, Brain, ArrowUp, ArrowDown, Minus
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie
} from 'recharts'
import config from '../../data/config.json'
import allQuestions from '../../data/questions.json'
import { STUDY_BLOCKS } from '../../data/study-content'
import styles from './Stats.module.css'

const BLOCK_META = {
  historia:      { label: 'Historia',       color: '#7C3AED' },
  constitucion:  { label: 'Constitución',   color: '#2563EB' },
  legislacion:   { label: 'Legislación',    color: '#059669' },
  gestion:       { label: 'Gestión Doc.',   color: '#0891B2' },
  descripcion:   { label: 'Descripción',    color: '#DC2626' },
  normas:        { label: 'Normas',         color: '#B45309' },
  conservacion:  { label: 'Conservación',   color: '#9333EA' },
  digitalizacion:{ label: 'Digitalización', color: '#0F766E' },
}

// ── Donut SVG ──────────────────────────────────────────────────────────────
function Donut({ pct, color = '#2563EB', size = 130, stroke = 14, label, sublabel }) {
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
function CustomTooltip({ active, payload, label }) {
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

export default function Stats({ progress, studyReadTopics, studyBookmarks }) {
  const [activeTab, setActiveTab] = useState('test')

  const sessions = progress?.sessions || []
  const wrongs   = progress?.wrongAnswers || []

  // ── Stats de TEST ──────────────────────────────────────────────────────
  const totalSessions  = sessions.length
  const totalQuestions = sessions.reduce((s, x) => s + (x.total  || 0), 0)
  const totalCorrect   = sessions.reduce((s, x) => s + (x.correct|| 0), 0)
  const totalWrong     = totalQuestions - totalCorrect
  const avgScore       = totalSessions ? Math.round(sessions.reduce((s,x)=>s+(x.score||0),0)/totalSessions) : 0
  const globalPct      = totalQuestions ? Math.round((totalCorrect/totalQuestions)*100) : 0

  // Rachas
  const sortedSessions = [...sessions].sort((a,b) => new Date(a.played_at)-new Date(b.played_at))
  let currentStreak = 0, bestStreak = 0, tmp = 0
  const today = new Date().toISOString().split('T')[0]
  const dates  = [...new Set(sortedSessions.map(s => s.played_at?.split('T')[0]||s.played_at))]
  for (let i = dates.length-1; i >= 0; i--) {
    const d = new Date(dates[i])
    const expected = new Date(); expected.setDate(expected.getDate()-(dates.length-1-i))
    if (d.toISOString().split('T')[0] === expected.toISOString().split('T')[0]) { tmp++; if(i===dates.length-1) currentStreak=tmp }
    else break
  }
  for (let i = 0; i < dates.length; i++) {
    tmp++; bestStreak = Math.max(bestStreak,tmp)
    if (i<dates.length-1) {
      const diff = (new Date(dates[i+1])-new Date(dates[i]))/(1000*60*60*24)
      if (diff > 1) tmp = 0
    }
  }

  // Evolución últimas 10 sesiones
  const last10 = sortedSessions.slice(-10).map((s,i) => ({
    name: `S${i+1}`, score: s.score||0,
    correctas: s.correct||0, total: s.total||0
  }))

  // Por bloques
  const blockStats = Object.entries(BLOCK_META).map(([id, meta]) => {
    const blockQ   = allQuestions.filter(q => q.block === id)
    const blockW   = wrongs.filter(w => blockQ.some(q=>q.id===w.question_id))
    const score    = blockQ.length ? Math.max(0, Math.round(100-(blockW.length/blockQ.length)*100)) : 0
    return { id, ...meta, score, fails: blockW.length, total: blockQ.length }
  })

  // Pie por modo
  const modeCount = {}
  sessions.forEach(s => { modeCount[s.mode_id] = (modeCount[s.mode_id]||0)+1 })
  const modeData = Object.entries(modeCount).map(([name,value]) => ({ name, value }))
  const modeColors = ['#2563EB','#059669','#DC2626','#B45309','#9333EA','#0891B2']

  // ── Stats de ESTUDIO ───────────────────────────────────────────────────
  const totalTopics    = STUDY_BLOCKS.reduce((s,b) => s+b.topics.length, 0)
  const readCount      = studyReadTopics?.size || 0
  const bookmarkCount  = studyBookmarks?.size  || 0
  const readPct        = Math.round((readCount/totalTopics)*100)

  const studyBlockData = STUDY_BLOCKS.map(b => {
    const read  = b.topics.filter(t => studyReadTopics?.has(t.id)).length
    const total = b.topics.length
    const pct   = Math.round((read/total)*100)
    return { name: b.label.split(' ')[0], pct, read, total, color: b.color }
  })

  // Tiempo estimado restante
  const totalMinutes = STUDY_BLOCKS.reduce((s,b)=>s+b.estimatedMinutes,0)
  const readMinutes  = STUDY_BLOCKS.reduce((s,b) => {
    const readFrac = b.topics.filter(t=>studyReadTopics?.has(t.id)).length / b.topics.length
    return s + Math.round(b.estimatedMinutes * readFrac)
  }, 0)
  const remainMins = totalMinutes - readMinutes

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Estadísticas</h1>
        <p className={styles.pageSubtitle}>Tu progreso global en tests y estudio</p>
      </div>

      {/* ── TABS ── */}
      <div className={styles.tabs}>
        <button className={[styles.tab, activeTab==='test'?styles.tabActive:''].join(' ')}
          onClick={()=>setActiveTab('test')}>
          <BarChart2 size={14}/> Tests
        </button>
        <button className={[styles.tab, activeTab==='estudio'?styles.tabActive:''].join(' ')}
          onClick={()=>setActiveTab('estudio')}>
          <BookOpen size={14}/> Estudio
        </button>
      </div>

      {/* ══════════ TAB: TEST ══════════ */}
      {activeTab === 'test' && (
        <>
          {/* KPIs */}
          <div className={styles.kpiGrid}>
            {[
              { icon: Target,    label: 'Sesiones',      value: totalSessions,  color:'#2563EB' },
              { icon: Brain,     label: 'Preguntas',     value: totalQuestions, color:'#059669' },
              { icon: Award,     label: 'Nota media',    value: `${avgScore}/100`, color:'#D97706'},
              { icon: Flame,     label: 'Racha actual',  value: `${currentStreak}d`, color:'#DC2626'},
              { icon: TrendingUp,label: '% correcto',    value: `${globalPct}%`, color:'#9333EA'},
              { icon: BarChart2, label: 'Fallos activos',value: wrongs.length,  color:'#0891B2'},
            ].map(({icon:Icon,label,value,color}) => (
              <div key={label} className={styles.kpiCard}>
                <div className={styles.kpiIcon} style={{background:`${color}18`,color}}>
                  <Icon size={18}/>
                </div>
                <div>
                  <p className={styles.kpiValue}>{value}</p>
                  <p className={styles.kpiLabel}>{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Donuts + Evolución */}
          <div className={styles.row2}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Resultado global</h3>
              <div className={styles.donutRow}>
                <Donut pct={globalPct} color="#059669" size={140} label="Correctas" sublabel={`${totalCorrect}/${totalQuestions}`}/>
                <div className={styles.donutLegend}>
                  <div className={styles.legendItem}>
                    <span className={styles.legendDot} style={{background:'#059669'}}/>
                    <span>Correctas: <strong>{totalCorrect}</strong></span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.legendDot} style={{background:'#DC2626'}}/>
                    <span>Incorrectas: <strong>{totalWrong}</strong></span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.legendDot} style={{background:'#F3F4F6'}}/>
                    <span>Total: <strong>{totalQuestions}</strong></span>
                  </div>
                  <div className={styles.streakBox}>
                    <Flame size={14} style={{color:'#DC2626'}}/>
                    <span>Mejor racha: <strong>{bestStreak} días</strong></span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Evolución (últimas sesiones)</h3>
              {last10.length === 0 ? (
                <div className={styles.emptyChart}>Aún no hay sesiones registradas</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={last10} margin={{top:5,right:5,left:-20,bottom:0}}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6"/>
                    <XAxis dataKey="name" tick={{fontSize:11}}/>
                    <YAxis domain={[0,100]} tick={{fontSize:11}}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Area type="monotone" dataKey="score" name="Nota" stroke="#2563EB"
                      fill="url(#scoreGrad)" strokeWidth={2} dot={{r:3}}/>
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Distribución por modos + por bloques */}
          <div className={styles.row2}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Modos de práctica</h3>
              {modeData.length === 0 ? (
                <div className={styles.emptyChart}>Sin datos todavía</div>
              ) : (
                <div className={styles.pieRow}>
                  <ResponsiveContainer width="50%" height={160}>
                    <PieChart>
                      <Pie data={modeData} dataKey="value" cx="50%" cy="50%"
                        innerRadius={40} outerRadius={65} paddingAngle={3}>
                        {modeData.map((_,i) => <Cell key={i} fill={modeColors[i%modeColors.length]}/>)}
                      </Pie>
                      <Tooltip/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className={styles.pieLegend}>
                    {modeData.map((d,i) => (
                      <div key={d.name} className={styles.legendItem}>
                        <span className={styles.legendDot} style={{background:modeColors[i%modeColors.length]}}/>
                        <span className={styles.legendText}>{d.name}: <strong>{d.value}</strong></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Puntuación por bloque</h3>
              <div className={styles.blockGrid}>
                {blockStats.map(b => (
                  <div key={b.id} className={styles.blockItem}>
                    <div className={styles.blockItemTop}>
                      <span className={styles.blockItemLabel}>{b.label}</span>
                      <span className={styles.blockItemScore}
                        style={{color: b.score>=75?'#059669':b.score>=50?'#D97706':'#DC2626'}}>
                        {b.score}%
                      </span>
                    </div>
                    <div className={styles.blockItemBar}>
                      <div className={styles.blockItemFill}
                        style={{width:`${b.score}%`,background:b.score>=75?'#059669':b.score>=50?'#D97706':'#DC2626'}}/>
                    </div>
                    <span className={styles.blockItemFails}>{b.fails} fallos / {b.total} preguntas</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fallos activos */}
          {wrongs.length > 0 && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Preguntas con más fallos</h3>
              <div className={styles.wrongList}>
                {wrongs.slice(0,8).map(w => {
                  const q = allQuestions.find(x=>x.id===w.question_id)
                  if(!q) return null
                  return (
                    <div key={w.id} className={styles.wrongItem}>
                      <div className={styles.wrongBadge}
                        style={{background:BLOCK_META[q.block]?.color+'20',color:BLOCK_META[q.block]?.color}}>
                        {BLOCK_META[q.block]?.label||q.block}
                      </div>
                      <p className={styles.wrongQ}>{q.question}</p>
                      <span className={styles.wrongCount}>{w.fail_count}x</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════ TAB: ESTUDIO ══════════ */}
      {activeTab === 'estudio' && (
        <>
          {/* KPIs estudio */}
          <div className={styles.kpiGrid}>
            {[
              { icon: BookOpen,    label: 'Temas leídos',    value: `${readCount}/${totalTopics}`, color:'#2563EB' },
              { icon: TrendingUp,  label: '% completado',    value: `${readPct}%`, color:'#059669' },
              { icon: Bookmark,    label: 'Marcadores',      value: bookmarkCount, color:'#D97706' },
              { icon: Clock,       label: 'Tiempo leído',    value: `${readMinutes}min`, color:'#9333EA' },
              { icon: Clock,       label: 'Tiempo restante', value: `${remainMins}min`, color:'#DC2626' },
              { icon: CheckCircle, label: 'Bloques completos',value: STUDY_BLOCKS.filter(b=>b.topics.every(t=>studyReadTopics?.has(t.id))).length, color:'#0891B2'},
            ].map(({icon:Icon,label,value,color}) => (
              <div key={label} className={styles.kpiCard}>
                <div className={styles.kpiIcon} style={{background:`${color}18`,color}}>
                  <Icon size={18}/>
                </div>
                <div>
                  <p className={styles.kpiValue}>{value}</p>
                  <p className={styles.kpiLabel}>{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Donut progreso global + barra bloques */}
          <div className={styles.row2}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Progreso global del temario</h3>
              <div className={styles.donutRow}>
                <Donut pct={readPct} color="#2563EB" size={150} label="Leídos"
                  sublabel={`${readCount}/${totalTopics}`}/>
                <div className={styles.donutLegend}>
                  <div className={styles.legendItem}>
                    <span className={styles.legendDot} style={{background:'#2563EB'}}/>
                    <span>Leídos: <strong>{readCount}</strong></span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.legendDot} style={{background:'#F3F4F6'}}/>
                    <span>Pendientes: <strong>{totalTopics-readCount}</strong></span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.legendDot} style={{background:'#D97706'}}/>
                    <span>Marcadores: <strong>{bookmarkCount}</strong></span>
                  </div>
                  <p className={styles.studyTime}>
                    <Clock size={11}/> {readMinutes}min leídos de {totalMinutes}min totales
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Progreso por bloque</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={studyBlockData} layout="vertical"
                  margin={{top:0,right:30,left:5,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false}/>
                  <XAxis type="number" domain={[0,100]} tick={{fontSize:10}} unit="%"/>
                  <YAxis type="category" dataKey="name" tick={{fontSize:10}} width={80}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Bar dataKey="pct" name="Completado" radius={[0,4,4,0]}>
                    {studyBlockData.map((d,i) => <Cell key={i} fill={d.color}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detalle por bloque con donuts */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Detalle por bloque</h3>
            <div className={styles.studyDonutGrid}>
              {STUDY_BLOCKS.map(b => {
                const read  = b.topics.filter(t=>studyReadTopics?.has(t.id)).length
                const total = b.topics.length
                const pct   = Math.round((read/total)*100)
                return (
                  <div key={b.id} className={styles.studyDonutItem}>
                    <Donut pct={pct} color={b.color} size={90} stroke={9}/>
                    <p className={styles.studyDonutLabel}>{b.label.split(' ').slice(0,2).join(' ')}</p>
                    <p className={styles.studyDonutSub}>{read}/{total} temas</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Marcadores guardados */}
          {bookmarkCount > 0 && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Temas marcados como favoritos</h3>
              <div className={styles.bookmarkStatList}>
                {STUDY_BLOCKS.flatMap(b =>
                  b.topics.filter(t=>studyBookmarks?.has(t.id)).map(t=>(
                    <div key={t.id} className={styles.bookmarkStatItem}>
                      <span className={styles.bookmarkStatDot} style={{background:b.color}}/>
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
