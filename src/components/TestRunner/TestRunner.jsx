import { useState, useEffect, useCallback, useRef } from 'react'
import { Clock, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react'
import allQuestions from '../../data/questions.json'
import config       from '../../data/config.json'
import QuestionCard from '../Question/QuestionCard'
import ProgressBar  from '../Progress/ProgressBar'
import Results      from '../Results/Results'
import styles       from './TestRunner.module.css'

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5) }

// Bloques temáticos válidos (para detectar si modeId es un bloque)
const BLOCK_IDS = new Set(Object.keys(config.blocks))

// Obtener preguntas según el modo
function getQuestions(modeId, wrongAnswers = []) {
  // Modo: repasar preguntas pendientes hoy (spaced repetition)
  if (modeId === 'review_due') {
    const today = new Date().toISOString().slice(0, 10)
    const due   = wrongAnswers.filter(w => w.next_review <= today)
    const ids   = new Set(due.map(w => w.question_id))
    return shuffle(allQuestions.filter(q => ids.has(q.id)))
  }

  // Modo: todos los fallos
  if (modeId === 'all_fails') {
    const ids = new Set(wrongAnswers.map(w => w.question_id))
    return shuffle(allQuestions.filter(q => ids.has(q.id)))
  }

  // Modo: practicar un bloque temático (viene desde StudyView)
  if (BLOCK_IDS.has(modeId)) {
    const blockQuestions = allQuestions.filter(q => q.block === modeId)
    return shuffle(blockQuestions).slice(0, Math.min(20, blockQuestions.length))
  }

  // Modos normales
  const mode = config.modes[modeId]
  if (!mode) return []
  return shuffle(allQuestions).slice(0, mode.questions)
}

function getModeLabel(modeId) {
  if (modeId === 'review_due') return 'Repasar hoy'
  if (modeId === 'all_fails')  return 'Todos mis fallos'
  if (BLOCK_IDS.has(modeId))   return config.blocks[modeId]?.label || modeId
  return config.modes[modeId]?.label || modeId
}

function getModeTime(modeId) {
  if (modeId === 'review_due' || modeId === 'all_fails') return null
  if (BLOCK_IDS.has(modeId)) return 25 * 60
  return (config.modes[modeId]?.timeMinutes || 25) * 60
}

