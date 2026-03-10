import { BookOpen, Timer, Trophy, Flame, FileText, Layers, LayoutGrid, Zap, Archive, Scale, Cpu, Shield, History, Compass, CreditCard } from 'lucide-react'
import config from '../../data/config.json'
import allQuestions from '../../data/questions.json'
import supuestos from '../../data/supuestos.json'
import styles from './Home.module.css'

const BLOCK_ICONS = {
  fundamentos: BookOpen, tipos_archivos: Archive, descripcion: FileText,
  gestion: Layers, legislacion: Scale, conservacion: Shield,
  digitalizacion: Cpu, constitucion: LayoutGrid, historia: History, normas: Compass,
}
const BLOCKS_ORDER = ['historia','constitucion','legislacion','gestion','descripcion','normas','conservacion','digitalizacion','fundamentos','tipos_archivos']
const MAX_COUNT = 210

const MODE_META = {
  beginner: { mc: 'mc_beginner', mi: 'mi_beginner', Icon: Zap },
  advanced: { mc: 'mc_advanced', mi: 'mi_advanced', Icon: Flame },
  exam:     { mc: 'mc_exam',     mi: 'mi_exam',     Icon: Trophy },
}

export default function Home({ onSelectMode, progress }) {
  const { totalAnswered, avgScore, streakDays, studiedDays } = progress

  const today    = new Date()
  const year     = today.getFullYear()
  const month    = today.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInM  = new Date(year, month + 1, 0).getDate()
  const calStart = firstDay === 0 ? 6 : firstDay - 1
  const calCells = Array.from({ length: calStart + daysInM }, (_, i) => {
    if (i < calStart) return null
    const day = i - calStart + 1
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    return { day, dateStr, studied: studiedDays.has(dateStr), isToday: day === today.getDate() }
  })
  const monthName = today.toLocaleString('es-ES', { month: 'long', year: 'numeric' })
  const regularModes = Object.values(config.modes).filter(m => !m.practical)

  return (
    <div className={styles.wrapper}>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.heroEyebrow}>Ministerio de Cultura · Sección Archivos</p>
          <h1 className={styles.heroTitle}>Prepara tu<br /><em>oposición</em></h1>
          <p className={styles.heroSub}>{allQuestions.length} preguntas · {supuestos.length} supuestos prácticos</p>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <Flame size={16} className={styles.statFlame} />
            <span className={styles.heroStatNum}>{streakDays}</span>
            <span className={styles.heroStatLabel}>días</span>
          </div>
          <div className={styles.heroStat}>
            <Trophy size={16} className={styles.statTrophy} />
            <span className={styles.heroStatNum}>{avgScore}%</span>
            <span className={styles.heroStatLabel}>media</span>
          </div>
          <div className={styles.heroStat}>
            <FileText size={16} className={styles.statFile} />
            <span className={styles.heroStatNum}>{totalAnswered}</span>
            <span className={styles.heroStatLabel}>resueltas</span>
          </div>
        </div>
      </section>

      <div className={styles.mainGrid}>

        {/* TESTS */}
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}><FileText size={14} /> Tests de teoría</h2>
          <div className={styles.modeList}>
            {regularModes.map(mode => {
              const { mc, mi, Icon } = MODE_META[mode.id] || { mc: 'mc_exam', mi: 'mi_exam', Icon: Zap }
              return (
                <button key={mode.id} className={[styles.modeCard, styles[mc]].join(' ')} onClick={() => onSelectMode(mode.id)}>
                  <div className={[styles.modeIcon, styles[mi]].join(' ')}><Icon size={16} strokeWidth={2} /></div>
                  <div className={styles.modeBody}>
                    <span className={styles.modeLabel}>{mode.label}</span>
                    <span className={styles.modeMeta}><Timer size={11} /> {mode.timeMinutes} min · {mode.questions} preg.</span>
                  </div>
                  <span className={styles.modeArrow}>→</span>
                </button>
              )
            })}
            <button className={[styles.modeCard, styles.mc_flash].join(' ')} onClick={() => onSelectMode('flashcards')}>
              <div className={[styles.modeIcon, styles.mi_flash].join(' ')}><CreditCard size={16} strokeWidth={2} /></div>
              <div className={styles.modeBody}>
                <span className={styles.modeLabel}>Flashcards</span>
                <span className={styles.modeMeta}>Repaso por tarjetas · {allQuestions.length} preguntas</span>
              </div>
              <span className={styles.modeArrow}>→</span>
            </button>
          </div>
        </section>

        {/* SUPUESTOS */}
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}><Layers size={14} /> Supuestos prácticos</h2>
          <div className={[styles.modeList, styles.modeListScroll].join(' ')}>
            {supuestos.map(s => (
              <button key={s.id} className={[styles.modeCard, styles.mc_practical].join(' ')} onClick={() => onSelectMode(s.id)}>
                <div className={[styles.modeIcon, styles.mi_practical].join(' ')}><Archive size={15} strokeWidth={2} /></div>
                <div className={styles.modeBody}>
                  <span className={styles.modeLabel}>{s.title}</span>
                  {s.subtitle && <span className={styles.modeMeta}>{s.subtitle}</span>}
                </div>
                <span className={styles.modeArrow}>→</span>
              </button>
            ))}
          </div>
        </section>

        {/* CALENDAR */}
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}><Shield size={14} /> Seguimiento mensual</h2>
          <p className={styles.calMonth}>{monthName}</p>
          <div className={styles.calGrid}>
            {['L','M','X','J','V','S','D'].map(d => <span key={d} className={styles.calDayName}>{d}</span>)}
            {calCells.map((cell, i) => (
              <div key={i} className={[styles.calCell, !cell?styles.calEmpty:'', cell?.studied?styles.calStudied:'', cell?.isToday?styles.calToday:''].join(' ')}>
                {cell?.day}
              </div>
            ))}
          </div>
          <p className={styles.calInfo}>
            {studiedDays.size > 0 ? `${studiedDays.size} día${studiedDays.size!==1?'s':''} estudiado${studiedDays.size!==1?'s':''} este mes` : 'Completa tests para registrar tu progreso'}
          </p>
        </section>

        {/* BLOQUES */}
        <section className={[styles.panel, styles.panelFull].join(' ')}>
          <h2 className={styles.panelTitle}>
            <LayoutGrid size={14} /> Distribución del temario
            <span className={styles.panelBadge}>{allQuestions.length} preguntas</span>
          </h2>
          <div className={styles.blocksGrid}>
            {BLOCKS_ORDER.map(key => {
              const block = config.blocks[key]
              const count = allQuestions.filter(q => q.block === key).length
              const Icon  = BLOCK_ICONS[key] || BookOpen
              return (
                <div key={key} className={styles.blockRow}>
                  <div className={styles.blockIcon}><Icon size={13} strokeWidth={2} /></div>
                  <div className={styles.blockInfo}>
                    <div className={styles.blockTop}>
                      <span className={styles.blockLabel}>{block.label}</span>
                      <span className={styles.blockCount}>{count}</span>
                    </div>
                    <div className={styles.blockBar}>
                      <div className={styles.blockBarFill} style={{ width: `${Math.min(100,(count/MAX_COUNT)*100)}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

      </div>
    </div>
  )
}
