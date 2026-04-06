import { Check, X, BookOpen, Loader2 } from 'lucide-react'
import { useAiExplanation } from '../../hooks/useAiExplanation'
import type { Question } from '../../types'
import styles from './QuestionCard.module.css'

const LETTERS = ['A', 'B', 'C', 'D']

interface FeedbackWrongProps {
  question:      string
  options:       string[]
  answer:        number
  selectedIndex: number
  explanation:   string | null
}

function FeedbackWrong({ question, options, answer, selectedIndex, explanation }: FeedbackWrongProps) {
  const { explText, isAi, loading, error } = useAiExplanation({
    wasWrong:   true,
    staticExpl: explanation,
  })

  return (
    <>
      <div className={styles.feedbackHeader}>
        <div className={styles.feedbackIconWrap}>
          <X size={14} strokeWidth={2.5} />
        </div>
        <div>
          <p className={styles.feedbackTitle}>Respuesta incorrecta</p>
          <p className={styles.feedbackSub}>
            Marcaste: <strong>{LETTERS[selectedIndex]}. {options[selectedIndex]}</strong>
          </p>
        </div>
      </div>

      <div className={styles.correctCallout}>
        <div className={styles.correctCalloutLabel}>
          <Check size={12} strokeWidth={2.5} /> Respuesta correcta
        </div>
        <p className={styles.correctCalloutText}>
          <strong>{LETTERS[answer]}.</strong> {options[answer]}
        </p>
      </div>

      <div className={styles.explBox}>
        <div className={styles.explBoxLabel}>
          <BookOpen size={12} strokeWidth={2} />
          {loading ? 'Generando explicación…' : '¿Por qué?'}
          {isAi && !loading && <span className={styles.aiTag}>IA</span>}
        </div>
        {loading ? (
          <div className={styles.loadingRow}>
            <Loader2 size={14} className={styles.spinner} />
            <span className={styles.loadingText}>Analizando la pregunta…</span>
          </div>
        ) : error ? (
          <p className={styles.errorText}>No se pudo conectar. Repasa esta pregunta en el temario.</p>
        ) : explText ? (
          <p className={styles.explBoxText}>{explText}</p>
        ) : null}
      </div>
    </>
  )
}

interface QuestionCardProps {
  question:      Question
  onAnswer:      (idx: number) => void
  answered:      boolean
  selectedIndex: number | undefined
}

export default function QuestionCard({ question, onAnswer, answered, selectedIndex }: QuestionCardProps) {
  const { question: text, options, answer, explanation } = question
  const opts     = options as string[]
  const wasWrong = answered && selectedIndex !== undefined && selectedIndex !== answer

  return (
    <div className={styles.card}>
      <p className={styles.questionText}>{text}</p>

      <div className={styles.options}>
        {opts.map((opt, i) => {
          let state = 'idle'
          if (answered) {
            if (i === answer)              state = 'correct'
            else if (i === selectedIndex)  state = 'wrong'
          } else if (i === selectedIndex)  state = 'selected'

          return (
            <button
              key={i}
              className={[styles.option, styles[`option_${state}`]].join(' ')}
              onClick={() => !answered && onAnswer(i)}
              disabled={answered}
            >
              <span className={styles.optLetter}>{LETTERS[i]}</span>
              <span className={styles.optText}>{opt}</span>
              {answered && i === answer                          && <Check size={15} strokeWidth={2.5} className={styles.iconCheck} />}
              {answered && i === selectedIndex && i !== answer  && <X     size={15} strokeWidth={2.5} className={styles.iconX}     />}
            </button>
          )
        })}
      </div>

      {answered && (
        <div className={[styles.feedback, wasWrong ? styles.feedbackWrong : styles.feedbackCorrect].join(' ')}>
          {wasWrong && selectedIndex !== undefined ? (
            <FeedbackWrong
              question={text}
              options={opts}
              answer={answer}
              selectedIndex={selectedIndex}
              explanation={explanation}
            />
          ) : (
            <div className={styles.feedbackHeader}>
              <div className={styles.feedbackIconWrapOk}>
                <Check size={14} strokeWidth={2.5} />
              </div>
              <div>
                <p className={styles.feedbackTitle}>¡Correcto!</p>
                {explanation && <p className={styles.feedbackExplShort}>{explanation}</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
