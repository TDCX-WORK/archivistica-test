import { useState, useEffect } from 'react'
import { BookOpen, Timer, Trophy, Flame, FileText, Layers, Zap, Archive,
         Scale, Cpu, Shield, History, Compass, CreditCard, AlertTriangle,
         Clock, ChevronRight, LayoutGrid, GraduationCap, Library,
         Building2, BookMarked, Database, Globe, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import config from '../../data/config.json'
import supuestosArchivistica from '../../data/supuestos.json'
import { usePlanSemanal } from '../../hooks/usePlanSemanal'
import styles from './Home.module.css'

const MODE_META = {
  beginner: { Icon: Zap,    color: '#059669', bg: '#ECFDF5' },
  advanced: { Icon: Flame,  color: '#D97706', bg: '#FFFBEB' },
  exam:     { Icon: Trophy, color: '#7C3AED', bg: '#F5F3FF' },
}

// Iconos genéricos para bloques de Supabase según palabras clave del label
function getBlockIcon(label = '') {
  const l = label.toLowerCase()
  if (l.includes('constitu') || l.includes('función pública')) return Scale
  if (l.includes('administ') || l.includes('uned') || l.includes('normativa')) return Building2
  if (l.includes('propiedad') || l.includes('servicio') || l.includes('usuario')) return Users
  if (l.includes('colección') || l.includes('instalación') || l.includes('instalac')) return Library
  if (l.includes('proceso') || l.includes('técnico') || l.includes('normaliz')) return Database
  if (l.includes('comuni') || l.includes('ciencia') || l.includes('coopera')) return Globe
  if (l.includes('historia')) return History
  if (l.includes('legisla')) return Scale
  if (l.includes('gestión') || l.includes('gestion')) return Layers
  if (l.includes('descri')) return FileText
  if (l.includes('conserva')) return Shield
  if (l.includes('digital')) return Cpu
  return BookOpen
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
              {b.todosLosTemas
                ? <span className={styles.planBloqueDesc}>Bloque completo</span>
                : <span className={styles.planBloqueDesc}>{b.temasEspecificos.map(t => t.title).join(' · ')}</span>
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Home({ onSelectMode, progress, currentUser }) {
  const { totalAnswered, avgScore, streakDays, studiedDays, wrongAnswers = [], dueForReview = [] } = progress

  // ── Datos de Supabase ──────────────────────────────────────────────────
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [blocks, setBlocks] = useState([])           // [{id, label, color, count}]
  const [supuestos, setSupuestos] = useState([])

  useEffect(() => {
    const subjectId = currentUser?.subject_id
    const academyId = currentUser?.academy_id
    if (!academyId) return

    // 1. Contar preguntas de esta asignatura
    const countQ = subjectId
      ? supabase.from('questions').select('id', { count: 'exact', head: true }).eq('academy_id', academyId).eq('subject_id', subjectId)
      : supabase.from('questions').select('id', { count: 'exact', head: true }).eq('academy_id', academyId)

    // 2. Bloques con conteo de preguntas
    const loadBlocks = async () => {
      const { data: bData } = subjectId
        ? await supabase.from('content_blocks').select('id, label, color, position').eq('academy_id', academyId).eq('subject_id', subjectId).order('position')
        : await supabase.from('content_blocks').select('id, label, color, position').eq('academy_id', academyId).order('position')

      if (!bData?.length) return []

      // Contar preguntas por bloque
      const { data: qData } = subjectId
        ? await supabase.from('questions').select('block_id').eq('academy_id', academyId).eq('subject_id', subjectId)
        : await supabase.from('questions').select('block_id').eq('academy_id', academyId)

      const countByBlock = {}
      for (const q of (qData || [])) {
        countByBlock[q.block_id] = (countByBlock[q.block_id] || 0) + 1
      }

      return bData.map(b => ({ ...b, count: countByBlock[b.id] || 0 }))
    }

    Promise.all([countQ, loadBlocks()]).then(([countRes, blocksData]) => {
      setTotalQuestions(countRes.count || 0)
      setBlocks(blocksData)
    })

    // 3. Supuestos: primero busca en Supabase, fallback a JSON local (Archivística)
    const loadSupuestos = async () => {
      // Intentar cargar desde Supabase (tabla supuestos)
      let query = supabase
        .from('supuestos')
        .select('id, slug, title, subtitle, scenario, position, supuesto_questions(id, question, options, answer, explanation, position)')
        .eq('academy_id', academyId)
        .order('position')

      if (subjectId) query = query.eq('subject_id', subjectId)

      const { data: supData } = await query

      if (supData?.length > 0) {
        // Formatear igual que supuestos.json para compatibilidad con SupuestoRunner
        const formatted = supData.map(s => ({
          id:       s.slug,
          title:    s.title,
          subtitle: s.subtitle || '',
          scenario: s.scenario || '',
          questions: (s.supuesto_questions || [])
            .sort((a, b) => a.position - b.position)
            .map(q => ({
              question:    q.question,
              options:     q.options,
              answer:      q.answer,
              explanation: q.explanation || ''
            }))
        }))
        setSupuestos(formatted)
        return
      }

      // Fallback a JSON local solo para Archivística
      if (!subjectId) {
        setSupuestos(supuestosArchivistica)
        return
      }
      const { data: subjectData } = await supabase
        .from('subjects').select('slug').eq('id', subjectId).maybeSingle()
      if (subjectData?.slug === 'archivistica' || subjectData?.slug?.includes('archiv')) {
        setSupuestos(supuestosArchivistica)
      } else {
        setSupuestos([])
      }
    }
    loadSupuestos()

  }, [currentUser?.academy_id, currentUser?.subject_id])

  const { planSemanal, bloquesSemanal, planDiario, bloquesDiario } = usePlanSemanal(currentUser?.academy_id)

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
  const maxCount     = blocks.length ? Math.max(...blocks.map(b => b.count), 1) : 1

  return (
    <div className={styles.page}>

      {/* ── KPI ROW ── */}
      <div className={styles.kpiRow}>
        <StatCard icon={Flame}         label="Racha"        value={`${streakDays}d`}   color="#D97706" bg="#FFFBEB" />
        <StatCard icon={Trophy}        label="Media"        value={`${avgScore}%`}     color="#7C3AED" bg="#F5F3FF" />
        <StatCard icon={FileText}      label="Respondidas"  value={totalAnswered}       color="#059669" bg="#ECFDF5" />
        <StatCard icon={AlertTriangle} label="Fallos"       value={wrongAnswers.length} color="#DC2626" bg="#FEF2F2" />
      </div>

      {/* ── PLAN DIARIO ── */}
      {planDiario && bloquesDiario.length > 0 && (
        <PlanWidget plan={planDiario} bloques={bloquesDiario} titulo="📅 Para hoy" variante="diario" />
      )}

      {/* ── PLAN SEMANAL ── */}
      {planSemanal && bloquesSemanal.length > 0 && (
        <PlanWidget plan={planSemanal} bloques={bloquesSemanal} titulo="🗓 Objetivo de esta semana" variante="semanal" />
      )}

      <div className={styles.grid}>

        {/* Columna izquierda */}
        <div className={styles.col}>

          {/* Tests */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Tests de teoría</span>
              <span className={styles.cardBadge}>{totalQuestions} preguntas</span>
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
                desc={`Repaso rápido · ${totalQuestions} tarjetas`}
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

          {/* Supuestos — solo si hay */}
          {supuestos.length > 0 && (
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
          )}

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

        {/* Distribución del temario — full width, desde Supabase */}
        {blocks.length > 0 && (
          <div className={[styles.card, styles.cardFull].join(' ')}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Distribución del temario</span>
              <span className={styles.cardBadge}>{totalQuestions} preguntas</span>
            </div>
            <div className={styles.blocksGrid}>
              {blocks.map(block => {
                const Icon = getBlockIcon(block.label)
                const pct  = Math.min(100, (block.count / maxCount) * 100)
                return (
                  <div key={block.id} className={styles.blockRow}>
                    <div className={styles.blockIcon} style={{ color: block.color }}>
                      <Icon size={12} strokeWidth={2} />
                    </div>
                    <div className={styles.blockInfo}>
                      <div className={styles.blockTop}>
                        <span className={styles.blockLabel}>{block.label}</span>
                        <span className={styles.blockCount}>{block.count}</span>
                      </div>
                      <div className={styles.blockBar}>
                        <div className={styles.blockFill} style={{ width: `${pct}%`, background: block.color }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
