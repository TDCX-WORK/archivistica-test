import { BarChart2, TrendingUp, Award, Flame, FileText } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import styles from './Stats.module.css'

function KPI({ icon: Icon, label, value, variant }) {
  return (
    <div className={[styles.kpi, styles[`kpi_${variant}`]].join(' ')}>
      <div className={styles.kpiIcon}><Icon size={16} strokeWidth={2} /></div>
      <span className={styles.kpiVal}>{value}</span>
      <span className={styles.kpiLabel}>{label}</span>
    </div>
  )
}

function CircleGauge({ pct }) {
  const size = 84, stroke = 8, r = (size - stroke) / 2, circ = 2 * Math.PI * r
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e3de" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1a5c35" strokeWidth={stroke}
        strokeDasharray={`${(pct/100)*circ} ${circ}`} strokeLinecap="round" />
    </svg>
  )
}

const TOOLTIP_STYLE = {
  fontSize: '0.75rem', border: '1px solid #e5e3de', borderRadius: '10px',
  fontFamily: 'Plus Jakarta Sans', fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.07)'
}

export default function Stats({ progress }) {
  const { totalSessions, totalAnswered, totalCorrect, avgScore, streakDays, last30 } = progress
  const totalWrong = totalAnswered - totalCorrect

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Tu progreso</h1>

      <div className={styles.kpiGrid}>
        <KPI icon={FileText}   label="Tests realizados" value={totalSessions}  variant="dark" />
        <KPI icon={Award}      label="Nota media"        value={`${avgScore}%`} variant="primary" />
        <KPI icon={Flame}      label="Racha actual"      value={`${streakDays}d`} variant="orange" />
        <KPI icon={TrendingUp} label="Respondidas"       value={totalAnswered}  variant="amber" />
      </div>

      {last30.length > 0 ? (
        <>
          <section className={styles.chartCard}>
            <h2 className={styles.chartTitle}><TrendingUp size={14} /> Nota media por sesión</h2>
            <ResponsiveContainer width="100%" height={170}>
              <AreaChart data={last30} margin={{ top:5, right:0, left:-24, bottom:0 }}>
                <defs>
                  <linearGradient id="gScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#1a5c35" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1a5c35" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize:9, fill:'#9e9d97', fontFamily:'Plus Jakarta Sans' }} tickFormatter={d => d.slice(5)} />
                <YAxis domain={[0,100]} tick={{ fontSize:9, fill:'#9e9d97', fontFamily:'Plus Jakarta Sans' }} />
                <Tooltip formatter={(v) => [`${v}%`, 'Nota']} contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="score" stroke="#1a5c35" strokeWidth={2} fill="url(#gScore)" dot={{ r:3, fill:'#1a5c35', strokeWidth:0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </section>

          <section className={styles.chartCard}>
            <h2 className={styles.chartTitle}><BarChart2 size={14} /> Preguntas por sesión</h2>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={last30} margin={{ top:5, right:0, left:-24, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize:9, fill:'#9e9d97', fontFamily:'Plus Jakarta Sans' }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize:9, fill:'#9e9d97', fontFamily:'Plus Jakarta Sans' }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="questions" fill="#1a5c35" radius={[4,4,0,0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </section>
        </>
      ) : (
        <div className={styles.empty}>
          <BarChart2 size={28} strokeWidth={1.4} />
          <p>Completa tests para ver tus estadísticas</p>
        </div>
      )}

      {totalAnswered > 0 && (
        <section className={styles.chartCard}>
          <h2 className={styles.chartTitle}><Award size={14} /> Aciertos totales</h2>
          <div className={styles.donutRow}>
            <div className={styles.donutWrap}>
              <CircleGauge pct={Math.round((totalCorrect / totalAnswered) * 100)} />
              <span className={styles.donutPct}>{Math.round((totalCorrect / totalAnswered) * 100)}%</span>
            </div>
            <div className={styles.donutLegend}>
              <div className={styles.legendRow}><span className={styles.legendDot} style={{ background: '#1a5c35' }} /> {totalCorrect} correctas</div>
              <div className={styles.legendRow}><span className={styles.legendDot} style={{ background: '#f5b8bf' }} /> {totalWrong} incorrectas</div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
