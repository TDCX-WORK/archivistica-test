import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Clock, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle,
  Loader2, GraduationCap, X, Check, Home as HomeIcon, RotateCcw
} from 'lucide-react'
import { supabase }    from '../../lib/supabase'
import QuestionCard    from '../Question/QuestionCard'
import ProgressBar     from '../Progress/ProgressBar'
import type { Question, WrongAnswer, ExamConfig, Supuesto, SupuestoQuestion } from '../../types'
import styles from './SimulacroRunner.module.css'

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

const LETTERS = ['A', 'B', 'C', 'D']

// ── Helpers ────────────────────────────────────────────────────────────────
function scoreColor(s: number): string {
  if (s >= 80) return '#059669'
  if (s >= 60) return '#0891B2'
  if (s >= 40) return '#D97706'
  return '#DC2626'
}

function formatTime(secs: number): string {
  const m = String(Math.floor(secs / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return `${m}:${s}`
}

// ── Pantalla intermedia entre parte 1 y parte 2 ───────────────────────────
function PantallaIntermedia({
  correct, total, penalty, onContinuar
}: {
  correct: number
  total:   number
  penalty: boolean
  onContinuar: () => void
}) {
  const score = total > 0 ? Math.round((correct / total) * 100) : 0
  const color = scoreColor(score)

  return (
    <div className={styles.intermediaWrap}>
      <div className={styles.intermediaCard}>
        <div className={styles.intermediaIcon} style={{ color }}>
          <GraduationCap size={40} strokeWidth={1.5} />
        </div>
        <h2 className={styles.intermediaTitle}>Parte 1 completada</h2>
        <p className={styles.intermediaSub}>Test de teoría — {total} preguntas</p>

        <div className={styles.intermediaScore} style={{ color }}>
          <span className={styles.intermediaNum}>{correct}</span>
          <span className={styles.intermediaDen}>/ {total}</span>
        </div>
        <p className={styles.intermediaPct} style={{ color }}>{score}/100 puntos</p>
        {penalty && (
          <p className={styles.intermediaNote}>Penalización aplicada: −0,25 por respuesta incorrecta</p>
        )}

        <div className={styles.intermediaDivider} />

        <p className={styles.intermediaNext}>
          A continuación realizarás el <strong>supuesto práctico</strong>.
          Lee el caso con atención antes de responder.
        </p>

        <button className={styles.intermediaBtn} onClick={onContinuar}>
          Continuar con el supuesto <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ── Pantalla de resultados finales ────────────────────────────────────────
interface ResultadosFinalesProps {
  parte1: { correct: number; total: number; durationSecs: number; penalty: boolean }
  parte2: { correct: number; total: number; durationSecs: number; supuestoTitle: string }
  onGoHome:  () => void
  onRepeat:  () => void
}

function CircleGauge({ pct, color }: { pct: number; color: string }) {
  const size = 120, stroke = 10, r = (size - stroke) / 2, circ = 2 * Math.PI * r
  return (
    <div className={styles.gaugeWrap}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${(pct/100)*circ} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      </svg>
      <div className={styles.gaugePct}>
        <span className={styles.gaugeNum}>{pct}</span>
        <span className={styles.gaugePctLbl}>%</span>
      </div>
    </div>
  )
}

function ResultadosFinales({ parte1, parte2, onGoHome, onRepeat }: ResultadosFinalesProps) {
  const score1 = parte1.total > 0 ? Math.round((parte1.correct / parte1.total) * 100) : 0
  const score2 = parte2.total > 0 ? Math.round((parte2.correct / parte2.total) * 100) : 0
  // Nota global: parte1 vale 30 puntos máx (necesitas 10 para aprobar), parte2 vale 10 puntos por supuesto
  // Simplificamos: media ponderada 60% test + 40% supuesto
  const scoreGlobal = Math.round(score1 * 0.6 + score2 * 0.4)
  const colorGlobal = scoreColor(scoreGlobal)

  const aprobado = score1 >= 33 // mínimo ~10/30 puntos en la parte 1

  return (
    <div className={styles.resultadosWrap}>
      <div className={styles.resultadosCard}>
        <div className={styles.resultadosHeader}>
          <GraduationCap size={28} strokeWidth={1.5} style={{ color: colorGlobal }} />
          <h2 className={styles.resultadosTitle}>Simulacro completado</h2>
        </div>

        <CircleGauge pct={scoreGlobal} color={colorGlobal} />

        <div className={styles.resultadosVeredicto} style={{
          color: aprobado ? '#059669' : '#DC2626',
          background: aprobado ? '#ECFDF5' : '#FEF2F2'
        }}>
          {aprobado ? '✓ Apto — Parte 1 superada' : '✗ No apto — Parte 1 no superada'}
        </div>

        <div className={styles.resultadosPartes}>
          <div className={styles.resultadosParte}>
            <div className={styles.resultadosParteHeader}>
              <span className={styles.resultadosParteNum}>Parte 1</span>
              <span className={styles.resultadosParteTitulo}>Test de teoría</span>
            </div>
            <div className={styles.resultadosParteStats}>
              <span className={styles.resultadosParteStat}>
                <Check size={13} style={{ color: '#059669' }} /> {parte1.correct} correctas
              </span>
              <span className={styles.resultadosParteStat}>
                <X size={13} style={{ color: '#DC2626' }} /> {parte1.total - parte1.correct} errores
              </span>
              <span className={styles.resultadosParteStat}>
                <Clock size={13} /> {formatTime(parte1.durationSecs)}
              </span>
            </div>
            <div className={styles.resultadosParteNota} style={{ color: scoreColor(score1) }}>
              {score1}/100
            </div>
          </div>

          <div className={styles.resultadosParte}>
            <div className={styles.resultadosParteHeader}>
              <span className={styles.resultadosParteNum}>Parte 2</span>
              <span className={styles.resultadosPparteTitulo}>{parte2.supuestoTitle}</span>
            </div>
            <div className={styles.resultadosParteStats}>
              <span className={styles.resultadosParteStat}>
                <Check size={13} style={{ color: '#059669' }} /> {parte2.correct} correctas
              </span>
              <span className={styles.resultadosParteStat}>
                <X size={13} style={{ color: '#DC2626' }} /> {parte2.total - parte2.correct} errores
              </span>
              <span className={styles.resultadosParteStat}>
                <Clock size={13} /> {formatTime(parte2.durationSecs)}
              </span>
            </div>
            <div className={styles.resultadosParteNota} style={{ color: scoreColor(score2) }}>
              {score2}/100
            </div>
          </div>
        </div>

        <div className={styles.resultadosActions}>
          <button className={styles.btnHome} onClick={onGoHome}>
            <HomeIcon size={15} /> Inicio
          </button>
          <button className={styles.btnRepeat} onClick={onRepeat}>
            <RotateCcw size={15} /> Repetir
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Fase 2: Supuesto práctico ─────────────────────────────────────────────
interface Fase2Props {
  supuesto:   Supuesto
  onFinish:   (answers: Record<number, number>, durationSecs: number) => void
}

function Fase2({ supuesto, onFinish }: Fase2Props) {
  const questions   = (supuesto.questions ?? []) as SupuestoQuestion[]
  const [index,     setIndex]   = useState(0)
  const [answers,   setAnswers] = useState<Record<number, number>>({})
  const [answered,  setAnswered] = useState(false)
  const startRef    = useRef(Date.now())
  const answersRef  = useRef(answers)
  useEffect(() => { answersRef.current = answers }, [answers])

  const current = questions[index]

  const handleAnswer = useCallback((optIdx: number) => {
    if (answered) return
    setAnswers(prev => ({ ...prev, [index]: optIdx }))
    setAnswered(true)
  }, [index, answered])

  const handleNext = () => {
    if (index < questions.length - 1) {
      setIndex(i => i + 1)
      setAnswered(false)
    } else {
      const elapsed = Math.round((Date.now() - startRef.current) / 1000)
      onFinish(answersRef.current, elapsed)
    }
  }

  if (!current) return null

  const opts = current.options as string[]
  const isLast = index === questions.length - 1

  return (
    <div className={styles.fase2Wrap}>
      <div className={styles.fase2Header}>
        <div className={styles.fase2Badge}>
          <GraduationCap size={14} /> Parte 2 — Supuesto práctico
        </div>
        <div className={styles.fase2Progress}>
          {index + 1} / {questions.length}
        </div>
      </div>

      {supuesto.scenario && (
        <div className={styles.fase2Scenario}>
          <div className={styles.fase2ScenarioTitle}>Supuesto</div>
          <p className={styles.fase2ScenarioText}>{supuesto.scenario}</p>
        </div>
      )}

      <div className={styles.fase2Question}>
        <p className={styles.fase2QuestionNum}>Pregunta {index + 1}</p>
        <p className={styles.fase2QuestionText}>{current.question}</p>
        <div className={styles.fase2Options}>
          {opts.map((opt, i) => {
            let state = 'idle'
            if (answered) {
              if (i === current.answer)           state = 'correct'
              else if (i === answers[index])      state = 'wrong'
            } else if (i === answers[index])      state = 'selected'
            return (
              <button key={i}
                className={[styles.fase2Option, styles[`fase2Option_${state}`]].join(' ')}
                onClick={() => handleAnswer(i)}
                disabled={answered}
              >
                <span className={styles.fase2OptLetter}>{LETTERS[i]}</span>
                <span className={styles.fase2OptText}>{opt}</span>
                {answered && i === current.answer         && <Check size={14} className={styles.iconCheck} />}
                {answered && i === answers[index] && i !== current.answer && <X size={14} className={styles.iconX} />}
              </button>
            )
          })}
        </div>

        {answered && current.explanation && (
          <div className={styles.fase2Expl}>
            <span className={styles.fase2ExplLabel}>Explicación</span>
            <p>{current.explanation}</p>
          </div>
        )}

        {answered && (
          <button className={styles.fase2NextBtn} onClick={handleNext}>
            {isLast ? <><CheckCircle size={15} /> Finalizar simulacro</> : <>Siguiente <ChevronRight size={15} /></>}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────
interface SimulacroRunnerProps {
  examConfig:            ExamConfig
  academyId:             string | null | undefined
  subjectId:             string | null | undefined
  userId?:               string | null
  onGoHome:              () => void
  onRecordSession:       (modeId: string, correct: number, total: number, elapsed: number) => void
  onRecordWrong:         (questionId: string, blockId: string | null) => void
  onRecordCorrectReview: (questionId: string) => void
  wrongAnswers?:         WrongAnswer[]
}

type Phase = 'intro' | 'fase1' | 'intermedia' | 'fase2' | 'resultados'

export default function SimulacroRunner({
  examConfig, academyId, subjectId, userId,
  onGoHome, onRecordSession, onRecordWrong, onRecordCorrectReview,
  wrongAnswers = [],
}: SimulacroRunnerProps) {
  const [phase,       setPhase]     = useState<Phase>('intro')
  const [questions,   setQuestions] = useState<Question[]>([])
  const [supuesto,    setSupuesto]  = useState<Supuesto | null>(null)
  const [loading,     setLoading]   = useState(true)
  const [index,       setIndex]     = useState(0)
  const [answers,     setAnswers]   = useState<Record<number, number>>({})
  const [secsLeft,    setSecsLeft]  = useState(examConfig.test_minutes * 60)

  // Resultados acumulados
  const [parte1Result, setParte1Result] = useState<{ correct: number; total: number; durationSecs: number } | null>(null)

  const startTimeRef = useRef(Date.now())
  const answersRef   = useRef(answers)
  useEffect(() => { answersRef.current = answers }, [answers])

  // Cargar preguntas y supuesto
  useEffect(() => {
    if (!academyId) return
    const load = async () => {
      setLoading(true)

      // Cargar preguntas para la parte 1
      let q = supabase.from('questions').select('*').eq('academy_id', academyId)
      if (subjectId) q = q.eq('subject_id', subjectId)
      const { data: qData } = await q

      const shuffled = shuffle((qData ?? []) as Question[]).slice(0, examConfig.test_questions)
      setQuestions(shuffled)

      // Cargar supuesto aleatorio para la parte 2
      let sq = supabase.from('supuestos')
        .select('id, slug, title, subtitle, scenario, position, supuesto_questions(id, question, options, answer, explanation, position)')
        .eq('academy_id', academyId)
      if (subjectId) sq = sq.eq('subject_id', subjectId)
      const { data: supData } = await sq

      if (supData && supData.length > 0) {
        type RawSup = Omit<Supuesto, 'questions'> & {
          supuesto_questions: SupuestoQuestion[]
        }
        const randomSup = shuffle(supData as RawSup[])[0]!
        const supuesto: Supuesto = {
          ...randomSup,
          questions: (randomSup.supuesto_questions ?? [])
            .sort((a, b) => a.position - b.position)
        }
        setSupuesto(supuesto)
      }

      setLoading(false)
    }
    load()
  }, [academyId, subjectId, examConfig.test_questions])

  // Timer fase 1
  useEffect(() => {
    if (phase !== 'fase1') return
    if (secsLeft <= 0) { handleFinishFase1(); return }
    const id = setInterval(() => setSecsLeft(s => s - 1), 1000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, secsLeft])

  const current  = questions[index]
  const answered = index in answers
  const qCount   = questions.length
  const urgent   = secsLeft < 120

  const handleAnswer = useCallback((optIdx: number) => {
    setAnswers(prev => ({ ...prev, [index]: optIdx }))
    const q = questions[index]
    if (!q) return
    const isCorrect = optIdx === q.answer
    const isInWrong = wrongAnswers.some(w => w.question_id === q.id)
    if (!isCorrect) onRecordWrong(q.id, q.block_id ?? null)
    else if (isCorrect && isInWrong) onRecordCorrectReview(q.id)
  }, [index, questions, wrongAnswers, onRecordWrong, onRecordCorrectReview])

  const handleFinishFase1 = useCallback(() => {
    const snap    = answersRef.current
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
    const correctCount  = Object.entries(snap).filter(([i, a]) => questions[Number(i)]?.answer === a).length
    const wrongCount    = Object.entries(snap).filter(([i, a]) => questions[Number(i)]?.answer !== a).length
    const answered      = Object.keys(snap).length
    const effectiveCorrect = examConfig.test_penalty
      ? Math.max(0, Math.round((correctCount - wrongCount * 0.25) * 10) / 10)
      : correctCount

    // Record session for fase 1
    onRecordSession('simulacro_test', Math.round(effectiveCorrect), answered, elapsed)

    setParte1Result({ correct: Math.round(effectiveCorrect), total: answered, durationSecs: elapsed })
    setPhase('intermedia')
  }, [questions, examConfig.test_penalty, onRecordSession])

  const handleFinishFase2 = useCallback((fase2Answers: Record<number, number>, durationSecs: number) => {
    if (!supuesto) return
    const questions2 = (supuesto.questions ?? []) as SupuestoQuestion[]
    const correct2   = Object.entries(fase2Answers).filter(([i, a]) => questions2[Number(i)]?.answer === a).length
    const total2     = Object.keys(fase2Answers).length

    // Record session for fase 2
    onRecordSession('simulacro_supuesto', correct2, total2, durationSecs)

    setPhase('resultados')
    // Store fase2 result in ref for display
    fase2ResultRef.current = { correct: correct2, total: total2, durationSecs, supuestoTitle: supuesto.title }
  }, [supuesto, onRecordSession])

  const fase2ResultRef = useRef<{ correct: number; total: number; durationSecs: number; supuestoTitle: string } | null>(null)

  const handleRepeat = () => {
    setPhase('intro')
    setIndex(0)
    setAnswers({})
    setSecsLeft(examConfig.test_minutes * 60)
    setParte1Result(null)
    fase2ResultRef.current = null
    startTimeRef.current = Date.now()
    // Reload questions with new shuffle
    if (academyId) {
      setLoading(true)
      const load = async () => {
        let q = supabase.from('questions').select('*').eq('academy_id', academyId)
        if (subjectId) q = q.eq('subject_id', subjectId)
        const { data: qData } = await q
        setQuestions(shuffle((qData ?? []) as Question[]).slice(0, examConfig.test_questions))

        let sq = supabase.from('supuestos')
          .select('id, slug, title, subtitle, scenario, position, supuesto_questions(id, question, options, answer, explanation, position)')
          .eq('academy_id', academyId)
        if (subjectId) sq = sq.eq('subject_id', subjectId)
        const { data: supData } = await sq
        if (supData && supData.length > 0) {
          type RawSup = Omit<Supuesto, 'questions'> & { supuesto_questions: SupuestoQuestion[] }
          const randomSup = shuffle(supData as RawSup[])[0]!
          setSupuesto({ ...randomSup, questions: (randomSup.supuesto_questions ?? []).sort((a, b) => a.position - b.position) })
        }
        setLoading(false)
      }
      load()
    }
  }

  // ── Renders ──────────────────────────────────────────────────────────────

  if (loading) return (
    <div className={styles.loading}>
      <Loader2 size={28} strokeWidth={1.5} style={{ animation: 'spin 1s linear infinite' }} />
      <p>Preparando el simulacro…</p>
    </div>
  )

  if (phase === 'intro') return (
    <div className={styles.intro}>
      <div className={styles.introCard}>
        <div className={styles.introIcon}><GraduationCap size={36} strokeWidth={1.4} /></div>
        <h2 className={styles.introTitle}>Simulacro Oficial</h2>
        <p className={styles.introSub}>Formato examen real — dos partes en una sesión</p>
        <div className={styles.introPartes}>
          <div className={styles.introParte}>
            <div className={styles.introParteNum}>Parte 1</div>
            <div className={styles.introParteTitulo}>Test de teoría</div>
            <div className={styles.introParteMeta}>
              <span><Clock size={12} /> {examConfig.test_minutes} min</span>
              <span>· {examConfig.test_questions} preguntas</span>
              {examConfig.test_penalty && <span style={{ color: '#DC2626' }}>· −0,25 por error</span>}
            </div>
          </div>
          <div className={styles.introSep}>+</div>
          <div className={styles.introParte}>
            <div className={styles.introParteNum}>Parte 2</div>
            <div className={styles.introParteTitulo}>Supuesto práctico</div>
            <div className={styles.introParteMeta}>
              <span>· {(supuesto?.questions ?? []).length} preguntas</span>
              <span>· Sin penalización</span>
            </div>
          </div>
        </div>
        {!supuesto && (
          <div className={styles.introWarning}>
            <AlertTriangle size={14} /> No hay supuestos prácticos disponibles para esta asignatura
          </div>
        )}
        <button className={styles.introBtn} onClick={() => {
          startTimeRef.current = Date.now()
          setPhase('fase1')
        }}>
          Comenzar simulacro
        </button>
        <button className={styles.introCancelar} onClick={onGoHome}>Cancelar</button>
      </div>
    </div>
  )

  if (phase === 'intermedia' && parte1Result) return (
    <PantallaIntermedia
      correct={parte1Result.correct}
      total={parte1Result.total}
      penalty={examConfig.test_penalty}
      onContinuar={() => {
        startTimeRef.current = Date.now()
        setPhase('fase2')
      }}
    />
  )

  if (phase === 'fase2' && supuesto) return (
    <Fase2 supuesto={supuesto} onFinish={handleFinishFase2} />
  )

  if (phase === 'resultados' && parte1Result && fase2ResultRef.current) return (
    <ResultadosFinales
      parte1={{ ...parte1Result, penalty: examConfig.test_penalty }}
      parte2={fase2ResultRef.current}
      onGoHome={onGoHome}
      onRepeat={handleRepeat}
    />
  )

  // ── Fase 1: Test de teoría ────────────────────────────────────────────
  const mm     = String(Math.floor(secsLeft / 60)).padStart(2, '0')
  const ss     = String(secsLeft % 60).padStart(2, '0')

  return (
    <div className={styles.wrapper}>
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <span className={styles.faseTag}><GraduationCap size={12} /> Parte 1</span>
          <span className={styles.progressNum}>{index + 1}<span className={styles.progressSep}>/</span>{qCount}</span>
        </div>
        <ProgressBar current={index + 1} total={qCount} secsLeft={secsLeft} totalSecs={examConfig.test_minutes * 60} />
        <div className={[styles.timer, urgent ? styles.timerUrgent : ''].join(' ')}>
          <Clock size={14} strokeWidth={1.8} />
          <span>{mm}:{ss}</span>
        </div>
      </div>

      <div className={styles.main}>
        <div className={styles.questionNum}>
          Pregunta {index + 1} de {qCount}
          {examConfig.test_penalty && (
            <span className={styles.penaltyTag}>−0,25 por error</span>
          )}
        </div>
        {current && (
          <QuestionCard
            question={current}
            onAnswer={handleAnswer}
            answered={answered}
            selectedIndex={answers[index]}
          />
        )}
      </div>

      <div className={styles.nav}>
        <button className={styles.navBtn} onClick={() => setIndex(i => i - 1)} disabled={index === 0}>
          <ChevronLeft size={17} /> Anterior
        </button>
        <div className={styles.dotTrack}>
          {questions.map((_, i) => (
            <button key={i}
              className={[styles.dot, i === index ? styles.dotActive : '', i in answers ? styles.dotAnswered : ''].join(' ')}
              onClick={() => setIndex(i)} />
          ))}
        </div>
        {index < qCount - 1 ? (
          <button className={styles.navBtn} onClick={() => setIndex(i => i + 1)}>
            Siguiente <ChevronRight size={17} />
          </button>
        ) : (
          <button className={[styles.navBtn, styles.navBtnFinish].join(' ')} onClick={handleFinishFase1}>
            Finalizar parte 1 <CheckCircle size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
