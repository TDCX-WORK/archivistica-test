import { CheckCircle, XCircle, Clock, RotateCcw, Home as HomeIcon,
         Check, X, ChevronDown, ChevronUp, BookOpen, TrendingUp,
         Users, Award, AlertTriangle, Plus } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { Question, WrongAnswer } from '../../types'
import styles from './Results.module.css'

const LETTERS = ['A', 'B', 'C', 'D']

interface Clasificacion {
  label: string
  color: string
  bg:    string
}

function getClasificacion(score: number): Clasificacion {
  if (score >= 80) return { label: 'Sobresaliente', color: '#059669', bg: '#ECFDF5' }
  if (score >= 65) return { label: 'Apto',          color: '#0891B2', bg: '#EFF6FF' }
  if (score >= 50) return { label: 'Por los pelos', color: '#D97706', bg: '#FFFBEB' }
  return                  { label: 'No apto',        color: '#DC2626', bg: '#FEF2F2' }
}

function CircleGauge({ pct, color }: { pct: number; color: string }) {
  const size = 110, stroke = 9, r = (size - stroke) / 2, circ = 2 * Math.PI * r
  return (
    <div className={styles.gaugeWrap}>
      <svg className={styles.gauge} width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${(pct/100)*circ} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      </svg>
      <div className={styles.gaugePct}>
        <span className={styles.gaugeNum}>{pct}</span>
        <span className={styles.gaugePctLbl}>%</span>
      </div>
    </div>
  )
}

function ComparativaClase({ score, academyId, subjectId }: {
  score:      number
  academyId:  string | null | undefined
  subjectId:  string | null | undefined
}) {
  const [mediaClase, setMediaClase] = useState<number | null>(null)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    if (!academyId) { setLoading(false); return }
    const fetch30d = async () => {
      const hace30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
      let q = supabase
        .from('sessions')
        .select('score')
        .eq('academy_id', academyId)
        .gte('played_at', hace30)
      if (subjectId) q = q.eq('subject_id', subjectId)
      const { data } = await q
      if (data && data.length > 1) {
        const media = Math.round((data as { score: number }[]).reduce((s, x) => s + x.score, 0) / data.length)
        setMediaClase(media)
      }
      setLoading(false)
    }
    fetch30d()
  }, [academyId, subjectId])

  if (loading || mediaClase === null) return null

  const diff  = score - mediaClase
  const mejor = diff > 0
  const igual = diff === 0

  return (
    <div className={styles.comparativa}>
      <Users size={13} className={styles.comparativaIcon} />
      <span className={styles.comparativaText}>
        Media de la clase: <b>{mediaClase}%</b>
      </span>
      {!igual && (
        <span className={styles.comparativaDiff}
          style={{ color: mejor ? '#059669' : '#DC2626', background: mejor ? '#ECFDF5' : '#FEF2F2' }}>
          {mejor ? '+' : ''}{diff}%
        </span>
      )}
    </div>
  )
}

interface FailItemProps {
  q:               Question
  i:               number
  userAns:         number | undefined
  onAddToRepaso?:  (questionId: string, blockId: string | null) => void
  alreadyInRepaso: boolean
}

