import { useMemo, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Flame, BookOpen, Star, Lock, CheckCircle, TrendingUp, Calendar, Target, Zap, Trophy,
  User, Settings, Sun, ChevronRight, Save, ClipboardList, Layers, Award, GraduationCap,
  Bookmark, Clock, Shield, Hash, Gem, FileText, BarChart2, Medal, Loader2
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useContent }        from '../../hooks/useContent'
import { useStudentProfile } from '../../hooks/useStudentProfile'
import ErrorState            from '../ui/ErrorState'
import { useSettings }       from '../../hooks/useSettings'
import type { CurrentUser, Session, WrongAnswer } from '../../types'
import type { useProgress }  from '../../hooks/useProgress'
import styles from './Profile.module.css'

// ── Niveles ────────────────────────────────────────────────────────────────
interface Level {
  level:      number
  title:      string
  subtitle:   string
  xpRequired: number
}

const LEVELS: Level[] = [
  { level: 1,  title: 'Aspirante',          subtitle: 'Acabas de llegar al archivo',           xpRequired: 0    },
  { level: 2,  title: 'Curioso',            subtitle: 'Empiezas a explorar los fondos',         xpRequired: 100  },
  { level: 3,  title: 'Iniciado',           subtitle: 'Ya conoces los pasillos',                xpRequired: 250  },
  { level: 4,  title: 'Auxiliar',           subtitle: 'Manejas los instrumentos básicos',       xpRequired: 500  },
  { level: 5,  title: 'Técnico',            subtitle: 'Clasificas con criterio',                xpRequired: 900  },
  { level: 6,  title: 'Archivero',          subtitle: 'Dominas el principio de procedencia',   xpRequired: 1400 },
  { level: 7,  title: 'Documentalista',     subtitle: 'Las series no tienen secretos para ti', xpRequired: 2000 },
  { level: 8,  title: 'Conservador',        subtitle: 'Proteges el patrimonio documental',     xpRequired: 2800 },
  { level: 9,  title: 'Experto',            subtitle: 'El temario es tu territorio',            xpRequired: 3800 },
  { level: 10, title: 'Maestro del Archivo',subtitle: '¡Estás listo para las oposiciones!',    xpRequired: 5000 },
]

