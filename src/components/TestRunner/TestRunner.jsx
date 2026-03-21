import { useState, useEffect, useCallback, useRef } from 'react'
import { Clock, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import config       from '../../data/config.json'
import QuestionCard from '../Question/QuestionCard'
import ProgressBar  from '../Progress/ProgressBar'
import Results      from '../Results/Results'
import styles       from './TestRunner.module.css'

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5) }

const BLOCK_IDS = new Set(Object.keys(config.blocks))

async function fetchQuestions(modeId, academyId, wrongAnswers = [], subjectId = null) {
  if (!academyId) return []

  // Modos de repaso — filtran por IDs de preguntas ya falladas
  if (modeId === 'review_due') {
    const today = new Date().toISOString().slice(0, 10)
    const due   = wrongAnswers.filter(w => w.next_review <= today)
    if (!due.length) return []
    // wrong_answers guarda question_id como INT (el id original del JSON)
    // Ahora necesitamos buscar por ese id numérico en la columna category o por UUID
    // Usamos la tabla questions filtrando por academy_id — los ids numéricos los guardamos en category
    const ids = due.map(w => w.question_id)
    let q = supabase.from('questions').select('*').eq('academy_id', academyId).in('id', ids)
    if (subjectId) q = q.eq('subject_id', subjectId)
    const { data } = await q
    return shuffle(data || [])
  }

  if (modeId === 'all_fails') {
    if (!wrongAnswers.length) return []
    const ids = wrongAnswers.map(w => w.question_id)
    let q = supabase.from('questions').select('*').eq('academy_id', academyId).in('id', ids)
    if (subjectId) q = q.eq('subject_id', subjectId)
    const { data } = await q
    return shuffle(data || [])
  }

  // Modo bloque temático (viene desde StudyView — modeId es el UUID del bloque)
  if (modeId && modeId.includes('-') && !config.modes[modeId]) {
    let q = supabase.from('questions').select('*').eq('academy_id', academyId).eq('block_id', modeId)
    if (subjectId) q = q.eq('subject_id', subjectId)
    const { data } = await q
    return shuffle(data || []).slice(0, 20)
  }

  // Modos normales del config (beginner, advanced, exam, supuesto_N...)
  const mode = config.modes[modeId]
  if (!mode) return []

  let query = supabase
    .from('questions')
    .select('*')
    .eq('academy_id', academyId)

  if (subjectId) {
    query = query.eq('subject_id', subjectId)
  }

  if (mode.practical) {
    query = query.or('difficulty.eq.practical,category.eq.gestion,category.eq.descripcion')
  }

  const { data } = await query
  return shuffle(data || []).slice(0, mode.questions)
}

function getModeLabel(modeId) {
  if (modeId === 'review_due') return 'Repasar hoy'
  if (modeId === 'all_fails')  return 'Todos mis fallos'
  if (BLOCK_IDS.has(modeId))   return config.blocks[modeId]?.label || modeId
  if (modeId && modeId.includes('-') && !config.modes[modeId]) return modeLabel || 'Practicar bloque'
  return config.modes[modeId]?.label || 'Test'
}

function getModeTime(modeId) {
  if (modeId === 'review_due' || modeId === 'all_fails') return null
  if (BLOCK_IDS.has(modeId)) return 25 * 60
  return (config.modes[modeId]?.timeMinutes || 25) * 60
}

export default function TestRunner({ modeId, modeLabel, academyId, subjectId, onGoHome, onRecordSession, onRecordWrong, onRecordCorrectReview, wrongAnswers = [], penalizacion = false }) {
  const totalSecs  = getModeTime(modeId)
  const isFailMode = modeId === 'review_due' || modeId === 'all_fails'

  const [phase,     setPhase]     = useState('intro')
  const [questions, setQuestions] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [index,     setIndex]     = useState(0)
  const [answers,   setAnswers]   = useState({})
  const [secsLeft,  setSecsLeft]  = useState(totalSecs)
  const startTimeRef              = useRef(Date.now())
  const answersRef                = useRef(answers)

  useEffect(() => { answersRef.current = answers }, [answers])

  // Cargar preguntas al montar
  useEffect(() => {
    if (!academyId) return
    setLoading(true)
    fetchQuestions(modeId, academyId, wrongAnswers, subjectId).then(qs => {
      setQuestions(qs)
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeId, academyId, subjectId])

  // Timer
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
      onRecordWrong?.(q.id, q.category || q.block_id)
    } else if (isCorrect && isInWrong) {
      onRecordCorrectReview?.(q.id)
    }
  }, [index, questions, wrongAnswers, onRecordWrong, onRecordCorrectReview])

  const handleFinish = useCallback(() => {
    const snap    = answersRef.current
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
    const correct  = Object.entries(snap).filter(([i, a]) => questions[Number(i)]?.answer === a).length
    const wrong    = Object.entries(snap).filter(([i, a]) => questions[Number(i)]?.answer !== a).length
    const answeredCount = Object.keys(snap).length
    const effectiveCorrect = penalizacion
      ? Math.max(0, correct - wrong * 0.25)
      : correct
    onRecordSession(modeId, effectiveCorrect, answeredCount, elapsed)
    setPhase('finished')
  }, [questions, modeId, onRecordSession, penalizacion])

  const handleRepeat = useCallback(() => {
    setPhase('intro')
    setIndex(0)
    setAnswers({})
    setSecsLeft(totalSecs)
    startTimeRef.current = Date.now()
    // Recargar preguntas mezcladas
    setLoading(true)
    fetchQuestions(modeId, academyId, wrongAnswers, subjectId).then(qs => {
      setQuestions(qs)
      setLoading(false)
    })
  }, [totalSecs, modeId, academyId, subjectId, wrongAnswers])

  // Estado de carga inicial
  if (loading) return (
    <div className={styles.intro}>
      <div className={styles.introCard}>
        <Loader2 size={28} strokeWidth={1.5} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '1rem', color: 'var(--ink-light)' }}>Cargando preguntas…</p>
      </div>
    </div>
  )

  // Sin preguntas en modo fallos
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
          {!isFailMode && (config.modes[modeId]?.description || `${qCount} preguntas`)}
        </p>
        <div className={styles.introMeta}>
          {totalSecs && <span><Clock size={14} /> {config.modes[modeId]?.timeMinutes} minutos</span>}
          {totalSecs && <span>·</span>}
          <span>{qCount} pregunta{qCount !== 1 ? 's' : ''}</span>
          {isFailMode && <span>· Sin límite de tiempo</span>}
          {penalizacion && <span>· <span style={{color:'var(--danger)',fontWeight:700}}>−0.25 por fallo</span></span>}
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
          {current?.category && config.blocks[current.category] && (
            <span className={styles.blockTag}>{config.blocks[current.category].label}</span>
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
