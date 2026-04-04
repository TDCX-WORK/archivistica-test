import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, Trophy, Flame, FileText, Layers, Zap, Archive,
  Scale, Cpu, Shield, History, Library, CreditCard, AlertTriangle,
  Clock, ChevronRight, Database, Globe, Users, Star
} from 'lucide-react'
import { supabase }        from '../../lib/supabase'
import config              from '../../data/config.json'
import { usePlanSemanal }  from '../../hooks/usePlanSemanal'
import StudyHeatmap        from './StudyHeatmap'
import { Ripple }          from '../magicui/Ripple'
import { useAnnouncements }  from '../../hooks/useAnnouncements'
import { useStudentProfile } from '../../hooks/useStudentProfile'
import ErrorState from '../ui/ErrorState'
import AnnouncementsCard    from './AnnouncementsCard'
import styles              from './Home.module.css'

/* ── Niveles ────────────────────────────────────────────────────────────── */
const LEVELS = [
  { level: 1,  title: 'Aspirante',          xpRequired: 0    },
  { level: 2,  title: 'Curioso',            xpRequired: 100  },
  { level: 3,  title: 'Iniciado',           xpRequired: 250  },
  { level: 4,  title: 'Auxiliar',           xpRequired: 500  },
  { level: 5,  title: 'Técnico',            xpRequired: 900  },
  { level: 6,  title: 'Archivero',          xpRequired: 1400 },
  { level: 7,  title: 'Documentalista',     xpRequired: 2000 },
  { level: 8,  title: 'Conservador',        xpRequired: 2800 },
  { level: 9,  title: 'Experto',            xpRequired: 3800 },
  { level: 10, title: 'Maestro del Archivo',xpRequired: 5000 },
]

function calcXP(sessions, readTopics, wrongAnswers, totalTopics) {
  const readCount     = readTopics?.size || 0
  const avgScore      = sessions.length ? Math.round(sessions.reduce((s,x)=>s+(x.score||0),0)/sessions.length) : 0
  const totalAnswered = sessions.reduce((s,x) => s + x.total, 0)
  return Math.min(sessions.length * 15, 600)
    + Math.round(avgScore * 8)
    + Math.round((readCount / Math.max(totalTopics, 1)) * 1500)
    + Math.min(Math.round(totalAnswered * 0.5), 800)
    + (wrongAnswers.length === 0 && sessions.length > 0 ? 300 : 0)
}

const MODE_META = {
  beginner: { Icon: Zap,    color: '#059669', bg: '#ECFDF5' },
  advanced: { Icon: Flame,  color: '#D97706', bg: '#FFFBEB' },
  exam:     { Icon: Trophy, color: '#7C3AED', bg: '#F5F3FF' },
}

function getBlockIcon(label = '') {
  const l = label.toLowerCase()
  if (l.includes('constitu') || l.includes('función')) return Scale
  if (l.includes('administ') || l.includes('uned'))    return Users
  if (l.includes('colección')|| l.includes('instalac'))return Library
  if (l.includes('proceso')  || l.includes('técnico')) return Database
  if (l.includes('comuni')   || l.includes('ciencia')) return Globe
  if (l.includes('historia')) return History
  if (l.includes('legisla'))  return Scale
  if (l.includes('gestión')  || l.includes('gestion')) return Layers
  if (l.includes('descri'))   return FileText
  if (l.includes('conserva')) return Shield
  if (l.includes('digital'))  return Cpu
  return BookOpen
}

/* ── KPI Card ───────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className={styles.statCard} style={{ '--cc': color, '--cb': bg }}>
      <div className={styles.statIcon}><Icon size={22} strokeWidth={1.8} /></div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  )
}

/* ── Mode button ────────────────────────────────────────────────────────── */
function ModeButton({ icon: Icon, label, meta, desc, onClick, badge, disabled }) {
  return (
    <button className={styles.modeBtn} onClick={onClick} disabled={disabled}>
      <div className={styles.modeBtnIcon} style={{ background: meta?.bg || '#F3F4F6' }}>
        <Icon size={15} strokeWidth={2} style={{ color: meta?.color || '#6B7280' }} />
      </div>
      <div className={styles.modeBtnBody}>
        <span className={styles.modeBtnLabel}>{label}</span>
        {desc && <span className={styles.modeBtnDesc}>{desc}</span>}
      </div>
      {badge != null && badge > 0
        ? <span className={styles.modeBtnBadge}>{badge}</span>
        : <ChevronRight size={14} className={styles.modeBtnArrow} />}
    </button>
  )
}