interface Mission {
  id:       string
  category: string
  title:    string
  desc:     string
  icon:     string
  current:  number
  target:   number
  unlocked: boolean
  unit?:    string
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
    { id: 'first_test',   category: 'Tests',       title: 'Primer paso',            desc: 'Completa tu primer test',               icon: '📋', current: Math.min(totalSessions, 1),   target: 1,   unlocked: totalSessions >= 1 },
    { id: 'ten_tests',    category: 'Tests',       title: 'En racha',               desc: 'Completa 10 tests',                     icon: '🔥', current: Math.min(totalSessions, 10),  target: 10,  unlocked: totalSessions >= 10 },
    { id: 'fifty_tests',  category: 'Tests',       title: 'Incansable',             desc: 'Completa 50 tests',                     icon: '⚡', current: Math.min(totalSessions, 50),  target: 50,  unlocked: totalSessions >= 50 },
    { id: 'score_60',     category: 'Rendimiento', title: 'Por encima de la media', desc: 'Alcanza una nota media del 60%',        icon: '📈', current: Math.min(avgScore, 60),       target: 60,  unlocked: avgScore >= 60,  unit: '%' },
    { id: 'score_75',     category: 'Rendimiento', title: 'Buen archivero',         desc: 'Alcanza una nota media del 75%',        icon: '🎯', current: Math.min(avgScore, 75),       target: 75,  unlocked: avgScore >= 75,  unit: '%' },
    { id: 'score_90',     category: 'Rendimiento', title: 'Maestro de los tests',   desc: 'Alcanza una nota media del 90%',        icon: '🏆', current: Math.min(avgScore, 90),       target: 90,  unlocked: avgScore >= 90,  unit: '%' },
    { id: 'exam_first',   category: 'Simulacros',  title: 'Cara al examen',         desc: 'Completa tu primer simulacro oficial',  icon: '📄', current: Math.min(examSessions.length, 1), target: 1, unlocked: examSessions.length >= 1 },
    { id: 'exam_pass',    category: 'Simulacros',  title: 'Aprobado',               desc: 'Supera el 50% en un simulacro oficial', icon: '✅', current: Math.min(examAvg, 50),       target: 50,  unlocked: examAvg >= 50,   unit: '%' },
    { id: 'exam_master',  category: 'Simulacros',  title: 'Nota de corte',          desc: 'Supera el 75% en un simulacro oficial', icon: '🥇', current: Math.min(examAvg, 75),       target: 75,  unlocked: examAvg >= 75,   unit: '%' },
    { id: 'study_first',  category: 'Estudio',     title: 'Primera lectura',        desc: 'Lee tu primer tema del temario',        icon: '📖', current: Math.min(readCount, 1),       target: 1,   unlocked: readCount >= 1 },
    { id: 'study_25',     category: 'Estudio',     title: 'Buen comienzo',          desc: 'Lee el 25% del temario',               icon: '📚', current: readCount, target: Math.max(1, Math.round(totalTopics * 0.25)), unlocked: readCount >= Math.round(totalTopics * 0.25) },
    { id: 'study_50',     category: 'Estudio',     title: 'A mitad de camino',      desc: 'Lee el 50% del temario',               icon: '📚', current: readCount, target: Math.max(1, Math.round(totalTopics * 0.5)),  unlocked: readCount >= Math.round(totalTopics * 0.5) },
    { id: 'study_100',    category: 'Estudio',     title: 'Temario completado',     desc: 'Lee todos los temas del temario',       icon: '🎓', current: readCount, target: Math.max(1, totalTopics), unlocked: totalTopics > 0 && readCount >= totalTopics },
    { id: 'bookmark_5',   category: 'Estudio',     title: 'Lector selectivo',       desc: 'Guarda 5 temas como favoritos',         icon: '🔖', current: Math.min(bookmarkCount, 5),   target: 5,   unlocked: bookmarkCount >= 5 },
    { id: 'streak_3',     category: 'Constancia',  title: 'Tres días seguidos',     desc: 'Mantén una racha de 3 días',            icon: '🔥', current: Math.min(streakDays, 3),      target: 3,   unlocked: streakDays >= 3 },
    { id: 'streak_7',     category: 'Constancia',  title: 'Una semana entera',      desc: 'Mantén una racha de 7 días',            icon: '🔥', current: Math.min(streakDays, 7),      target: 7,   unlocked: streakDays >= 7 },
    { id: 'streak_30',    category: 'Constancia',  title: 'Un mes sin parar',       desc: 'Mantén una racha de 30 días',           icon: '🌟', current: Math.min(streakDays, 30),     target: 30,  unlocked: streakDays >= 30 },
    { id: 'no_fails',     category: 'Dominio',     title: 'Sin deudas pendientes',  desc: 'Elimina todos tus fallos del repaso',   icon: '🛡️', current: wrongAnswers.length === 0 ? 1 : 0, target: 1, unlocked: wrongAnswers.length === 0 },
    { id: 'answered_200', category: 'Dominio',     title: 'Doscientas respondidas', desc: 'Responde 200 preguntas en total',       icon: '💪', current: Math.min(totalAnswered, 200), target: 200, unlocked: totalAnswered >= 200 },
    { id: 'answered_500', category: 'Dominio',     title: 'Medio millar',           desc: 'Responde 500 preguntas en total',       icon: '💎', current: Math.min(totalAnswered, 500), target: 500, unlocked: totalAnswered >= 500 },
  ]
}

function calcXP(sessions: Session[], studyReadTopics: Set<string> | undefined, wrongAnswers: WrongAnswer[], totalTopics: number): number {
  const readCount     = studyReadTopics?.size ?? 0
  const avgScore      = sessions.length ? Math.round(sessions.reduce((s, x) => s + (x.score ?? 0), 0) / sessions.length) : 0
  const totalAnswered = sessions.reduce((s, x) => s + x.total, 0)
  return Math.min(sessions.length * 15, 600)
    + Math.round(avgScore * 8)
    + Math.round((readCount / Math.max(totalTopics, 1)) * 1500)
    + Math.min(Math.round(totalAnswered * 0.5), 800)
    + (wrongAnswers.length === 0 && sessions.length > 0 ? 300 : 0)
}

