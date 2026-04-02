import { useState, useEffect } from 'react'
import { AlertTriangle, RefreshCw, TrendingDown, ChevronDown, ChevronUp,
         BookOpen, Users, BarChart2, Layers } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import styles from './FallosClase.module.css'

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function pctColor(pct) {
  if (pct >= 60) return '#DC2626'
  if (pct >= 35) return '#D97706'
  return '#059669'
}
function pctBg(pct) {
  if (pct >= 60) return '#FEF2F2'
  if (pct >= 35) return '#FFFBEB'
  return '#ECFDF5'
}
function pctLabel(pct) {
  if (pct >= 60) return 'Crítico'
  if (pct >= 35) return 'Atención'
  return 'Bajo'
}

/* ─── Badge circular de porcentaje ───────────────────────────────────────── */
function PctBadge({ pct, size = 56 }) {
  const color  = pctColor(pct)
  const bg     = pctBg(pct)
  const r      = (size - 5) / 2
  const circ   = 2 * Math.PI * r
  const fill   = (pct / 100) * circ
  return (
    <div className={styles.pctBadge} style={{ width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ position: 'absolute', inset: 0 }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bg} strokeWidth={5} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${fill} ${circ - fill}`} strokeDashoffset={circ / 4}
          strokeLinecap="round" />
      </svg>
      <span className={styles.pctNum} style={{ color, fontSize: size * 0.22 }}>{pct}%</span>
    </div>
  )
}

/* ─── Card de pregunta expandible ────────────────────────────────────────── */
function PreguntaCard({ item, rank, totalAlumnos }) {
  const [open, setOpen] = useState(false)
  const q      = item.pregunta
  const pct    = Math.round(parseFloat(item.pct_fallo) || 0)
  const color  = pctColor(pct)
  const fails  = item.total_fails
  const alumnos= item.total_alumnos

  // Parsear opciones correctamente
  const opts = (() => {
    if (!q?.options) return []
    if (Array.isArray(q.options)) return q.options
    if (typeof q.options === 'object') return Object.values(q.options)
    return []
  })()

  // answer es índice numérico (0=A, 1=B, 2=C, 3=D)
  const isCorrect = (i) => i === q?.answer

  return (
    <div className={[styles.pregCard, open ? styles.pregCardOpen : ''].join(' ')}>
      <button className={styles.pregBtn} onClick={() => setOpen(v => !v)}>
        {/* Rank */}
        <div className={styles.pregRank} style={{
          background: rank === 1 ? '#DC2626' : rank <= 3 ? '#D97706' : rank <= 5 ? '#FFFBEB' : 'var(--surface-dim)',
          color:      rank <= 3 ? 'white' : rank <= 5 ? '#D97706' : 'var(--ink-muted)',
        }}>
          {rank <= 3 ? ['🥇','🥈','🥉'][rank - 1] : rank}
        </div>

        {/* Cuerpo */}
        <div className={styles.pregBody}>
          {item.bloque && (
            <span className={styles.pregBloqueChip} style={{ color: item.bloque.color, background: item.bloque.color + '18' }}>
              {item.bloque.label}
            </span>
          )}
          <p className={styles.pregTexto}>{q?.question || 'Pregunta sin texto'}</p>
          <div className={styles.pregMeta}>
            <span className={styles.pregMetaItem}><Users size={11} /> {alumnos} alumno{alumnos !== 1 ? 's' : ''} lo fallaron</span>
            <span className={styles.pregMetaItem}><BarChart2 size={11} /> {fails} fallos totales</span>
            <span className={styles.pregMetaLabel} style={{ color, background: pctBg(pct) }}>
              {pctLabel(pct)}
            </span>
          </div>
        </div>

        {/* Badge % */}
        <PctBadge pct={pct} size={52} />

        {/* Chevron */}
        <span className={styles.pregChevron}>
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </span>
      </button>

      {/* Contenido expandido */}
      {open && (
        <div className={styles.pregExpandido}>
          {opts.length > 0 && (
            <div className={styles.opcionesGrid}>
              {opts.map((opt, i) => {
                const correcto = isCorrect(i)
                const texto    = typeof opt === 'object' ? (opt.text || JSON.stringify(opt)) : opt
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

/* ─── Vista por bloques ───────────────────────────────────────────────────── */
function BloqueSection({ blockId, items, bloque, expanded, onToggle }) {
  const isOpen   = expanded === blockId
  const avgPct   = Math.round(items.reduce((s, i) => s + parseFloat(i.pct_fallo || 0), 0) / items.length)
  const maxFails = Math.max(...items.map(i => parseInt(i.total_fails) || 0), 1)

  return (
    <div className={styles.bloqueCard}>
      <button className={styles.bloqueHeader} onClick={() => onToggle(isOpen ? null : blockId)}>
        <div className={styles.bloqueLeft}>
          <div className={styles.bloqueDot} style={{ background: bloque?.color || '#888' }} />
          <span className={styles.bloqueLabel}>{bloque?.label || 'Sin bloque asignado'}</span>
          <span className={styles.bloqueCount}>{items.length} pregunta{items.length !== 1 ? 's' : ''}</span>
        </div>
        <div className={styles.bloqueRight}>
          <span className={styles.bloqueAvg} style={{ color: pctColor(avgPct) }}>
            {avgPct}% fallo medio
          </span>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {isOpen && (
        <div className={styles.bloqueBody}>
          {items.map((item, i) => (
            <PreguntaCard key={item.question_id} item={item} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Componente principal ────────────────────────────────────────────────── */
export default function FallosClase({ currentUser }) {
  const [fallos,   setFallos]   = useState([])
  const [bloques,  setBloques]  = useState({})
  const [pregs,    setPregs]    = useState({})
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [vista,    setVista]    = useState('top') // 'top' | 'bloques'

  const academyId = currentUser?.academy_id
  const subjectId = currentUser?.subject_id ?? null

  useEffect(() => {
    if (!academyId) return
    const load = async () => {
      setLoading(true)
      setError(null)

      const { data: fallosData, error: fErr } = await supabase
        .rpc('get_class_wrong_answers', { p_academy_id: academyId, p_subject_id: subjectId })

      if (fErr) { setError(`Error: ${fErr.message}`); setLoading(false); return }
      if (!fallosData?.length) { setFallos([]); setLoading(false); return }

      const qIds = fallosData.map(f => f.question_id).filter(Boolean)
      const { data: pregData } = await supabase
        .from('questions').select('id, question, options, answer, explanation, block_id')
        .eq('academy_id', academyId).in('id', qIds)

      const pregsMap = {}
      for (const q of pregData || []) pregsMap[q.id] = q

      const blockIds = [...new Set((pregData || []).map(q => q.block_id).filter(Boolean))]
      let bloquesMap = {}
      if (blockIds.length) {
        const { data: blks } = await supabase.from('content_blocks')
          .select('id, label, color').in('id', blockIds)
        for (const b of blks || []) bloquesMap[b.id] = b
      }

      setFallos(fallosData)
      setPregs(pregsMap)
      setBloques(bloquesMap)
      setLoading(false)
    }
    load()
  }, [academyId, subjectId])

  if (loading) return (
    <div className={styles.state}>
      <RefreshCw size={24} className={styles.spinner} />
      <p>Analizando fallos de la clase…</p>
    </div>
  )
  if (error) return (
    <div className={styles.state}><AlertTriangle size={24} /><p>{error}</p></div>
  )
  if (!fallos.length) return (
    <div className={styles.state}>
      <TrendingDown size={40} strokeWidth={1.2} />
      <p className={styles.stateTitle}>Sin fallos registrados</p>
      <p className={styles.stateSub}>Ningún alumno ha fallado preguntas todavía.</p>
    </div>
  )

  // Enriquecer fallos con pregunta y bloque
  const fallosRicos = fallos.map(f => ({
    ...f,
    pregunta: pregs[f.question_id] || null,
    bloque:   pregs[f.question_id] ? bloques[pregs[f.question_id].block_id] : null,
  }))

  // Agrupar por bloque
  const porBloque = {}
  for (const f of fallosRicos) {
    const bid = f.pregunta?.block_id || '__sin_bloque__'
    if (!porBloque[bid]) porBloque[bid] = []
    porBloque[bid].push(f)
  }

  // Stats rápidas
  const totalPregs   = fallos.length
  const avgPct       = Math.round(fallos.reduce((s, f) => s + parseFloat(f.pct_fallo || 0), 0) / totalPregs)
  const criticas     = fallos.filter(f => parseFloat(f.pct_fallo) >= 60).length
  const totalFails   = fallos.reduce((s, f) => s + parseInt(f.total_fails || 0), 0)

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Análisis de fallos</h1>
          <p className={styles.pageSubtitle}>
            {totalPregs} preguntas analizadas · {criticas} críticas
          </p>
        </div>

        {/* Toggle de vista */}
        <div className={styles.vistaTabs}>
          <button className={[styles.vistaTab, vista === 'top' ? styles.vistaTabActive : ''].join(' ')}
            onClick={() => setVista('top')}>
            <BarChart2 size={13} /> Ranking
          </button>
          <button className={[styles.vistaTab, vista === 'bloques' ? styles.vistaTabActive : ''].join(' ')}
            onClick={() => setVista('bloques')}>
            <Layers size={13} /> Por bloque
          </button>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statVal}>{totalPregs}</span>
          <span className={styles.statLabel}>Preguntas falladas</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statVal} style={{ color: pctColor(avgPct) }}>{avgPct}%</span>
          <span className={styles.statLabel}>Fallo medio clase</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statVal} style={{ color: criticas > 0 ? '#DC2626' : '#059669' }}>{criticas}</span>
          <span className={styles.statLabel}>Preguntas críticas (&gt;60%)</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statVal}>{totalFails}</span>
          <span className={styles.statLabel}>Fallos totales acumulados</span>
        </div>
      </div>

      {/* Vista ranking */}
      {vista === 'top' && (
        <div className={styles.rankingList}>
          <div className={styles.rankingHeader}>
            <span>Ordenado por % de alumnos que fallan la pregunta</span>
          </div>
          {fallosRicos.map((item, i) => (
            <PreguntaCard key={item.question_id} item={item} rank={i + 1} />
          ))}
        </div>
      )}

      {/* Vista por bloques */}
      {vista === 'bloques' && (
        <div className={styles.bloquesList}>
          {Object.entries(porBloque).map(([blockId, items]) => (
            <BloqueSection
              key={blockId}
              blockId={blockId}
              items={items}
              bloque={bloques[blockId]}
              expanded={expanded}
              onToggle={setExpanded}
            />
          ))}
        </div>
      )}
    </div>
  )
}