function FailItem({ q, i, userAns, onAddToRepaso, alreadyInRepaso }: FailItemProps) {
  const [expanded, setExpanded] = useState(false)
  const [added,    setAdded]    = useState(alreadyInRepaso)
  const opts = q.options as string[]

  const handleAdd = () => {
    if (onAddToRepaso) {
      onAddToRepaso(q.id, q.block_id)
      setAdded(true)
    }
  }

  return (
    <div className={styles.failItem}>
      <button className={styles.failHeader} onClick={() => setExpanded(v => !v)}>
        <span className={styles.failNum}>P{i + 1}</span>
        <X size={13} className={styles.iconRed} />
        <span className={styles.failQ}>{q.question}</span>
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {expanded && (
        <div className={styles.failBody}>
          {userAns !== undefined && (
            <p className={styles.failWrongAns}>
              ✗ Tu respuesta: {LETTERS[userAns]}. {opts[userAns]}
            </p>
          )}
          <p className={styles.failCorrectAns}>
            ✓ {LETTERS[q.answer]}. {opts[q.answer]}
          </p>
          {q.explanation && <p className={styles.failExpl}>{q.explanation}</p>}
          {onAddToRepaso && (
            <button className={[styles.addRepasoBtn, added ? styles.addRepasoBtnAdded : ''].join(' ')}
              onClick={handleAdd}
              disabled={added}>
              {added
                ? <><Check size={12} /> En tu repaso</>
                : <><Plus size={12} /> Añadir al repaso</>
              }
            </button>
          )}
        </div>
      )}
    </div>
  )
}

interface BlockInfo {
  label:   string
  color?:  string
}

interface ResultsProps {
  questions:       Question[]
  answers:         Record<number, number>
  onGoHome:        () => void
  onRepeat:        () => void
  durationSecs:    number
  academyId?:      string | null
  subjectId?:      string | null
  onRecordWrong?:  (questionId: string, blockId: string | null) => void
  wrongAnswers?:   WrongAnswer[]
  blockMap?:       Record<string, BlockInfo>
}

