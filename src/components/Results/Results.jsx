import { CheckCircle, XCircle, Clock, RotateCcw, Home as HomeIcon, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import styles from './Results.module.css'

const LETTERS = ['A', 'B', 'C', 'D']

function CircleGauge({ pct, passed }) {
  const size = 100, stroke = 9, r = (size - stroke) / 2, circ = 2 * Math.PI * r
  const color = passed ? '#1a5c35' : '#b8293a'
  return (
    <div className={styles.gaugeWrap}>
      <svg className={styles.gauge} width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e3de" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${(pct/100)*circ} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className={styles.gaugePct}>
        <span className={styles.gaugeNum}>{pct}</span>
        <span className={styles.gaugePctLbl}>%</span>
      </div>
    </div>
  )
}

export default function Results({ questions, answers, onGoHome, onRepeat, durationSecs }) {
  const [showReview, setShowReview] = useState(false)

  const total   = Object.keys(answers).length
  const correct = Object.entries(answers).filter(([i, a]) => questions[i]?.answer === a).length
  const wrong   = total - correct
  const score   = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0
  const passed  = score >= 50

  const mm = String(Math.floor(durationSecs / 60)).padStart(2, '0')
  const ss = String(durationSecs % 60).padStart(2, '0')

  return (
    <div className={styles.wrapper}>
      <div className={styles.scoreCard}>
        <CircleGauge pct={score} passed={passed} />
        <h2 className={styles.scoreTitle}>{passed ? '¡Buen trabajo!' : 'Sigue practicando'}</h2>
        <p className={styles.scoreDesc}>{correct} correctas de {questions.length} preguntas</p>

        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <CheckCircle size={16} strokeWidth={2} className={styles.statIconGreen} />
            <span className={styles.statNum}>{correct}</span>
            <span className={styles.statLabel}>Correctas</span>
          </div>
          <div className={styles.stat}>
            <XCircle size={16} strokeWidth={2} className={styles.statIconRed} />
            <span className={styles.statNum}>{wrong}</span>
            <span className={styles.statLabel}>Errores</span>
          </div>
          <div className={styles.stat}>
            <Clock size={16} strokeWidth={2} className={styles.statIconMuted} />
            <span className={styles.statNum}>{mm}:{ss}</span>
            <span className={styles.statLabel}>Tiempo</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.btnHome}   onClick={onGoHome}><HomeIcon size={15} /> Inicio</button>
          <button className={styles.btnRepeat} onClick={onRepeat}><RotateCcw size={15} /> Repetir</button>
        </div>
      </div>

      <button className={styles.reviewToggle} onClick={() => setShowReview(v => !v)}>
        {showReview ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {showReview ? 'Ocultar revisión' : 'Revisar todas las respuestas'}
      </button>

      {showReview && (
        <div className={styles.reviewList}>
          {questions.map((q, i) => {
            const userAns    = answers[i]
            const isCorrect  = userAns === q.answer
            const wasAnswered = i in answers
            return (
              <div key={i} className={[styles.reviewItem, isCorrect ? styles.reviewCorrect : wasAnswered ? styles.reviewWrong : styles.reviewSkipped].join(' ')}>
                <div className={styles.reviewHeader}>
                  <span className={styles.reviewNum}>P{i + 1}</span>
                  {wasAnswered
                    ? (isCorrect ? <CheckCircle size={13} className={styles.iconGreen} /> : <XCircle size={13} className={styles.iconRed} />)
                    : <span className={styles.skippedTag}>Sin responder</span>}
                </div>
                <p className={styles.reviewQ}>{q.question}</p>
                {wasAnswered && !isCorrect && <p className={styles.reviewWrongAns}>Tu respuesta: {LETTERS[userAns]}. {q.options[userAns]}</p>}
                <p className={styles.reviewCorrectAns}>✓ {LETTERS[q.answer]}. {q.options[q.answer]}</p>
                {q.explanation && <p className={styles.reviewExpl}>{q.explanation}</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
