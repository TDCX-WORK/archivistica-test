import { useState, useEffect, useCallback, useRef } from 'react'
import { Clock, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'
import allQuestions from '../../data/questions.json'
import config       from '../../data/config.json'
import QuestionCard from '../Question/QuestionCard'
import ProgressBar  from '../Progress/ProgressBar'
import Results      from '../Results/Results'
import styles       from './TestRunner.module.css'

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5) }

export default function TestRunner({ modeId, onGoHome, onRecordSession }) {
  const mode      = config.modes[modeId]
  const totalSecs = (mode?.timeMinutes || 25) * 60
  const qCount    = mode?.questions || 20

  const [phase,     setPhase]     = useState('intro')
  const [questions]               = useState(() => shuffle(allQuestions).slice(0, qCount))
  const [index,     setIndex]     = useState(0)
  const [answers,   setAnswers]   = useState({})
  const [secsLeft,  setSecsLeft]  = useState(totalSecs)
  const startTimeRef              = useRef(Date.now())

  // FIX 4: keep answers in a ref so finishTest always sees latest value
  const answersRef = useRef(answers)
  useEffect(() => { answersRef.current = answers }, [answers])

  // Timer
  useEffect(() => {
    if (phase !== 'running') return
    if (secsLeft <= 0) { handleFinish(); return }
    const id = setInterval(() => setSecsLeft(s => s - 1), 1000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, secsLeft])

  const current  = questions[index]
  const answered = index in answers

  const handleAnswer = useCallback((optIdx) => {
    setAnswers(prev => ({ ...prev, [index]: optIdx }))
  }, [index])

  // FIX 4: read from ref — never stale
  const handleFinish = useCallback(() => {
    const snap    = answersRef.current
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
    const correct = Object.entries(snap).filter(([i, a]) => questions[Number(i)]?.answer === a).length
    onRecordSession(modeId, correct, Object.keys(snap).length, elapsed)
    setPhase('finished')
  }, [questions, modeId, onRecordSession])

  // FIX 5: repeat resets internal state instead of reload
  const handleRepeat = useCallback(() => {
    setPhase('intro')
    setIndex(0)
    setAnswers({})
    setSecsLeft(totalSecs)
    startTimeRef.current = Date.now()
  }, [totalSecs])

  if (phase === 'intro') return (
    <div className={styles.intro}>
      <div className={styles.introCard}>
        <div className={styles.introIcon}><CheckCircle size={28} strokeWidth={1.5} /></div>
        <h2 className={styles.introTitle}>{mode?.label}</h2>
        <p className={styles.introDesc}>{mode?.description}</p>
        <div className={styles.introMeta}>
          <span><Clock size={14} /> {mode?.timeMinutes} minutos</span>
          <span>·</span>
          <span>{qCount} preguntas</span>
        </div>
        <button className={styles.startBtn} onClick={() => {
          startTimeRef.current = Date.now()
          setPhase('running')
        }}>
          Comenzar test
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

  const mm     = String(Math.floor(secsLeft / 60)).padStart(2, '0')
  const ss     = String(secsLeft % 60).padStart(2, '0')
  const urgent = secsLeft < 120

  return (
    <div className={styles.wrapper}>
      <div className={styles.topBar}>
        <div className={styles.progress}>
          <span className={styles.progressNum}>{index + 1}</span>
          <span className={styles.progressSep}>/</span>
          <span className={styles.progressTotal}>{qCount}</span>
        </div>
        <ProgressBar current={index + 1} total={qCount} secsLeft={secsLeft} totalSecs={totalSecs} />
        <div className={[styles.timer, urgent ? styles.timerUrgent : ''].join(' ')}>
          <Clock size={14} strokeWidth={1.8} />
          <span className={styles.timerText}>{mm}:{ss}</span>
        </div>
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