export default function Results({
  questions, answers, onGoHome, onRepeat, durationSecs,
  academyId, subjectId, onRecordWrong, wrongAnswers = [],
  blockMap = {},
}: ResultsProps) {
  const [showFails,   setShowFails]   = useState(false)
  const [showCorrect, setShowCorrect] = useState(false)

  const total   = Object.keys(answers).length
  const correct = Object.entries(answers).filter(([i, a]) => questions[Number(i)]?.answer === a).length
  const wrong   = total - correct
  const score   = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0
  const clf     = getClasificacion(score)

  const mm = String(Math.floor(durationSecs / 60)).padStart(2, '0')
  const ss = String(durationSecs % 60).padStart(2, '0')

  const failedQs  = questions.map((q, i) => ({ q, i, userAns: answers[i] }))
    .filter(({ i, userAns }) => userAns !== undefined && questions[i]?.answer !== userAns)
  const correctQs = questions.map((q, i) => ({ q, i, userAns: answers[i] }))
    .filter(({ i, userAns }) => userAns !== undefined && questions[i]?.answer === userAns)
  const skippedQs = questions.map((q, i) => ({ q, i }))
    .filter(({ i }) => answers[i] === undefined)

  const byBlock: Record<string, { label: string; correct: number; total: number }> = {}
  questions.forEach((q, i) => {
    const blockId    = q.block_id ?? 'sin-bloque'
    const blockLabel = blockMap[blockId]?.label ?? 'Sin bloque'
    if (!byBlock[blockId]) byBlock[blockId] = { label: blockLabel, correct: 0, total: 0 }
    byBlock[blockId]!.total++
    if (answers[i] === q.answer) byBlock[blockId]!.correct++
  })
  const blockStats = Object.values(byBlock).filter(b => b.total >= 3)

  return (
    <div className={styles.wrapper}>
      <div className={styles.scoreCard}>
        <CircleGauge pct={score} color={clf.color} />

        <div className={styles.clf} style={{ color: clf.color, background: clf.bg }}>
          {clf.label}
        </div>

        <h2 className={styles.scoreTitle}>
          {score >= 65 ? '¡Bien hecho!' : score >= 50 ? 'Casi lo tienes' : 'Sigue practicando'}
        </h2>
        <p className={styles.scoreDesc}>{correct} correctas de {questions.length} preguntas</p>

        <ComparativaClase score={score} academyId={academyId} subjectId={subjectId} />

        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <CheckCircle size={16} className={styles.statIconGreen} />
            <span className={styles.statNum}>{correct}</span>
            <span className={styles.statLabel}>Correctas</span>
          </div>
          <div className={styles.stat}>
            <XCircle size={16} className={styles.statIconRed} />
            <span className={styles.statNum}>{wrong}</span>
            <span className={styles.statLabel}>Errores</span>
          </div>
          {skippedQs.length > 0 && (
            <div className={styles.stat}>
              <AlertTriangle size={16} className={styles.statIconMuted} />
              <span className={styles.statNum}>{skippedQs.length}</span>
              <span className={styles.statLabel}>Sin resp.</span>
            </div>
          )}
          <div className={styles.stat}>
            <Clock size={16} className={styles.statIconMuted} />
            <span className={styles.statNum}>{mm}:{ss}</span>
            <span className={styles.statLabel}>Tiempo</span>
          </div>
        </div>

        {blockStats.length > 1 && (
          <div className={styles.blockStats}>
            <div className={styles.blockStatsTitle}>
              <TrendingUp size={12} /> Rendimiento por bloque
            </div>
            {blockStats.map(b => {
              const pct = Math.round((b.correct / b.total) * 100)
              return (
                <div key={b.label} className={styles.blockRow}>
                  <span className={styles.blockLabel}>{b.label}</span>
                  <div className={styles.blockBar}>
                    <div className={styles.blockBarFill}
                      style={{
                        width: `${pct}%`,
                        background: pct >= 65 ? '#059669' : pct >= 50 ? '#D97706' : '#DC2626'
                      }} />
                  </div>
                  <span className={styles.blockPct}
                    style={{ color: pct >= 65 ? '#059669' : pct >= 50 ? '#D97706' : '#DC2626' }}>
                    {pct}%
                  </span>
                </div>
              )
            })}
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.btnHome}   onClick={onGoHome}><HomeIcon size={15} /> Inicio</button>
          <button className={styles.btnRepeat} onClick={onRepeat}><RotateCcw size={15} /> Repetir</button>
        </div>
      </div>

      {failedQs.length > 0 && (
        <>
          <button className={styles.sectionToggle}
            onClick={() => setShowFails(v => !v)}
            style={{ borderColor: '#FECACA', color: '#DC2626' }}>
            {showFails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <XCircle size={14} />
            {failedQs.length} pregunta{failedQs.length !== 1 ? 's' : ''} fallada{failedQs.length !== 1 ? 's' : ''}
            {!showFails && onRecordWrong && (
              <span className={styles.sectionHint}>— pulsa para ver y añadir al repaso</span>
            )}
          </button>
          {showFails && (
            <div className={styles.failList}>
              {failedQs.map(({ q, i, userAns }) => (
                <FailItem
                  key={q.id}
                  q={q} i={i} userAns={userAns}
                  onAddToRepaso={onRecordWrong}
                  alreadyInRepaso={wrongAnswers.some(w => w.question_id === q.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {correctQs.length > 0 && (
        <>
          <button className={styles.sectionToggle}
            onClick={() => setShowCorrect(v => !v)}
            style={{ borderColor: '#A7F3D0', color: '#059669' }}>
            {showCorrect ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <CheckCircle size={14} />
            {correctQs.length} pregunta{correctQs.length !== 1 ? 's' : ''} correcta{correctQs.length !== 1 ? 's' : ''}
          </button>
          {showCorrect && (
            <div className={styles.failList}>
              {correctQs.map(({ q, i }) => (
                <div key={q.id} className={[styles.failItem, styles.failItemCorrect].join(' ')}>
                  <div className={styles.failHeader}>
                    <span className={styles.failNum}>P{i + 1}</span>
                    <CheckCircle size={13} className={styles.iconGreen} />
                    <span className={styles.failQ}>{q.question}</span>
                  </div>
                  <div className={styles.failBody} style={{ paddingTop: 0 }}>
                    <p className={styles.failCorrectAns}>
                      ✓ {LETTERS[q.answer]}. {(q.options as string[])[q.answer]}
                    </p>
                    {q.explanation && <p className={styles.failExpl}>{q.explanation}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
