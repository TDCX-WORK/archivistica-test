import { BookOpen, Timer, Trophy, Flame, FileText, Layers, LayoutGrid, Zap, Archive, Scale, Cpu, Shield, History, Compass, CreditCard, AlertTriangle, Clock, TrendingUp, ChevronRight } from 'lucide-react'
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

const MODE_META = {
  beginner: { Icon: Zap,    color: '#059669', bg: '#ECFDF5', label_color: '#065F46' },
  advanced: { Icon: Flame,  color: '#D97706', bg: '#FFFBEB', label_color: '#92400E' },
  exam:     { Icon: Trophy, color: '#7C3AED', bg: '#F5F3FF', label_color: '#4C1D95' },
}

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className={styles.statCard} style={{ '--card-color': color, '--card-bg': bg }}>
      <div className={styles.statIcon}><Icon size={16} strokeWidth={2} /></div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  )
}

function ModeButton({ icon: Icon, label, meta, desc, onClick, badge, disabled }) {
  return (
    <button className={styles.modeBtn} onClick={onClick} disabled={disabled}>
      <div className={styles.modeBtnIcon} style={{ background: meta?.bg || '#F3F4F6' }}>
        <Icon size={16} strokeWidth={2} style={{ color: meta?.color || '#6B7280' }} />
      </div>
      <div className={styles.modeBtnBody}>
        <span className={styles.modeBtnLabel}>{label}</span>
        {desc && <span className={styles.modeBtnDesc}>{desc}</span>}
      </div>
      {badge != null && badge > 0
        ? <span className={styles.modeBtnBadge}>{badge}</span>
        : <ChevronRight size={14} className={styles.modeBtnArrow} />
      }
    </button>
  )
}

