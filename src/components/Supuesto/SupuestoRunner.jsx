import { useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle, BookOpen, RotateCcw, Home as HomeIcon, Check, X, Loader2 } from 'lucide-react'
import { useAiExplanation } from '../../hooks/useAiExplanation'
import styles from './SupuestoRunner.module.css'

const LETTERS = ['A', 'B', 'C', 'D']

function CircleGauge({ pct }) {
  const size = 96, stroke = 9, r = (size - stroke) / 2, circ = 2 * Math.PI * r
  const color = pct >= 50 ? '#1a5c35' : '#b8293a'
  return (
    <div className={styles.finishGaugeWrap}>
      <svg className={styles.finishGauge} width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e3de" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${(pct/100)*circ} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className={styles.finishGaugePct}>
        <span className={styles.finishGaugeNum}>{pct}</span>
        <span className={styles.finishGaugeLbl}>%</span>
      </div>
    </div>
  )
}

function RichFeedback({ question, selectedIndex, styles }) {
  const wasWrong = selectedIndex !== undefined && selectedIndex !== question.answer

  const { explText, isAi, loading, error } = useAiExplanation({
    wasWrong,
    staticExpl: question.explanation,
    question:   question.question,
    options:    question.options,
    answer:     question.answer,
    selectedIndex,
  })

  if (wasWrong) return (
    <div className={styles.wrongFeedback}>
      <div className={styles.fbHeader}>
        <div className={styles.fbIconWrong}><X size={13} strokeWidth={2.5} /></div>
        <div>
          <p className={styles.fbTitle}>Respuesta incorrecta</p>
          <p className={styles.fbSub}>Marcaste: <strong>{LETTERS[selectedIndex]}. {question.options[selectedIndex]}</strong></p>
        </div>
      </div>
      <div className={styles.fbCorrectBox}>
        <div className={styles.fbCorrectLbl}><Check size={11} strokeWidth={2.5} /> Respuesta correcta</div>
        <p className={styles.fbCorrectTxt}><strong>{LETTERS[question.answer]}.</strong> {question.options[question.answer]}</p>
      </div>
      <div className={styles.fbExplBox}>
        <div className={styles.fbExplLbl}>
          <BookOpen size={11} strokeWidth={2} />
          {loading ? 'Generando explicación…' : '¿Por qué?'}
          {isAi && !loading && <span className={styles.fbAiTag}>IA</span>}
        </div>
        {loading ? (
          <div className={styles.fbLoadingRow}>
            <Loader2 size={13} className={styles.fbSpinner} />
            <span className={styles.fbLoadingText}>Analizando la pregunta…</span>
          </div>
        ) : error ? (
          <p className={styles.fbExplTxt} style={{ color: 'var(--ink-subtle)' }}>
            No se pudo conectar. Repasa esta pregunta en el temario.
          </p>
        ) : explText ? (
          <p className={styles.fbExplTxt}>{explText}</p>
        ) : null}
      </div>
    </div>
  )

  return (
    <div className={styles.correctFeedback}>
      <div className={styles.fbHeader}>
        <div className={styles.fbIconOk}><Check size={13} strokeWidth={2.5} /></div>
        <div>
          <p className={styles.fbTitle}>¡Correcto!</p>
          {question.explanation && <p className={styles.fbOkExpl}>{question.explanation}</p>}
        </div>
      </div>
    </div>
  )
}

