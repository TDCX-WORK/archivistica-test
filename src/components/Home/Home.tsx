import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, Trophy, Flame, FileText, Layers, Zap, Archive,
  Scale, Cpu, Shield, History, Library, CreditCard, AlertTriangle,
  Clock, ChevronRight, Database, Globe, Users, Star,
  Lock, Check, ClipboardList, TrendingUp, Target, Award,
  GraduationCap, Bookmark, BarChart2, Medal, Hash, Gem
} from 'lucide-react'
import { supabase }          from '../../lib/supabase'
import config                from '../../data/config.json'
import { usePlanSemanal }    from '../../hooks/usePlanSemanal'
import StudyHeatmap          from './StudyHeatmap'
import { Ripple }            from '../magicui/Ripple'
import { useAnnouncements }  from '../../hooks/useAnnouncements'
import { useAlumnoMessages } from '../../hooks/useDirectMessages'
import { useStudentProfile }   from '../../hooks/useStudentProfile'
import { useCalendarEvents }  from '../../hooks/useCalendarEvents'
import AnnouncementsCard     from './AnnouncementsCard'
import type { CurrentUser, Session, WrongAnswer, BloqueConTemas, StudyPlan } from '../../types'
import type { useProgress }  from '../../hooks/useProgress'
import type useStudyProgress from '../../hooks/useStudyProgress'
import type { LucideIcon }   from 'lucide-react'
import styles                from './Home.module.css'

// ── Niveles ────────────────────────────────────────────────────────────────
interface Level { level: number; title: string; xpRequired: number }
const LEVELS: Level[] = [
  { level: 1,  title: 'Aspirante',           xpRequired: 0    },
  { level: 2,  title: 'Curioso',             xpRequired: 100  },
  { level: 3,  title: 'Iniciado',            xpRequired: 250  },
  { level: 4,  title: 'Auxiliar',            xpRequired: 500  },
  { level: 5,  title: 'Técnico',             xpRequired: 900  },
  { level: 6,  title: 'Archivero',           xpRequired: 1400 },
  { level: 7,  title: 'Documentalista',      xpRequired: 2000 },
  { level: 8,  title: 'Conservador',         xpRequired: 2800 },
  { level: 9,  title: 'Experto',             xpRequired: 3800 },
  { level: 10, title: 'Maestro del Archivo', xpRequired: 5000 },
]

const CAT_COLORS: Record<string, string> = {
  'Tests':       '#2563EB',
  'Rendimiento': '#059669',
  'Simulacros':  '#7C3AED',
  'Estudio':     '#D97706',
  'Constancia':  '#DC2626',
  'Dominio':     '#0891B2',
}

interface Mission {
  id:       string
  category: string
  title:    string
  current:  number
  target:   number
  unlocked: boolean
}

