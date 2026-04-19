import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, FileText } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { CurrentUser } from '../../../types'
import styles from './BancoSupuestos.module.css'

const LETRAS_SUP = ['A', 'B', 'C', 'D']

interface SupuestoQuestion {
  id: string; question: string; options: string[]; answer: number; explanation: string | null; position: number
}

interface Supuesto {
  id: string; title: string; subtitle: string | null; scenario: string | null; position: number; questions: SupuestoQuestion[]
}

function SupuestoCard({ supuesto }: { supuesto: Supuesto }) {
  const [abierto, setAbierto]       = useState(false)
  const [pregAbierta, setPregAbierta] = useState<string | null>(null)

  return (
    <div className={styles.supCard}>
      <button className={styles.supHeader} onClick={() => setAbierto(v => !v)}>
        <div className={styles.supHeaderLeft}>
          <span className={styles.supTitle}>{supuesto.title}</span>
          {supuesto.subtitle && <span className={styles.supSubtitle}>{supuesto.subtitle}</span>}
        </div>
        <div className={styles.supHeaderRight}>
          <span className={styles.supCount}>{supuesto.questions.length} preguntas</span>
          {abierto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {abierto && (
        <div className={styles.supBody}>
          {supuesto.scenario && (
            <div className={styles.supEscenario}>
              <div className={styles.supEscenarioLabel}>Enunciado</div>
              <p>{supuesto.scenario}</p>
            </div>
          )}

          <div className={styles.supPregLista}>
            {supuesto.questions.map((q, idx) => (
              <div key={q.id} className={styles.supPregItem}>
                <button className={styles.supPregHead} onClick={() => setPregAbierta(p => p === q.id ? null : q.id)}>
                  <span className={styles.supPregNum}>{idx + 1}</span>
                  <span className={styles.supPregTexto}>{q.question}</span>
                  {pregAbierta === q.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {pregAbierta === q.id && (
                  <div className={styles.supPregDetalle}>
                    {q.options.map((opt, i) => (
                      <div key={i} className={[styles.supOpcion, i === q.answer ? styles.supOpcionCorrecta : ''].join(' ')}>
                        <span className={styles.supOpcionLetra}>{LETRAS_SUP[i]}</span>
                        <span className={styles.supOpcionTexto}>{opt}</span>
                        {i === q.answer && <span className={styles.supOpcionBadge}>✓</span>}
                      </div>
                    ))}
                    {q.explanation && <p className={styles.supExplicacion}>{q.explanation}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface BancoSupuestosProps {
  currentUser: CurrentUser | null
}

export default function BancoSupuestos({ currentUser }: BancoSupuestosProps) {
  const [supuestos, setSupuestos] = useState<Supuesto[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    const aid = currentUser?.academy_id
    const sid = currentUser?.subject_id
    if (!aid) return

    const load = async () => {
      setLoading(true)
      let q = supabase
        .from('supuestos')
        .select('id, title, subtitle, scenario, position, supuesto_questions(id, question, options, answer, explanation, position)')
        .eq('academy_id', aid)
        .order('position')
      if (sid) q = q.eq('subject_id', sid)
      const { data } = await q

      type RawSupQ = { id: string; question: string; options: string[]; answer: number; explanation: string | null; position: number }
      type RawSup  = { id: string; title: string; subtitle: string | null; scenario: string | null; position: number; supuesto_questions: RawSupQ[] }

      const mapped = ((data ?? []) as RawSup[]).map(s => ({
        id:        s.id,
        title:     s.title,
        subtitle:  s.subtitle ?? null,
        scenario:  s.scenario ?? null,
        position:  s.position,
        questions: (s.supuesto_questions ?? [])
          .sort((a, b) => a.position - b.position)
          .map(q => ({
            id:          q.id,
            question:    q.question,
            options:     Array.isArray(q.options) ? q.options : [],
            answer:      q.answer,
            explanation: q.explanation ?? null,
            position:    q.position,
          })),
      }))
      setSupuestos(mapped)
      setLoading(false)
    }
    load()
  }, [currentUser?.academy_id, currentUser?.subject_id])

  if (loading) return (
    <div className={styles.loading}>
      <div className={styles.spinner} />
      <p>Cargando supuestos…</p>
    </div>
  )

  if (!supuestos.length) return (
    <div className={styles.empty}>
      <FileText size={32} strokeWidth={1.2} />
      <p>No hay supuestos prácticos para esta asignatura.</p>
    </div>
  )

  return (
    <div className={styles.supLista}>
      {supuestos.map(s => <SupuestoCard key={s.id} supuesto={s} />)}
    </div>
  )
}
