import { useState, useEffect } from 'react'
import {
  BookOpen, Trophy, Flame, FileText, Layers, Zap, Archive,
  Scale, Cpu, Shield, History, Library, CreditCard, AlertTriangle,
  Clock, ChevronRight, Database, Globe, Users
} from 'lucide-react'
import { supabase }        from '../../lib/supabase'
import config              from '../../data/config.json'
import { usePlanSemanal }  from '../../hooks/usePlanSemanal'
import StudyHeatmap        from './StudyHeatmap'
import styles              from './Home.module.css'

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

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className={styles.statCard} style={{ '--cc': color, '--cb': bg }}>
      <div className={styles.statIcon}><Icon size={15} strokeWidth={2} /></div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  )
}

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

export default function Home({ onSelectMode, progress, currentUser }) {
  const {
    totalAnswered, avgScore, streakDays,
    wrongAnswers = [], dueForReview = [], sessions = []
  } = progress

  const [totalQuestions, setTotalQuestions] = useState(0)
  const [blocks,         setBlocks]         = useState([])
  const [supuestos,      setSupuestos]      = useState([])
  const [planDates,      setPlanDates]      = useState(new Set())

  useEffect(() => {
    const sid = currentUser?.subject_id
    const aid = currentUser?.academy_id
    if (!aid) return
    const cq = sid
      ? supabase.from('questions').select('id',{count:'exact',head:true}).eq('academy_id',aid).eq('subject_id',sid)
      : supabase.from('questions').select('id',{count:'exact',head:true}).eq('academy_id',aid)
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
    Promise.all([cq, loadBlocks()]).then(([cr, bd]) => {
      setTotalQuestions(cr.count||0); setBlocks(bd)
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
  const regularModes = Object.values(config.modes).filter(m => !m.practical)
  const maxCount     = blocks.length ? Math.max(...blocks.map(b=>b.count),1) : 1

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

        <div className={[styles.card, styles.aTests].join(' ')}>
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

        <div className={[styles.card, styles.aSupuestos].join(' ')}>
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
              <div className={styles.comingSoonIcon}><Archive size={20} strokeWidth={1.5} /></div>
              <span className={styles.comingSoonTitle}>Supuestos prácticos</span>
              <span className={styles.comingSoonSub}>Tu profesor añadirá casos prácticos aquí</span>
            </div>
          )}
        </div>

        <div className={[styles.card, styles.aFallos].join(' ')}>
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

        <div className={[styles.card, styles.aExtra].join(' ')}>
          <div className={styles.comingSoonCard}>
            <div className={styles.comingSoonIcon}><BookOpen size={20} strokeWidth={1.5} /></div>
            <span className={styles.comingSoonTitle}>Próximamente</span>
            <span className={styles.comingSoonSub}>Nuevas funcionalidades en camino</span>
          </div>
        </div>

        <div className={[styles.card, styles.aCalendar].join(' ')}>
          <StudyHeatmap
            sessions={sessions} planDates={planDates}
            wrongAnswers={wrongAnswers} dueForReview={dueForReview}
            streakDays={streakDays} avgScore={avgScore}
          />
        </div>

        {blocks.length > 0 && (
          <div className={[styles.card, styles.aTemario].join(' ')}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Distribución del temario</span>
              <span className={styles.cardBadge}>{totalQuestions} preguntas</span>
            </div>
            <div className={styles.blocksGrid}>
              {blocks.map(block => {
                const Icon = getBlockIcon(block.label)
                const pct  = Math.min(100,(block.count/maxCount)*100)
                return (
                  <div key={block.id} className={styles.blockRow}>
                    <div className={styles.blockIcon} style={{color:block.color}}><Icon size={12} strokeWidth={2}/></div>
                    <div className={styles.blockInfo}>
                      <div className={styles.blockTop}>
                        <span className={styles.blockLabel}>{block.label}</span>
                        <span className={styles.blockCount}>{block.count}</span>
                      </div>
                      <div className={styles.blockBar}>
                        <div className={styles.blockFill} style={{width:`${pct}%`,background:block.color}}/>
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
