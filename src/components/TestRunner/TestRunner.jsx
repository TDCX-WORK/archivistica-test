import { useState, useEffect, useCallback, useRef } from 'react'
import { Clock, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Loader2, Zap } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import config       from '../../data/config.json'
import QuestionCard from '../Question/QuestionCard'
import ProgressBar  from '../Progress/ProgressBar'
import Results      from '../Results/Results'
import styles       from './TestRunner.module.css'

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5) }

function isUUID(id) { return id && id.includes('-') && !config.modes[id] }

async function fetchQuestions(modeId, academyId, wrongAnswers = [], subjectId = null, topicId = null) {
  if (!academyId) return { questions: [], fromTopic: false }

  // ── Repaso expres: 5 preguntas pendientes hoy ──────────────────────────
  if (modeId === 'quick_review') {
    const today = new Date().toISOString().slice(0, 10)
    const due   = wrongAnswers.filter(w => w.next_review <= today)
    if (!due.length) return { questions: [], fromTopic: false }
    const ids = shuffle(due).slice(0, 5).map(w => w.question_id)
    let q = supabase.from('questions').select('*').eq('academy_id', academyId).in('id', ids)
    if (subjectId) q = q.eq('subject_id', subjectId)
    const { data } = await q
    return { questions: shuffle(data || []), fromTopic: false }
  }

  // ── Repasar hoy: todas las pendientes ─────────────────────────────────
  if (modeId === 'review_due') {
    const today = new Date().toISOString().slice(0, 10)
    const due   = wrongAnswers.filter(w => w.next_review <= today)
    if (!due.length) return { questions: [], fromTopic: false }
    const ids = due.map(w => w.question_id)
    let q = supabase.from('questions').select('*').eq('academy_id', academyId).in('id', ids)
    if (subjectId) q = q.eq('subject_id', subjectId)
    const { data } = await q
    return { questions: shuffle(data || []), fromTopic: false }
  }

  if (modeId === 'all_fails') {
    if (!wrongAnswers.length) return { questions: [], fromTopic: false }
    const ids = wrongAnswers.map(w => w.question_id)
    let q = supabase.from('questions').select('*').eq('academy_id', academyId).in('id', ids)
    if (subjectId) q = q.eq('subject_id', subjectId)
    const { data } = await q
    return { questions: shuffle(data || []), fromTopic: false }
  }

  // Modo bloque tematico (UUID)
  if (isUUID(modeId)) {
    if (topicId) {
      let tq = supabase.from('questions').select('*').eq('academy_id', academyId).eq('topic_id', topicId)
      if (subjectId) tq = tq.eq('subject_id', subjectId)
      const { data: topicData } = await tq

      if (topicData && topicData.length >= 5) {
        return { questions: shuffle(topicData).slice(0, 20), fromTopic: true }
      }

      const topicQuestionIds = new Set((topicData || []).map(q => q.id))
      let bq = supabase.from('questions').select('*').eq('academy_id', academyId).eq('block_id', modeId)
      if (subjectId) bq = bq.eq('subject_id', subjectId)
      const { data: blockData } = await bq

      const blockExtras = (blockData || []).filter(q => !topicQuestionIds.has(q.id))
      const combined = [...(topicData || []), ...shuffle(blockExtras)]
      return { questions: combined.slice(0, 20), fromTopic: (topicData || []).length > 0 }
    }

    let q = supabase.from('questions').select('*').eq('academy_id', academyId).eq('block_id', modeId)
    if (subjectId) q = q.eq('subject_id', subjectId)
    const { data } = await q
    return { questions: shuffle(data || []).slice(0, 20), fromTopic: false }
  }

  // Modos normales del config (beginner, advanced, exam)
  const mode = config.modes[modeId]
  if (!mode) return { questions: [], fromTopic: false }

  let query = supabase.from('questions').select('*').eq('academy_id', academyId)
  if (subjectId) query = query.eq('subject_id', subjectId)
  const { data } = await query
  return { questions: shuffle(data || []).slice(0, mode.questions), fromTopic: false }
}