export default function SupuestoRunner({ supuesto, onGoHome }) {
  const [phase,   setPhase]   = useState('intro')
  const [index,   setIndex]   = useState(0)
  const [answers, setAnswers] = useState({})
  const [finished, setFinished] = useState(false)

  const totalQ = supuesto.questions.length
  const q      = supuesto.questions[index]
  const answered = index in answers
  const correct  = Object.entries(answers).filter(([i, a]) => supuesto.questions[i]?.answer === a).length
  const score    = totalQ > 0 ? Math.round((correct / totalQ) * 100) : 0

  const handleAnswer = useCallback((optIdx) => {
    setAnswers(prev => ({ ...prev, [index]: optIdx }))
  }, [index])

  if (phase === 'intro') return (
    <div className={styles.introPage}>
      <div className={styles.introLayout}>
        <div>
          <div className={styles.introBadge}><BookOpen size={11} /> Supuesto práctico</div>
          <h2 className={styles.introTitle}>{supuesto.title}</h2>
          {supuesto.subtitle && <p className={styles.introSubtitle}>{supuesto.subtitle}</p>}
          <div className={styles.scenarioBox}>
            <p className={styles.scenarioText}>{supuesto.scenario}</p>
          </div>
        </div>
        <div className={styles.introSide}>
          <div className={styles.introInfo}>
            <p className={styles.introMeta}>{totalQ} preguntas — Lee el escenario antes de comenzar</p>
            <button className={styles.startBtn} onClick={() => setPhase('running')}>
              Comenzar <ChevronRight size={15} />
            </button>
            <button className={styles.backBtn} onClick={onGoHome}>
              <HomeIcon size={13} /> Volver al inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  if (finished) return (
    <div className={styles.finishPage}>
      <div className={styles.finishCard}>
        <CircleGauge pct={score} />
        <h2 className={styles.finishTitle}>Supuesto completado</h2>
        <p className={styles.finishSub}>{correct} de {totalQ} correctas</p>
        <div className={styles.finishActions}>
          <button className={styles.finishBtn} onClick={() => { setPhase('intro'); setIndex(0); setAnswers({}); setFinished(false) }}>
            <RotateCcw size={14} /> Repetir
          </button>
          <button className={[styles.finishBtn, styles.finishBtnGhost].join(' ')} onClick={onGoHome}>
            <HomeIcon size={14} /> Inicio
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className={styles.runPage}>
      <div className={styles.runLayout}>
        <aside className={styles.scenarioPanel}>
          <div className={styles.scenarioBadge}><BookOpen size={11} /> Escenario</div>
          <h3 className={styles.scenarioTitle}>{supuesto.title}</h3>
          <div className={styles.scenarioScroll}>
            <p className={styles.scenarioBody}>{supuesto.scenario}</p>
          </div>
        </aside>

        <main className={styles.qPanel}>
          <div className={styles.qHeader}>
            <span className={styles.qNum}>Pregunta {index + 1} de {totalQ}</span>
            <div className={styles.qBar}><div className={styles.qBarFill} style={{ width: `${((index+1)/totalQ)*100}%` }} /></div>
          </div>

          <p className={styles.qText}>{q?.question}</p>

          <div className={styles.qOptions}>
            {q?.options.map((opt, i) => {
              let state = 'idle'
              if (answered) {
                if (i === q.answer)           state = 'correct'
                else if (i === answers[index]) state = 'wrong'
              } else if (i === answers[index]) state = 'selected'
              return (
                <button key={i}
                  className={[styles.qOpt, styles[`qOpt_${state}`]].join(' ')}
                  onClick={() => !answered && handleAnswer(i)}
                  disabled={answered}
                >
                  <span className={styles.qLetter}>{LETTERS[i]}</span>
                  <span className={styles.qOptText}>{opt}</span>
                  {answered && i === q.answer            && <Check size={14} className={styles.iconCheck} />}
                  {answered && i === answers[index] && i !== q.answer && <X size={14} className={styles.iconX} />}
                </button>
              )
            })}
          </div>

          {answered && <RichFeedback question={q} selectedIndex={answers[index]} styles={styles} />}

          <div className={styles.qNav}>
            <button className={styles.qNavBtn} disabled={index === 0} onClick={() => setIndex(i => i - 1)}>
              <ChevronLeft size={14} /> Anterior
            </button>
            {index < totalQ - 1 ? (
              <button className={styles.qNavBtn} onClick={() => setIndex(i => i + 1)}>
                Siguiente <ChevronRight size={14} />
              </button>
            ) : (
              <button className={[styles.qNavBtn, styles.qNavBtnFinish].join(' ')} onClick={() => setFinished(true)}>
                Finalizar <CheckCircle size={14} />
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
