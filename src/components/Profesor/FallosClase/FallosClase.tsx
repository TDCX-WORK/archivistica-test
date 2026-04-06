import { useState, useEffect } from 'react'
import { AlertTriangle, RefreshCw, TrendingDown, ChevronDown, ChevronUp,
         BookOpen, Users, BarChart2, Layers } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { CurrentUser } from '../../../types'
import styles from './FallosClase.module.css'

function pctColor(pct: number): string {
  if (pct >= 60) return '#DC2626'
  if (pct >= 35) return '#D97706'
  return '#059669'
}
function pctBg(pct: number): string {
  if (pct >= 60) return '#FEF2F2'
  if (pct >= 35) return '#FFFBEB'
  return '#ECFDF5'
}
function pctLabel(pct: number): string {
  if (pct >= 60) return 'Crítico'
  if (pct >= 35) return 'Atención'
  return 'Bajo'
}

function PctBadge({ pct, size = 56 }: { pct: number; size?: number }) {
  const color = pctColor(pct), bg = pctBg(pct)
  const r = (size - 5) / 2, circ = 2 * Math.PI * r, fill = (pct / 100) * circ
  return (
    <div className={styles.pctBadge} style={{ width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ position: 'absolute', inset: 0 }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bg}    strokeWidth={5} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${fill} ${circ - fill}`} strokeDashoffset={circ / 4} strokeLinecap="round" />
      </svg>
      <span className={styles.pctNum} style={{ color, fontSize: size * 0.22 }}>{pct}%</span>
    </div>
  )
}

interface Bloque { id: string; label: string; color: string }
interface Pregunta { id: string; question: string; options: unknown; answer: number; explanation: string | null; block_id: string | null }

interface FalloItem {
  question_id:   string
  pct_fallo:     string | number
  total_fails:   string | number
  total_alumnos: string | number
  pregunta:      Pregunta | null
  bloque:        Bloque | null | undefined
}

function PreguntaCard({ item, rank }: { item: FalloItem; rank: number }) {
  const [open, setOpen] = useState(false)
  const q    = item.pregunta
  const pct  = Math.round(parseFloat(String(item.pct_fallo)) || 0)
  const color = pctColor(pct)
  const fails  = item.total_fails
  const alumnos = item.total_alumnos

  const opts = (() => {
    if (!q?.options) return []
    if (Array.isArray(q.options)) return q.options as string[]
    if (typeof q.options === 'object') return Object.values(q.options as Record<string, string>)
    return []
  })()

  return (
    <div className={[styles.pregCard, open ? styles.pregCardOpen : ''].join(' ')}>
      <button className={styles.pregBtn} onClick={() => setOpen(v => !v)}>
        <div className={styles.pregRank} style={{
          background: rank === 1 ? '#DC2626' : rank <= 3 ? '#D97706' : rank <= 5 ? '#FFFBEB' : 'var(--surface-dim)',
          color:      rank <= 3 ? 'white' : rank <= 5 ? '#D97706' : 'var(--ink-muted)',
        }}>
          {rank <= 3 ? ['🥇','🥈','🥉'][rank - 1] : rank}
        </div>
        <div className={styles.pregBody}>
          {item.bloque && (
            <span className={styles.pregBloqueChip} style={{ color: item.bloque.color, background: item.bloque.color + '18' }}>
              {item.bloque.label}
            </span>
          )}
          <p className={styles.pregTexto}>{q?.question ?? 'Pregunta sin texto'}</p>
          <div className={styles.pregMeta}>
            <span className={styles.pregMetaItem}><Users size={11} /> {alumnos} alumno{alumnos !== 1 ? 's' : ''} lo fallaron</span>
            <span className={styles.pregMetaItem}><BarChart2 size={11} /> {fails} fallos totales</span>
            <span className={styles.pregMetaLabel} style={{ color, background: pctBg(pct) }}>{pctLabel(pct)}</span>
          </div>
        </div>
        <PctBadge pct={pct} size={52} />
        <span className={styles.pregChevron}>{open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
      </button>

      {open && (
        <div className={styles.pregExpandido}>
          {opts.length > 0 && (
            <div className={styles.opcionesGrid}>
              {opts.map((opt, i) => {
                const correcto = i === q?.answer
                const texto    = typeof opt === 'object' ? JSON.stringify(opt) : String(opt)
                return (
                  <div key={i} className={[styles.opcion, correcto ? styles.opcionCorrecta : ''].join(' ')}>
                    <span className={styles.opcionLetra} style={correcto ? { background: '#059669', color: 'white' } : {}}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className={styles.opcionTexto}>{texto}</span>
                    {correcto && <span className={styles.opcionTag}>✓ Correcta</span>}
                  </div>
                )
              })}
            </div>
          )}
          {q?.explanation && (
            <div className={styles.explicacion}>
              <span className={styles.explicacionLabel}><BookOpen size={11} /> Explicación</span>
              <p>{q.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BloqueSection({ blockId, items, bloque, expanded, onToggle }: {
  blockId:  string
  items:    FalloItem[]
  bloque:   Bloque | undefined
  expanded: string | null
  onToggle: (id: string | null) => void
}) {
  const isOpen  = expanded === blockId
  const avgPct  = Math.round(items.reduce((s, i) => s + parseFloat(String(i.pct_fallo ?? 0)), 0) / items.length)

  return (
    <div className={styles.bloqueCard}>
      <button className={styles.bloqueHeader} onClick={() => onToggle(isOpen ? null : blockId)}>
        <div className={styles.bloqueLeft}>
          <div className={styles.bloqueDot} style={{ background: bloque?.color ?? '#888' }} />
          <span className={styles.bloqueLabel}>{bloque?.label ?? 'Sin bloque asignado'}</span>
          <span className={styles.bloqueCount}>{items.length} pregunta{items.length !== 1 ? 's' : ''}</span>
        </div>
        <div className={styles.bloqueRight}>
          <span className={styles.bloqueAvg} style={{ color: pctColor(avgPct) }}>{avgPct}% fallo medio</span>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>
      {isOpen && (
        <div className={styles.bloqueBody}>
          {items.map((item, i) => <PreguntaCard key={item.question_id} item={item} rank={i + 1} />)}
        </div>
      )}
    </div>
  )
}

export default function FallosClase({ currentUser }: { currentUser: CurrentUser | null }) {
  const [fallos,   setFallos]   = useState<FalloItem[]>([])
  const [bloques,  setBloques]  = useState<Record<string, Bloque>>({})
  const [pregs,    setPregs]    = useState<Record<string, Pregunta>>({})
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [vista,    setVista]    = useState<'top' | 'bloques'>('top')

  const academyId = currentUser?.academy_id
  const subjectId = currentUser?.subject_id ?? null

  useEffect(() => {
    if (!academyId) return
    const load = async () => {
      setLoading(true); setError(null)
      const { data: fallosData, error: fErr } = await supabase
        .rpc('get_class_wrong_answers', { p_academy_id: academyId, p_subject_id: subjectId })
      if (fErr) { setError(`Error: ${fErr.message}`); setLoading(false); return }
      if (!fallosData?.length) { setFallos([]); setLoading(false); return }

      const qIds = (fallosData as { question_id: string }[]).map(f => f.question_id).filter(Boolean)
      const { data: pregData } = await supabase.from('questions')
        .select('id, question, options, answer, explanation, block_id').eq('academy_id', academyId).in('id', qIds)

      const pregsMap: Record<string, Pregunta> = {}
      for (const q of (pregData ?? []) as Pregunta[]) pregsMap[q.id] = q

      const blockIds = [...new Set((pregData ?? []).map((q: { block_id: string | null }) => q.block_id).filter(Boolean) as string[])]
      const bloquesMap: Record<string, Bloque> = {}
      if (blockIds.length) {
        const { data: blks } = await supabase.from('content_blocks').select('id, label, color').in('id', blockIds)
        for (const b of (blks ?? []) as Bloque[]) bloquesMap[b.id] = b
      }

      setFallos(fallosData as FalloItem[])
      setPregs(pregsMap)
      setBloques(bloquesMap)
      setLoading(false)
    }
    load()
  }, [academyId, subjectId])

  if (loading) return <div className={styles.state}><RefreshCw size={24} className={styles.spinner} /><p>Analizando fallos de la clase…</p></div>
  if (error)   return <div className={styles.state}><AlertTriangle size={24} /><p>{error}</p></div>
  if (!fallos.length) return (
    <div className={styles.state}>
      <TrendingDown size={40} strokeWidth={1.2} />
      <p className={styles.stateTitle}>Sin fallos registrados</p>
      <p className={styles.stateSub}>Ningún alumno ha fallado preguntas todavía.</p>
    </div>
  )

  const fallosRicos: FalloItem[] = fallos.map(f => ({
    ...f,
    pregunta: pregs[f.question_id] ?? null,
    bloque:   pregs[f.question_id] ? bloques[pregs[f.question_id]!.block_id ?? ''] : null,
  }))

  const porBloque: Record<string, FalloItem[]> = {}
  for (const f of fallosRicos) {
    const bid = f.pregunta?.block_id ?? '__sin_bloque__'
    if (!porBloque[bid]) porBloque[bid] = []
    porBloque[bid]!.push(f)
  }

  const totalPregs = fallos.length
  const avgPct     = Math.round(fallos.reduce((s, f) => s + parseFloat(String(f.pct_fallo ?? 0)), 0) / totalPregs)
  const criticas   = fallos.filter(f => parseFloat(String(f.pct_fallo)) >= 60).length
  const totalFails = fallos.reduce((s, f) => s + parseInt(String(f.total_fails ?? 0)), 0)

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Análisis de fallos</h1>
          <p className={styles.pageSubtitle}>{totalPregs} preguntas analizadas · {criticas} críticas</p>
        </div>
        <div className={styles.vistaTabs}>
          <button className={[styles.vistaTab, vista === 'top'    ? styles.vistaTabActive : ''].join(' ')} onClick={() => setVista('top')}>
            <BarChart2 size={13} /> Ranking
          </button>
          <button className={[styles.vistaTab, vista === 'bloques'? styles.vistaTabActive : ''].join(' ')} onClick={() => setVista('bloques')}>
            <Layers size={13} /> Por bloque
          </button>
        </div>
      </div>

      <div className={styles.statsRow}>
        {[
          { val: totalPregs, label: 'Preguntas falladas',         color: undefined },
          { val: `${avgPct}%`, label: 'Fallo medio clase',        color: pctColor(avgPct) },
          { val: criticas,   label: 'Preguntas críticas (>60%)',  color: criticas > 0 ? '#DC2626' : '#059669' },
          { val: totalFails, label: 'Fallos totales acumulados',   color: undefined },
        ].map(({ val, label, color }) => (
          <div key={label} className={styles.statCard}>
            <span className={styles.statVal} style={color ? { color } : {}}>{val}</span>
            <span className={styles.statLabel}>{label}</span>
          </div>
        ))}
      </div>

      {vista === 'top' && (
        <div className={styles.rankingList}>
          <div className={styles.rankingHeader}><span>Ordenado por % de alumnos que fallan la pregunta</span></div>
          {fallosRicos.map((item, i) => <PreguntaCard key={item.question_id} item={item} rank={i + 1} />)}
        </div>
      )}

      {vista === 'bloques' && (
        <div className={styles.bloquesList}>
          {Object.entries(porBloque).map(([blockId, items]) => (
            <BloqueSection key={blockId} blockId={blockId} items={items} bloque={bloques[blockId]} expanded={expanded} onToggle={setExpanded} />
          ))}
        </div>
      )}
    </div>
  )
}