function BookIcon({ color, opacity = 1, x = 0, y = 0, rotate = 0 }: { color: string; opacity?: number; x?: number; y?: number; rotate?: number }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rotate})`} opacity={opacity}>
      <rect x="-11" y="-15" width="22" height="30" rx="2.5" fill={color} fillOpacity=".18" stroke={color} strokeWidth="1.5" />
      <rect x="-7"  y="-10" width="14" height="2.5" rx="1" fill={color} fillOpacity=".5" />
      <rect x="-7"  y="-5"  width="10" height="2"   rx="1" fill={color} fillOpacity=".4" />
      <rect x="-7"  y="0"   width="12" height="2"   rx="1" fill={color} fillOpacity=".3" />
    </g>
  )
}

const CAT_COLORS: Record<string, string> = {
  'Tests':       '#2563EB',
  'Rendimiento': '#059669',
  'Simulacros':  '#7C3AED',
  'Estudio':     '#D97706',
  'Constancia':  '#DC2626',
  'Dominio':     '#0891B2',
}

const MISSION_ICONS: Record<string, LucideIcon> = {
  first_test:   ClipboardList,
  ten_tests:    Layers,
  fifty_tests:  Zap,
  score_60:     TrendingUp,
  score_75:     Target,
  score_90:     Award,
  exam_first:   FileText,
  exam_pass:    BarChart2,
  exam_master:  Medal,
  study_first:  BookOpen,
  study_25:     BookOpen,
  study_50:     GraduationCap,
  study_100:    GraduationCap,
  bookmark_5:   Bookmark,
  streak_3:     Flame,
  streak_7:     Flame,
  streak_30:    Star,
  no_fails:     Shield,
  answered_200: Hash,
  answered_500: Gem,
}

const TABS = [
  { id: 'logros',    label: 'Logros',    icon: Trophy   },
  { id: 'mis-datos', label: 'Mis datos', icon: User     },
  { id: 'ajustes',   label: 'Ajustes',   icon: Settings },
]

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      className={[styles.toggle, checked ? styles.toggleOn : '', disabled ? styles.toggleDisabled : ''].join(' ')}
      onClick={() => !disabled && onChange(!checked)}
      role="switch" aria-checked={checked}
    >
      <span className={styles.toggleKnob} />
    </button>
  )
}

function SettingsTab({ currentUser, settings, updateSetting, onUpdateDisplayName }: {
  currentUser:          CurrentUser | null
  settings:             ReturnType<typeof useSettings>['settings']
  updateSetting:        ReturnType<typeof useSettings>['updateSetting']
  onUpdateDisplayName?: (name: string) => void
}) {
  const [saved,       setSaved]       = useState(false)
  const [saveError,   setSaveError]   = useState('')
  const [savingName,  setSavingName]  = useState(false)
  const [displayName, setDisplayName] = useState(currentUser?.displayName ?? '')

  const handleSaveName = async () => {
    if (!currentUser?.id || !displayName.trim()) return
    const newUsername = displayName.trim().toLowerCase()
    if (newUsername === currentUser.username) return
    setSavingName(true)
    setSaveError('')
    const { error } = await import('../../lib/supabase').then(({ supabase }) =>
      supabase.from('profiles').update({ username: newUsername }).eq('id', currentUser.id)
    )
    setSavingName(false)
    if (error) {
      const msg = error.message ?? ''
      setSaveError(msg.includes('duplicate') || msg.includes('unique')
        ? 'Ese nombre de usuario ya está en uso. Elige otro.'
        : 'No se pudo guardar. Inténtalo de nuevo.')
      return
    }
    // Actualizar también en memoria para que el Header lo refleje inmediatamente
    onUpdateDisplayName?.(newUsername)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }
  const preguntasOptions = [10, 20, 30, 50]

  return (
    <div className={styles.settingsPage}>
      <div className={styles.settingsSection}>
        <div className={styles.settingsSectionHeader}><User size={15} /><span>Cuenta</span></div>
        <div className={styles.settingsCard}>
          <div className={styles.settingsRow}>
            <div className={styles.settingsRowInfo}>
              <span className={styles.settingsRowLabel}>Nombre de usuario</span>
              <span className={styles.settingsRowDesc}>Se muestra en tu perfil y ranking</span>
            </div>
            <div className={styles.settingsRowControl}>
              <input className={styles.settingsInput} value={displayName} onChange={e => { setDisplayName(e.target.value); setSaveError('') }} placeholder="Tu nombre" maxLength={32} />
              <button className={[styles.settingsSaveBtn, saved ? styles.settingsSaved : ''].join(' ')} onClick={handleSaveName} disabled={savingName}>
                {savingName ? '…' : saved ? '✓ Guardado' : 'Guardar'}
              </button>
            </div>
            {saveError && (
              <p style={{ fontSize: '0.8rem', color: '#DC2626', marginTop: '0.25rem' }}>{saveError}</p>
            )}
          </div>
          <div className={styles.settingsDivider} />
          <div className={styles.settingsRow}>
            <div className={styles.settingsRowInfo}>
              <span className={styles.settingsRowLabel}>Correo electrónico</span>
              <span className={styles.settingsRowDesc}>—</span>
            </div>
            <span className={styles.settingsBadge}>Verificado</span>
          </div>
        </div>
      </div>

      <div className={styles.settingsSection}>
        <div className={styles.settingsSectionHeader}><BookOpen size={15} /><span>Preferencias de estudio</span></div>
        <div className={styles.settingsCard}>
          <div className={styles.settingsRow}>
            <div className={styles.settingsRowInfo}>
              <span className={styles.settingsRowLabel}>Modo penalización</span>
              <span className={styles.settingsRowDesc}>Cada respuesta incorrecta resta 0,25 puntos. Como en el examen real.</span>
            </div>
            <Toggle checked={settings.penalizacion} onChange={v => updateSetting('penalizacion', v)} />
          </div>
          <div className={styles.settingsDivider} />
          <div className={styles.settingsRow}>
            <div className={styles.settingsRowInfo}>
              <span className={styles.settingsRowLabel}>Preguntas en Test Rápido</span>
              <span className={styles.settingsRowDesc}>Número de preguntas por defecto al iniciar un test rápido</span>
            </div>
            <div className={styles.settingsSegmented}>
              {preguntasOptions.map(n => (
                <button key={n} className={[styles.segmentBtn, settings.preguntasRapido === n ? styles.segmentActive : ''].join(' ')} onClick={() => updateSetting('preguntasRapido', n)}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.settingsSection}>
        <div className={styles.settingsSectionHeader}><Sun size={15} /><span>Apariencia</span></div>
        <div className={styles.themeRow}>
          {([
            { id: 'claro',  label: 'Claro',  icon: '☀️' },
            { id: 'oscuro', label: 'Oscuro', icon: '🌙' },
            { id: 'calido', label: 'Cálido', icon: '🌅' },
          ] as { id: 'claro' | 'oscuro' | 'calido'; label: string; icon: string }[]).map(t => (
            <button key={t.id} className={[styles.themeCircleBtn, settings.tema === t.id ? styles.themeCircleActive : ''].join(' ')} onClick={() => updateSetting('tema', t.id)} title={t.label}>
              <span className={styles.themeCircleIcon}>{t.icon}</span>
              <span className={styles.themeCircleLabel}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function MisDatosTab({ currentUser }: { currentUser: CurrentUser | null }) {
  const { profile, loading, saving, error, save } = useStudentProfile(currentUser?.id)
  const [form, setForm] = useState({ full_name: '', phone: '', city: '', email_contact: '', exam_date: '' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({
        full_name:     profile.full_name     ?? '',
        phone:         profile.phone         ?? '',
        city:          profile.city          ?? '',
        email_contact: profile.email_contact ?? '',
        exam_date:     profile.exam_date     ?? '',
      })
    }
  }, [profile])

  const set = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSave = async () => {
    const ok = await save({
      full_name:     form.full_name.trim()     || null,
      phone:         form.phone.trim()         || null,
      city:          form.city.trim()          || null,
      email_contact: form.email_contact.trim() || null,
      exam_date:     form.exam_date            || null,
    })
    if (ok) { setSaved(true); setTimeout(() => setSaved(false), 2500) }
  }

  if (error)   return <ErrorState message="No se pudo cargar tu perfil." onRetry={() => window.location.reload()} compact />
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
      <Loader2 size={24} strokeWidth={1.5} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
    </div>
  )

  const CAMPOS: { key: keyof typeof form; label: string; desc: string; placeholder: string; type: string }[] = [
    { key: 'full_name',     label: 'Nombre completo',   desc: 'Tu nombre real, visible para el profesor',   placeholder: 'María García López', type: 'text'  },
    { key: 'phone',         label: 'Teléfono',           desc: 'Para que tu academia pueda contactarte',     placeholder: '612 345 678',        type: 'tel'   },
    { key: 'city',          label: 'Ciudad',             desc: 'Tu ciudad de residencia actual',             placeholder: 'Madrid',             type: 'text'  },
    { key: 'email_contact', label: 'Email de contacto', desc: 'Puede ser distinto al de tu cuenta',         placeholder: 'tu@email.com',       type: 'email' },
    { key: 'exam_date',     label: 'Fecha del examen',  desc: 'Fecha aproximada de tu oposición',           placeholder: '',                   type: 'date'  },
  ]

  return (
    <div className={styles.settingsPage}>
      <div className={styles.settingsSection}>
        <div className={styles.settingsSectionHeader}><User size={15} /><span>Mis datos personales</span></div>
        <div className={styles.settingsCard}>
          {CAMPOS.map((campo, idx) => (
            <div key={campo.key}>
              {idx > 0 && <div className={styles.settingsDivider} />}
              <div className={styles.settingsRow}>
                <div className={styles.settingsRowInfo}>
                  <span className={styles.settingsRowLabel}>{campo.label}</span>
                  <span className={styles.settingsRowDesc}>{campo.desc}</span>
                </div>
                <div className={styles.settingsRowControl}>
                  <input className={styles.settingsInput} type={campo.type} value={form[campo.key]}
                    onChange={e => set(campo.key, e.target.value)} placeholder={campo.placeholder} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <button className={[styles.settingsSaveBtn, saved ? styles.settingsSaved : ''].join(' ')}
          onClick={handleSave} disabled={saving}
          style={{ height: 38, padding: '0 1.25rem', fontSize: '0.85rem' }}>
          {saving ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}

interface ProfileProps {
  currentUser:          CurrentUser | null
  progress:             ReturnType<typeof useProgress>
  studyReadTopics:      Set<string>
  studyBookmarks:       Set<string>
  onUpdateDisplayName?: (name: string) => void
}

export default function Profile({ currentUser, progress, studyReadTopics, studyBookmarks, onUpdateDisplayName }: ProfileProps) {
  const { sessions = [], wrongAnswers = [], streakDays = 0 } = progress
  const { settings, updateSetting } = useSettings()
  const location   = useLocation()
  const [activeTab, setActiveTab] = useState(() => new URLSearchParams(location.search).get('tab') ?? 'logros')

  const { blocks: studyBlocks, loading: loadingContent } = useContent(currentUser?.academy_id, currentUser?.subject_id)
  const totalTopics = useMemo(() => studyBlocks.reduce((s, b) => s + (b.topics?.length ?? 0), 0), [studyBlocks])

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab') ?? 'logros'
    setActiveTab(tab)
  }, [location.search])

  const xp       = useMemo(() => calcXP(sessions, studyReadTopics, wrongAnswers, totalTopics), [sessions, studyReadTopics, wrongAnswers, totalTopics])
  const missions = useMemo(() => buildMissions(sessions, wrongAnswers, studyReadTopics, studyBookmarks, totalTopics), [sessions, wrongAnswers, studyReadTopics, studyBookmarks, totalTopics])

  const currentLevelData = [...LEVELS].reverse().find(l => xp >= l.xpRequired) ?? LEVELS[0]!
  const nextLevelData    = LEVELS.find(l => l.level === currentLevelData.level + 1)
  const xpInLevel        = xp - currentLevelData.xpRequired
  const xpNeeded         = nextLevelData ? nextLevelData.xpRequired - currentLevelData.xpRequired : 1
  const levelPct         = nextLevelData ? Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)) : 100

  const totalAnswered = sessions.reduce((s, x) => s + x.total, 0)
  const readCount     = studyReadTopics?.size ?? 0
  const unlockedCount = missions.filter(m => m.unlocked).length
  const nextMission   = missions.find(m => !m.unlocked && m.current > 0) ?? missions.find(m => !m.unlocked)
  const categories    = [...new Set(missions.map(m => m.category))]

  const bookLevel = currentLevelData.level <= 2 ? 1 : currentLevelData.level <= 5 ? 2 : currentLevelData.level <= 7 ? 3 : currentLevelData.level <= 9 ? 4 : 5
  const bookColor = currentLevelData.level <= 3 ? '#059669' : currentLevelData.level <= 6 ? '#2563EB' : currentLevelData.level <= 8 ? '#7C3AED' : '#D97706'

  if (loadingContent) return (
    <div className={styles.page} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <Loader2 size={28} strokeWidth={1.5} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
        <p style={{ marginTop: '1rem', color: 'var(--ink-muted)', fontSize: '0.88rem' }}>Cargando perfil…</p>
      </div>
    </div>
  )

  return (
    <div className={styles.page}>

      {activeTab === 'logros' && (
        <div className={styles.heroCard}>
          <div className={styles.heroLeft}>
            <div className={styles.avatarRing} style={{ ['--ring-color' as string]: bookColor }}>
              <div className={styles.avatarInner}>{currentUser?.displayName?.[0]?.toUpperCase() ?? '?'}</div>
            </div>
            <div className={styles.heroInfo}>
              <h1 className={styles.heroName}>{currentUser?.displayName ?? 'Usuario'}</h1>
              <div className={styles.heroLevel} style={{ color: bookColor }}>Nivel {currentLevelData.level} · {currentLevelData.title}</div>
              <p className={styles.heroSubtitle}>{currentLevelData.subtitle}</p>
            </div>
          </div>
          <div className={styles.heroBook}>
            <svg width="90" height="90" viewBox="-45 -45 90 90">
              {bookLevel >= 1 && <BookIcon color={bookColor} x={bookLevel >= 2 ? -10 : 0} y={bookLevel >= 2 ? 8 : 0}  rotate={bookLevel >= 2 ? -8 : 0} opacity={0.5} />}
              {bookLevel >= 2 && <BookIcon color={bookColor} x={6}   y={0}   rotate={5}   opacity={0.75} />}
              {bookLevel >= 3 && <BookIcon color={bookColor} x={-4}  y={-10} rotate={-3}  opacity={1}    />}
              {bookLevel >= 4 && <BookIcon color={bookColor} x={14}  y={-8}  rotate={8}   opacity={0.85} />}
              {bookLevel >= 5 && <BookIcon color={bookColor} x={-14} y={-6}  rotate={-10} opacity={0.9}  />}
            </svg>
          </div>
        </div>
      )}

      {activeTab === 'logros' && (
        <div className={styles.xpCard}>
          <div className={styles.xpTop}>
            <span className={styles.xpLabel}><Star size={13} /> {xp} XP</span>
            {nextLevelData
              ? <span className={styles.xpNext}>Siguiente: <strong>{nextLevelData.title}</strong> — faltan {nextLevelData.xpRequired - xp} XP</span>
              : <span className={styles.xpNext}>🎉 ¡Nivel máximo alcanzado!</span>}
          </div>
          <div className={styles.xpBarWrap}>
            <div className={styles.xpBarFill} style={{ width: `${levelPct}%`, background: bookColor }} />
          </div>
          <div className={styles.xpLevels}>
            {LEVELS.map(l => (
              <div key={l.level} className={[styles.xpDot, l.level <= currentLevelData.level ? styles.xpDotDone : ''].join(' ')}
                style={l.level <= currentLevelData.level ? { background: bookColor } : {}}
                title={`Nivel ${l.level}: ${l.title}`} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'logros' && (
        <div className={styles.quickStats}>
          {([
            { icon: Target,     label: 'Tests',        value: sessions.length,               color: '#2563EB' },
            { icon: TrendingUp, label: 'Respondidas',  value: totalAnswered,                  color: '#059669' },
            { icon: BookOpen,   label: 'Temas leídos', value: `${readCount}/${totalTopics}`,  color: '#D97706' },
            { icon: Flame,      label: 'Racha',        value: `${streakDays}d`,               color: '#DC2626' },
            { icon: Trophy,     label: 'Logros',       value: `${unlockedCount}/${missions.length}`, color: '#7C3AED' },
          ] as { icon: LucideIcon; label: string; value: string | number; color: string }[]).map(({ icon: Icon, label, value, color }) => (
            <div key={label} className={styles.quickStat}>
              <div className={styles.quickStatIcon} style={{ background: `${color}18`, color }}><Icon size={15} /></div>
              <span className={styles.quickStatVal}>{value}</span>
              <span className={styles.quickStatLabel}>{label}</span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.tabs}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} className={[styles.tab, activeTab === id ? styles.tabActive : ''].join(' ')} onClick={() => setActiveTab(id)}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'logros' && (
        <>
          {nextMission && (
            <div className={styles.nextMissionCard}>
              <div className={styles.nextMissionIcon}>{nextMission.icon}</div>
              <div className={styles.nextMissionBody}>
                <span className={styles.nextMissionTag}>Próximo logro</span>
                <p className={styles.nextMissionTitle}>{nextMission.title}</p>
                <p className={styles.nextMissionDesc}>{nextMission.desc}</p>
                <div className={styles.nextMissionBar}>
                  <div className={styles.nextMissionFill} style={{ width: `${Math.round((nextMission.current / nextMission.target) * 100)}%` }} />
                </div>
                <span className={styles.nextMissionPct}>{nextMission.current}{nextMission.unit ?? ''} / {nextMission.target}{nextMission.unit ?? ''}</span>
              </div>
            </div>
          )}

          {categories.map(cat => (
            <div key={cat} className={styles.missionSection}>
              <h3 className={styles.missionCatTitle}>
                <span className={styles.missionCatDot} style={{ background: CAT_COLORS[cat] ?? '#6B7280' }} />
                {cat}
              </h3>
              <div className={styles.missionList}>
                {missions.filter(m => m.category === cat).map((m, idx, arr) => {
                  const MIcon  = MISSION_ICONS[m.id] ?? Star
                  const color  = CAT_COLORS[cat] ?? '#6B7280'
                  const isLast = idx === arr.length - 1
                  const pct    = Math.min(100, Math.round((m.current / m.target) * 100))
                  return (
                    <div key={m.id} className={styles.missionRow}>
                      <div className={styles.missionTrack}>
                        <div className={[styles.missionDot, m.unlocked ? styles.missionDotDone : ''].join(' ')}
                          style={m.unlocked ? { background: color, boxShadow: `0 0 0 4px ${color}22` } : {}}>
                          {m.unlocked
                            ? <CheckCircle size={10} color="#fff" strokeWidth={3} />
                            : <Lock        size={8}  color="var(--ink-subtle)" strokeWidth={2.5} />}
                        </div>
                        {!isLast && (
                          <div className={styles.missionLine}>
                            <div className={styles.missionLineFill} style={{ background: color, height: m.unlocked ? '100%' : `${pct}%` }} />
                            {!m.unlocked && pct > 0 && pct < 100 && (
                              <div className={styles.missionLineDot} style={{ background: color, top: `${pct}%` }} />
                            )}
                          </div>
                        )}
                      </div>
                      <div className={[styles.missionCard, m.unlocked ? styles.missionUnlocked : ''].join(' ')}
                        style={m.unlocked ? { ['--m-color' as string]: color, ['--done-color' as string]: color } : {}}>
                        <div className={styles.missionCardTop}>
                          <div className={styles.missionIconWrap} style={m.unlocked ? { background: `${color}18`, color } : { background: 'var(--surface-dim)', color: 'var(--ink-subtle)' }}>
                            <MIcon size={14} strokeWidth={m.unlocked ? 2 : 1.5} />
                          </div>
                          <div className={styles.missionCardMeta}>
                            <p className={styles.missionTitle}>{m.title}</p>
                            <p className={styles.missionDesc}>{m.desc}</p>
                          </div>
                          {m.unlocked && <div className={styles.missionBadgeDone} style={{ background: `${color}18`, color }}>✓</div>}
                        </div>
                        {!m.unlocked && (
                          <div className={styles.missionBarWrap}>
                            <div className={styles.missionBar}>
                              <div className={styles.missionBarFill} style={{ width: `${pct}%`, background: color }} />
                            </div>
                            <span className={styles.missionProgress}>{m.current}{m.unit ?? ''} / {m.target}{m.unit ?? ''}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {activeTab === 'mis-datos' && <MisDatosTab currentUser={currentUser} />}
      {activeTab === 'ajustes'   && <SettingsTab currentUser={currentUser} settings={settings} updateSetting={updateSetting} onUpdateDisplayName={onUpdateDisplayName} />}
    </div>
  )
}
