import { useState, useEffect } from 'react'
import { AlertTriangle, RefreshCw, BookOpen, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import styles from './FallosClase.module.css'

export default function FallosClase({ currentUser }) {
  const [fallos,   setFallos]   = useState([])
  const [bloques,  setBloques]  = useState({})
  const [pregs,    setPregs]    = useState({})
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [expanded, setExpanded] = useState(null)

  const academyId = currentUser?.academy_id

  useEffect(() => {
    if (!academyId) return
    const load = async () => {
      setLoading(true)
      setError(null)

      // 1. Fallos agregados por pregunta
      const { data: fallosData, error: fErr } = await supabase
        .rpc('get_class_wrong_answers', { p_academy_id: academyId })

      if (fErr) { setError(`Error: ${fErr.message}`); setLoading(false); return }
      if (!fallosData?.length) { setFallos([]); setLoading(false); return }

      // 2. Buscar preguntas por original_id (integer = wrong_answers.question_id)
      const qIds = fallosData.map(f => Number(f.question_id))

      const { data: pregData, error: pErr } = await supabase
        .from('questions')
        .select('id, original_id, question, options, answer, explanation, block_id')
        .eq('academy_id', academyId)
        .in('original_id', qIds)

      if (pErr) { setError(`Error preguntas: ${pErr.message}`); setLoading(false); return }

      // Mapa por original_id
      const pregsMap = {}
      for (const q of pregData || []) {
        if (q.original_id !== null && q.original_id !== undefined) {
          pregsMap[q.original_id]         = q
          pregsMap[String(q.original_id)] = q
          pregsMap[Number(q.original_id)] = q
        }
      }

      // 3. Bloques
      const blockIds = [...new Set((pregData || []).map(q => q.block_id).filter(Boolean))]
      let bloquesMap = {}
      if (blockIds.length > 0) {
        const { data: blks } = await supabase
          .from('content_blocks')
          .select('id, label, color')
          .in('id', blockIds)
        for (const b of blks || []) bloquesMap[b.id] = b
      }

      setFallos(fallosData)
      setPregs(pregsMap)
      setBloques(bloquesMap)
      setLoading(false)
    }
    load()
  }, [academyId])

  if (loading) return (
    <div className={styles.state}><RefreshCw size={22} className={styles.spinner} /><p>Analizando fallos de la clase…</p></div>
  )
  if (error) return (
    <div className={styles.state}><AlertTriangle size={22} /><p>{error}</p></div>
  )
  if (!fallos.length) return (
    <div className={styles.state}><TrendingDown size={36} strokeWidth={1.2} /><p>Ningún alumno ha fallado preguntas todavía.</p></div>
  )

  const getQ   = (id) => pregs[id] || pregs[Number(id)] || pregs[String(id)]
  const maxPct = Math.max(...fallos.map(f => parseFloat(f.pct_fallo) || 0), 1)

  // Agrupar por bloque
  const porBloque = {}
  for (const f of fallos) {
    const q   = getQ(f.question_id)
    const blk = q?.block_id || '__sin_bloque__'
    if (!porBloque[blk]) porBloque[blk] = []
    porBloque[blk].push({ ...f, pregunta: q, bloque: bloques[blk] })
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Preguntas más falladas</h1>
        <p className={styles.pageSubtitle}>Analizando {fallos.length} preguntas · ordenadas por fallos acumulados</p>
      </div>

      {/* Top 5 */}
      <div className={styles.topCard}>
        <h3 className={styles.sectionTitle}>Top 5 — Mayor porcentaje de fallo</h3>
        <div className={styles.topList}>
          {fallos.slice(0, 5).map((f, i) => {
            const q        = getQ(f.question_id)
            const blk      = q ? bloques[q.block_id] : null
            const pct      = parseFloat(f.pct_fallo) || 0
            const barColor = pct > 60 ? '#DC2626' : pct > 40 ? '#B45309' : '#0891B2'
            return (
              <div key={f.question_id} className={styles.topItem}>
                <div className={styles.topRank} style={{
                  background: i === 0 ? '#DC2626' : i < 3 ? '#B45309' : 'var(--surface-dim)',
                  color: i < 3 ? 'white' : 'var(--ink)'
                }}>{i + 1}</div>
                <div className={styles.topBody}>
                  {blk && <span className={styles.topBloque} style={{ color: blk.color }}>{blk.label}</span>}
                  <span className={styles.topPregunta}>{q?.question || `Pregunta #${f.question_id}`}</span>
                  <div className={styles.topBarRow}>
                    <div className={styles.topBarTrack}>
                      <div className={styles.topBarFill} style={{ width: `${pct}%`, background: barColor }} />
                    </div>
                    <span className={styles.topPct} style={{ color: barColor }}>{pct}% la falla</span>
                  </div>
                </div>
                <div className={styles.topMeta}>
                  <span className={styles.topFails}>{f.total_fails}</span>
                  <span className={styles.topFailsLabel}>fallos</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Por bloque */}
      {Object.entries(porBloque).map(([blockId, items]) => {
        const blk    = bloques[blockId]
        const isOpen = expanded === blockId
        return (
          <div key={blockId} className={styles.bloqueCard}>
            <button className={styles.bloqueHeader} onClick={() => setExpanded(isOpen ? null : blockId)}>
              <div className={styles.bloqueLeft}>
                <div className={styles.bloqueColor} style={{ background: blk?.color || '#888' }} />
                <span className={styles.bloqueLabel}>{blk?.label || 'Preguntas sin bloque'}</span>
                <span className={styles.bloqueCount}>{items.length} pregunta{items.length !== 1 ? 's' : ''}</span>
              </div>
              {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {isOpen && (
              <div className={styles.bloqueBody}>
                {items.map(item => {
                  const pct      = parseFloat(item.pct_fallo) || 0
                  const opts     = item.pregunta?.options || []
                  const ans      = item.pregunta?.answer ?? -1
                  const barColor = pct > 60 ? '#DC2626' : pct > 40 ? '#B45309' : '#0891B2'
                  return (
                    <div key={item.question_id} className={styles.pregCard}>
                      <div className={styles.pregHeader}>
                        <span className={styles.pregTexto}>{item.pregunta?.question || `Pregunta #${item.question_id}`}</span>
                        <div className={styles.pregStats}>
                          <span className={styles.pregPct} style={{ color: barColor }}>{pct}%</span>
                          <span className={styles.pregAlumnos}>{item.total_alumnos} alumnos</span>
                        </div>
                      </div>
                      <div className={styles.pregBarra}>
                        <div className={styles.pregBarraFill} style={{ width: `${(pct / maxPct) * 100}%`, background: barColor }} />
                      </div>
                      {opts.length > 0 && (
                        <div className={styles.pregOpciones}>
                          {opts.map((opt, oi) => (
                            <div key={oi} className={[styles.pregOpcion, oi === ans ? styles.pregOpcionCorrecta : ''].join(' ')}>
                              <span className={styles.pregOpcionLetra}>{['A','B','C','D'][oi]}</span>
                              <span>{opt}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {item.pregunta?.explanation && (
                        <div className={styles.pregExplicacion}>
                          <BookOpen size={12} /><span>{item.pregunta.explanation}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