function buildMissions(
  sessions:        Session[],
  wrongAnswers:    WrongAnswer[],
  studyReadTopics: Set<string> | undefined,
  studyBookmarks:  Set<string> | undefined,
  totalTopics:     number
): Mission[] {
  const totalSessions = sessions.length
  const totalAnswered = sessions.reduce((s, x) => s + x.total, 0)
  const avgScore      = totalSessions ? Math.round(sessions.reduce((s, x) => s + (x.score ?? 0), 0) / totalSessions) : 0
  const readCount     = studyReadTopics?.size ?? 0
  const bookmarkCount = studyBookmarks?.size  ?? 0
  const examSessions  = sessions.filter(s => s.mode_id === 'exam')
  const examAvg       = examSessions.length ? Math.round(examSessions.reduce((s, x) => s + (x.score ?? 0), 0) / examSessions.length) : 0
  const streakDays    = (() => {
    const days = [...new Set(sessions.map(s => s.played_at))].sort().reverse()
    if (!days.length) return 0
    let streak = 1
    for (let i = 1; i < days.length; i++) {
      const prev = new Date(days[i-1]!), curr = new Date(days[i]!)
      if ((prev.getTime() - curr.getTime()) / 86400000 === 1) streak++
      else break
    }
    return streak
  })()

  return [
    { id: 'first_test',   category: 'Tests',       title: 'Primer paso',            current: Math.min(totalSessions, 1),   target: 1,   unlocked: totalSessions >= 1 },
    { id: 'ten_tests',    category: 'Tests',       title: 'En racha',               current: Math.min(totalSessions, 10),  target: 10,  unlocked: totalSessions >= 10 },
    { id: 'fifty_tests',  category: 'Tests',       title: 'Incansable',             current: Math.min(totalSessions, 50),  target: 50,  unlocked: totalSessions >= 50 },
    { id: 'score_60',     category: 'Rendimiento', title: 'Por encima de la media', current: Math.min(avgScore, 60),       target: 60,  unlocked: avgScore >= 60 },
    { id: 'score_75',     category: 'Rendimiento', title: 'Buen archivero',         current: Math.min(avgScore, 75),       target: 75,  unlocked: avgScore >= 75 },
    { id: 'score_90',     category: 'Rendimiento', title: 'Maestro de los tests',   current: Math.min(avgScore, 90),       target: 90,  unlocked: avgScore >= 90 },
    { id: 'exam_first',   category: 'Simulacros',  title: 'Cara al examen',         current: Math.min(examSessions.length, 1), target: 1, unlocked: examSessions.length >= 1 },
    { id: 'exam_pass',    category: 'Simulacros',  title: 'Aprobado',               current: Math.min(examAvg, 50),        target: 50,  unlocked: examAvg >= 50 },
    { id: 'exam_master',  category: 'Simulacros',  title: 'Nota de corte',          current: Math.min(examAvg, 75),        target: 75,  unlocked: examAvg >= 75 },
    { id: 'study_first',  category: 'Estudio',     title: 'Primera lectura',        current: Math.min(readCount, 1),       target: 1,   unlocked: readCount >= 1 },
    { id: 'study_25',     category: 'Estudio',     title: 'Buen comienzo',          current: readCount, target: Math.max(1, Math.round(totalTopics * 0.25)), unlocked: readCount >= Math.round(totalTopics * 0.25) },
    { id: 'study_50',     category: 'Estudio',     title: 'A mitad de camino',      current: readCount, target: Math.max(1, Math.round(totalTopics * 0.5)),  unlocked: readCount >= Math.round(totalTopics * 0.5) },
    { id: 'study_100',    category: 'Estudio',     title: 'Temario completado',     current: readCount, target: Math.max(1, totalTopics), unlocked: totalTopics > 0 && readCount >= totalTopics },
    { id: 'bookmark_5',   category: 'Estudio',     title: 'Lector selectivo',       current: Math.min(bookmarkCount, 5),   target: 5,   unlocked: bookmarkCount >= 5 },
    { id: 'streak_3',     category: 'Constancia',  title: 'Tres días seguidos',     current: Math.min(streakDays, 3),      target: 3,   unlocked: streakDays >= 3 },
    { id: 'streak_7',     category: 'Constancia',  title: 'Una semana entera',      current: Math.min(streakDays, 7),      target: 7,   unlocked: streakDays >= 7 },
    { id: 'streak_30',    category: 'Constancia',  title: 'Un mes sin parar',       current: Math.min(streakDays, 30),     target: 30,  unlocked: streakDays >= 30 },
    { id: 'no_fails',     category: 'Dominio',     title: 'Sin deudas pendientes',  current: wrongAnswers.length === 0 ? 1 : 0, target: 1, unlocked: wrongAnswers.length === 0 },
    { id: 'answered_200', category: 'Dominio',     title: 'Doscientas respondidas', current: Math.min(totalAnswered, 200), target: 200, unlocked: totalAnswered >= 200 },
    { id: 'answered_500', category: 'Dominio',     title: 'Medio millar',           current: Math.min(totalAnswered, 500), target: 500, unlocked: totalAnswered >= 500 },
  ]
}