export default function Home({ onSelectMode, progress }) {
  const { totalAnswered, avgScore, streakDays, studiedDays, wrongAnswers = [], dueForReview = [] } = progress

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
  const monthName    = today.toLocaleString('es-ES', { month: 'long', year: 'numeric' })
  const regularModes = Object.values(config.modes).filter(m => !m.practical)

  return (
    <div className={styles.page}>

      {/* ── KPI ROW ── */}
      <div className={styles.kpiRow}>
        <StatCard icon={Flame}      label="Racha"        value={`${streakDays}d`}  color="#D97706" bg="#FFFBEB" />
        <StatCard icon={Trophy}     label="Media"        value={`${avgScore}%`}    color="#7C3AED" bg="#F5F3FF" />
        <StatCard icon={FileText}   label="Respondidas"  value={totalAnswered}      color="#059669" bg="#ECFDF5" />
        <StatCard icon={AlertTriangle} label="Fallos"   value={wrongAnswers.length} color="#DC2626" bg="#FEF2F2" />
      </div>

      {/* ── MAIN GRID ── */}
      <div className={styles.grid}>

        {/* Columna izquierda */}
        <div className={styles.col}>

          {/* Tests */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Tests de teoría</span>
              <span className={styles.cardBadge}>{allQuestions.length} preguntas</span>
            </div>
            <div className={styles.modeList}>
              {regularModes.map(mode => {
                const meta = MODE_META[mode.id]
                const Icon = meta?.Icon || Zap
                return (
                  <ModeButton
                    key={mode.id}
                    icon={Icon}
                    label={mode.label}
                    desc={`${mode.timeMinutes} min · ${mode.questions} preguntas`}
                    meta={meta}
                    onClick={() => onSelectMode(mode.id)}
                  />
                )
              })}
              <ModeButton
                icon={CreditCard}
                label="Flashcards"
                desc={`Repaso rápido · ${allQuestions.length} tarjetas`}
                meta={{ Icon: CreditCard, color: '#7C3AED', bg: '#F5F3FF' }}
                onClick={() => onSelectMode('flashcards')}
              />
            </div>
          </div>

          {/* Entrenar fallos */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Entrenar fallos</span>
              {wrongAnswers.length > 0 && (
                <span className={styles.cardBadgeRed}>{wrongAnswers.length} pendientes</span>
              )}
            </div>
            {wrongAnswers.length === 0 ? (
              <div className={styles.emptyState}>
                <Shield size={20} strokeWidth={1.5} />
                <p>Sin errores registrados. ¡Completa un test!</p>
              </div>
            ) : (
              <div className={styles.modeList}>
                <ModeButton
                  icon={Clock}
                  label="Repasar hoy"
                  desc={dueForReview.length > 0
                    ? `${dueForReview.length} pregunta${dueForReview.length !== 1 ? 's' : ''} pendiente${dueForReview.length !== 1 ? 's' : ''}`
                    : 'Al día · sin pendientes'}
                  meta={{ color: '#D97706', bg: '#FFFBEB' }}
                  onClick={() => onSelectMode('review_due')}
                  badge={dueForReview.length > 0 ? dueForReview.length : null}
                  disabled={dueForReview.length === 0}
                />
                <ModeButton
                  icon={AlertTriangle}
                  label="Todos mis fallos"
                  desc={`${wrongAnswers.length} preguntas falladas`}
                  meta={{ color: '#DC2626', bg: '#FEF2F2' }}
                  onClick={() => onSelectMode('all_fails')}
                />
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha */}
        <div className={styles.col}>

          {/* Supuestos prácticos */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Supuestos prácticos</span>
              <span className={styles.cardBadge}>{supuestos.length} casos</span>
            </div>
            <div className={[styles.modeList, styles.modeListScroll].join(' ')}>
              {supuestos.map(s => (
                <ModeButton
                  key={s.id}
                  icon={Archive}
                  label={s.title}
                  desc={s.subtitle}
                  meta={{ color: '#2563EB', bg: '#EFF6FF' }}
                  onClick={() => onSelectMode(s.id)}
                />
              ))}
            </div>
          </div>

          {/* Calendario */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Seguimiento</span>
              <span className={styles.cardBadge} style={{ textTransform: 'capitalize' }}>{monthName}</span>
            </div>
            <div className={styles.calGrid}>
              {['L','M','X','J','V','S','D'].map(d => (
                <span key={d} className={styles.calDayName}>{d}</span>
              ))}
              {calCells.map((cell, i) => (
                <div
                  key={i}
                  className={[
                    styles.calCell,
                    !cell ? styles.calEmpty : '',
                    cell?.studied ? styles.calStudied : '',
                    cell?.isToday ? styles.calToday : '',
                  ].join(' ')}
                >
                  {cell?.day}
                </div>
              ))}
            </div>
            <p className={styles.calInfo}>
              {studiedDays.size > 0
                ? `${studiedDays.size} día${studiedDays.size !== 1 ? 's' : ''} estudiado${studiedDays.size !== 1 ? 's' : ''} este mes`
                : 'Completa tests para registrar progreso'}
            </p>
          </div>
        </div>

        {/* Temario — full width */}
        <div className={[styles.card, styles.cardFull].join(' ')}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Distribución del temario</span>
            <span className={styles.cardBadge}>{allQuestions.length} preguntas</span>
          </div>
          <div className={styles.blocksGrid}>
            {BLOCKS_ORDER.map(key => {
              const block = config.blocks[key]
              const count = allQuestions.filter(q => q.block === key).length
              const Icon  = BLOCK_ICONS[key] || BookOpen
              const pct   = Math.min(100, (count / 210) * 100)
              return (
                <div key={key} className={styles.blockRow}>
                  <div className={styles.blockIcon}><Icon size={12} strokeWidth={2} /></div>
                  <div className={styles.blockInfo}>
                    <div className={styles.blockTop}>
                      <span className={styles.blockLabel}>{block.label}</span>
                      <span className={styles.blockCount}>{count}</span>
                    </div>
                    <div className={styles.blockBar}>
                      <div className={styles.blockFill} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