export default function TestRunner({ modeId, onGoHome, onRecordSession, onRecordWrong, onRecordCorrectReview, wrongAnswers = [] }) {
  const totalSecs = getModeTime(modeId)
  const isFailMode = modeId === 'review_due' || modeId === 'all_fails'

  const [phase,     setPhase]     = useState('intro')
  const [questions]               = useState(() => getQuestions(modeId, wrongAnswers))
  const [index,     setIndex]     = useState(0)
  const [answers,   setAnswers]   = useState({})
  const [secsLeft,  setSecsLeft]  = useState(totalSecs)
  const startTimeRef              = useRef(Date.now())
  const answersRef                = useRef(answers)

  useEffect(() => { answersRef.current = answers }, [answers])

  // Timer (solo en modos con tiempo)
  useEffect(() => {
    if (phase !== 'running' || !totalSecs) return
    if (secsLeft <= 0) { handleFinish(); return }
    const id = setInterval(() => setSecsLeft(s => s - 1), 1000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, secsLeft, totalSecs])

  const qCount   = questions.length
  const current  = questions[index]
  const answered = index in answers

  const handleAnswer = useCallback((optIdx) => {
    setAnswers(prev => ({ ...prev, [index]: optIdx }))

    const q         = questions[index]
    const isCorrect = optIdx === q.answer
    const isInWrong = wrongAnswers.some(w => w.question_id === q.id)

    if (!isCorrect) {
      // Registrar fallo
      onRecordWrong?.(q.id, q.block)
    } else if (isCorrect && isInWrong) {
      // Acertó una pregunta que tenía en fallos → actualizar spaced repetition
      onRecordCorrectReview?.(q.id)
    }
  }, [index, questions, wrongAnswers, onRecordWrong, onRecordCorrectReview])

  const handleFinish = useCallback(() => {
    const snap    = answersRef.current
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
    const correct = Object.entries(snap).filter(([i, a]) => questions[Number(i)]?.answer === a).length
    onRecordSession(modeId, correct, Object.keys(snap).length, elapsed)
    setPhase('finished')
  }, [questions, modeId, onRecordSession])

  const handleRepeat = useCallback(() => {
    setPhase('intro')
    setIndex(0)
    setAnswers({})
    setSecsLeft(totalSecs)
    startTimeRef.current = Date.now()
  }, [totalSecs])

  // Sin preguntas disponibles en modo fallos
  if (phase === 'intro' && isFailMode && qCount === 0) return (
    <div className={styles.intro}>
      <div className={styles.introCard}>
        <div className={styles.introIcon}><AlertTriangle size={28} strokeWidth={1.5} /></div>
        <h2 className={styles.introTitle}>Sin preguntas pendientes</h2>
        <p className={styles.introDesc}>
          {modeId === 'review_due'
            ? 'No tienes preguntas pendientes de repaso hoy. ¡Vuelve mañana!'
            : 'Aún no tienes fallos registrados. Completa un test primero.'}
        </p>
        <button className={styles.startBtn} onClick={onGoHome}>Volver al inicio</button>
      </div>
    </div>
  )

  if (phase === 'intro') return (
    <div className={styles.intro}>
      <div className={styles.introCard}>
        <div className={styles.introIcon}>
          {isFailMode
            ? <AlertTriangle size={28} strokeWidth={1.5} style={{ color: 'var(--danger)' }} />
            : <CheckCircle   size={28} strokeWidth={1.5} />}
        </div>
        <h2 className={styles.introTitle}>{getModeLabel(modeId)}</h2>
        <p className={styles.introDesc}>
          {modeId === 'review_due' && 'Preguntas que necesitas repasar según tu ritmo de aprendizaje.'}
          {modeId === 'all_fails'  && 'Practica con todas las preguntas que has fallado anteriormente.'}
          {BLOCK_IDS.has(modeId)   && `Practica con preguntas del bloque: ${config.blocks[modeId]?.label}.`}
          {!isFailMode && !BLOCK_IDS.has(modeId) && config.modes[modeId]?.description}
        </p>
        <div className={styles.introMeta}>
          {totalSecs && <span><Clock size={14} /> {config.modes[modeId]?.timeMinutes} minutos</span>}
          {totalSecs && <span>·</span>}
          <span>{qCount} pregunta{qCount !== 1 ? 's' : ''}</span>
          {isFailMode && <span>· Sin límite de tiempo</span>}
        </div>
        <button className={styles.startBtn} onClick={() => {
          startTimeRef.current = Date.now()
          setPhase('running')
        }}>
          Comenzar
        </button>
      </div>
    </div>
  )

  if (phase === 'finished') return (
    <Results
      questions={questions}
      answers={answers}
      onGoHome={onGoHome}
      onRepeat={handleRepeat}
      durationSecs={Math.round((Date.now() - startTimeRef.current) / 1000)}
    />
  )

  const mm     = totalSecs ? String(Math.floor(secsLeft / 60)).padStart(2, '0') : null
  const ss     = totalSecs ? String(secsLeft % 60).padStart(2, '0') : null
  const urgent = totalSecs && secsLeft < 120

  return (
    <div className={styles.wrapper}>
      <div className={styles.topBar}>
        <div className={styles.progress}>
          <span className={styles.progressNum}>{index + 1}</span>
          <span className={styles.progressSep}>/</span>
          <span className={styles.progressTotal}>{qCount}</span>
        </div>
        <ProgressBar current={index + 1} total={qCount} secsLeft={secsLeft} totalSecs={totalSecs} />
        {totalSecs ? (
          <div className={[styles.timer, urgent ? styles.timerUrgent : ''].join(' ')}>
            <Clock size={14} strokeWidth={1.8} />
            <span className={styles.timerText}>{mm}:{ss}</span>
          </div>
        ) : (
          <div className={styles.timer}>
            <AlertTriangle size={13} strokeWidth={1.8} style={{ color: 'var(--danger)' }} />
            <span className={styles.timerText} style={{ color: 'var(--danger)', fontSize: '0.72rem' }}>Fallos</span>
          </div>
        )}
      </div>

      <div className={styles.main}>
        <div className={styles.questionNum}>
          Pregunta {index + 1} de {qCount}
          {current?.block && config.blocks[current.block] && (
            <span className={styles.blockTag}>{config.blocks[current.block].label}</span>
          )}
        </div>
        <QuestionCard
          question={current}
          onAnswer={handleAnswer}
          answered={answered}
          selectedIndex={answers[index]}
        />
      </div>

      <div className={styles.nav}>
        <button
          className={styles.navBtn}
          onClick={() => setIndex(i => i - 1)}
          disabled={index === 0}
        >
          <ChevronLeft size={17} /> Anterior
        </button>

        <div className={styles.dotTrack}>
          {questions.map((_, i) => (
            <button
              key={i}
              className={[
                styles.dot,
                i === index   ? styles.dotActive   : '',
                i in answers  ? styles.dotAnswered : ''
              ].join(' ')}
              onClick={() => setIndex(i)}
              title={`Pregunta ${i + 1}`}
            />
          ))}
        </div>

        {index < qCount - 1 ? (
          <button className={styles.navBtn} onClick={() => setIndex(i => i + 1)}>
            Siguiente <ChevronRight size={17} />
          </button>
        ) : (
          <button
            className={[styles.navBtn, styles.navBtnFinish].join(' ')}
            onClick={handleFinish}
          >
            Finalizar <CheckCircle size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