function calcXP(sessions: Session[], readTopics: Set<string> | undefined, wrongAnswers: WrongAnswer[], totalTopics: number): number {
  const readCount     = readTopics?.size ?? 0
  const avgScore      = sessions.length ? Math.round(sessions.reduce((s, x) => s + (x.score ?? 0), 0) / sessions.length) : 0
  const totalAnswered = sessions.reduce((s, x) => s + x.total, 0)
  return Math.min(sessions.length * 15, 600)
    + Math.round(avgScore * 8)
    + Math.round((readCount / Math.max(totalTopics, 1)) * 1500)
    + Math.min(Math.round(totalAnswered * 0.5), 800)
    + (wrongAnswers.length === 0 && sessions.length > 0 ? 300 : 0)
}

const modes = config.modes as Record<string, { id: string; label: string; timeMinutes: number; questions: number; description: string; color: string }>

const MODE_META: Record<string, { Icon: LucideIcon; color: string; bg: string }> = {
  beginner: { Icon: Zap,    color: '#059669', bg: '#ECFDF5' },
  advanced: { Icon: Flame,  color: '#D97706', bg: '#FFFBEB' },
  exam:     { Icon: Trophy, color: '#7C3AED', bg: '#F5F3FF' },
}

function getBlockIcon(label = ''): LucideIcon {
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

interface StatCardProps { icon: LucideIcon; label: string; value: string | number; color: string; bg: string }
function StatCard({ icon: Icon, label, value, color, bg }: StatCardProps) {
  return (
    <div className={styles.statCard} style={{ ['--cc' as string]: color, ['--cb' as string]: bg }}>
      <div className={styles.statIcon}><Icon size={22} strokeWidth={1.8} /></div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  )
}

interface ModeButtonProps {
  icon:      LucideIcon
  label:     string
  meta?:     { color: string; bg: string } | null
  desc?:     string
  onClick:   () => void
  badge?:    number | null
  disabled?: boolean
}
function ModeButton({ icon: Icon, label, meta, desc, onClick, badge, disabled }: ModeButtonProps) {
  return (
    <button className={styles.modeBtn} onClick={onClick} disabled={disabled}>
      <div className={styles.modeBtnIcon} style={{ background: meta?.bg ?? '#F3F4F6' }}>
        <Icon size={15} strokeWidth={2} style={{ color: meta?.color ?? '#6B7280' }} />
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

interface PlanWidgetProps { plan: StudyPlan; bloques: BloqueConTemas[]; titulo: string; variante: string }
function PlanWidget({ plan, bloques, titulo, variante }: PlanWidgetProps) {
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

interface XpCardProps {
  xp:            number
  streakDays:    number
  sessions:      number
  levelData:     Level
  nextLevelData: Level | undefined
  levelPct:      number
  missions:      Mission[]
  onViewAll:     () => void
}
function XpCard({ xp, streakDays, sessions, levelData, nextLevelData, levelPct, missions, onViewAll }: XpCardProps) {
  const levelColor =
    levelData.level <= 3 ? '#059669' :
    levelData.level <= 6 ? '#2563EB' :
    levelData.level <= 8 ? '#7C3AED' : '#D97706'
  const unlockedCount = missions.filter(m => m.unlocked).length

  return (
    <div className={styles.xpCard}>
      <div className={styles.xpTop}>
        <div className={styles.xpBadge} style={{ background: levelColor + '18', color: levelColor, borderColor: levelColor + '30' }}>
          <Star size={11} strokeWidth={2.5} /> Nivel {levelData.level}
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
      {missions.length > 0 && (
        <div className={styles.missionSection}>
          <div className={styles.xpDivider} />
          <div className={styles.missionHeader}>
            <span className={styles.missionHeaderTitle}>Mis logros</span>
            <span className={styles.missionHeaderCount}>
              {unlockedCount}<span style={{ color: 'var(--ink-subtle)' }}>/{missions.length}</span>
            </span>
          </div>
          <div className={styles.missionTimeline}>
            {missions.map((m, i) => {
              const color  = CAT_COLORS[m.category] ?? '#6B7280'
              const isLast = i === missions.length - 1
              return (
                <div key={m.id} className={styles.missionGroup}>
                  <div className={styles.missionRow}>
                    <div className={styles.missionDot} style={m.unlocked ? { borderColor: color, boxShadow: `0 0 7px ${color}90, inset 0 0 4px ${color}20` } : {}}>
                      {m.unlocked
                        ? <Check size={9} color={color} strokeWidth={3} />
                        : <Lock  size={8} color="var(--ink-subtle)" strokeWidth={2} />}
                    </div>
                    <span className={styles.missionName} style={m.unlocked ? { color: 'var(--ink)', fontWeight: 600 } : {}}>{m.title}</span>
                  </div>
                  {!isLast && <div className={styles.missionConnector} style={m.unlocked ? { background: color + '50' } : {}} />}
                </div>
              )
            })}
          </div>
        </div>
      )}
      <button className={styles.viewAllBtn} onClick={onViewAll}>
        <Trophy size={13} style={{ color: '#7C3AED' }} />
        <span>Ver mis logros · {unlockedCount}/{missions.length}</span>
        <ChevronRight size={13} style={{ color: 'var(--ink-subtle)', marginLeft: 'auto' }} />
      </button>
    </div>
  )
}

interface BlockWithCount { id: string; label: string; color: string; position: number; count: number }
interface BlockCardProps { block: BlockWithCount; onClick: () => void }
function BlockCard({ block, onClick }: BlockCardProps) {
  const Icon       = getBlockIcon(block.label)
  const shortLabel = block.label.split(/[:\u2014\u2013]/)[0]!.trim()
  return (
    <button className={styles.blockRippleCard} onClick={onClick}>
      <Ripple color={block.color} mainCircleSize={48} mainCircleOpacity={0.28} numCircles={5} duration={3.5} />
      <div className={styles.blockRippleIcon} style={{ color: block.color, background: block.color + '18' }}>
        <Icon size={20} strokeWidth={1.8} />
      </div>
      <span className={styles.blockRippleLabel}>{shortLabel}</span>
      <span className={styles.blockRippleCount}>{block.count} preguntas</span>
    </button>
  )
}

interface SupuestoData {
  id:        string
  title:     string
  subtitle:  string
  scenario:  string
  questions: { question: string; options: unknown; answer: number; explanation: string }[]
}

interface HomeProps {
  onSelectMode:  (modeId: string, modeLabel?: string, third?: unknown, fourth?: string) => void
  progress:      ReturnType<typeof useProgress>
  currentUser:   CurrentUser
  studyProgress: ReturnType<typeof useStudyProgress>
}

export default function Home({ onSelectMode, progress, currentUser, studyProgress }: HomeProps) {
  const { announcements, loading: loadingAnn } = useAnnouncements(currentUser?.academy_id, currentUser?.subject_id)
  const { byDate: calendarEventsByDate, upcoming: upcomingEvents } = useCalendarEvents(currentUser)
  const { messages: dmMessages, unread: dmUnread, markRead: dmMarkRead, replyToMessage: dmReply, deleteMessage: dmDelete } = useAlumnoMessages(currentUser?.id)
  const { profile: studentProfile }            = useStudentProfile(currentUser?.id)
  const navigate = useNavigate()

  const { totalAnswered, avgScore, streakDays, wrongAnswers = [], dueForReview = [], sessions = [] } = progress
  const readTopics = studyProgress?.readTopics
  const bookmarks  = studyProgress?.bookmarks

  const [totalQuestions, setTotalQuestions] = useState(0)
  const [blocks,         setBlocks]         = useState<BlockWithCount[]>([])
  const [supuestos,      setSupuestos]      = useState<SupuestoData[]>([])
  const [planDates,      setPlanDates]      = useState<Set<string>>(new Set())
  const [totalTopics,    setTotalTopics]    = useState(0)

  useEffect(() => {
    const sid = currentUser?.subject_id
    const aid = currentUser?.academy_id
    if (!aid) return

    const loadBlocks = async (): Promise<BlockWithCount[]> => {
      const { data: bd } = sid
        ? await supabase.from('content_blocks').select('id,label,color,position').eq('academy_id', aid).eq('subject_id', sid).order('position')
        : await supabase.from('content_blocks').select('id,label,color,position').eq('academy_id', aid).order('position')
      if (!bd?.length) return []
      const { data: qd } = sid
        ? await supabase.from('questions').select('block_id').eq('academy_id', aid).eq('subject_id', sid)
        : await supabase.from('questions').select('block_id').eq('academy_id', aid)
      const c: Record<string, number> = {}
      for (const q of (qd ?? []) as { block_id: string }[]) c[q.block_id] = (c[q.block_id] ?? 0) + 1
      return (bd as { id: string; label: string; color: string; position: number }[]).map(b => ({ ...b, count: c[b.id] ?? 0 }))
    }

    const cq = sid
      ? supabase.from('questions').select('id', { count: 'exact', head: true }).eq('academy_id', aid).eq('subject_id', sid)
      : supabase.from('questions').select('id', { count: 'exact', head: true }).eq('academy_id', aid)

    Promise.all([cq, loadBlocks()]).then(([cr, bd]) => {
      setTotalQuestions(cr.count ?? 0)
      setBlocks(bd)
    })

    const loadTopics = async () => {
      const { data: blockData } = sid
        ? await supabase.from('content_blocks').select('id').eq('academy_id', aid).eq('subject_id', sid)
        : await supabase.from('content_blocks').select('id').eq('academy_id', aid)
      if (!blockData?.length) return
      const { count } = await supabase.from('content_topics').select('id', { count: 'exact', head: true })
        .in('block_id', (blockData as { id: string }[]).map(b => b.id))
      setTotalTopics(count ?? 0)
    }
    loadTopics()

    const loadSup = async () => {
      let q = supabase.from('supuestos')
        .select('id,slug,title,subtitle,scenario,position,supuesto_questions(id,question,options,answer,explanation,position)')
        .eq('academy_id', aid).order('position')
      if (sid) q = q.eq('subject_id', sid)
      const { data } = await q
      if (data?.length) {
        type RawSup = {
          slug: string; title: string; subtitle: string | null; scenario: string | null
          supuesto_questions: { question: string; options: string[]; answer: number; explanation: string | null; position: number }[]
        }
        setSupuestos((data as RawSup[]).map(s => ({
          id: s.slug, title: s.title, subtitle: s.subtitle ?? '', scenario: s.scenario ?? '',
          questions: (s.supuesto_questions ?? [])
            .sort((a, b) => a.position - b.position)
            .map(q => ({ question: q.question, options: q.options, answer: q.answer, explanation: q.explanation ?? '' }))
        })))
      } else setSupuestos([])
    }
    loadSup()

    const loadPlan = async () => {
      let q = supabase.from('study_plans').select('week_start').eq('academy_id', aid)
      if (sid) q = q.eq('subject_id', sid)
      const { data } = await q
      if (data?.length) setPlanDates(new Set((data as { week_start: string }[]).map(p => p.week_start)))
    }
    loadPlan()
  }, [currentUser?.academy_id, currentUser?.subject_id])

  const { planSemanal, bloquesSemanal, planDiario, bloquesDiario } = usePlanSemanal(currentUser?.academy_id, currentUser?.subject_id)

  const xp       = useMemo(() => calcXP(sessions, readTopics, wrongAnswers, totalTopics), [sessions, readTopics, wrongAnswers, totalTopics])
  const missions = useMemo(() => buildMissions(sessions, wrongAnswers, readTopics, bookmarks, totalTopics), [sessions, wrongAnswers, readTopics, bookmarks, totalTopics])

  const levelData     = [...LEVELS].reverse().find(l => xp >= l.xpRequired) ?? LEVELS[0]!
  const nextLevelData = LEVELS.find(l => l.level === levelData.level + 1)
  const xpInLevel     = xp - levelData.xpRequired
  const xpNeeded      = nextLevelData ? nextLevelData.xpRequired - levelData.xpRequired : 1
  const levelPct      = nextLevelData ? Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)) : 100

  const regularModes = Object.values(modes).filter(m => m.id !== 'simulacro')

  return (
    <div className={styles.page}>
      <div className={styles.kpiRow}>
        <StatCard icon={Flame}         label="Racha"       value={`${streakDays}d`}   color="#D97706" bg="#FFFBEB" />
        <StatCard icon={Trophy}        label="Media"       value={`${avgScore}%`}     color="#7C3AED" bg="#F5F3FF" />
        <StatCard icon={FileText}      label="Respondidas" value={totalAnswered}       color="#059669" bg="#ECFDF5" />
        <StatCard icon={AlertTriangle} label="Fallos"      value={wrongAnswers.length} color="#DC2626" bg="#FEF2F2" />
      </div>

      {planDiario  && bloquesDiario.length  > 0 && <PlanWidget plan={planDiario}  bloques={bloquesDiario}  titulo="Para hoy"               variante="diario"  />}
      {planSemanal && bloquesSemanal.length > 0 && <PlanWidget plan={planSemanal} bloques={bloquesSemanal} titulo="Objetivo de esta semana" variante="semanal" />}

      <div className={styles.grid}>
        <div className={styles.colLeft}>
          <XpCard
            xp={xp} streakDays={streakDays} sessions={sessions.length}
            levelData={levelData} nextLevelData={nextLevelData}
            levelPct={levelPct} missions={missions}
            onViewAll={() => navigate('/perfil?tab=logros')}
          />
        </div>

        <div className={styles.colTests}>
          <div className={[styles.card, styles.cardFill].join(' ')}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Tests de teoría</span>
              <span className={styles.cardBadge}>{totalQuestions} preguntas</span>
            </div>
            <div className={styles.modeList}>
              {regularModes.map(mode => {
                const meta = MODE_META[mode.id], Icon = meta?.Icon ?? Zap
                return <ModeButton key={mode.id} icon={Icon} label={mode.label}
                  desc={`${mode.timeMinutes} min · ${mode.questions} preguntas`}
                  meta={meta ?? null} onClick={() => onSelectMode(mode.id)} />
              })}
              <ModeButton icon={CreditCard} label="Flashcards"
                desc={`Repaso rápido · ${totalQuestions} tarjetas`}
                meta={{ color: '#7C3AED', bg: '#F5F3FF' }} onClick={() => onSelectMode('flashcards')} />
              {currentUser?.examConfig && (
                <ModeButton icon={GraduationCap} label="Simulacro Oficial"
                  desc={`${currentUser.examConfig.test_questions} preguntas + supuesto práctico · Formato examen real`}
                  meta={{ color: '#DC2626', bg: '#FEF2F2' }}
                  onClick={() => onSelectMode('simulacro', 'Simulacro Oficial', currentUser.examConfig)} />
              )}
            </div>
          </div>
        </div>

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
                  desc="5 preguntas · menos de 3 min" meta={{ color: '#D97706', bg: '#FFFBEB' }}
                  onClick={() => onSelectMode('quick_review')} />}
                <ModeButton icon={Clock} label="Repasar hoy"
                  desc={dueForReview.length > 0 ? `${dueForReview.length} pregunta${dueForReview.length !== 1 ? 's' : ''} pendiente${dueForReview.length !== 1 ? 's' : ''}` : 'Al día · sin pendientes'}
                  meta={{ color: '#0891B2', bg: '#EFF6FF' }} onClick={() => onSelectMode('review_due')}
                  badge={dueForReview.length > 0 ? dueForReview.length : null} disabled={dueForReview.length === 0} />
                <ModeButton icon={AlertTriangle} label="Todos mis fallos"
                  desc={`${wrongAnswers.length} preguntas falladas`}
                  meta={{ color: '#DC2626', bg: '#FEF2F2' }} onClick={() => onSelectMode('all_fails')} />
              </div>
            )}
          </div>
        </div>

        <div className={styles.colRight}>
          <div className={styles.cardTall}>
            {supuestos.length > 0 ? (
              <>
                <div className={styles.cardHeader}>
                  <span className={styles.cardTitle}>Supuestos prácticos</span>
                  <span className={styles.cardBadge}>{supuestos.length} casos</span>
                </div>
                <div className={[styles.modeList, styles.modeListScroll].join(' ')}>
                  {supuestos.map(s => (
                    <ModeButton key={s.id} icon={Archive} label={s.title} desc={s.subtitle}
                      meta={{ color: '#2563EB', bg: '#EFF6FF' }} onClick={() => onSelectMode(s.id, '', s)} />
                  ))}
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
              messages={dmMessages}
              unreadMessages={dmUnread}
              onMarkRead={dmMarkRead}
              onReply={dmReply}
              onDeleteMessage={dmDelete}
            />
          </div>

          <div className={styles.walletRow}>
            {/* Wallet 1 — Tu Matrícula */}
            <div className={styles.wallet}>
              <div className={styles.walletBg} />
              <div className={styles.walletTabs}>
                <div className={[styles.walletTab, styles.walletTabGreen].join(' ')}>
                  <span className={styles.walletTabDot} style={{background:'#059669'}} />
                  <span>Acceso activo</span>
                  <span className={styles.walletTabRight}>✓</span>
                </div>
                <div className={[styles.walletTab, styles.walletTabAmber].join(' ')}>
                  <span className={styles.walletTabDot} style={{background:'#D97706'}} />
                  <span>Próximo examen</span>
                  {studentProfile?.exam_date && <span className={styles.walletTabRight}>{new Date(studentProfile.exam_date + 'T12:00:00').toLocaleDateString('es-ES',{day:'2-digit',month:'short'})}</span>}
                </div>
              </div>
              <div className={styles.walletPocket}>
                
                <div className={styles.walletContent}>
                  <span className={styles.walletLabel}>Tu matrícula</span>
                  {studentProfile?.monthly_price ? (
                    <div className={styles.walletPrice}>{studentProfile.monthly_price} €<span className={styles.walletPriceUnit}>/mes</span></div>
                  ) : (
                    <div className={styles.walletPrice}>—</div>
                  )}
                  <div className={styles.walletDetails}>
                    {currentUser?.access_until && (
                      <div className={styles.walletDetailRow}>
                        <span>Acceso hasta</span>
                        <span className={styles.walletDetailVal}>{new Date(currentUser.access_until).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'})}</span>
                      </div>
                    )}
                    {studentProfile?.exam_date && (
                      <div className={styles.walletDetailRow}>
                        <span>Fecha examen</span>
                        <span className={styles.walletDetailVal}>{new Date(studentProfile.exam_date + 'T12:00:00').toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'})}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Wallet 2 — Tus Documentos */}
            <div
              className={styles.wallet}
              onClick={() => navigate('/documentos')}
              style={{ cursor: 'pointer' }}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && navigate('/documentos')}
              aria-label="Ver tus documentos"
            >
              <div className={styles.walletBg} />
              <div className={styles.walletTabs}>
                <div className={[styles.walletTab, styles.walletTabBlue].join(' ')}>
                  <span className={styles.walletTabDot} style={{background:'#2563EB'}} />
                  <span>Contrato</span>
                </div>
                <div className={[styles.walletTab, styles.walletTabPurple].join(' ')}>
                  <span className={styles.walletTabDot} style={{background:'#7C3AED'}} />
                  <span>Material de estudio</span>
                </div>
              </div>
              <div className={styles.walletPocket}>
                <div className={styles.walletContent}>
                  <span className={styles.walletLabel}>Tus documentos</span>
                  <span className={styles.walletPlaceholderSub} style={{marginTop:'6px',display:'block'}}>
                    Contratos, apuntes y vídeos de tu academia
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={[styles.card, styles.calendarCard].join(' ')}>
        <StudyHeatmap
          sessions={sessions} planDates={planDates}
          dueForReview={dueForReview}
          streakDays={streakDays} avgScore={avgScore}
          calendarEvents={calendarEventsByDate}
          upcomingEvents={upcomingEvents}
        />
      </div>

      {blocks.length > 0 && (
        <div className={styles.blocksSection}>
          <div className={styles.blocksSectionHeader}>
            <span className={styles.blocksSectionTitle}>Temario por bloques</span>
            <span className={styles.blocksSectionBadge}>{totalQuestions} preguntas</span>
          </div>
          <div className={styles.blocksRippleGrid}>
            {blocks.map(block => (
              <BlockCard key={block.id} block={block} onClick={() => navigate(`/estudio?block=${block.id}`)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