/* ── Plan widget ────────────────────────────────────────────────────────── */
function PlanWidget({ plan, bloques, titulo, variante }) {
  return (
    <div className={[styles.planCard, variante === 'diario' ? styles.planCardDiario : ''].join(' ')}>
      <div className={styles.planHeader}>
        <span className={styles.planTitle}>{titulo}</span>
        {plan.notes && <span className={styles.planNota}>{plan.notes}</span>}
      </div>
      <div className={styles.planBloques}>
        {bloques.map(b => (
          <div key={b.id} className={styles.planBloque}>
            <div className={styles.planBloqueDot} style={{ background: b.color }} />
            <div className={styles.planBloqueInfo}>
              <span className={styles.planBloqueLabel}>{b.label}</span>
              <span className={styles.planBloqueDesc}>
                {b.todosLosTemas ? 'Bloque completo' : b.temasEspecificos.map(t => t.title).join(' · ')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── XP Card ────────────────────────────────────────────────────────────── */
function XpCard({ xp, streakDays, sessions, levelData, nextLevelData, levelPct }) {
  const levelColor =
    levelData.level <= 3 ? '#059669' :
    levelData.level <= 6 ? '#2563EB' :
    levelData.level <= 8 ? '#7C3AED' : '#D97706'

  const nextTwo = LEVELS.filter(l => l.level > levelData.level).slice(0, 2)

  return (
    <div className={styles.xpCard}>
      <div className={styles.xpTop}>
        <div className={styles.xpBadge} style={{ background: levelColor + '18', color: levelColor, borderColor: levelColor + '30' }}>
          <Star size={11} strokeWidth={2.5} />
          Nivel {levelData.level}
        </div>
        <span className={styles.xpPoints}>{xp} XP</span>
      </div>
      <div className={styles.xpTitle}>{levelData.title}</div>
      {nextLevelData && (
        <div className={styles.xpBarWrap}>
          <div className={styles.xpBarTrack}>
            <div className={styles.xpBarFill} style={{ width: `${levelPct}%`, background: levelColor }} />
          </div>
          <div className={styles.xpBarLabels}>
            <span>{levelPct}%</span>
            <span className={styles.xpNextLabel}>→ {nextLevelData.title}</span>
          </div>
        </div>
      )}
      <div className={styles.xpDivider} />
      <div className={styles.xpStats}>
        <div className={styles.xpStat}>
          <Flame size={14} style={{ color: streakDays >= 3 ? '#D97706' : 'var(--ink-subtle)' }} />
          <span className={styles.xpStatVal}>{streakDays}d</span>
          <span className={styles.xpStatLabel}>racha</span>
        </div>
        <div className={styles.xpStat}>
          <Trophy size={14} style={{ color: '#7C3AED' }} />
          <span className={styles.xpStatVal}>{sessions}</span>
          <span className={styles.xpStatLabel}>tests</span>
        </div>
      </div>
      {nextTwo.length > 0 && (
        <>
          <div className={styles.xpDivider} />
          <div className={styles.xpNextLevels}>
            <span className={styles.xpNextTitle}>Próximos niveles</span>
            {nextTwo.map(l => (
              <div key={l.level} className={styles.xpNextRow}>
                <span className={styles.xpNextName}>Nv.{l.level} · {l.title}</span>
                <span className={styles.xpNextXp}>{l.xpRequired} XP</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ── Block Ripple Card ──────────────────────────────────────────────────── */
function BlockCard({ block, onClick }) {
  const Icon = getBlockIcon(block.label)
  // Nombre corto — todo lo que va antes de los dos puntos o guión largo
  const shortLabel = block.label.split(/[:\u2014\u2013]/)[0].trim()

  return (
    <button className={styles.blockRippleCard} onClick={onClick}>
      <Ripple
        color={block.color}
        mainCircleSize={48}
        mainCircleOpacity={0.28}
        numCircles={5}
        duration={3.5}
      />
      <div className={styles.blockRippleIcon} style={{ color: block.color, background: block.color + '18' }}>
        <Icon size={20} strokeWidth={1.8} />
      </div>
      <span className={styles.blockRippleLabel}>{shortLabel}</span>
      <span className={styles.blockRippleCount}>{block.count} preguntas</span>
    </button>
  )
}

/* ── Componente principal ───────────────────────────────────────────────── */
export default function Home({ onSelectMode, progress, currentUser, studyProgress }) {
  const { announcements, loading: loadingAnn, error: errorAnn } = useAnnouncements(
    currentUser?.academy_id, currentUser?.subject_id
  )
  const { profile: studentProfile } = useStudentProfile(currentUser?.id)
  const navigate = useNavigate()

  const {
    totalAnswered, avgScore, streakDays,
    wrongAnswers = [], dueForReview = [], sessions = []
  } = progress

  const readTopics = studyProgress?.readTopics

  const [totalQuestions, setTotalQuestions] = useState(0)
  const [blocks,         setBlocks]         = useState([])
  const [supuestos,      setSupuestos]      = useState([])
  const [planDates,      setPlanDates]      = useState(new Set())
  const [totalTopics,    setTotalTopics]    = useState(0)

  useEffect(() => {
    const sid = currentUser?.subject_id
    const aid = currentUser?.academy_id
    if (!aid) return

    const loadBlocks = async () => {
      const { data: bd } = sid
        ? await supabase.from('content_blocks').select('id,label,color,position').eq('academy_id',aid).eq('subject_id',sid).order('position')
        : await supabase.from('content_blocks').select('id,label,color,position').eq('academy_id',aid).order('position')
      if (!bd?.length) return []
      const { data: qd } = sid
        ? await supabase.from('questions').select('block_id').eq('academy_id',aid).eq('subject_id',sid)
        : await supabase.from('questions').select('block_id').eq('academy_id',aid)
      const c = {}
      for (const q of (qd||[])) c[q.block_id] = (c[q.block_id]||0)+1
      return bd.map(b => ({ ...b, count: c[b.id]||0 }))
    }

    const cq = sid
      ? supabase.from('questions').select('id',{count:'exact',head:true}).eq('academy_id',aid).eq('subject_id',sid)
      : supabase.from('questions').select('id',{count:'exact',head:true}).eq('academy_id',aid)

    Promise.all([cq, loadBlocks()]).then(([cr, bd]) => {
      setTotalQuestions(cr.count || 0)
      setBlocks(bd)
    })

    const loadSup = async () => {
      let q = supabase.from('supuestos')
        .select('id,slug,title,subtitle,scenario,position,supuesto_questions(id,question,options,answer,explanation,position)')
        .eq('academy_id',aid).order('position')
      if (sid) q = q.eq('subject_id',sid)
      const { data } = await q
      if (data?.length) setSupuestos(data.map(s => ({
        id: s.slug, title: s.title, subtitle: s.subtitle||'', scenario: s.scenario||'',
        questions: (s.supuesto_questions||[]).sort((a,b)=>a.position-b.position)
          .map(q => ({ question:q.question, options:q.options, answer:q.answer, explanation:q.explanation||'' }))
      })))
      else setSupuestos([])
    }
    loadSup()

    const loadPlan = async () => {
      let q = supabase.from('study_plans').select('week_start').eq('academy_id',aid)
      if (sid) q = q.eq('subject_id',sid)
      const { data } = await q
      if (data?.length) setPlanDates(new Set(data.map(p => p.week_start)))
    }
    loadPlan()
  }, [currentUser?.academy_id, currentUser?.subject_id])

  const { planSemanal, bloquesSemanal, planDiario, bloquesDiario } = usePlanSemanal(
    currentUser?.academy_id, currentUser?.subject_id
  )

  const xp = useMemo(
    () => calcXP(sessions, readTopics, wrongAnswers, totalTopics),
    [sessions, readTopics, wrongAnswers, totalTopics]
  )

  const levelData     = [...LEVELS].reverse().find(l => xp >= l.xpRequired) || LEVELS[0]
  const nextLevelData = LEVELS.find(l => l.level === levelData.level + 1)
  const xpInLevel     = xp - levelData.xpRequired
  const xpNeeded      = nextLevelData ? nextLevelData.xpRequired - levelData.xpRequired : 1
  const levelPct      = nextLevelData ? Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)) : 100

  const regularModes = Object.values(config.modes).filter(m => !m.practical)

  const goToBlock = (blockId) => {
    navigate(`/estudio?block=${blockId}`)
  }

  return (
    <div className={styles.page}>

      {/* ── KPIs centradas ── */}
      <div className={styles.kpiRow}>
        <StatCard icon={Flame}         label="Racha"       value={`${streakDays}d`}    color="#D97706" bg="#FFFBEB" />
        <StatCard icon={Trophy}        label="Media"       value={`${avgScore}%`}      color="#7C3AED" bg="#F5F3FF" />
        <StatCard icon={FileText}      label="Respondidas" value={totalAnswered}        color="#059669" bg="#ECFDF5" />
        <StatCard icon={AlertTriangle} label="Fallos"      value={wrongAnswers.length}  color="#DC2626" bg="#FEF2F2" />
      </div>

      {/* ── Plan del profesor ── */}
      {planDiario  && bloquesDiario.length  > 0 && <PlanWidget plan={planDiario}  bloques={bloquesDiario}  titulo="Para hoy"               variante="diario"  />}
      {planSemanal && bloquesSemanal.length > 0 && <PlanWidget plan={planSemanal} bloques={bloquesSemanal} titulo="Objetivo de esta semana" variante="semanal" />}

      {/* ── Grid 3 columnas ── */}
      <div className={styles.grid}>

        {/* Columna izquierda — XP */}
        <div className={styles.colLeft}>
          <XpCard
            xp={xp}
            streakDays={streakDays}
            sessions={sessions.length}
            levelData={levelData}
            nextLevelData={nextLevelData}
            levelPct={levelPct}
          />
        </div>

        {/* Columna Tests */}
        <div className={styles.colTests}>
          <div className={[styles.card, styles.cardFill].join(' ')}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Tests de teoría</span>
              <span className={styles.cardBadge}>{totalQuestions} preguntas</span>
            </div>
            <div className={styles.modeList}>
              {regularModes.map(mode => {
                const meta = MODE_META[mode.id], Icon = meta?.Icon || Zap
                return <ModeButton key={mode.id} icon={Icon} label={mode.label}
                  desc={`${mode.timeMinutes} min · ${mode.questions} preguntas`}
                  meta={meta} onClick={() => onSelectMode(mode.id)} />
              })}
              <ModeButton icon={CreditCard} label="Flashcards"
                desc={`Repaso rápido · ${totalQuestions} tarjetas`}
                meta={{ color:'#7C3AED', bg:'#F5F3FF' }} onClick={() => onSelectMode('flashcards')} />
            </div>
          </div>
        </div>

        {/* Columna Fallos */}
        <div className={styles.colFallos}>
          <div className={[styles.card, styles.cardFill].join(' ')}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Entrenar fallos</span>
              {wrongAnswers.length > 0 && <span className={styles.cardBadgeRed}>{wrongAnswers.length} pendientes</span>}
            </div>
            {wrongAnswers.length === 0 ? (
              <div className={styles.emptyState}>
                <Shield size={18} strokeWidth={1.5} />
                <span>Sin errores registrados</span>
                <span className={styles.emptyStateSub}>Completa un test para empezar</span>
              </div>
            ) : (
              <div className={styles.modeList}>
                {dueForReview.length > 0 && <ModeButton icon={Zap} label="Repaso Exprés"
                  desc="5 preguntas · menos de 3 min" meta={{ color:'#D97706', bg:'#FFFBEB' }}
                  onClick={() => onSelectMode('quick_review')} />}
                <ModeButton icon={Clock} label="Repasar hoy"
                  desc={dueForReview.length>0?`${dueForReview.length} pregunta${dueForReview.length!==1?'s':''} pendiente${dueForReview.length!==1?'s':''}`:'Al día · sin pendientes'}
                  meta={{ color:'#0891B2', bg:'#EFF6FF' }} onClick={() => onSelectMode('review_due')}
                  badge={dueForReview.length>0?dueForReview.length:null} disabled={dueForReview.length===0} />
                <ModeButton icon={AlertTriangle} label="Todos mis fallos"
                  desc={`${wrongAnswers.length} preguntas falladas`}
                  meta={{ color:'#DC2626', bg:'#FEF2F2' }} onClick={() => onSelectMode('all_fails')} />
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha — Supuestos + Próximamente */}
        <div className={styles.colRight}>
          <div className={styles.cardTall}>
            {supuestos.length > 0 ? (
              <>
                <div className={styles.cardHeader}>
                  <span className={styles.cardTitle}>Supuestos prácticos</span>
                  <span className={styles.cardBadge}>{supuestos.length} casos</span>
                </div>
                <div className={[styles.modeList, styles.modeListScroll].join(' ')}>
                  {supuestos.map(s => <ModeButton key={s.id} icon={Archive} label={s.title} desc={s.subtitle}
                    meta={{ color:'#2563EB', bg:'#EFF6FF' }} onClick={() => onSelectMode(s.id, null, s)} />)}
                </div>
              </>
            ) : (
              <div className={styles.comingSoonCard}>
                <div className={styles.comingSoonIcon}><Archive size={22} strokeWidth={1.5} /></div>
                <span className={styles.comingSoonTitle}>Supuestos prácticos</span>
                <span className={styles.comingSoonSub}>Tu profesor añadirá casos prácticos aquí</span>
              </div>
            )}
          </div>

          <div className={styles.cardTall}>
            <AnnouncementsCard
              announcements={announcements}
              loading={loadingAnn}
            />
          </div>

          {/* Card de info de matrícula */}
          {studentProfile && (studentProfile.monthly_price || studentProfile.exam_date || currentUser?.access_until) && (
            <div className={styles.matriculaCard}>
              {studentProfile.monthly_price && (
                <div className={styles.matriculaRow}>
                  <span className={styles.matriculaLabel}>Tu matrícula</span>
                  <span className={styles.matriculaPrecio}>{studentProfile.monthly_price} €<span className={styles.matriculaMes}>/mes</span></span>
                </div>
              )}
              {currentUser?.access_until && (
                <div className={styles.matriculaRow}>
                  <span className={styles.matriculaLabel}>Acceso hasta</span>
                  <span className={styles.matriculaFecha}>{new Date(currentUser.access_until).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              )}
              {studentProfile.exam_date && (
                <div className={styles.matriculaRow}>
                  <span className={styles.matriculaLabel}>Fecha examen</span>
                  <span className={styles.matriculaFecha}>{new Date(studentProfile.exam_date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* ── Calendario ── */}
      <div className={[styles.card, styles.calendarCard].join(' ')}>
        <StudyHeatmap
          sessions={sessions} planDates={planDates}
          wrongAnswers={wrongAnswers} dueForReview={dueForReview}
          streakDays={streakDays} avgScore={avgScore}
        />
      </div>

      {/* ── Bloques del temario con Ripple ── */}
      {blocks.length > 0 && (
        <div className={styles.blocksSection}>
          <div className={styles.blocksSectionHeader}>
            <span className={styles.blocksSectionTitle}>Temario por bloques</span>
            <span className={styles.blocksSectionBadge}>{totalQuestions} preguntas</span>
          </div>
          <div className={styles.blocksRippleGrid}>
            {blocks.map(block => (
              <BlockCard
                key={block.id}
                block={block}
                onClick={() => goToBlock(block.id)}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