export default function TestRunner({ modeId, modeLabel, topicId, topicLabel, academyId, subjectId, onGoHome, onRecordSession, onRecordWrong, onRecordCorrectReview, wrongAnswers = [], penalizacion = false }) {

  const isQuickReview = modeId === 'quick_review'
  const isFailMode    = modeId === 'review_due' || modeId === 'all_fails' || isQuickReview
  const isBlockMode   = isUUID(modeId)
  const isTopicMode   = isBlockMode && !!topicId

  const resolvedLabel = isQuickReview
    ? 'Repaso Exprés'
    : isFailMode
      ? (modeId === 'review_due' ? 'Repasar hoy' : 'Todos mis fallos')
      : isTopicMode
        ? (topicLabel || modeLabel || 'Practicar tema')
        : isBlockMode
          ? (modeLabel || 'Practicar bloque')
          : (config.modes[modeId]?.label || 'Test')

  const totalSecs   = isFailMode ? null : isBlockMode ? 25 * 60 : (config.modes[modeId]?.timeMinutes || 25) * 60
  const timeMinutes = isBlockMode ? 25 : config.modes[modeId]?.timeMinutes

  const [blockMap,   setBlockMap]   = useState({})
  const [phase,      setPhase]      = useState(isQuickReview ? 'running' : 'intro')
  const [questions,  setQuestions]  = useState([])
  const [fromTopic,  setFromTopic]  = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [index,      setIndex]      = useState(0)
  const [answers,    setAnswers]    = useState({})
  const [secsLeft,   setSecsLeft]   = useState(totalSecs)
  const startTimeRef                = useRef(Date.now())
  const answersRef                  = useRef(answers)

  useEffect(() => { answersRef.current = answers }, [answers])

  useEffect(() => {
    if (!academyId) return
    const load = async () => {
      let q = supabase.from('content_blocks').select('id, label, color').eq('academy_id', academyId)
      if (subjectId) q = q.eq('subject_id', subjectId)
      const { data } = await q
      const map = {}
      for (const b of (data || [])) map[b.id] = { label: b.label, color: b.color }
      setBlockMap(map)
    }
    load()
  }, [academyId, subjectId])

  useEffect(() => {
    if (!academyId) return
    setLoading(true)
    fetchQuestions(modeId, academyId, wrongAnswers, subjectId, topicId).then(result => {
      setQuestions(result.questions)
      setFromTopic(result.fromTopic)
      setLoading(false)
      // Repaso expres: arrancar directamente sin intro
      if (isQuickReview) {
        startTimeRef.current = Date.now()
        setPhase('running')
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeId, academyId, subjectId, topicId])

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

  const currentBlockTag = current?.block_id && blockMap[current.block_id]
    ? blockMap[current.block_id].label
    : null

  const handleAnswer = useCallback((optIdx) => {
    setAnswers(prev => ({ ...prev, [index]: optIdx }))
    const q         = questions[index]
    const isCorrect = optIdx === q.answer
    const isInWrong = wrongAnswers.some(w => w.question_id === q.id)
    if (!isCorrect) onRecordWrong?.(q.id, q.block_id)
    else if (isCorrect && isInWrong) onRecordCorrectReview?.(q.id)

    // Repaso expres: avanzar automaticamente tras responder
    if (isQuickReview) {
      setTimeout(() => {
        if (index < questions.length - 1) {
          setIndex(i => i + 1)
        } else {
          handleFinish()
        }
      }, 600)
    }
  }, [index, questions, wrongAnswers, onRecordWrong, onRecordCorrectReview, isQuickReview])

  const handleFinish = useCallback(() => {
    const snap    = answersRef.current
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
    const correct  = Object.entries(snap).filter(([i, a]) => questions[Number(i)]?.answer === a).length
    const wrong    = Object.entries(snap).filter(([i, a]) => questions[Number(i)]?.answer !== a).length
    const answeredCount = Object.keys(snap).length
    const effectiveCorrect = penalizacion ? Math.max(0, correct - wrong * 0.25) : correct
    onRecordSession(modeId, effectiveCorrect, answeredCount, elapsed)
    setPhase('finished')
  }, [questions, modeId, onRecordSession, penalizacion])

  const handleRepeat = useCallback(() => {
    setPhase(isQuickReview ? 'running' : 'intro')
    setIndex(0)
    setAnswers({})
    setSecsLeft(totalSecs)
    startTimeRef.current = Date.now()
    setLoading(true)
    fetchQuestions(modeId, academyId, wrongAnswers, subjectId, topicId).then(result => {
      setQuestions(result.questions)
      setFromTopic(result.fromTopic)
      setLoading(false)
    })
  }, [totalSecs, modeId, academyId, subjectId, topicId, wrongAnswers, isQuickReview])

  if (loading) return (
    <div className={styles.intro}>
      <div className={styles.introCard}>
        <Loader2 size={28} strokeWidth={1.5} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '1rem', color: 'var(--ink-light)' }}>Cargando preguntas…</p>
      </div>
    </div>
  )

  if (phase === 'intro' && qCount === 0) return (
    <div className={styles.intro}>
      <div className={styles.introCard}>
        <div className={styles.introIcon}><AlertTriangle size={28} strokeWidth={1.5} /></div>
        <h2 className={styles.introTitle}>
          {isFailMode ? 'Sin preguntas pendientes' : 'Sin preguntas disponibles'}
        </h2>
        <p className={styles.introDesc}>
          {modeId === 'review_due' ? 'No tienes preguntas pendientes de repaso hoy. ¡Vuelve mañana!'
            : modeId === 'all_fails' ? 'Aún no tienes fallos registrados. Completa un test primero.'
            : isTopicMode ? 'Este tema aún no tiene preguntas de tipo test disponibles.'
            : 'Este bloque aún no tiene preguntas disponibles.'}
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
        <h2 className={styles.introTitle}>{resolvedLabel}</h2>
        <p className={styles.introDesc}>
          {modeId === 'review_due' && 'Preguntas que necesitas repasar según tu ritmo de aprendizaje.'}
          {modeId === 'all_fails'  && 'Practica con todas las preguntas que has fallado anteriormente.'}
          {isTopicMode && fromTopic && 'Preguntas específicas del tema'}
          {isTopicMode && !fromTopic && 'Preguntas del bloque que incluye este tema'}
          {isBlockMode && !isTopicMode && `Preguntas del bloque "${modeLabel || 'seleccionado'}"`}
          {!isFailMode && !isBlockMode && (config.modes[modeId]?.description || `${qCount} preguntas`)}
        </p>
        <div className={styles.introMeta}>
          {totalSecs && <span><Clock size={14} /> {timeMinutes} minutos</span>}
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
    <Results questions={questions} answers={answers} onGoHome={onGoHome}
      onRepeat={handleRepeat}
      durationSecs={Math.round((Date.now() - startTimeRef.current) / 1000)}
      academyId={academyId}
      subjectId={subjectId}
      onRecordWrong={onRecordWrong}
      wrongAnswers={wrongAnswers} />
  )

  const mm     = totalSecs ? String(Math.floor(secsLeft / 60)).padStart(2, '0') : null
  const ss     = totalSecs ? String(secsLeft % 60).padStart(2, '0') : null
  const urgent = totalSecs && secsLeft < 120

  return (
    <div className={styles.wrapper}>
      {/* Barra de progreso */}
      <div className={styles.topBar}>
        <div className={styles.progress}>
          <span className={styles.progressNum}>{index + 1}</span>
          <span className={styles.progressSep}>/</span>
          <span className={styles.progressTotal}>{qCount}</span>
        </div>
        <ProgressBar current={index + 1} total={qCount} secsLeft={secsLeft} totalSecs={totalSecs} />
        {isQuickReview ? (
          <div className={styles.timer} style={{ color: '#D97706' }}>
            <Zap size={14} strokeWidth={1.8} />
            <span className={styles.timerText} style={{ color: '#D97706' }}>Exprés</span>
          </div>
        ) : totalSecs ? (
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
          {currentBlockTag && <span className={styles.blockTag}>{currentBlockTag}</span>}
          {isQuickReview && <span className={styles.blockTag} style={{ background: '#FFFBEB', color: '#D97706' }}>⚡ Exprés</span>}
        </div>
        <QuestionCard question={current} onAnswer={handleAnswer} answered={answered} selectedIndex={answers[index]} />
      </div>

      {/* Nav — en modo exprés no se muestra (avance automatico) */}
      {!isQuickReview && (
        <div className={styles.nav}>
          <button className={styles.navBtn} onClick={() => setIndex(i => i - 1)} disabled={index === 0}>
            <ChevronLeft size={17} /> Anterior
          </button>
          <div className={styles.dotTrack}>
            {questions.map((_, i) => (
              <button key={i}
                className={[styles.dot, i === index ? styles.dotActive : '', i in answers ? styles.dotAnswered : ''].join(' ')}
                onClick={() => setIndex(i)} title={`Pregunta ${i + 1}`} />
            ))}
          </div>
          {index < qCount - 1 ? (
            <button className={styles.navBtn} onClick={() => setIndex(i => i + 1)}>
              Siguiente <ChevronRight size={17} />
            </button>
          ) : (
            <button className={[styles.navBtn, styles.navBtnFinish].join(' ')} onClick={handleFinish}>
              Finalizar <CheckCircle size={16} />
            </button>
          )}
        </div>
      )}

      {/* En modo expres: boton finalizar si quiere salir antes */}
      {isQuickReview && (
        <div className={styles.nav} style={{ justifyContent: 'center' }}>
          <button className={[styles.navBtn, styles.navBtnFinish].join(' ')} onClick={handleFinish}>
            Finalizar <CheckCircle size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
