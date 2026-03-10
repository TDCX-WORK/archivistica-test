import { useState, useCallback } from 'react'
import { RotateCcw, ThumbsUp, RefreshCw, Home as HomeIcon, Eye } from 'lucide-react'
import allQuestions from '../../data/questions.json'
import config from '../../data/config.json'
import styles from './Flashcard.module.css'

const LETTERS = ['A','B','C','D']

export default function Flashcard({ onGoHome }) {
  const [deck]    = useState(() => [...allQuestions].sort(() => Math.random() - 0.5))
  const [index,   setIndex]   = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known,   setKnown]   = useState(0)
  const [review,  setReview]  = useState(0)
  const [done,    setDone]    = useState(false)

  const current = deck[index]
  const block   = current ? config.blocks[current.block] : null

  const next = useCallback((knew) => {
    if (knew) setKnown(k => k + 1); else setReview(r => r + 1)
    if (index >= deck.length - 1) { setDone(true); return }
    setIndex(i => i + 1); setFlipped(false)
  }, [index, deck.length])

  if (done) return (
    <div className={styles.center}>
      <div className={styles.doneCard}>
        <RotateCcw size={28} strokeWidth={1.5} className={styles.doneIcon} />
        <h2 className={styles.doneTitle}>Mazo completado</h2>
        <div className={styles.doneLine}><span className={styles.doneGreen}>{known}</span> correctas · <span className={styles.doneRed}>{review}</span> a repasar</div>
        <div className={styles.doneActions}>
          <button className={styles.doneBtn} onClick={() => { setIndex(0); setFlipped(false); setKnown(0); setReview(0); setDone(false) }}>
            <RefreshCw size={15} /> Repetir
          </button>
          <button className={[styles.doneBtn, styles.doneBtnGhost].join(' ')} onClick={onGoHome}>
            <HomeIcon size={15} /> Inicio
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className={styles.wrapper}>
      <div className={styles.topBar}>
        <span className={styles.progress}>{index + 1} / {deck.length}</span>
        <div className={styles.scores}>
          <span className={styles.scoreGreen}><ThumbsUp size={12} /> {known}</span>
          <span className={styles.scoreRed}><RefreshCw size={12} /> {review}</span>
        </div>
        <button className={styles.exitBtn} onClick={onGoHome}><HomeIcon size={15} /></button>
      </div>

      <div className={styles.barWrap}>
        <div className={styles.barFill} style={{ width: `${(index / deck.length) * 100}%` }} />
      </div>

      <div
        className={[styles.card, flipped ? styles.flipped : ''].join(' ')}
        onClick={() => setFlipped(f => !f)}
      >
        <div className={styles.inner}>
          {/* FRONT */}
          <div className={styles.front}>
            {block && <span className={styles.blockTag}>{block.label}</span>}
            <p className={styles.question}>{current?.question}</p>
            <div className={styles.flipHint}><Eye size={13} /> Toca para ver respuesta</div>
          </div>
          {/* BACK */}
          <div className={styles.back}>
            <span className={styles.correctLabel}>Respuesta correcta</span>
            <p className={styles.answer}>{LETTERS[current?.answer]}. {current?.options[current?.answer]}</p>
            {current?.explanation && <p className={styles.expl}>{current.explanation}</p>}
          </div>
        </div>
      </div>

      {flipped ? (
        <div className={styles.actions}>
          <button className={styles.btnReview} onClick={() => next(false)}>
            <RefreshCw size={16} /> Repasar
          </button>
          <button className={styles.btnKnow} onClick={() => next(true)}>
            <ThumbsUp size={16} /> Lo sé
          </button>
        </div>
      ) : (
        <p className={styles.hint}>Toca la tarjeta para revelar la respuesta</p>
      )}
    </div>
  )
}
