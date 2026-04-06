import { useState, useEffect, useCallback } from 'react'
import { RotateCcw, ThumbsUp, RefreshCw, Home as HomeIcon, Eye, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Question } from '../../types'
import styles from './Flashcard.module.css'

const LETTERS = ['A', 'B', 'C', 'D']

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

interface BlockInfo {
  label: string
  color: string
}

interface FlashcardProps {
  academyId:  string | null | undefined
  subjectId:  string | null | undefined
  onGoHome:   () => void
}

export default function Flashcard({ academyId, subjectId, onGoHome }: FlashcardProps) {
  const [deck,    setDeck]    = useState<Question[]>([])
  const [blocks,  setBlocks]  = useState<Record<string, BlockInfo>>({})
  const [loading, setLoading] = useState(true)
  const [index,   setIndex]   = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known,   setKnown]   = useState(0)
  const [review,  setReview]  = useState(0)
  const [done,    setDone]    = useState(false)

  useEffect(() => {
    if (!academyId) return

    const load = async () => {
      setLoading(true)

      let qQuery = supabase
        .from('questions')
        .select('id, block_id, question, options, answer, explanation, academy_id, subject_id, topic_id, difficulty, category')
        .eq('academy_id', academyId)

      if (subjectId) qQuery = qQuery.eq('subject_id', subjectId)

      const { data: qData } = await qQuery

      let bQuery = supabase
        .from('content_blocks')
        .select('id, label, color')
        .eq('academy_id', academyId)

      if (subjectId) bQuery = bQuery.eq('subject_id', subjectId)

      const { data: bData } = await bQuery

      const blocksMap: Record<string, BlockInfo> = {}
      for (const b of (bData ?? [])) {
        blocksMap[b.id] = { label: b.label, color: b.color }
      }

      setBlocks(blocksMap)
      setDeck(shuffle((qData ?? []) as Question[]))
      setLoading(false)
    }

    load()
  }, [academyId, subjectId])

  const current = deck[index]
  const block   = current?.block_id ? blocks[current.block_id] : null

  const next = useCallback((knew: boolean) => {
    if (knew) setKnown(k => k + 1); else setReview(r => r + 1)
    if (index >= deck.length - 1) { setDone(true); return }
    setIndex(i => i + 1); setFlipped(false)
  }, [index, deck.length])

  const restart = useCallback(() => {
    setDeck(prev => shuffle([...prev]))
    setIndex(0)
    setFlipped(false)
    setKnown(0)
    setReview(0)
    setDone(false)
  }, [])

  if (loading) return (
    <div className={styles.center}>
      <div style={{ textAlign: 'center' }}>
        <Loader2 size={28} strokeWidth={1.5} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
        <p style={{ marginTop: '1rem', color: 'var(--ink-muted)', fontSize: '0.88rem' }}>Cargando flashcards…</p>
      </div>
    </div>
  )

  if (!loading && deck.length === 0) return (
    <div className={styles.center}>
      <div className={styles.doneCard}>
        <h2 className={styles.doneTitle}>Sin preguntas disponibles</h2>
        <div className={styles.doneActions}>
          <button className={[styles.doneBtn, styles.doneBtnGhost].join(' ')} onClick={onGoHome}>
            <HomeIcon size={15} /> Inicio
          </button>
        </div>
      </div>
    </div>
  )

  if (done) return (
    <div className={styles.center}>
      <div className={styles.doneCard}>
        <RotateCcw size={28} strokeWidth={1.5} className={styles.doneIcon} />
        <h2 className={styles.doneTitle}>Mazo completado</h2>
        <div className={styles.doneLine}>
          <span className={styles.doneGreen}>{known}</span> correctas · <span className={styles.doneRed}>{review}</span> a repasar
        </div>
        <div className={styles.doneActions}>
          <button className={styles.doneBtn} onClick={restart}>
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
          <div className={styles.front}>
            {block && (
              <span className={styles.blockTag} style={block.color ? { background: block.color + '18', color: block.color } : {}}>
                {block.label}
              </span>
            )}
            <p className={styles.question}>{current?.question}</p>
            <div className={styles.flipHint}><Eye size={13} /> Toca para ver respuesta</div>
          </div>
          <div className={styles.back}>
            <span className={styles.correctLabel}>Respuesta correcta</span>
            <p className={styles.answer}>
              {current ? `${LETTERS[current.answer]}. ${(current.options as string[])[current.answer]}` : ''}
            </p>
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
