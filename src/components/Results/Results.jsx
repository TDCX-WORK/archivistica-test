import { CheckCircle, XCircle, Clock, RotateCcw, Home as HomeIcon,
         Check, X, ChevronDown, ChevronUp, BookOpen, TrendingUp,
         Users, Award, AlertTriangle, Plus } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import styles from './Results.module.css'

const LETTERS = ['A', 'B', 'C', 'D']

// ── Clasificacion por nota ────────────────────────────────────────────────────
function getClasificacion(score) {
  if (score >= 80) return { label: 'Sobresaliente', color: '#059669', bg: '#ECFDF5' }
  if (score >= 65) return { label: 'Apto',          color: '#0891B2', bg: '#EFF6FF' }
  if (score >= 50) return { label: 'Por los pelos', color: '#D97706', bg: '#FFFBEB' }
  return           { label: 'No apto',              color: '#DC2626', bg: '#FEF2F2' }
}

// ── Gauge circular ────────────────────────────────────────────────────────────
function CircleGauge({ pct, color }) {
  const size = 110, stroke = 9, r = (size - stroke) / 2, circ = 2 * Math.PI * r
  return (
    <div className={styles.gaugeWrap}>
      <svg className={styles.gauge} width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="var(--line)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={`${(pct/100)*circ} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      </svg>
      <div className={styles.gaugePct}>
        <span className={styles.gaugeNum}>{pct}</span>
        <span className={styles.gaugePctLbl}>%</span>
      </div>
    </div>
  )
}

// ── Comparativa con la clase ──────────────────────────────────────────────────
function ComparativaClase({ score, academyId, subjectId }) {
  const [mediaClase, setMediaClase] = useState(null)
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
      if (data?.length > 1) {
        const media = Math.round(data.reduce((s, x) => s + x.score, 0) / data.length)
        setMediaClase(media)
      }
      setLoading(false)
    }
    fetch30d()
  }, [academyId, subjectId])

  if (loading || mediaClase === null) return null

  const diff     = score - mediaClase
  const mejor    = diff > 0
  const igual    = diff === 0

  return (
    <div className={styles.comparativa}>
      <Users size={13} className={styles.comparativaIcon} />
      <span className={styles.comparativaText}>
        Media de la clase: <b>{mediaClase}%</b>
      </span>
      {!igual && (
        <span className={styles.comparativaDiff}
          style={{ color: mejor ? '#059669' : '#DC2626',
                   background: mejor ? '#ECFDF5' : '#FEF2F2' }}>
          {mejor ? '▲' : '▼'} {Math.abs(diff)} pts
        </span>
      )}
      {igual && (
        <span className={styles.comparativaDiff}
          style={{ color: '#6B7280', background: '#F3F4F6' }}>
          = igual que la clase
        </span>
      )}
    </div>
  )
}

// ── Item de pregunta fallada ──────────────────────────────────────────────────
function FailItem({ q, i, userAns, onAddToRepaso, alreadyInRepaso }) {
  const [open,  setOpen]  = useState(false)
  const [added, setAdded] = useState(alreadyInRepaso)

  const handleAdd = () => {
    if (added) return
    onAddToRepaso(q.id, q.block_id)
    setAdded(true)
  }

  return (
    <div className={styles.failItem}>
      <button className={styles.failHeader} onClick={() => setOpen(v => !v)}>
        <span className={styles.failNum}>P{i + 1}</span>
        <XCircle size={13} className={styles.iconRed} />
        <span className={styles.failQ}>{q.question}</span>
        {open ? <ChevronUp size={13} className={styles.failChevron} />
              : <ChevronDown size={13} className={styles.failChevron} />}
      </button>

      {open && (
        <div className={styles.failBody}>
          {userAns !== undefined && (
            <p className={styles.failWrongAns}>
              Tu respuesta: {LETTERS[userAns]}. {q.options[userAns]}
            </p>
          )}
          <p className={styles.failCorrectAns}>
            ✓ Correcta: {LETTERS[q.answer]}. {q.options[q.answer]}
          </p>
          {q.explanation && (
            <p className={styles.failExpl}>{q.explanation}</p>
          )}
          <button
            className={[styles.btnAddRepaso, added ? styles.btnAddRepasoAdded : ''].join(' ')}
            onClick={handleAdd}
            disabled={added}>
            {added
              ? <><Check size={12} /> En tu repaso</>
              : <><Plus size={12} /> Añadir al repaso</>
            }
          </button>
        </div>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Results({
  questions, answers, onGoHome, onRepeat, durationSecs,
  academyId, subjectId, onRecordWrong, wrongAnswers = [],
  blockMap = {}
}) {
  const [showFails,   setShowFails]   = useState(false)
  const [showCorrect, setShowCorrect] = useState(false)

  const total   = Object.keys(answers).length
  const correct = Object.entries(answers).filter(([i, a]) => questions[i]?.answer === a).length
  const wrong   = total - correct
  const score   = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0
  const clf     = getClasificacion(score)

  const mm = String(Math.floor(durationSecs / 60)).padStart(2, '0')
  const ss = String(durationSecs % 60).padStart(2, '0')

  // Separar preguntas falladas y correctas
  const failedQs   = questions.map((q, i) => ({ q, i, userAns: answers[i] }))
    .filter(({ i, userAns }) => userAns !== undefined && questions[i]?.answer !== userAns)
  const correctQs  = questions.map((q, i) => ({ q, i, userAns: answers[i] }))
    .filter(({ i, userAns }) => userAns !== undefined && questions[i]?.answer === userAns)
  const skippedQs  = questions.map((q, i) => ({ q, i }))
    .filter(({ i }) => answers[i] === undefined)

  // Rendimiento por bloque
  const byBlock = {}
  questions.forEach((q, i) => {
    const blockId = q.block_id || 'sin-bloque'
    const blockLabel = blockMap[blockId]?.label || 'Sin bloque'
    if (!byBlock[blockId]) byBlock[blockId] = { label: blockLabel, correct: 0, total: 0 }
    byBlock[blockId].total++
    if (answers[i] === q.answer) byBlock[blockId].correct++
  })
  const blockStats = Object.values(byBlock).filter(b => b.total >= 3)

  return (
    <div className={styles.wrapper}>

      {/* ── Tarjeta principal ── */}
      <div className={styles.scoreCard}>
        <CircleGauge pct={score} color={clf.color} />

        {/* Clasificacion */}
        <div className={styles.clf} style={{ color: clf.color, background: clf.bg }}>
          {clf.label}
        </div>

        <h2 className={styles.scoreTitle}>
          {score >= 65 ? '¡Bien hecho!' : score >= 50 ? 'Casi lo tienes' : 'Sigue practicando'}
        </h2>
        <p className={styles.scoreDesc}>{correct} correctas de {questions.length} preguntas</p>

        {/* Comparativa con la clase */}
        <ComparativaClase score={score} academyId={academyId} subjectId={subjectId} />

        {/* Stats */}
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

        {/* Rendimiento por bloque */}
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

        {/* Acciones */}
        <div className={styles.actions}>
          <button className={styles.btnHome}   onClick={onGoHome}>
            <HomeIcon size={15} /> Inicio
          </button>
          <button className={styles.btnRepeat} onClick={onRepeat}>
            <RotateCcw size={15} /> Repetir
          </button>
        </div>
      </div>

      {/* ── Preguntas falladas ── */}
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

      {/* ── Preguntas correctas (colapsadas) ── */}
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
                      ✓ {LETTERS[q.answer]}. {q.options[q.answer]}
                    </p>
                    {q.explanation && (
                      <p className={styles.failExpl}>{q.explanation}</p>
                    )}
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
